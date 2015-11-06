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

//////// POLYFILLS ////////

if(!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
        if (this === undefined || this === null) {
            throw new TypeError('"this" is null or not defined');
        }

        var length = this.length >>> 0; // Hack to convert object.length to a UInt32

        fromIndex = +fromIndex || 0;

        if (Math.abs(fromIndex) === Infinity) {
            fromIndex = 0;
        }

        if (fromIndex < 0) {
            fromIndex += length;
            if (fromIndex < 0) {
                fromIndex = 0;
            }
        }

        for (; fromIndex < length; fromIndex++) {
            if (this[fromIndex] === searchElement) {
                return fromIndex;
            }
        }

        return -1;
    };
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function (obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [], prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if(!Array.prototype.map) {

    Array.prototype.map = function(callback, thisArg) {

        var T, A, k;

        if(this == null) {
            throw new TypeError(" this is null or not defined");
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if(typeof callback !== "function") {
            throw new TypeError(callback + " is not a function");
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if(arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array( len) where Array is
        // the standard built-in constructor with that name and len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while(k < len) {

            var kValue, mappedValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if(k in O) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[k];

                // ii. Let mappedValue be the result of calling the Call internal method of callback
                // with T as the this value and argument list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty( A, k, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                // For best browser support, use the following:
                A[k] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }

        // 9. return A
        return A;
    };
}

if(!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisArg */) {
        "use strict";

        if(this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if(typeof fun !== "function")
            throw new TypeError();

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for(var i = 0; i < len; i++) {
            if(i in t) {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if(fun.call(thisArg, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if(!Array.prototype.some) {
    Array.prototype.some = function(fun /*, thisArg*/) {
        'use strict';

        if(this == null) {
            throw new TypeError('Array.prototype.some called on null or undefined');
        }

        if(typeof fun !== 'function') {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for(var i = 0; i < len; i++) {
            if(i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

////// END POLYFILLS //////

/**
 *
 * @param nums
 * @return {{mean: number, stdDev: number}}
 */
function meanStddev(nums) {
    var sum = 0.0;
    var sumSq = 0.0;
    var count = nums.length;
    nums.forEach(function(num) {
        if(!isNaN(num)) {
            sum += num;
            sumSq += num * num;
        } else {
            count--;
        }
    });

    var mean = sum / count;
    return {
        mean: mean,
        stdDev: Math.sqrt((sumSq / count) - Math.pow(mean, 2)),
        count: count
    };
}

/**
 *
 * @param nums
 * @return {{mean: number, stdDev: number, stdErr: number}}
 */
function meanStderrStddev(nums) {
    var retVal = meanStddev(nums);
    retVal.stdErr = retVal.stdDev / Math.sqrt(retVal.count);

    return retVal;
}

/**
 * Creates an array whose values will be the same as the index
 * @param {number} size the size of the array
 * @return {Array.<number>} the resulting array
 */
function ascendingIntegers(size) {
    var arr = new Array(size);
    for(var i = 0; i < arr.length; i++) {
        arr[i] = i;
    }
    return arr;
}

/**
 * Enumeration describing the kind of a sample variable
 * @readonly
 * @enum {string}
 */
var VarKind = {
    /** "number" designates a numeric variable which can be real or integer. Eg: blood pressure */
    NUMBER: "number",

    /** "factor" designates a factor/categorical variable. Eg: sex or coat color */
    FACTOR: "factor",

    /** "identifier" designates an identifier which must be unique for every sample */
    IDENTIFIER: "identifier"
};

/**
 * This function will try to guess what kind of data is held in the given value strings.
 * It will guess between
 * @param valStrings the value strings that this function will use to infer what kind of values they are
 */
function inferValueKind(valStrings) {
    var valNums = new Array(valStrings.length);
    var i;

    // first see if we can treat everything as a number. We do this by trying
    // to convert everything to a number using "+" which returns NaN in the
    // case that the given string can't be converted to a number
    for(i = 0; i < valStrings.length; i++) {
        var currVal = +valStrings[i];

        if(isNaN(currVal) && valStrings[i].toUpperCase() !== 'NAN') {
            // this is not a number so we'll abort this loop
            valNums = null;
            break;
        } else {
            valNums[i] = currVal;
        }
    }

    if(valNums !== null) {
        return {
            kind: VarKind.NUMBER,
            values: valNums
        };
    } else {
        // The data is not numeric so find out if it's categorical or not.
        // We'll call it categorical if there are any duplicate IDs
        var valMap = {};
        var anyDups = false;
        for(i = 0; valStrings.length; i++) {
            if(valMap.hasOwnProperty(valStrings[i])) {
                anyDups = true;
                valMap = null;
                break;
            } else {
                valMap[valStrings[i]] = null;
            }
        }
        valMap = null;

        if(anyDups) {
            // treat this as a factor with levels since there are duplicate strings
            var factorLevels = [];
            for(i = 0; i < valStrings.length; i++) {
                if(factorLevels.indexOf(valStrings[i]) === -1) {
                    factorLevels.push(valStrings[i]);
                }
            }

            return {
                kind: VarKind.FACTOR,
                values: valStrings,
                levels: factorLevels
            };
        } else {
            // all strings are unique so treat this as an ID
            return {
                kind: VarKind.IDENTIFIER,
                values: valStrings
            };
        }
    }
}

/**
 * This class provides a way of going back and forth between a numerical index
 * and a tuple of factor levels
 * @param facList
 *      a list of factors. each element must have a levels attribute 
 * @constructor
 */
function MultiFactors(facList) {
    var self = this;

    /**
     * This value represents the maximum number of combinations
     * that the factors given in the constructor can represent.
     * Thus integers in the range [0 - (totalFactorCombinations - 1)]
     * can be represented.
     * @type {number}
     */
    this.totalFactorCombinations = 0;
    var ordersOfMagnitude = new Array(facList.length);
    (function() {
        if(facList.length) {
            self.totalFactorCombinations = 1;
            var ordOfMag = 1;
            for(var i = facList.length - 1; i >= 0; i--) {
                ordersOfMagnitude[i] = ordOfMag;
                ordOfMag *= facList[i].levels.length;
                self.totalFactorCombinations *= facList[i].levels.length;
            }
        }
    })();

    /**
     * Maps the given index to a unique array of factor levels.
     * @param {number} index the index to map
     * @return {Array.<string>} the array of factor levels
     */
    this.indexToValues = function(index) {
        var values = [];
        for(var i = 0; i < facList.length; i++) {
            var currValIndex = 0;
            var currMag = ordersOfMagnitude[i];
            currValIndex = Math.floor(index / currMag);
            index %= currMag;
            values.push(facList[i].levels[currValIndex]);
        }
        return values;
    };

    /**
     * Maps the given values array to an integer in the range
     * [0 - (totalFactorCombinations - 1)] to a list of factor
     * levels
     * @param {Array.<string>} values the given factor levels
     * @return {number} the index that uniquely maps to the given levels
     */
    this.valuesToIndex = function(values) {
        var total = 0;
        for(var i = 0; i < values.length; i++) {
            var currValIndex = facList[i].levels.indexOf(values[i]);
            total += currValIndex * ordersOfMagnitude[i];
        }
        return total;
    };
}

/**
 * Read the given CSV text
 * @param {string} text the CSV text
 * @return {Array.<Array.<string>>} the 2D array of table cells
 */
function readCSV(text) {
    return readTable(text, /,/, true);
}

/**
 * Read the given tab separated text
 * @param {string} text the tab separated text
 * @return {Array.<Array.<string>>} the 2D array of table cells
 */
function readTab(text) {
    return readTable(text, /\t/, true);
}

/**
 * Read the given whitespace separated text
 * @param {string} text the whitespace separated text
 * @return {Array.<Array.<string>>} the 2D array of table cells
 */
function readWhiteSpace(text) {
    return readTable(text, /\s+/, true);
}

/**
 * Read the given table
 * @param {string} text the text
 * @param fieldSepRegex regular expression used to split cells in the table
 * @param {boolean} [trimFields=false] should fields be trimmed?
 * @return {Array.<Array.<string>>} the 2D array of table cells
 */
function readTable(text, fieldSepRegex, trimFields) {
    if(typeof trimFields === 'undefined') {
        trimFields = false;
    }
    
    // break on newline
    var lines = text.split(/\r\n|\n/);
    for(var i = 0; i < lines.length; i++) {
        var row = lines[i].split(fieldSepRegex);
        if(trimFields) {
            for(var j = 0; j < row.length; j++) {
                row[j] = row[j].trim();
            }
        }
        
        // special case for empty row
        if(row.length === 1 && row[0] === '') {
            row = [];
        }

        lines[i] = row;
    }
    
    return lines;
}

/**
 * Transpose the given matrix
 * @param mat       a 2D array that we treat as a matrix
 * @param colCount  the column count. All rows must be this length
 * @return {Array}  the transpose of mat
 */
function transpose(mat, colCount) {
    var rowCount = mat.length;
    var tMat = new Array(colCount);
    for(var colIndex = 0; colIndex < colCount; colIndex++) {
        tMat[colIndex] = new Array(rowCount);
    }

    for(var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        var row = mat[rowIndex];
        if(row.length !== colCount) {
            throw ('bad row length: observed ' + row.length + ' but expected ' + colCount);
        }
        for(var colIndex = 0; colIndex < colCount; colIndex++) {
            tMat[colIndex][rowIndex] = row[colIndex];
        }
    }

    return tMat;
}

/**
 * Create an object out of a design table
 * @param sampleDataTable
 *          a 2D array of string values. The first row should be header values naming each column
 *          and subsequent rows should be values. The column types will be inferred using the
 *          inferValueKind function
 * @return the resulting sample data object
 */
function tableToSampleDataObject(sampleDataTable) {
    sampleDataTable = sampleDataTable.filter(function(row) {
        return row.length > 0;
    });

    if(sampleDataTable.length <= 1) {
        throw 'the design table is empty';
    }
    
    var headerRow = sampleDataTable[0];
    var colCount = headerRow.length;
    if(colCount === 0) {
        throw 'the header row is empty';
    }

    var valStrCols = transpose(sampleDataTable.slice(1), colCount);
    var varCols = valStrCols.map(inferValueKind);
    for(var colIndex = 0; colIndex < colCount; colIndex++) {
        varCols[colIndex]['name'] = headerRow[colIndex];
    }

    return {
        sampleCount: (sampleDataTable.length - 1),
        //variableCount: varCols.length,
        sampleVariables: varCols
    };
}

/**
 * This callback will be called with the file that was dropped.
 * @callback dropCallback
 * @param file the file object
 */
/**
 * Create a file drop area
 * @param activeElement
 *          the element that the user can drop on to trigger a callback
 * @param highlightElement
 *          the element that we will overlay with the hover message when the
 *          user drags a file over
 * @param hoverMessage {string}
 *          the text to use in the drop overlay
 * @param dropCallback {dropCallback}
 */
function fileDropify(activeElement, highlightElement, hoverMessage, dropCallback) {
    var fileDropOverlay = null;
    var designDropActive = function() {
        if(fileDropOverlay == null) {
            var offset = highlightElement.offset();
            fileDropOverlay = $(document.createElement('div'));

            fileDropOverlay.css(offset);
            fileDropOverlay.width(highlightElement.outerWidth());
            fileDropOverlay.height(highlightElement.outerHeight());
            fileDropOverlay.addClass('file-drop-panel');

            var textSpan = $(document.createElement('span'));
            textSpan.text(hoverMessage);
            fileDropOverlay.append(textSpan);

            $('body').append(fileDropOverlay);
        }
    };
    var designDropInactive = function() {
        if(fileDropOverlay !== null) {
            fileDropOverlay.remove();
            fileDropOverlay = null;
        }
    };

    activeElement.on('dragenter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        designDropActive();
    });
    activeElement.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        designDropActive();
    });
    activeElement.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        designDropInactive();
    });
    activeElement.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        designDropInactive();

        var files = e.originalEvent.dataTransfer.files;
        if(files.length === 1) {
            dropCallback(files[0]);
        }
    });
}

function rotate(point, theta) {
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    var newX = cosTheta * point.x - sinTheta * point.y;
    var newY = sinTheta * point.x + cosTheta * point.y;

    return {
        x: newX,
        y: newY
    }
}

/**
 * If maybeFunc is a func it is evaluated with no parameters and the result is
 * returned, otherwise maybeFunc itself is returned. This can be useful if you
 * want to allow an object/function to accept parameters that can either be
 * functions or simple objects/scalar values.
 * @param maybeFunc possibly a zero arg function, possibly something else
 * @return maybeFunc() or maybeFunc... depending on if it's a function or not
 */
function callIfFunc(maybeFunc) {
    if(typeof maybeFunc === 'function') {
        return maybeFunc();
    } else {
        return maybeFunc;
    }
}

/**
 * @typedef SampleVariable
 * @property {string} [name] an optional name for this variable
 * @property {VarKind} kind
 *          tells us whether the variable is a "number", "factor" or "identifier"
 * @property {(string[]|number[])} values
 *          if kind is number than this will be a number array, otherwise it will be a string array
 * @property {string[]} [levels]
 *          this property will only be present in the case that kind is a "factor". In this case
 *          levels will be a list of unique strings representing all of the possible levels in
 *          this factor variable
 */

/**
 * Enumeration of available data point shapes
 * @readonly
 * @enum {string}
 */
var DataPointShape = {
    CIRCLE: "circle",
    SQUARE: "square",
    DIAMOND: "diamond",
    CROSS: "cross",
    X: "x",
    STAR: "star",
    UP_TRIANGLE: "up-triangle",
    DOWN_TRIANGLE: "down-triangle"
};

/**
 * Render a circle centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderCircle(parentNode, sizePx) {
    return parentNode.append('svg:circle')
        .attr('class', 'data-point circle-data-point')
        .attr('r', sizePx / 2);
}

/**
 * Render a square centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderSquare(parentNode, sizePx) {
    return parentNode.append('svg:rect')
        .attr('class', 'data-point square-data-point')
        .attr('x', -sizePx / 2)
        .attr('y', -sizePx / 2)
        .attr('width', sizePx)
        .attr('height', sizePx);
}

/**
 * Render a diamond centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderDiamond(parentNode, sizePx) {
    return parentNode.append('svg:rect')
        .attr('class', 'data-point diamond-data-point')
        .attr('x', -sizePx / 2)
        .attr('y', -sizePx / 2)
        .attr('width', sizePx)
        .attr('height', sizePx)
        .attr('transform', 'rotate(45)');
}

/**
 * Render a cross centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderCross(parentNode, sizePx) {
    var crossShape = parentNode.append('g')
        .attr('class', 'data-point cross-data-point');
    crossShape.append('svg:line')
        .attr('x1', -sizePx / 2)
        .attr('y1', 0)
        .attr('x2', sizePx / 2)
        .attr('y2', 0);
    crossShape.append('svg:line')
        .attr('x1', 0)
        .attr('y1', -sizePx / 2)
        .attr('x2', 0)
        .attr('y2', sizePx / 2);
    return crossShape;
}

/**
 * Render an X centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderX(parentNode, sizePx) {
    var xShape = parentNode.append('g')
        .attr('class', 'data-point x-data-point');
    xShape.append('svg:line')
        .attr('x1', -sizePx / 2)
        .attr('y1', -sizePx / 2)
        .attr('x2', sizePx / 2)
        .attr('y2', sizePx / 2);
    xShape.append('svg:line')
        .attr('x1', -sizePx / 2)
        .attr('y1', sizePx / 2)
        .attr('x2', sizePx / 2)
        .attr('y2', -sizePx / 2);
    return xShape;
}

/**
 * Render a star centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderStar(parentNode, sizePx) {
    // to create a star we calculate the position of a star tip and a connecting inner pentagon corner,
    // then we rotate them 4 times by 2PI/5
    var currStarPoint = {
        x: sizePx / 2,
        y: Math.cos(2 * Math.PI / 5) * sizePx / 2
    };
    var currPentagonPoint = {
        x: Math.tan(Math.PI / 5) * currStarPoint.y,
        y: currStarPoint.y
    };

    var starPath = 'M' + currStarPoint.x + ',' + -currStarPoint.y + ' ' + currPentagonPoint.x + ',' + -currPentagonPoint.y;
    var i;
    for(i = 0; i < 4; i++) {
        currStarPoint = rotate(currStarPoint, 2 * Math.PI / 5);
        currPentagonPoint = rotate(currPentagonPoint, 2 * Math.PI / 5);

        starPath += ' ' + currStarPoint.x + ',' + -currStarPoint.y + ' ' + currPentagonPoint.x + ',' + -currPentagonPoint.y;
    }
    starPath += 'Z';

    return parentNode.append('path')
        .attr('class', 'data-point star-data-point')
        .attr('d', starPath);
}

/**
 * Render an equilateral triangle pointing up and centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderUpTriangle(parentNode, sizePx) {
    // build equilateral up triangle
    var currTrianglePoint = {
        x: sizePx / 2,
        y: Math.tan(Math.PI / 6) * sizePx / 2
    };

    var upTrianglePath = 'M' + currTrianglePoint.x + ',' + currTrianglePoint.y;
    for(var i = 0; i < 2; i++) {
        currTrianglePoint = rotate(currTrianglePoint, 2 * Math.PI / 3);
        upTrianglePath += ' ' + currTrianglePoint.x + ',' + currTrianglePoint.y;
    }
    upTrianglePath += 'Z';

    return parentNode.append('path')
        .attr('class', 'data-point up-triangle-data-point')
        .attr('d', upTrianglePath);
}

/**
 * Render an equilateral triangle pointing down and centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @return reference to d3 shape node
 */
function renderDownTriangle(parentNode, sizePx) {
    // build equilateral down triangles
    var currTrianglePoint = {
        x: sizePx / 2,
        y: Math.tan(Math.PI / 6) * sizePx / 2
    };

    var downTrianglePath = 'M' + currTrianglePoint.x + ',' + -currTrianglePoint.y;
    for(var i = 0; i < 2; i++) {
        currTrianglePoint = rotate(currTrianglePoint, 2 * Math.PI / 3);
        downTrianglePath += ' ' + currTrianglePoint.x + ',' + -currTrianglePoint.y;
    }
    downTrianglePath += 'Z';

    return parentNode.append('path')
        .attr('class', 'data-point down-triangle-data-point')
        .attr('d', downTrianglePath);
}

/**
 * Render the given point shape centered at the origin
 * @param parentNode                the d3 parent node to render to
 * @param {number} sizePx           the size in pixels
 * @param {DataPointShape} shape    the shape
 * @return reference to d3 shape node
 */
function renderShape(parentNode, sizePx, shape) {
    switch(shape) {
        case DataPointShape.CIRCLE:
            return renderCircle(parentNode, sizePx);
        case DataPointShape.SQUARE:
            return renderSquare(parentNode, sizePx);
        case DataPointShape.DIAMOND:
            return renderDiamond(parentNode, sizePx);
        case DataPointShape.CROSS:
            return renderCross(parentNode, sizePx);
        case DataPointShape.X:
            return renderX(parentNode, sizePx);
        case DataPointShape.STAR:
            return renderStar(parentNode, sizePx);
        case DataPointShape.UP_TRIANGLE:
            return renderUpTriangle(parentNode, sizePx);
        case DataPointShape.DOWN_TRIANGLE:
            return renderDownTriangle(parentNode, sizePx);
        default:
            throw 'unexpected shape: ' + shape;
    }
}

/**
 * The factorial plot object.
 * @param params.svg a D3 object for the svg element. Eg: d3.select('#id-of-svg-elem')
 * @param {number} [params.margin=2] the margin to use for the plot (this provides blank space around the edges of the plot)
 * @param {number} [params.pointSizePx=10] the default size used for point shapes
 * @param {string} [params.idPrefix=''] the default prefix to use for IDs created within this plot. This is useful if you
 *      want to render more than one plot in the same HTML document and you want to make sure that the IDs don't
 *      conflict with each other
 * @param {DataPointShape} [params.defaultDataPointShape=DataPointShape.CIRCLE]
 *      data points will use this shape by default
 * @constructor
 */
function FactExpPlot(params) {
    var self = this;

    // initialize the plot
    var svg = params.svg;
    var margin = typeof params.margin === 'undefined' ? 2 : params.margin;
    var pointSizePx = typeof params.pointSizePx === 'undefined' ? 10 : params.pointSizePx;
    var idPrefix = typeof params.idPrefix === 'undefined' ? '' : params.idPrefix;
    var defaultDataPointShape =
            typeof params.defaultDataPointShape === 'undefined' ? DataPointShape.CIRCLE : params.defaultDataPointShape;
    var renderWidth = params.width;
    var renderHeight = params.height;

    // build icon shapes
    var defaultPointNode = null;
    (function() {
        // if there is already a defs element use it. Otherwise create it
        var defs = svg.select('defs');
        if(defs.empty()) {
            defs = svg.append('defs');
        }

        renderCircle(defs, pointSizePx).attr('id', idPrefix + 'circle-data-point');
        renderSquare(defs, pointSizePx).attr('id', idPrefix + 'square-data-point');
        renderDiamond(defs, pointSizePx).attr('id', idPrefix + 'diamond-data-point');
        renderCross(defs, pointSizePx).attr('id', idPrefix + 'cross-data-point');
        renderX(defs, pointSizePx).attr('id', idPrefix + 'x-data-point');
        renderStar(defs, pointSizePx).attr('id', idPrefix + 'star-data-point');
        renderUpTriangle(defs, pointSizePx).attr('id', idPrefix + 'up-triangle-data-point');
        renderDownTriangle(defs, pointSizePx).attr('id', idPrefix + 'down-triangle-data-point');

        defaultPointNode = defs.append('use')
            .attr('id', idPrefix + 'default-data-point')
            .attr('xlink:href', '#' + idPrefix + defaultDataPointShape + '-data-point');
    })();

    this.getSVG = function() {
        return svg;
    };

    /**
     * Change the default point shape
     * @param shape the new default point shape
     */
    this.setDefaultPointShape = function(shape) {
        defaultDataPointShape = shape;
        defaultPointNode.attr('xlink:href', '#' + idPrefix + defaultDataPointShape + '-data-point');
    };


    /**
     * Set the shape of the given point.
     * @param d3Node
     *          the D3 node selection for the point whose shape were updating
     * @param {DataPointShape} shape
     *          the shape. if this is set to null, the shape will fall back to the default
     * @return the same d3Node that was passed in (to facilitate chaining method calls)
     */
    this.setPointShape = function(d3Node, shape) {
        if(typeof shape === 'undefined' || shape === null) {
            return d3Node.attr('xlink:href', '#' + idPrefix + 'default-data-point');
        } else {
            return d3Node.attr('xlink:href', '#' + idPrefix + shape + '-data-point');
        }
    };


    /**
     * You can assign your callback function to this member. It will be invoked when the user mouses over
     * a point on the plot. By default this function is null and so does not have any effect at all
     *
     * @param {number} sampleIndex
     *      the sampleIndex that the user has moused over
     * @param {Object} d3Node
     *      the d3 node that was rendered for the sample at sampleIndex
     */
    this.mouseOverPoint = null;


    /**
     * Assign your own function to this variable if you would like to post process points. It will be passed
     * the sample index along with the d3 object for the rendered point. You can use this for instance
     * to apply a class to the node. Eg: d3Node.attr('class', 'myclass')
     * or this.setPointShape(d3Node, DataPointShape.STAR)
     *
     * @param {number} sampleIndex
     *      the sample index that this function should generate a style for.
     * @param {Object} d3Node
     *      the d3 node generated from rendering the node at the given sampleIndex
     */
    this.postProcessPoint = null;


    /**
     * @typedef {Object} WhiskerDescription
     * @property {string} [units='stderr'] the units to use for dist
     * @property {number} [dist=1] the distance to use for whiskers
     * @property {number} [sizeRatio=0.8] a 0 to 1 value that specifies how much space the whiskers should take up. 1
     *                      indicates that it should fill 100% of the width available in its "swim lane"
     * @property {SampleVariable[]} [groupByFactors]
     *                      group by these factors for the purposes of creating whiskers. These groupings are,
     *                      of course, in addition to any factor groupings that are already applied to the relevant
     *                      axis
     */
    /**
     * @typedef {Object} AxisDescription
     * @property {string} [label]
     *          the axis label. A null value indicates that a default label should be used based on the given variable names
     * @property {SampleVariable[]} variables
     *          all of the sample variables that make up this design. These can be numbers,
     *          identifiers and/or factors.
     * @property {number} [min] this property can be used to specify the minimum numeric value. The
     *          default behavior is to calculate this value based on the variables
     * @property {number} [max] this property can be used to specify the maximum numeric value. The
     *          default behavior is to calculate this value based on the variables
     * @property {WhiskerDescription} [whiskers] the default behavior is to not use whiskers in the plot
     */
    /**
     * Render the plot based on the given params. Note that there are constraints on which X and Y axis variables
     * are chosen. Each axis can handle an arbitrary number of variables of kind "factor" but only a single
     * "number" kind is allowed. Also note that the min/max values for the X and Y axes will only affect the
     * numeric ranges of an axis (the factor components will remain unaffected). If max/min values are not
     * provided they will be calculated based on the range of numeric data in axis variables.
     * @param {SampleData} params.sampleData
     *          the object containing all sample data that will be used to render the axes (via
     *          xAxisVariableIndexesOrNames and yAxisVariableIndexesOrNames) and styles (via styleRules)
     * @param {string} [params.title]
     *          the main title of the plot. the default is to have no label
     * @param {AxisDescription} [params.xAxis] describes the X axis
     * @param {AxisDescription} [params.yAxis] describes the Y axis
     * @param {boolean} [params.renderPoints=true] determines if we actually render the plot data points
     */
    this.renderPlot = function(params) {
        svg.selectAll('#' + idPrefix + 'plot-content').remove();

        if(typeof params === 'undefined' || params === null) {
            throw 'renderPlot requires a non-null params object';
        }

        var renderPoints = true;
        if(typeof params.renderPoints !== 'undefined') {
            renderPoints = params.renderPoints;
        }

        // assume that this is a call to the function using the legacy parameter structure
        //if(typeof params.xAxis === 'undefined' && typeof params.yAxis === 'undefined') {
        if(typeof params.sampleData !== 'undefined') {
            console.warn(
                'The caller is using the old parameter structure. This was detected because we ' +
                'are missing xAxis and yAxis parameters but we do have a sampleData parameter. ' +
                'The old calling structure is deprecated and may not be supported in future versions.');

            // create a closure just to force variable to go out of scope at the end of the "if" statement
            (function() {
                // validate and initialize X axis variables
                function idOrNameToVariable(i) {
                    if(typeof i === 'string') {
                        // look up the variable whose name matches
                        var retVal = null;
                        params.sampleData.sampleVariables.some(function(currSampleVar) {
                            if(currSampleVar.name === i) {
                                retVal = currSampleVar;

                                // break loop
                                return true;
                            } else {
                                return false;
                            }
                        });
                        return retVal;
                    } else {
                        // treat i as a simple numeric index
                        return params.sampleData.sampleVariables[i];
                    }
                }

                var xAxisVariables;
                var yAxisVariables;
                if(typeof params.xAxisVariableIndexes === 'undefined') {
                    xAxisVariables = params.xAxisVariableIndexesOrNames.map(idOrNameToVariable);
                    yAxisVariables = params.yAxisVariableIndexesOrNames.map(idOrNameToVariable);
                } else {
                    xAxisVariables = params.xAxisVariableIndexes.map(idOrNameToVariable);
                    yAxisVariables = params.yAxisVariableIndexes.map(idOrNameToVariable);
                }

                params = {
                    title: params.title,
                    sampleCount: params.sampleData.sampleCount,
                    xAxis: {
                        label: params.xAxisLabel,
                        variables: xAxisVariables,
                        min: params.xAxisMin,
                        max: params.xAxisMax
                    },
                    yAxis: {
                        label: params.yAxisLabel,
                        variables: yAxisVariables,
                        min: params.yAxisMin,
                        max: params.yAxisMax
                    }
                };
            })();
        }

        function initAxis(axisName) {
            if(typeof params[axisName].min === 'undefined') {
                params[axisName].min = null;
            }
            if(typeof params[axisName].max === 'undefined') {
                params[axisName].max = null;
            }
            if(typeof params[axisName].variables === 'undefined' || params[axisName].variables.length === 0) {
                throw 'params.' + axisName + '.variables must contain at least one index or name in order to render the plot';
            }
            var numericVariables = params[axisName].variables.filter(function(x) {return x.kind === VarKind.NUMBER;});
            if(numericVariables.length > 1) {
                throw 'There is more than one numeric Y axis variable selected. Only one numeric variable is permitted';
            }
            var numeric = numericVariables.length === 1 ? numericVariables[0] : null;

            var factors = params[axisName].variables.filter(function(x) {return x.kind === VarKind.FACTOR;});
            var multiFactors = factors.length ? new MultiFactors(factors) : null;


            function makeFactorScale() {
                if(multiFactors === null) {
                    return null;
                } else {
                    // we don't know the range yet so we just set the domain
                    return d3.scale.linear().domain([-0.5, multiFactors.totalFactorCombinations - 0.5]);
                }
            }

            function makeNumericScales() {
                if(numeric === null) {
                    return null;
                } else {
                    // we don't know the range yet so we just set the domain
                    var numericVarScale = d3.scale.linear().domain([
                        params[axisName].min === null ? d3.min(numeric.values) : params[axisName].min,
                        params[axisName].max === null ? d3.max(numeric.values) : params[axisName].max]);

                    if(multiFactors === null) {
                        return [numericVarScale];
                    } else {
                        var numericScales = [];
                        for(var i = 0; i < multiFactors.totalFactorCombinations; i++) {
                            numericScales.push(numericVarScale.copy());
                        }

                        return numericScales;
                    }
                }
            }

            return {
                factors: factors,
                numeric: numeric,
                multiFactors: multiFactors,
                factorScale: makeFactorScale(),
                numericScales: makeNumericScales()
            };
        }

        var xAxis = initAxis('xAxis');
        var yAxis = initAxis('yAxis');

        // we'll use the main group to hold all axes and points
        var main = svg.append('g')
            .attr('id', idPrefix + 'plot-content')
            .attr('class', 'plot-content');

        var svgWidth;
        var svgHeight;
        if(typeof renderWidth === 'undefined') {
            // TODO remove jquery dependency (d3 gives string like '545px' so it's not as straight forward)
            svgWidth = $(svg.node()).width();
        } else {
            svgWidth = renderWidth;
        }
        if(typeof renderHeight === 'undefined') {
            // TODO remove jquery dependency (d3 gives string like '545px' so it's not as straight forward)
            svgHeight = $(svg.node()).height();
        } else {
            svgHeight = renderHeight;
        }
        // define convenience functions to convert sample index
        // to their XY position
        function sampleIndexToPosition(sampleIndex, axis) {
            var sampleFactorsIndex = null;
            if(axis.multiFactors !== null) {
                var sampleFactors = axis.factors.map(function(factor) {
                    return factor.values[sampleIndex];
                });
                sampleFactorsIndex = axis.multiFactors.valuesToIndex(sampleFactors);
            }

            var sampleVal = axis.numeric === null ? null : axis.numeric.values[sampleIndex];

            if(axis.factorScale !== null && axis.numericScales === null) {
                // there are no numeric scales so we just need to use the factor scale
                return axis.factorScale(sampleFactorsIndex);
            } else if(axis.factorScale === null && axis.numericScales !== null && axis.numericScales.length === 1) {
                // there is no factor scale so we're just going to use the numeric scale
                return axis.numericScales[0](sampleVal);
            } else if(axis.factorScale !== null && axis.numericScales !== null) {
                // we have both
                return axis.numericScales[sampleFactorsIndex](sampleVal);
            } else {
                throw 'internal error';
            }
        }
        function sampleIndexToX(sampleIndex) {
            return sampleIndexToPosition(sampleIndex, xAxis);
        }
        function sampleIndexToY(sampleIndex) {
            return sampleIndexToPosition(sampleIndex, yAxis);
        }

        // this function takes care of updating the ranges on all scales (both factor and numeric scales)
        // when the range start and/or stop values have changed
        function updateScaleRanges(factorScale, numScales, rangeStart, rangeStop) {
            if(factorScale !== null) {
                factorScale.range([rangeStart, rangeStop]);
            }

            if(numScales !== null) {
                if(factorScale === null) {
                    numScales[0].range([rangeStart, rangeStop]);
                } else {
                    // create margins to separate the scales a little bit
                    var startMargin = rangeStart < rangeStop ? 1 : -1;
                    var stopMargin = rangeStart < rangeStop ? -1 : 1;

                    var numScaleSize = (rangeStop - rangeStart) / numScales.length;
                    for(var scaleIndex = 0; scaleIndex < numScales.length; scaleIndex++) {
                        var currRangeStart = startMargin + rangeStart + numScaleSize * scaleIndex;
                        var currRangeStop = stopMargin + rangeStart + numScaleSize * (scaleIndex + 1);

                        numScales[scaleIndex].range([currRangeStart, currRangeStop]);
                    }
                }
            }
        }

        var titleHeight = 0;
        if(typeof params.title !== 'undefined' && params.title) {
            var titleText = main.append('text')
                .text(params.title)
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'hanging')
                .attr('class', 'plot-title');
            titleHeight = titleText.node().getBBox().height + margin;
            titleText.attr("x", svgWidth / 2).attr("y", margin);
        }

        var xAxisHeight = 0;
        var yAxisWidth = 0;

        function createXAxis() {
            if(xAxis.hasOwnProperty('svgGroup') && xAxis.svgGroup !== null) {
                xAxis.svgGroup.remove();
            }
            xAxis.svgGroup = main.append('g').attr('id', idPrefix + 'x-axis');
            var axisSubGroup = xAxis.svgGroup.append('g');

            var axisRangeStart = yAxisWidth + margin;
            var axisRangeStop = svgWidth - yAxisWidth - margin;
            updateScaleRanges(xAxis.factorScale, xAxis.numericScales, axisRangeStart, axisRangeStop);

            if(xAxis.factorScale !== null && xAxis.numericScales === null) {
                // there are no numeric scales so we're only going to need to render the factor scale
                var xFactorAxis = d3.svg.axis()
                    .scale(xAxis.factorScale)
                    .orient('bottom')
                    .tickValues(ascendingIntegers(xAxis.multiFactors.totalFactorCombinations))
                    .tickFormat(function(x) {
                        return xAxis.multiFactors.indexToValues(x).join(' : ');
                    });
                var xFactorAxisText = axisSubGroup.call(xFactorAxis).selectAll("text");
                xFactorAxisText
                    .attr("y", 0)
                    .attr("x", -9)
                    .attr("transform", function() {
                        return "translate(" + (-this.getBBox().height / 2.0) + ")rotate(-90)";
                    })
                    .style("text-anchor", "end")
                    .style("dominant-baseline", "middle");
            } else if(xAxis.factorScale === null && xAxis.numericScales !== null && xAxis.numericScales.length === 1) {
                // there is no factor scale so we're just going to render a numeric scale
                var xNumericAxis = d3.svg.axis()
                    .scale(xAxis.numericScales[0])
                    .orient('bottom');
                axisSubGroup.call(xNumericAxis);
            } else if(xAxis.factorScale !== null && xAxis.numericScales !== null) {
                // render the factor scale
                var xFactorAxis = d3.svg.axis()
                    .scale(xAxis.factorScale)
                    .orient('bottom')
                    .tickValues(ascendingIntegers(xAxis.multiFactors.totalFactorCombinations))
                    .tickFormat(function(x) {
                        return xAxis.multiFactors.indexToValues(x).join(' : ');
                    });
                var xFactorAxisGrp = axisSubGroup.append('g').attr('id', idPrefix + 'x-factor-axis');
                xFactorAxisGrp.call(xFactorAxis);
                var xFactorAxisText = xFactorAxisGrp.selectAll("text");
                xFactorAxisText
                    .attr("y", 0)
                    .attr("x", -9)
                    .attr("transform", function() {
                        return "translate(" + (-this.getBBox().height / 2.0) + ")rotate(-90)";
                    })
                    .style("text-anchor", "end")
                    .style("dominant-baseline", "middle");


                // since we are also rendering numeric axes we should remove the line and ticks from
                // the factor axis
                xFactorAxisGrp.selectAll('line').remove();
                xFactorAxisGrp.selectAll('path').remove();

                // render each of the numeric scales
                var xNumericAxesGrp = axisSubGroup.append('g').attr('id', idPrefix + 'x-numeric-axes');
                xAxis.numericScales.forEach(function(numericScale) {
                    var xNumericAxis = d3.svg.axis()
                        .scale(numericScale)
                        .orient('bottom');
                    xNumericAxesGrp.append('g').call(xNumericAxis);
                });

                // move the numeric scales so that they don't overlap with the factor scale
                var numericAxesHeight = xNumericAxesGrp.node().getBBox().height;
                xFactorAxisGrp.attr('transform', 'translate(0,' + numericAxesHeight + ')')
            } else {
                throw 'internal error';
            }

            // if there's a valid axis label add it here
            var xAxisLabel = null;
            if(typeof params.xAxis.label === 'undefined') {
                xAxisLabel = params.xAxis.variables.map(function(x) {return x.name;}).join(' x ');
            } else {
                xAxisLabel = params.xAxis.label;
            }
            if(xAxisLabel) {
                var noLabelHeight = axisSubGroup.node().getBBox().height;
                xAxis.svgGroup.append('text')
                    .text(xAxisLabel)
                    .style('text-anchor', 'middle')
                    .style('dominant-baseline', 'hanging')
                    .attr('class', 'axis-label x-axis-label')
                    .attr('x', (axisRangeStart + axisRangeStop) / 2.0)
                    .attr('y', noLabelHeight + margin);
            }

            xAxisHeight = xAxis.svgGroup.node().getBBox().height;
            var xAxisTranslate = 'translate(0,' + (svgHeight - (xAxisHeight + margin)) + ')';
            xAxis.svgGroup.attr('transform', xAxisTranslate).attr('class', 'main axis');
        }
        function createYAxis() {
            if(yAxis.hasOwnProperty('svgGroup') && yAxis.svgGroup !== null) {
                yAxis.svgGroup.remove();
            }
            yAxis.svgGroup = main.append('g').attr('id', idPrefix + 'y-axis');
            var axisSubGroup = yAxis.svgGroup.append('g');

            var axisRangeStart = svgHeight - xAxisHeight - margin;
            var axisRangeStop = titleHeight + margin;
            updateScaleRanges(yAxis.factorScale, yAxis.numericScales, axisRangeStart, axisRangeStop);

            if(yAxis.factorScale !== null && yAxis.numericScales === null) {
                // there are no numeric scales so we're only going to need to render the factor scale
                var yFactorAxis = d3.svg.axis()
                    .scale(yAxis.factorScale)
                    .orient('left')
                    .tickValues(ascendingIntegers(yAxis.multiFactors.totalFactorCombinations))
                    .tickFormat(function(x) {
                        return yAxis.multiFactors.indexToValues(x).join(' : ');
                    });
                axisSubGroup.call(yFactorAxis);
            } else if(yAxis.factorScale === null && yAxis.numericScales !== null && yAxis.numericScales.length === 1) {
                // there is no factor scale so we're just going to render a numeric scale
                var yNumericAxis = d3.svg.axis()
                    .scale(yAxis.numericScales[0])
                    .orient('left');
                axisSubGroup.call(yNumericAxis);
            } else if(yAxis.factorScale !== null && yAxis.numericScales !== null) {
                // render the factor scale
                var yFactorAxis = d3.svg.axis()
                    .scale(yAxis.factorScale)
                    .orient('left')
                    .tickValues(ascendingIntegers(yAxis.multiFactors.totalFactorCombinations))
                    .tickFormat(function(x) {
                        return yAxis.multiFactors.indexToValues(x).join(' : ');
                    });
                var yFactorAxisGrp = axisSubGroup.append('g').attr('id', idPrefix + 'y-factor-axis');
                yFactorAxisGrp.call(yFactorAxis);

                // since we are also rendering numeric axes we should remove the line and ticks from
                // the factor axis
                yFactorAxisGrp.selectAll('line').remove();
                yFactorAxisGrp.selectAll('path').remove();

                // render each of the numeric scales
                var yNumericAxesGrp = axisSubGroup.append('g').attr('id', idPrefix + 'y-numeric-axes');
                yAxis.numericScales.forEach(function(numericScale) {
                    var yNumericAxis = d3.svg.axis()
                        .scale(numericScale)
                        .orient('left');
                    yNumericAxesGrp.append('g').call(yNumericAxis);
                });

                // move the numeric scales so that they don't overlap with the factor scale
                var numericAxesWidth = yNumericAxesGrp.node().getBBox().width;
                yFactorAxisGrp.attr('transform', 'translate(' + (-numericAxesWidth) + ',0)');
            } else {
                throw 'internal error';
            }

            // if there's a valid axis label add it here
            var yAxisLabel = null;
            if(typeof params.yAxis.label === 'undefined') {
                yAxisLabel = params.yAxis.variables.map(function(x) {return x.name;}).join(' x ');
            } else {
                yAxisLabel = params.yAxis.label;
            }
            if(yAxisLabel) {
                var axisLabelTextElem = yAxis.svgGroup.append('text')
                    .text(yAxisLabel)
                    .style('text-anchor', 'middle')
                    .style('dominant-baseline', 'hanging')
                    .attr('class', 'axis-label x-axis-label');
                var noLabelHeight = axisSubGroup.node().getBBox().width;
                var axisLabelWidth = axisLabelTextElem.node().getBBox().height;
                var axisLabelTransform =
                    'translate(-' + (axisLabelWidth + noLabelHeight + margin) + ', ' +
                    ((axisRangeStart + axisRangeStop) / 2.0) + ')rotate(-90)';
                axisLabelTextElem.attr('transform', axisLabelTransform);
            }

            yAxisWidth = yAxis.svgGroup.node().getBBox().width;
            var yAxisTranslate = 'translate(' + (yAxisWidth + margin) + ',0)';
            yAxis.svgGroup.attr('transform', yAxisTranslate).attr('class', 'main axis')
        }

        // find out how much margin we have to give just for the axes. to do this we need to draw then delete the
        // axis node.
        //
        // NOTE: in a more general implementation we should iterate to find axis sizes
        //       since shortening an axis could change which labels are rendered
        createXAxis();
        createYAxis();
        createXAxis();

        // draw separators between factors
        function calcSeparatorPositions(axisToSep, otherAxis) {
            var posRange = null;
            if(otherAxis.factorScale !== null) {
                posRange = otherAxis.factorScale.range();
            } else if(otherAxis.numericScales !== null && otherAxis.numericScales.length === 1) {
                posRange = otherAxis.numericScales[0].range();
            }

            if(posRange === null) {
                return null;
            }

            if(axisToSep.factorScale !== null) {
                var positions = [];
                var isTopLevelSep = [];

                var totalCombinations = axisToSep.multiFactors.totalFactorCombinations;
                var factorIndexes = ascendingIntegers(totalCombinations);
                var topLevelFactors = axisToSep.factors[0];
                var topLevelGroupSize = totalCombinations / topLevelFactors.levels.length;

                for(var i = 1; i < factorIndexes.length; i++) {
                    positions.push(axisToSep.factorScale(i - 0.5));
                    isTopLevelSep.push(i % topLevelGroupSize === 0);
                }

                return {
                    otherAxisStart: posRange[0],
                    otherAxisStop: posRange[1],
                    positions: positions,
                    isTopLevelSep: isTopLevelSep
                };
            } else {
                return null;
            }
        }

        var xSepPositions = calcSeparatorPositions(xAxis, yAxis);
        if(xSepPositions !== null) {
            var xSepGrp = main.append('g').attr('id', idPrefix + 'x-separators').attr('class', 'separator-line x-separator-line');
            xSepGrp.selectAll('line')
                .data(xSepPositions.positions)
                .enter().append('svg:line')
                .attr('x1', function(d) {return d;})
                .attr('y1', xSepPositions.otherAxisStart)
                .attr('x2', function(d) {return d;})
                .attr('y2', xSepPositions.otherAxisStop)
                .classed('top-level-separator', function(d, i) {return xSepPositions.isTopLevelSep[i];});
        }

        var ySepPositions = calcSeparatorPositions(yAxis, xAxis);
        if(ySepPositions !== null) {
            var ySepGrp = main.append('g').attr('id', idPrefix + 'y-separators').attr('class', 'separator-line y-separator-line');
            ySepGrp.selectAll('line')
                .data(ySepPositions.positions)
                .enter().append('svg:line')
                .attr('x1', ySepPositions.otherAxisStart)
                .attr('y1', function(d) {return d;})
                .attr('x2', ySepPositions.otherAxisStop)
                .attr('y2', function(d) {return d;})
                .classed('top-level-separator', function(d, i) {return ySepPositions.isTopLevelSep[i];});
        }

        var pointGrp = main.append('g').attr('id', idPrefix + 'points-group');
        if(renderPoints) {
            for(var sampleIndex = 0; sampleIndex < params.sampleCount; sampleIndex++) {
                // capture the sampleIndex with a closure
                (function(sampleIndex) {
                    var x = sampleIndexToX(sampleIndex);
                    var y = sampleIndexToY(sampleIndex);
                    if(!isNaN(x) && !isNaN(y)) {
                        var transform = 'translate(' + x + ', ' + y + ')';
                        var pointNode = pointGrp.append('use')
                            .attr('xlink:href', '#' + idPrefix + 'default-data-point')
                            .attr('transform', transform);
                        if(self.mouseOverPoint) {
                            pointNode.on('mouseover', function() {
                                self.mouseOverPoint(sampleIndex, pointNode);
                            });
                        }
                        if(self.postProcessPoint) {
                            self.postProcessPoint(sampleIndex, pointNode);
                        }
                    }
                })(sampleIndex);
            }
        }

        // draw whiskers
        // TODO generalize me to X and Y
        if(typeof params.yAxis.whiskers !== 'undefined' && yAxis.numeric !== null) {
            var whiskerGrp = main.append('g').attr('id', idPrefix + 'whiskers').attr('class', 'whiskers default-whiskers');

            function itemIndexToGroupIndex(axis, sampleIndex) {
                if(axis.multiFactors === null) {
                    return 0;
                } else {
                    var sampleFactors = axis.factors.map(function(factor) {
                        return factor.values[sampleIndex];
                    });

                    return axis.multiFactors.valuesToIndex(sampleFactors);
                }
            }

            var whiskerGroupByFactors = [];
            if(params.yAxis.whiskers.groupByFactors) {
                whiskerGroupByFactors = params.yAxis.whiskers.groupByFactors.filter(function(x) {
                    return x.kind === VarKind.FACTOR;
                });
            }
            var whiskerMultiFactors = whiskerGroupByFactors.length ? new MultiFactors(whiskerGroupByFactors) : null;
            function itemIndexToWhiskerGroupIndex(sampleIndex) {
                if(whiskerMultiFactors === null) {
                    return 0;
                } else {
                    var sampleFactors = whiskerGroupByFactors.map(function(factor) {
                        return factor.values[sampleIndex];
                    });

                    return whiskerMultiFactors.valuesToIndex(sampleFactors);
                }
            }

            var groupedNumVals = [];
            for(var sampleIndex = 0; sampleIndex < params.sampleCount; sampleIndex++) {
                var xGroup = itemIndexToGroupIndex(xAxis, sampleIndex);
                var yGroup = itemIndexToGroupIndex(yAxis, sampleIndex);
                var whiskerGroup = itemIndexToWhiskerGroupIndex(sampleIndex);

                if(typeof groupedNumVals[xGroup] === 'undefined') {
                    groupedNumVals[xGroup] = [];
                }
                if(typeof groupedNumVals[xGroup][yGroup] === 'undefined') {
                    groupedNumVals[xGroup][yGroup] = [];
                }
                if(typeof groupedNumVals[xGroup][yGroup][whiskerGroup] === 'undefined') {
                    groupedNumVals[xGroup][yGroup][whiskerGroup] = [];
                }
                groupedNumVals[xGroup][yGroup][whiskerGroup].push(yAxis.numeric.values[sampleIndex]);
                console.log("pushed w data");
            }


            var prevMedians = [];
            groupedNumVals.forEach(function(xGrps, xIndex) {
                console.log('xIndex');
                console.log(xIndex);
                xGrps.forEach(function(yGrp, yIndex) {
                    console.log('yIndex');
                    console.log(yIndex);
                    yGrp.forEach(function(wGrp, wIndex) {
                        console.log('wIndex');
                        console.log(wIndex);
                        if(wGrp.length) {
                            var halfWhiskerWidth = 5;
                            var xOffset = 0;
                            if(xAxis.factorScale !== null) {
                                xOffset = xAxis.factorScale(xIndex);
                            }

                            var currStats = meanStderrStddev(wGrp);
                            whiskerGrp.append('svg:line')
                                .attr('x1', xOffset)
                                .attr('y1', yAxis.numericScales[yIndex](currStats.mean - currStats.stdErr))
                                .attr('x2', xOffset)
                                .attr('y2', yAxis.numericScales[yIndex](currStats.mean + currStats.stdErr));
                            whiskerGrp.append('svg:line')
                                .attr('x1', xOffset - halfWhiskerWidth)
                                .attr('y1', yAxis.numericScales[yIndex](currStats.mean - currStats.stdErr))
                                .attr('x2', xOffset + halfWhiskerWidth)
                                .attr('y2', yAxis.numericScales[yIndex](currStats.mean - currStats.stdErr));
                            whiskerGrp.append('svg:line')
                                .attr('x1', xOffset - halfWhiskerWidth)
                                .attr('y1', yAxis.numericScales[yIndex](currStats.mean))
                                .attr('x2', xOffset + halfWhiskerWidth)
                                .attr('y2', yAxis.numericScales[yIndex](currStats.mean));
                            whiskerGrp.append('svg:line')
                                .attr('x1', xOffset - halfWhiskerWidth)
                                .attr('y1', yAxis.numericScales[yIndex](currStats.mean + currStats.stdErr))
                                .attr('x2', xOffset + halfWhiskerWidth)
                                .attr('y2', yAxis.numericScales[yIndex](currStats.mean + currStats.stdErr));

                            if(params.yAxis.whiskers.connected) {
                                if(typeof prevMedians[wIndex] !== 'undefined') {
                                    var prevXY = prevMedians[wIndex];
                                    var whiskerConnecter = whiskerGrp.append('svg:line')
                                        .attr('x1', prevXY.x)
                                        .attr('y1', prevXY.y)
                                        .attr('x2', xOffset)
                                        .attr('y2', yAxis.numericScales[yIndex](currStats.mean));
                                    whiskerConnecter.attr('class', 'whisker-connector');
                                }
                                prevMedians[wIndex] = {
                                    x: xOffset,
                                    y: yAxis.numericScales[yIndex](currStats.mean)
                                };
                            }
                        }
                    });
                });
            });
        }
    };
}
