# Copyright (c) 2015 The Jackson Laboratory
#
# This software was developed by Gary Churchill's Lab at The Jackson
# Laboratory (see http://research.jax.org/faculty/churchill).
#
# This is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This software is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this software.  If not, see <http://www.gnu.org/licenses/>.

import argparse
import csv
import pymongo
import config

SAMPLE_ID_HEADER = 'SampleID'

GENE_ID_HEADER = 'Gene ID'
GENE_SYMBOL_HEADER = 'Gene Symbol'
GENE_NAME_HEADER = 'Gene Name'
STRAND_HEADER = 'Strand'
CHR_HEADER = 'Chr'
START_POS_HEADER = 'Start'
END_POS_HEADER = 'End'


def get_db():
    client = pymongo.MongoClient(config.MONGO_SERVER, config.MONGO_PORT)
    if config.MONGO_DATABASE not in client.database_names():
        init_db(client[config.MONGO_DATABASE])

    return client[config.MONGO_DATABASE]


def init_db(db):
    db.mouse.create_index('mouse_id', unique=True)
    db.genes.create_index('ensembl_gene_id', unique=True)


def main():

    # parse command line arguments
    parser = argparse.ArgumentParser(description='import data into')
    parser.add_argument(
        'design_file',
        help='the tab-separated design file')
    parser.add_argument(
        'intensities_file',
        help='the tab-separated file containing probe(set) intensities and '
             'probe IDs and annotation')
    args = parser.parse_args()

    with open(args.design_file, 'rU') as design_file_handle, \
         open(args.intensities_file, 'rU') as intensities_file_handle:

        db = get_db()

        design_table = csv.reader(design_file_handle, delimiter='\t')
        design_header = next(design_table)
        all_mouse_ids = set()
        for design_row in design_table:
            row_dict = dict(zip(design_header, design_row))
            mouse_id = row_dict[SAMPLE_ID_HEADER]
            del row_dict[SAMPLE_ID_HEADER]
            all_mouse_ids.add(mouse_id)
            sample = {
                'mouse_id': mouse_id,
                'factors': row_dict,
            }

            db.mouse.insert_one(sample)

        intensities_table = csv.reader(intensities_file_handle, delimiter='\t')
        intensities_header = next(intensities_table)
        genes_bulk = db.genes.initialize_unordered_bulk_op()
        mouse_bulk = db.mouse.initialize_unordered_bulk_op()
        for i, intensities_row in enumerate(intensities_table):
            if i % 1000 == 0:
                print('processing {}th row from intensities files'.format(i))

            row_dict = dict(zip(intensities_header, intensities_row))
            gene_id = row_dict[GENE_ID_HEADER]
            #db.genes.insert_one({
            genes_bulk.insert({
                'ensembl_gene_id': gene_id,
                'gene_symbol': row_dict[GENE_SYMBOL_HEADER],
                'chrom': row_dict[CHR_HEADER],
                'gene_start': int(row_dict[START_POS_HEADER]),
                'gene_end': int(row_dict[END_POS_HEADER]),
            })
            for mouse_id in all_mouse_ids:
                #db.mouse.update_one(
                mouse_bulk.find({'mouse_id': mouse_id}).update(
                    {'$set': {'expression_data.' + gene_id: float(row_dict[mouse_id])}}
                )
        print('processing bulk update for genes')
        genes_bulk.execute()
        print('processing bulk update for mice')
        mouse_bulk.execute()


if __name__ == '__main__':
    main()
