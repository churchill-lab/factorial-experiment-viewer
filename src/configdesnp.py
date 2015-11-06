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

DEBUG = True
PORT = 5000
#MONGO_SERVER = 'localhost'
MONGO_SERVER = 'mr4.jax.org'
MONGO_PORT = 27017
MONGO_DATABASE = 'desnp'

# the following values enumerate all possible shapes you can use for 'level_shapes' in
# the WEB_APP_CONF below
CIRCLE = "circle"
SQUARE = "square"
DIAMOND = "diamond"
CROSS = "cross"
X = "x"
STAR = "star"
UP_TRIANGLE = "up-triangle"
DOWN_TRIANGLE = "down-triangle"


# this dictionary is used to configure the user interface of the web application: title,
# point styles, layout ...
WEB_APP_CONF = {
    # this will be rendered as the page title and header
    'title': 'DeSNP Database',

    # to arrange plots in a single row set 'plot_arrangement' to 'single-row'
    #'plot_arrangement': 'single-row',

    # arrange plot with stacked factor plots beside larger scatter plot
    'plot_arrangement': 'stack-factor-large-scatter',

    # adjust the point size used in plots:
    'point_size': 8,

    # in this section you will define how each of the factors will be displayed.
    # Each factor name comes from the design file that was imported into the database.
    # Each factor can have any subset of the following:
    #
    # * level_order: this defines the order that the factors will appear on the
    #   X axis if they are selected in the 'x_axis_factors' section below and
    #   so this value is required for any factor that appears in x_axis_factors
    # * level_styles: this allows per-level CSS styles to be applied to SVG
    #   data points, allowing you to control point appearance based on the
    #   factor level of the data point
    # * level_shapes: this is similar to level styles but allows you to specify
    #   a shape per-level. The shape specified must be one of the values enumerated
    #   above
    'factors': {
        'treatment': {
            'level_order': ['NONE', 'ROS', 'ACT', 'PPAR'],
            'level_styles': {
                'NONE': {
                    'fill': 'rgba(218, 165, 32, 0.3)',
                    'stroke': 'rgba(218, 165, 32, 1)',
                    'stroke-width': '0.5',
                },
                'ROS': {
                    'fill': 'rgba(68, 68, 68, 0.3)',
                    'stroke': 'rgba(68, 68, 68, 1)',
                    'stroke-width': '0.5',
                },
                'ACT': {
                    'fill': 'rgba(255, 136, 136, 0.3)',
                    'stroke': 'rgba(255, 136, 136, 1)',
                    'stroke-width': '0.5',
                },
                'PPAR': {
                    'fill': 'rgba(17, 17, 255, 0.3)',
                    'stroke': 'rgba(17, 17, 255, 1.0)',
                    'stroke-width': '0.5',
                },
            },
        },
        'time': {
            'level_order': [' 2 hrs', ' 24 hrs', ' 72 hrs'],
        },
        'treatment ros': {
            'level_order': [' Rosiglitazone ', ' No Rosiglitazone '],
            'level_shapes': {
                ' Rosiglitazone ': CIRCLE,
                ' No Rosiglitazone ': DIAMOND,
            },
        },
    },

    # in this section you configure which X axis factors are available as selections
    # to the user. This is an array of dictionaries where each dictionary in
    # the array represents an X axis configuration that the user can choose.
    # Each dictionary will have a "label" and a list of "factors". The label is
    # what appears to the user in a drop-down box and the list of factors is used for
    # the X axis when that label is selected
    'x_axis_factors': [
        {
            'label': 'Treatment',
            'factors': ['treatment']
        },
        {
            'label': 'Treatment x Time',
            'factors': ['treatment', 'time']
        },
        {
            'label': 'Rosiglitazone x Time',
            'factors': ['treatment ros', 'time']
        },
    ],

    # if set to true we will allow the user to switch between the log scale and raw
    # data scale. If false (or missing) only the raw data scale will be available.
    'include_log_scale': True,

    # should we include error bars in the plot?
    'render_error_bars': True,

    # should we connect the error bars
    'render_error_bar_connections': False,

    # should we include points in the plot?
    'render_points': True,

    # should we jitter the points?
    'jitter_points': True,
}
