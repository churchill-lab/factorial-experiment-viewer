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

import pymongo
import re

MONGO = None
DEFAULT_DB = None


MOUSE_FIELDS = {'birth_date': 1, 'diet_desc': 1, 'mouse_id': 1, 'group': 1, 'sacrifice_date': 1, 'factors': 1}


def connect(server, port=27017, database=None):
    """
    Connect to a Mongo server.

    :param server: ip address or server name
    :type server: string
    :param port: port number
    :type server: int
    :param database: the name of the default database
    :type database: string
    """
    global MONGO
    MONGO = pymongo.MongoClient(server, port)


def set_default_database(database):
    """
    Set the default datbase to use.

    :param database: the name of the default database
    :type database: string
    """
    global DEFAULT_DB
    DEFAULT_DB = database


def get_databases():
    """
    Retrieve a list of the databases.

    :return: a list of the database names
    """
    return MONGO.database_names()


def get_collections(database=None, include_system=False):
    """
    Retrieve a list of the collections for a database.  If no database is specified, the default database is used.

    :param database: the name of the database
    :type database: string
    :param include_system: flag to prevent system collections from being returned
    :type include_system: boolean
    :return: a list of collections with the database
    """
    database = database if database else DEFAULT_DB

    collections = []

    for name in MONGO[database].collection_names():
        if not include_system and name.startswith('system'):
            continue

        collections.append(name)

    return collections


def get_collection_data(collection, database=None, object_id=True):
    """
    Retrieve data for the specified collection

    :param collection: the name of the collection
    :type collection: string
    :param database: the name of the database
    :type database: string
    :param object_id: True to include the Mongo Object Id, False otherwise
    :type object_id: boolean
    :return: a list of the dictionaries in the collection
    """
    database = database if database else DEFAULT_DB

    data = []

    for res in MONGO[database][collection].find():
        if not object_id:
            res.pop('_id', None)
        data.append(res)

    return data


def get_mouse(mouse_id):
    """
    Retrieve the information for a mouse.

    :param mouse_id: the mouse identifier
    :type mouse_id: string
    :return: the mouse
    """
    mouse = MONGO[DEFAULT_DB]['mouse'].find_one({'mouse_id': mouse_id})
    if mouse:
        mouse.pop('_id', None)

    return mouse


def find_mice(param):
    """
    Find a mouse based upon generic criteria.

    :param param: a dictionary of values to match a mouse on
    :type param: dict
    :return: the mice that match
    """
    mice = []
    data = MONGO[DEFAULT_DB]['mouse'].find(param)

    if data:
        for mouse in data:
            mouse.pop('_id', None)
            mice.append(mouse)

    return mice


def get_phenotype(phenotype_id):
    """
    Get information about a specific phenotype

    :param phenotype_id: the id of the phenotype to retrieve
    :return: a phenotype
    """
    elems = phenotype_id.split(".")
    params = {}

    if len(elems) == 1:
        params['key_id'] = phenotype_id
    else:
        params['sub_key'] = elems[0]
        params['key_id'] = elems[1]

    return MONGO[DEFAULT_DB]['attributes'].find_one(params)




def phenotypes_search(text):
    """
    Search for phenotypes containing text

    :param text: the text to search
    :return: a list of phenotypes
    """
    data = MONGO[DEFAULT_DB]['attributes'].find({'key_id_desc': re.compile(text, re.IGNORECASE)}).sort('key_id_desc', 1)

    phenotypes = []
    for pheno in data:
        phenotypes.append(pheno)

    return phenotypes


def get_phenotype_data(phenotype_id):
    """
    Get the phenotype data for all mice

    :param phenotype_id: the phenotype id
    :return: a list of dicts that contain info about a mouse
    """
    fields = MOUSE_FIELDS
    fields[phenotype_id] = 1

    data = []

    for res in MONGO[DEFAULT_DB]['mouse'].find({}, fields).sort('mouse_id', 1):
        print res
        if res['mouse_id']:
            data.append(res)

    return data


def get_expression_data(expr_id):
    """
    Get the expression data for all mice

    :param expr_id: the expression id
    :return: a list of dicts that contain info about a mouse
    """
    fields = MOUSE_FIELDS
    fields["expression_data.{0}".format(expr_id)] = 1

    data = []

    for res in MONGO[DEFAULT_DB]['mouse'].find({}, fields).sort('mouse_id', 1):
        if res['mouse_id']:
            data.append(res)

    return data


