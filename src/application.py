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

from flask import Flask
from flask import render_template
from flask import jsonify
from flask import request

from scipy.stats import pearsonr, spearmanr

import config
import mongodb_utils

app = Flask(__name__)

class Config:
    pass

CONF = Config()


def _decode_uri_slashes(uriCompStr):
    """
    We have to use an encoding scheme to allow forward slashes in URL components. This function decodes these strings
    :param uriCompStr:  the encoded string
    :return:            the decoded string
    """
    return uriCompStr.replace('\\f', '/').replace('\\b', '\\')

@app.route("/phenotypes/")
def phenotypes():
    """
    Return all the phenotypes.
    """
    data = mongodb_utils.get_collection_data('attributes', object_id=False)
    return jsonify({'phenotypes:': data})


@app.route("/expression/")
def expressions():
    """
    Return all the expression kinds.
    """
    pass


@app.route("/mouse/<mouse_id>")
def mouse(mouse_id):
    """
    Retrieve a mouse based upon the id.

    :param mouse_id: the mouse identifier
    :type mouse_id: string
    """
    mouse_id = _decode_uri_slashes(mouse_id)
    mouse = mongodb_utils.get_mouse(mouse_id)

    if not mouse:
        return jsonify({"mouse": None})

    return jsonify({'mouse': mouse})


@app.route("/mice/", methods=['POST'])
def mice():
    json = request.get_json()

    mice = mongodb_utils.find_mice(json)

    if not mice:
        return jsonify({"mice": None})

    return jsonify({'mice': mice})


@app.route("/phenotype/<pheno_id>")
def phenotype(pheno_id):
    """
    Get phenotype data for the given phenotype ID
    :param pheno_id:
    :return: this function will return a jsonified dict with the following
    keys.

    * mouse_id: array indexed by individual mouse. this will contain unique mouse IDs
    * sex: array indexed by individual mouse with mouse sex as "male" or "female"
    * strain: array indexed by individual mouse. Contains string values for the mouse strain
    * diet: array indexed by individual mouse. Contains the IDs for the mouse diet
    * type: a string describing the phenotype values as one of: "number", "factor" or "identifier"
    * values: array indexed by individual mouse containing phenotype values. The type of data is determined by
              the "type" attribute
    """
    pheno_id = _decode_uri_slashes(pheno_id)

    mouse_ids = []
    sexes = []
    strains = []
    diets = []
    values = []

    # retrieve all mice, also return the phenotype value specified

    data = mongodb_utils.get_phenotype_data(pheno_id)
    phenotype = mongodb_utils.get_phenotype(pheno_id)

    # TODO: Need a better way of determining the type, maybe store in mongo
    types = phenotype['type']

    if types in ['FLOAT', 'INT']:
        types = 'number'
    else:
        types = 'identifier'

    elems = pheno_id.split('.')
    sub_key = elems[0]
    if elems > 1:
        key_id = elems[1]

    if data:
        for d in data:
            mouse_id = d.get('mouse_id', '')
            sex = 'M'
            strain = d.get('group', '')
            diet = d.get('diet_desc', '')
            try:
                value = ''
                if key_id:
                    value = d[sub_key][key_id]
                else:
                    value = d[sub_key]
            except KeyError:
                pass

            mouse_ids.append(mouse_id)
            sexes.append(sex)
            strains.append(strain)
            diets.append(diet)
            values.append(value)

    return jsonify({
        'mouse_ids': mouse_ids,
        'sexes': sexes,
        'strains': strains,
        'diets': diets,
        'type': types,
        'values': values,
    })


@app.route("/search/phenotype/<pheno_search_text>/<int:start_index>/<int:max_count>")
def phenotype_search(pheno_search_text, start_index, max_count):
    """
    Searches for phenotypes using the given text
    :param pheno_search_text:
    :param start_index the start index to use (for data paging)
    :param max_count the maximum number of results to return (for data paging)
    :return: a jsonified dict with the following attributes:

    * ids: a list of phenotype IDs matching the search. This list length is >= max_count
    * names: a list of human-readable names for phenotypes matching the search. This list length is >= max_count
    * total_count: the total number of phenotypes found in the search
    """
    # just searching for attributes
    pheno_search_text = _decode_uri_slashes(pheno_search_text)

    ids = []
    names = []
    total_count = 0

    data = mongodb_utils.phenotypes_search(pheno_search_text)

    if data:
        if start_index <= 0:
            start_index = 1

        if start_index >= 1:
            start_index -= 1

        if max_count <= 0:
            max_count = 1

        print start_index, max_count

        total_count = len(data)
        data = data[start_index:start_index+max_count]

        ids = ["{0}.{1}".format(d['sub_key'], d['key_id']) for d in data]
        names = [str(d['key_id_desc']) for d in data]

    return jsonify({
        'ids': ids,
        'names': names,
        'total_count': total_count,
    })


