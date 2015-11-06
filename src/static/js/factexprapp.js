/*
 * Copyright (c) 2015 The Jackson Laboratory
 *
 * This software was developed by Gary Churchill's Lab at The Jackson
 * Laboratory (see http://research.jax.org/faculty/churchill).
 *
 * This is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this software.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Calculates log2(x + 1)
 */
function log21p(x) {
    return Math.log(1 + x) / Math.LN2;
}

/**
 * returns an array containing only unique string values found in the given input
 * @param allStrings    array of strings which may contain repeats
 * @return sorted array of unique strings found in the allStrings parameter
 */
function uniqueStrs(allStrings) {
    var setObj = {};
    allStrings.forEach(function(str) {
        setObj[str] = 0;
    });

    return Object.keys(setObj).sort();
}

/**
 * Clean up malformed numeric data
 * @param numData a number... or something else
 * @return a number if we can reasonably interpret the input as a number. otherwise NaN
 */
function cleanNumericData(numData) {
    var typeofX = typeof numData;
    if(typeofX === 'number') {
        return numData;
    } else if(typeofX === 'string') {
        try {
            return parseInt(numData);
        } catch(err) {
            return NaN;
        }
    }
}

/**
 * Clean up malformed categorical data.
 * @param categoryData the data to clean
 * @return the category string if the input can be reasonably converted to a string. Otherwise an empty
 *         string is returned
 */
function cleanCategoryData(categoryData) {
    var typeofX = typeof categoryData;
    if(typeofX === 'string') {
        return categoryData;
    } else {
        try {
            return categoryData.toString();
        } catch(err) {
            return '';
        }
    }
}

/**
 * Uses a custom encoding for strings to deal with forward slashes.
 * Forward slashes don't work well in URI components even when encoded as %2F. Many server side implementations
 * still stumble on them. We can encode/decode the string with a simple scheme where:
 *      \ => \b
 *      / => \f
 * This scheme is simple enough to encode/decode with regex and gets us around this issue. Note that
 * http://flask.pocoo.org/snippets/76/ recommends against this approach, but the advantage of doing it
 * this way is that we can encode multiple components in a single URL (which I don't think is possible with the
 * "path" approach suggested.
 */
