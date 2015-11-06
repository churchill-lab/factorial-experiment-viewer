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

// NOTE: This code is a work in progress (not yet ready to be used.)

function calculateDepth(rows) {
    var maxDepth = 0;
    rows.forEach(function(row) {
        if(Array.isArray(row.rows)) {
            var currDepth = 1 + calcDepthRecursive(row.rows);
            if(currDepth > maxDepth) {
                maxDepth = currDepth;
            }
        }
    });

    return maxDepth;
}


function TreeTable(table, tableData) {
    var self = this;

    this.tableData = null;
    this.selectionChanged = null;
    this.depth = 0;

    this.updateTableData = function(tableData) {
        self.tableData = tableData;

        var maxDepth = calculateDepth(tableData.rows);

        table.empty();

        var thRow = $('<tr></tr>');
        table.append(thRow);

        // add empty select column header
        thRow.append($('<th></th>'));

        // add th for first header
        var firstHeader = $('<tr></tr>');
        firstHeader.prop('colspan', maxDepth + 1);
        firstHeader.text(tableData.header[0].name);
        thRow.append(firstHeader);

        // add the remaining headers
        var colIndex;
        for(colIndex = 1; colIndex < tableData.header.length; colIndex++) {
            var currColHeader = $('<tr></tr>');
            currColHeader.text(tableData.header[colIndex].name);
            thRow.append(currColHeader);
        }

        // OK done with headers. we're going to append row data now
        function appendRows(rows, depth) {
            rows.forEach(function(row) {
                var tr = $('<tr></tr>');
                var td;

                var checkboxTD = $('<td></td>');
                tr.append(checkboxTD);
                //td = $('<td><input type="checkbox"></td>');
                //tr.append(td);

                // append empty cells for alignment if needed
                if(depth) {
                    td = $('<td></td>');
                    td.prop('colspan', depth);
                    tr.append(td);
                }

                if(Array.isArray(row.rows)) {
                    // this is a nested row so we need to create a new group and recurse
                    td = $('<td><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></td>');
                    //td.prop('colspan', )
                    tr.append(td);

                    td = $('<td></td>');
                    td.text(row.name);
                    td.prop('colspan', header.length + maxDepth - depth);
                    tr.append(td);
                } else {
                    checkboxTD.append($('<input type="checkbox">'));
                    tableData.header.forEach(function(headerItem, i) {
                        td = $('<td></td>');
                        td.text(row[headerItem.id]);

                        if(i === 0 && maxDepth > 0) {
                            td.prop('colspan', 1 + maxDepth - depth);
                        }

                        tr.append(td);
                    });
                }
            });
        }
        appendRows(tableData.rows, 0);
    };
    this.updateTableData(tableData);
}