def expression_search(text):
    """
    Search for expression containing text

    :param text: the text to search
    :return: a list of genes
    """
    data = MONGO[DEFAULT_DB]['genes'].find({'ensembl_gene_id': re.compile(text, re.IGNORECASE)}).sort('ensembl_gene_id', 1)

    expressions = []
    for expr in data:
        expressions.append(expr)

    data = MONGO[DEFAULT_DB]['genes'].find({'gene_symbol': re.compile(text, re.IGNORECASE)}).sort('ensembl_gene_id', 1)

    for expr in data:
        expressions.append(expr)

    return expressions


def correlation_search(corr_func, search_id_kind, search_id, result_id_kind, result_count):
    if search_id_kind == 'expression' and result_id_kind == 'expression':
        ens_ids = MONGO[DEFAULT_DB]['genes'].find({}, {'ensembl_gene_id': 1, 'gene_symbol': 1, '_id': 0})
        ens_id_gene_name_dict = {x['ensembl_gene_id']: x['gene_symbol'] for x in ens_ids}

        mice_gene_intens = MONGO[DEFAULT_DB]['mouse'].find({}, {'expression_data': 1})
        mice_expression = [mouse['expression_data'] for mouse in mice_gene_intens if 'expression_data' in mouse]

        ref_intens_dict = {i: mouse[search_id] for i, mouse in enumerate(mice_expression) if search_id in mouse}
        ref_mouse_indexes = set(ref_intens_dict.keys())

        corr_id_tuples = []
        for ens_id in ens_id_gene_name_dict.keys():
            if ens_id == search_id:
                continue

            curr_intens_dict = {i: mouse[ens_id] for i, mouse in enumerate(mice_expression) if ens_id in mouse}
            if len(curr_intens_dict) == 0:
                continue

            common_mouse_indexes = set(curr_intens_dict.keys())
            common_mouse_indexes &= ref_mouse_indexes
            common_mouse_indexes = list(common_mouse_indexes)

            ref_intens = [ref_intens_dict[i] for i in common_mouse_indexes]
            curr_intens = [curr_intens_dict[i] for i in common_mouse_indexes]

            corr = corr_func(ref_intens, curr_intens)
            corr_id_tuples.append((abs(corr), ens_id, corr))

        corr_id_tuples.sort(reverse=True)
        corr_id_tuples = corr_id_tuples[: result_count]
        return {
            'ids': [ens_id for _, ens_id, _ in corr_id_tuples],
            'names': [ens_id_gene_name_dict[ens_id] for _, ens_id, _ in corr_id_tuples],
            'correlations': [corr for _, _, corr in corr_id_tuples],
            'total_count': len(corr_id_tuples),
        }
    else:
        return None


if __name__ == '__main__':
    from config import *
    from scipy.stats import pearsonr, spearmanr

    connect(MONGO_SERVER, MONGO_PORT)
    set_default_database(MONGO_DATABASE)

    ens_ids = MONGO[DEFAULT_DB]['genes'].find({}, {'ensembl_gene_id': 1, '_id': 0})
    ens_ids = [x['ensembl_gene_id'] for x in ens_ids]

    sum = 0
    mice_gene_intens = MONGO[DEFAULT_DB]['mouse'].find({}, {'expression_data': 1})
    mice_expression = [mouse['expression_data'] for mouse in mice_gene_intens if 'expression_data' in mouse]
    ref_ens_id = ens_ids[0]
    ref_intens_dict = {i: mouse[ref_ens_id] for i, mouse in enumerate(mice_expression) if ref_ens_id in mouse}
    ref_mouse_indexes = set(ref_intens_dict.keys())

    pearson_scores = dict()

    for ens_id in ens_ids:
        if ens_id == ref_ens_id:
            continue

        curr_intens_dict = {i: mouse[ens_id] for i, mouse in enumerate(mice_expression) if ens_id in mouse}
        if len(curr_intens_dict) == 0:
            continue

        common_mouse_indexes = set(curr_intens_dict.keys())
        common_mouse_indexes &= ref_mouse_indexes
        common_mouse_indexes = list(common_mouse_indexes)

        ref_intens = [ref_intens_dict[i] for i in common_mouse_indexes]
        curr_intens = [curr_intens_dict[i] for i in common_mouse_indexes]

        print('ID={}, Pearson={}, Spearman={}'.format(
            ens_id,
            pearsonr(ref_intens, curr_intens)[1],
            spearmanr(ref_intens, curr_intens)[1])
        )