function encURIComp(str) {
    return encodeURIComponent(str.replace(/\\/g, '\\b').replace(/\//g, '\\f'));
}

function decURIComp(str) {
    return decodeURIComponent(str).replace(/\\f/g, '/').replace(/\\b/g, '\\');
}


/**
 * Just A convenience method to build a jQuery option doc node
 * @param value the option's value
 * @param label the option's text
 * @return the jQuery option node
 */
function makeOpt(value, label) {
    var option = $(document.createElement('option'));
    option.val(value);
    option.text(label);

    return option;
}

/**
 * Periodically listen for changes to a text field. This is similar just registering for a change event
 * except that it doesn't matter if focus is lost or not, and there is a delay introduced that prevents
 * firing too many events as the user is typing.
 * @param textField the text field to listen to
 * @param func the function that gets called with a text argument after a change
 * @param checkIntervalMS at what interval should we poll to see if there has been a change
 * @param doneIntervalMS how long of a quiet time (an interval where there is no change) is
 *                       required before notifying of change by calling func?
 */
function listenForTextChange(textField, func, checkIntervalMS, doneIntervalMS) {
    // TODO: This function is implemented using polling logic. It's probably better to change
    //       it to event based (but the logic may be a bit more tricky)
    if(typeof checkIntervalMS === 'undefined') {
        checkIntervalMS = 100;
    }
    if(typeof doneIntervalMS === 'undefined') {
        doneIntervalMS = 500;
    }

    var lastEventText = textField.val();
    var lastChangeText = textField.val();
    var lastChangeTime = -1;

    window.setInterval(function() {
        var currText = textField.val();
        if(lastEventText === currText) {
            return;
        }

        var currTime = Date.now();
        if(currText !== lastChangeText) {
            lastChangeText = currText;
            lastChangeTime = currTime;
        } else if(currTime - lastChangeTime > doneIntervalMS) {
            lastEventText = currText;
            lastChangeText = currText;
            lastChangeTime = currTime;
            func(currText);
        }
    }, checkIntervalMS);
}

/**
 * Initializes the Factorial Expression Application based on the given appConfig. Note that this function references
 * many nodes by assuming that they will have specific IDs. This means that this function is tightly coupled to the
 * hosting document and if you update IDs in one you will have to find and update IDs in the other or the application
 * is likely to break. It would probably be a nice improvement to refactor these hidden dependencies as a parameter
 * object to make them explicit.
 * @param appConfig this is a JSON-serialized version of the WEB_APP_CONF object specified in conif.py. Consult
 *                  the code documentation in config.py for details about the structure of this object.
 */
function initFactExprApp(appConfig) {
    var allFactorIDs = [];
    $.each(appConfig.factors, function(factorID) {
        allFactorIDs.push(factorID);
    });

    var scatterPlotSize = 400;
    if(appConfig.plot_arrangement === 'stack-factor-large-scatter') {
        scatterPlotSize = 800;
    }

    var plotFactorsSelect = $('#plot-factors-select');
    appConfig.x_axis_factors.forEach(function(factor) {
        plotFactorsSelect.append(makeOpt(factor.label, factor.label));
    });
    plotFactorsSelect.change(refreshPlots);

    // on the page we have two search/select widget combinations. The user can use these to search by
    // gene or correlated data. The searchStates array is used for keeping track of the current state
    // of both of these widgets. The following code will initialize these search state objects
    var searchStates = [{}, {}];
    searchStates[0].otherState = searchStates[1];
    searchStates[1].otherState = searchStates[0];

    function initSearchState(state, stateIndex) {
        var geneAJAXObj = null;

        state.searchMode = 'expression'; // 'expression', 'phenotype' or 'correlation'
        state.prevGeneSearch = null;
        state.selectionData = null;
        state.selectionName = null;
        state.searchResultsTable = $('#gene' + (stateIndex + 1) + '-results-table');
        state.correlationLink = $('#correlation' + (stateIndex + 1) + '-search-select');
        state.searchResultsTable.bootstrapTable({
            columns: [{
                field: 'selected' + (stateIndex + 1),
                radio: true
            }, {
                field: 'id',
                title: 'ID' + (stateIndex + 1)
            }, {
                field: 'name',
                title: 'Name' + (stateIndex + 1)
            }, {
                field: 'correlation',
                title: 'Correlation' + (stateIndex + 1),
                visible: false
            }],
            data: [],
            height: 200,
            clickToSelect: true,
            selectItemName: 'selected' + (stateIndex + 1),
            onCheck: function(rowData, row) {
                state.selectionName = rowData.name;
                state.selectionID = rowData.id;
                state.otherState.correlationLink.text(rowData.name + ' Correlation Search');

                if(geneAJAXObj !== null) {
                    geneAJAXObj.abort();
                }

                // FIXME prefix needs to work for all correlation kinds
                var urlPrefix = null;
                if(state.searchMode === 'correlation') {
                    urlPrefix = '../expression/';
                } else {
                    urlPrefix = '../' + state.searchMode + '/';
                }
                var url = urlPrefix + encURIComp(rowData.id);
                geneAJAXObj = $.getJSON(url, function(selectionData) {
                    console.log(selectionData);
                    state.selectionData = selectionData;
                    refreshPlots();
                });
            }
        });

        state.downloadDataButton = $('#gene' + (stateIndex + 1) + '-download-button');
        state.downloadDataButton.click(function() {
            var rows = [['sample ID', 'value', 'diet', 'strain'].join('\t')];
            state.selectionData.values.forEach(function(currVal, valIndex) {
                rows.push([
                    state.selectionData.mouse_ids[valIndex],
                    currVal,
                    state.selectionData.diets[valIndex],
                    state.selectionData.strains[valIndex]].join('\t'))
            });

            var blob = new Blob([rows.join('\n')], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "values-" + (stateIndex + 1) + ".txt");
        });

        var searchLabel = $('#search' + (stateIndex + 1) + '-label');
        $('#gene' + (stateIndex + 1) + '-search-select').click(function() {
            state.searchMode = 'expression';
            searchLabel.text(this.text);
            state.searchResultsTable.bootstrapTable('hideColumn', 'correlation');
            state.searchResultsTable.bootstrapTable('load', []);
            searchTextFields[stateIndex].prop('disabled', false);
            performSearch(stateIndex, searchTextFields[stateIndex].val());
        });
        $('#phenotype' + (stateIndex + 1) + '-search-select').click(function() {
            state.searchMode = 'phenotype';
            searchLabel.text(this.text);
            state.searchResultsTable.bootstrapTable('hideColumn', 'correlation');
            state.searchResultsTable.bootstrapTable('load', []);
            searchTextFields[stateIndex].prop('disabled', false);
            performSearch(stateIndex, searchTextFields[stateIndex].val());
        });
        state.correlationLink.click(function() {
            state.searchMode = 'correlation';
            searchLabel.text(this.text);
            state.searchResultsTable.bootstrapTable('showColumn', 'correlation');
            state.searchResultsTable.bootstrapTable('load', []);
            searchTextFields[stateIndex].prop('disabled', true);
            correlationSearch(state);
        });
    }
    searchStates.forEach(initSearchState);

    /**
     * Perform a search using the given search text. This will ask the application server for search results and
     * populate the search results box indicated by geneIndex
     * @param geneIndex determines which of the two gene search boxes this search will be for (this
     *              must be either 0 or 1
     * @param text  the search text
     */
    function performSearch(geneIndex, text) {
        var state = searchStates[geneIndex];
        if(state.prevGeneSearch !== null) {
            state.prevGeneSearch.abort();
        }

        // performing search is only valid for expression and phenotype modes
        if(['expression', 'phenotype'].indexOf(state.searchMode) >= 0) {
            state.searchResultsTable.bootstrapTable('showLoading');

            var url = '../search/' + state.searchMode + '/' + encURIComp(text) + '/1/100';
            state.prevGeneSearch = $.getJSON(url, function(data) {
                var tableRows = [];
                for(var rowIndex = 0; rowIndex < data.total_count; rowIndex++) {
                    tableRows.push({
                        id: data.ids[rowIndex],
                        name: data.names[rowIndex]
                    });
                }

                state.searchResultsTable.bootstrapTable('load', tableRows);
            }).always(function() {
                state.searchResultsTable.bootstrapTable('hideLoading');
            });
        }
    }

    /**
     * This performs a correlation search for the given search state
     * @param state this is the object that contains state information for one of the two
     *          gene search widgets.
     */
    function correlationSearch(state) {
        state.searchResultsTable.bootstrapTable('showLoading');

        if(state.prevGeneSearch !== null) {
            state.prevGeneSearch.abort();
        }

        if(['expression', 'correlation'].indexOf(state.otherState.searchMode) >= 0) {
            var url = '../correlation/pearson/expression/' + encURIComp(state.otherState.selectionID) + '/expression/100';
            state.prevGeneSearch = $.getJSON(url, function(data) {
                var tableRows = [];
                for(var rowIndex = 0; rowIndex < data.total_count; rowIndex++) {
                    tableRows.push({
                        id: data.ids[rowIndex],
                        name: data.names[rowIndex],
                        correlation: data.correlations[rowIndex]
                    });
                }

                state.searchResultsTable.bootstrapTable('load', tableRows);
            }).always(function() {
                state.searchResultsTable.bootstrapTable('hideLoading');
            });
        }
    }

    // listen for to the two gene search text fields so that we can perform searches automatically (without
    // requiring the user to hit enter or click a search button)
    var searchTextFields = [$('#gene1-search-text'), $('#gene2-search-text')];
    searchTextFields.forEach(function(searchTextField, geneIndex) {
        listenForTextChange(searchTextField, function(text) {
            performSearch(geneIndex, text);
        });
    });

    // Initialize both of the factorial expression plots (where each plot corresponds to its respective search state)
    var geneFactPlots = [
        new FactExpPlot({svg: d3.select('#gene1-chart'), width: 400, height: 400, pointSizePx: appConfig.point_size}),
        new FactExpPlot({svg: d3.select('#gene2-chart'), width: 400, height: 400, pointSizePx: appConfig.point_size})
    ];
    var geneFactPlotPointNodes = [[], []];
    var backupFactPlotPointAttrs = [{}, {}];
    geneFactPlots.forEach(function(currPlot, plotIndex) {
        var state = searchStates[plotIndex];

        // define a point post processing function which will allow us to modify point
        // styles and listen for mouse events.
        currPlot.postProcessPoint = function(nodeIndex, d3Node) {
            geneFactPlotPointNodes[plotIndex][nodeIndex] = d3Node;
            try {
                $.each(appConfig.factors, function(factorID, factorConfig) {
                    var currVals = state.selectionData[factorID];
                    if(typeof currVals !== 'undefined') {
                        var currLevelStyles = factorConfig['level_styles'];
                        if(typeof currLevelStyles !== 'undefined') {
                            var currStyle = currLevelStyles[currVals[nodeIndex]];
                            if(typeof currStyle !== 'undefined') {
                                d3Node.style(currStyle);
                            }
                        }

                        var currShapesStyles = factorConfig['level_shapes'];
                        if(typeof currShapesStyles !== 'undefined') {
                            var currShape = currShapesStyles[currVals[nodeIndex]];
                            if(typeof currShape !== 'undefined') {
                                d3Node.style(currShape);
                                scatterPlot.setPointShape(d3Node, currShape);
                            }
                        }
                    }
                });

                var chartNode = $('#gene' + (plotIndex + 1) + '-chart');
                d3Node.on('mouseover', function() {
                    showPointPopup(chartNode, plotIndex, nodeIndex)
                });
                d3Node.on('mousemove', function() {
                    showPointPopup(chartNode, plotIndex, nodeIndex)
                });
                d3Node.on('mouseout', mouseOutPoint);
            } catch(err) {
                console.error('failed to postProcessPoint');
                console.error(err);
            }
        };
    });

    // Here we're basically doing the same thing for the scatter plot that we did for the factorial plots above.
    var scatterPlot = new FactExpPlot({svg: d3.select('#scatter-chart'), width: scatterPlotSize, height: scatterPlotSize, pointSizePx: appConfig.point_size});
    var scatterPlotPointNodes = [];
    var backupScatterPointAttrs = {};
    scatterPlot.postProcessPoint = function(nodeIndex, d3Node) {
        scatterPlotPointNodes[nodeIndex] = d3Node;
        try {
            var state = searchStates[0];
            $.each(appConfig.factors, function(factorID, factorConfig) {
                var currVals = state.selectionData[factorID];
                if(typeof currVals !== 'undefined') {
                    var currLevelStyles = factorConfig['level_styles'];
                    if(typeof currLevelStyles !== 'undefined') {
                        var currStyle = currLevelStyles[currVals[nodeIndex]];
                        if(typeof currStyle !== 'undefined') {
                            d3Node.style(currStyle);
                        }
                    }

                    var currShapesStyles = factorConfig['level_shapes'];
                    if(typeof currShapesStyles !== 'undefined') {
                        var currShape = currShapesStyles[currVals[nodeIndex]];
                        if(typeof currShape !== 'undefined') {
                            d3Node.style(currShape);
                            scatterPlot.setPointShape(d3Node, currShape);
                        }
                    }
                }
            });

            var chartNode = $('#scatter-chart');
            d3Node.on('mouseover', function() {
                showPointPopup(chartNode, 0, nodeIndex)
            });
            d3Node.on('mousemove', function() {
                showPointPopup(chartNode, 0, nodeIndex)
            });
            d3Node.on('mouseout', mouseOutPoint);
        } catch(err) {
            console.error('failed to postProcessPoint');
            console.error(err);
        }
    };

    function mouseOutPoint() {
        var div = $('#cursor-status');
        div.css('display', 'none');

        // restore the points to their state before they were moused over
        backupFactPlotPointAttrs.forEach(function(backup) {
            if(typeof backup['node'] !== 'undefined') {
                backup['node'].attr('transform', backup['transform']);
                delete backup['transform'];
                delete backup['node'];
            }
        });

        if(typeof backupScatterPointAttrs['node'] !== 'undefined') {
            backupScatterPointAttrs['node'].attr('transform', backupScatterPointAttrs['transform']);
            delete backupScatterPointAttrs['transform'];
            delete backupScatterPointAttrs['node'];
        }
    }

    /**
     * This function gets called any time that there is an update to the application
     * state which requires any/all of the plots to be updated.
     */
    function refreshPlots() {
        function axisLabel(geneIndex) {
            var state = searchStates[geneIndex];
            if(log2TransformBtn.is(':checked')) {
                return "log2(" + state.selectionName + " + 1)";
            } else {
                return state.selectionName;
            }
        }

        try {
            var validGeneCount = 0;
            var cleanVals = [];
            searchStates.forEach(function(state, stateIndex) {
                if(state.selectionData === null) {
                    // there is nothing to do if no gene is selected for this plot
                    return;
                }
                validGeneCount++;
                state.downloadDataButton.css('display', '');
                saveImageGeneButtons[stateIndex].css('display', '');

                // do some data cleaning and organization in order to build the plot parameters
                var currCleanValues = state.selectionData.values.map(cleanNumericData);
                if(log2TransformBtn.is(':checked')) {
                    currCleanValues = currCleanValues.map(log21p);
                }

                cleanVals.push(currCleanValues);

                var xFactorIds = null;
                appConfig.x_axis_factors.some(function(currXFac) {
                    if(currXFac.label === plotFactorsSelect.val()) {
                        xFactorIds = currXFac.factors;
                        return true;
                    } else {
                        return false;
                    }
                });
                var factorVars = xFactorIds.map(function(factorId) {
                    var currFactor = appConfig.factors[factorId];
                    return {
                        "kind": "factor",
                        "values": state.selectionData[factorId].map(cleanCategoryData),
                        "levels": currFactor.level_order,
                        "name": factorId
                    }
                });

                var groupByWhiskerVars = [];
                $.each(appConfig.factors, function(factorId, currFactor) {
                    if(currFactor.hasOwnProperty('level_styles') ||
                       currFactor.hasOwnProperty('level_shapes')) {
                        if(xFactorIds.indexOf(factorId) === -1) {
                            groupByWhiskerVars.push({
                                "kind": "factor",
                                "values": state.selectionData[factorId].map(cleanCategoryData),
                                "levels": currFactor.level_order,
                                "name": factorId
                            });
                        }
                    }
                });

                var factExpPlotParams = {
                    title: "",
                    sampleCount: state.selectionData.values.length,
                    xAxis: {
                        label: plotFactorsSelect.val(),
                        variables: factorVars
                    },
                    yAxis: {
                        label: axisLabel(stateIndex),
                        variables: [{
                            "kind": "number",
                            "values": currCleanValues,
                            "name": "Value " + stateIndex
                        }]
                    },
                    renderPoints: appConfig.render_points
                };
                if(typeof appConfig.render_error_bars === 'undefined' || appConfig.render_error_bars) {
                    factExpPlotParams.yAxis.whiskers = {
                        units: 'stderr',
                        dist: 1,
                        groupByFactors: groupByWhiskerVars,
                        connected: appConfig.render_error_bar_connections
                    };
                }
                geneFactPlots[stateIndex].renderPlot(factExpPlotParams);
            });

            // we will only draw the scatter plot when there are two genes selected
            if(validGeneCount === 2) {
                downloadScatterButton.css('display', '');
                saveImageScatterButton.css('display', '');
                var scatterPlotParams = {
                    title: "",
                    sampleCount: cleanVals[0].length,
                    xAxis: {
                        variables: [{
                            "kind": "number",
                            "values": cleanVals[0],
                            "name": axisLabel(0)
                        }]
                        //min: 0
                    },
                    yAxis: {
                        variables: [{
                            "kind": "number",
                            "values": cleanVals[1],
                            "name": axisLabel(1)
                        }]
                        //min: 0
                    }
                };
                scatterPlot.renderPlot(scatterPlotParams);
            }
        } catch(msg) {
            console.error('failed to render plot');
            console.error(msg);
        }
    }

    var log2TransformBtn = $('#log2-transform');
    log2TransformBtn.change(refreshPlots);

    var rawTransformBtn = $('#raw-transform');
    rawTransformBtn.change(refreshPlots);

    // the popup is used to show details for whichever point the user mouses over.
    var strainDetailRequest = null;
    function showPointPopup(svgChart, geneIndex, sampleIndex) {
        var state = searchStates[geneIndex];

        // we'll fill in some sample data in the table that is rendered in the popup
        var tbl = $('#cursor-status-table');
        tbl.empty();

        var row = $(document.createElement('tr'));
        var td = $(document.createElement('td'));
        td.text('Mouse ID');
        row.append(td);

        td = $(document.createElement('td'));
        td.text(state.selectionData.mouse_ids[sampleIndex]);
        row.append(td);
        tbl.append(row);

        allFactorIDs.forEach(function(factorID) {
            row = $(document.createElement('tr'));
            td = $(document.createElement('td'));
            td.text(factorID);
            row.append(td);

            td = $(document.createElement('td'));
            td.text(state.selectionData[factorID][sampleIndex]);
            row.append(td);
            tbl.append(row);
        });

        searchStates.forEach(function(state) {
            if(state.selectionName !== null) {
                row = $(document.createElement('tr'));
                td = $(document.createElement('td'));
                td.text(state.selectionName);
                row.append(td);

                td = $(document.createElement('td'));
                td.text(state.selectionData.values[sampleIndex]);
                row.append(td);
                tbl.append(row);
            }
        });

        // we want to position the popup such that it is near the mosue cursor but not in the way
        var xyPoint = d3.mouse(svgChart[0]);

        var div = $('#cursor-status');
        var popupOffset = 20;
        var pastCenterX = xyPoint[0] > svgChart.width() / 2;
        var pastCenterY = xyPoint[1] > svgChart.height() / 2;
        var xPos = d3.event.pageX + (pastCenterX ? -popupOffset : popupOffset);
        var yPos = d3.event.pageY + (pastCenterY ? -popupOffset : popupOffset);
        var xTrans = pastCenterX ? -100 : 0;
        var yTrans = pastCenterY ? -100 : 0;
        var transformStr = "translate(" + xTrans + "%," + yTrans + "%)";
        div.css('display', 'block');
        div.css('top', yPos);
        div.css('left', xPos);
        div.css('transform', transformStr);
        div.css('-webkit-transform', transformStr);

        // double the size of the point that is highlighted
        [0, 1].forEach(function(plotIndex) {
            if(typeof backupFactPlotPointAttrs[plotIndex]['node'] === 'undefined') {
                var currNode = geneFactPlotPointNodes[plotIndex][sampleIndex];
                if(typeof currNode !== 'undefined') {
                    backupFactPlotPointAttrs[plotIndex]['node'] = currNode;
                    var backupTransform = currNode.attr('transform');
                    backupFactPlotPointAttrs[plotIndex]['transform'] = backupTransform;
                    currNode.attr('transform', backupTransform + 'scale(2)');

                    // this remove/append sequence is a pure hack to prevent a firefox bug
                    // where the scaled node gets clipped
                    var parent = currNode.node().parentNode;
                    currNode.remove();
                    parent.appendChild(currNode.node());
                }
            }
        });

        if(typeof backupScatterPointAttrs['node'] === 'undefined') {
            var currNode = scatterPlotPointNodes[sampleIndex];
            if(typeof currNode !== 'undefined') {
                backupScatterPointAttrs['node'] = currNode;
                var backupTransform = currNode.attr('transform');
                backupScatterPointAttrs['transform'] = backupTransform;
                currNode.attr('transform', backupTransform + 'scale(2)');

                // this remove/append sequence is a pure hack to prevent a firefox bug
                // where the scaled node gets clipped
                var parent = currNode.node().parentNode;
                currNode.remove();
                parent.appendChild(currNode.node());
            }
        }
    }

    // implement listeners for the image and data save buttons.

    var downloadScatterButton = $('#scatter-download-button');
    downloadScatterButton.click(function() {
        var gene1Vals = searchStates[0].selectionData;
        var gene2Vals = searchStates[1].selectionData;
        var rows = [['sample ID', 'value1', 'value2', 'diet', 'strain'].join('\t')];
        gene1Vals.values.forEach(function(currVal, valIndex) {
            rows.push([
                gene1Vals.mouse_ids[valIndex],
                currVal,
                gene2Vals.values[valIndex],
                gene1Vals.diets[valIndex],
                gene1Vals.strains[valIndex]].join('\t'))
        });

        var blob = new Blob([rows.join('\n')], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "scatter-plot-data.txt");
    });

    var saveImageGeneButtons = [0, 1].map(function(i) {return $('#gene' + (i + 1) + '-save-image')});
    saveImageGeneButtons.forEach(function(button, geneIndex) {
        button.click(function() {
            var state = searchStates[geneIndex];
            saveSvgAsPng(
                    geneFactPlots[geneIndex].getSVG().node(),
                    state.selectionName + ".png",
                    {scale: 3});
        });
    });

    var saveImageScatterButton = $('#scatter-save-image');
    saveImageScatterButton.click(function() {
        var name1 = searchStates[0].selectionName;
        var name2 = searchStates[1].selectionName;
        saveSvgAsPng(
                scatterPlot.getSVG().node(),
                name1 + "-" + name2 + ".png",
                {scale: 3});
    });
}