@app.route("/expression/<expr_id>")
def expression(expr_id):
    """
    Get phenotype data for the given phenotype ID
    :param pheno_id:
    :return: this function will return a jsonified dict with the following
    keys.

    * mouse_id: array indexed by individual mouse. this will contain unique mouse IDs
    * sex: array indexed by individual mouse with mouse sex as "male" or "female"
    * strain: array indexed by individual mouse. Contains string values for the mouse strain
    * diet: array indexed by individual mouse. Contains the IDs for the mouse diet
    * type: a string describing the phenotype values as one of: "number", "factor" or "identifier"
    * values: array indexed by individual mouse containing expression values. Expression data is a numeric type
    """
    expr_id = _decode_uri_slashes(expr_id)

    expr_dict = {
        'mouse_ids': [],
        'sexes': [],
        'strains': [],
        'diets': [],
        'values': [],
    }

    # retrieve all mice, also return the phenotype value specified

    data = mongodb_utils.get_expression_data(expr_id)

    if data:
        all_factor_keys = set()
        for d in data:
            all_factor_keys |= set(d['factors'].keys())

        for fact_key in all_factor_keys:
            expr_dict[fact_key] = []

        for d in data:
            mouse_id = d.get('mouse_id', '')
            sex = 'M'
            strain = d.get('group', '')
            diet = d.get('diet_desc', '')
            value = ''
            try:
                value = d['expression_data'][expr_id]
            except KeyError:
                pass

            expr_dict['mouse_ids'].append(mouse_id)
            expr_dict['sexes'].append(sex)
            expr_dict['strains'].append(strain)
            expr_dict['diets'].append(diet)
            expr_dict['values'].append(value)

            for fact_key in all_factor_keys:
                try:
                    expr_dict[fact_key].append(d['factors'][fact_key])
                except KeyError:
                    expr_dict[fact_key].append('')

    return jsonify(expr_dict)


@app.route("/search/expression/<expr_search_text>/<int:start_index>/<int:max_count>")
def expression_search(expr_search_text, start_index, max_count):
    """
    Searches for genotype expression using the given text
    :param expr_search_text:
    :param start_index the start index to use (for data paging)
    :param max_count the maximum number of results to return (for data paging)
    :return: a jsonified dict with the following attributes:

    * ids: a list of expression IDs matching the search. This list length is >= max_count
    * names: a list of human-readable names for expression genes matching the search. This list length is >= max_count
    * total_count: the total number of expression results found in the search
    """
    expr_search_text = _decode_uri_slashes(expr_search_text)

    ids = []
    names = []
    total_count = 0

    data = mongodb_utils.expression_search(expr_search_text)

    if data:
        if start_index <= 0:
            start_index = 1

        if start_index >= 1:
            start_index -= 1

        if max_count <= 0:
            max_count = 1

        print start_index, max_count

        total_count = len(data)
        data = data[start_index:start_index+max_count]

        ids = [d['ensembl_gene_id'] for d in data]
        names = [d['gene_symbol'] for d in data]

    return jsonify({
        'ids': ids,
        'names': names,
        'total_count': total_count,
    })


@app.route("/correlation/<corr_kind>/<search_id_kind>/<search_id>/<result_id_kind>/<int:result_count>")
def correlation_search(corr_kind, search_id_kind, search_id, result_id_kind, result_count):
    """
    Searches for most highly correlated values for the given ID
    :param corr_kind: the kind of correlation that should be calculated. One of: "pearson", "spearman", or "biweight"
    :param search_id_kind: "expression" or "phenotype"
    :param search_id: the expression or phenotype ID to find correlation for
    :param result_id_kind: "expression" or "phenotype"
    :param result_count: the maximum number of results to return
    :return: a jsonified dict with the following attributes (ordered by descending correlation)

    * ids: an array for the result phenotype or expression IDs
    * names: a list of human-readable names for expression genes matching the search. This list length is >= max_count
    * correlations: an array for correlation values
    * total_count: the total number of expression or phenotype results
    """
    search_id = _decode_uri_slashes(search_id)
    corr_func = None
    if corr_kind == "pearson":
        corr_func = lambda x, y: pearsonr(x, y)[0]
    elif corr_kind == "spearman":
        corr_func = lambda x, y: spearmanr(x, y)[0]
    else:
        raise Exception('"{}" corr_kind is not supported'.format(corr_kind))
    corr_search_result = mongodb_utils.correlation_search(
        corr_func,
        search_id_kind,
        search_id,
        result_id_kind,
        result_count)

    return jsonify(corr_search_result)


@app.route('/app-config.json')
def app_config_json():
    return jsonify(config.WEB_APP_CONF)


@app.route('/index.html')
def index_html():
    return render_template('index.html', web_app_conf=config.WEB_APP_CONF)


if __name__ == "__main__":
    app.config.from_object('config')

    mongodb_utils.connect(app.config['MONGO_SERVER'], app.config['MONGO_PORT'])
    mongodb_utils.set_default_database(app.config['MONGO_DATABASE'])

    app.run(host='0.0.0.0', port=app.config['PORT'], threaded=True)

