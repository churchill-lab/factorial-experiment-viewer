#!/usr/bin/env python
import pymongo

if __name__ == '__main__':
    con = pymongo.MongoClient('mr4.jax.org', 27017)
    mouse = con.attie_keller_pheno.mouse

    expr_ids = set()
    for mouse in mouse.find({'expression_data': {'$exists': True, '$ne': None}}):
        for gene_id in mouse['expression_data'].iterkeys():
            expr_ids.add(gene_id)

    print 'mouse_id'
    for expr_id in expr_ids:
        print 'expression_data.{}'.format(expr_id)
