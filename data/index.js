var fs = require('fs');
var readline = require('readline')

var zoomLevels = {};

/* takes in csv file name (if rows in CSV represent rows in matrix), returns data parsed into matrix array */
var parseCSV = function (fileName) {
    return new Promise((resolve, reject) => {
        var data = [];
        // open stream
        const rl = readline.createInterface({
            input: fs.createReadStream(fileName),
            output: process.stdout,
            terminal: false
        });

        // for each line (row), parse into javascript matrix
        rl.on('line', (input) => {
            var row = input;
            data.push(row.split(",").filter(String)); // filter cleans array
        }).on('close', () => {
            // after data is loaded, fulfill promise
            resolve(data);
        });
    });
},

/* converts 2D array to CSV (string) */
convertToCSV = function(data) {
    var lineArray = [];
    data.forEach(function (infoArray, index) {
        var line = infoArray.join(",");
        lineArray.push(line);
    });
    var csvContent = lineArray.join("\n");
    return csvContent;
}

/* Returns object of various zoom levels depending on given factor */
var getZoomLevels = function(totalSize=-1, factor=-1) {
    if (totalSize > 0 && factor > 0) {
        var zoomLevel = 0;
        var currentZoom = totalSize;
        while (currentZoom > 1) {
            zoomLevels[zoomLevel] = currentZoom;
            zoomLevel++;
            currentZoom = Math.ceil(currentZoom / factor);
        }
    }
    
    return zoomLevels;
}, 

getFactor = function(level) {
    var zoomLevels = getZoomLevels();
    // for every 1, there are factor elements
    if (zoomLevels[level] !== undefined) return zoomLevels[0] / zoomLevels[level]; 
    else return -1;
},

linearFn = function(values) {
    return Math.max.apply(Math, values);
},

/* returns index for the values passed in (for a particular zoom level) */
mapToZoomRange = function(start, end, zoomLevel) {
    zoomFactor = getFactor(zoomLevel);
    zoomedStart = Math.ceil(start/zoomFactor);
    zoomedEnd = Math.ceil(end/zoomFactor);
    return (zoomedStart, zoomedEnd);
},

/* creates a new row array with the values folded */
generateZoomCol = function(dataCol, zoomLevel) {
    var factor = getFactor(zoomLevel);
    var newCol = [];
    var start, end;
    start, end = mapToZoomRange(0, dataCol.length, zoomLevel);
    if (factor != -1) {
        for (var i = 0; i < end; i++) {
            var values = dataCol.slice(factor*i, factor*(i+1));
            newCol.push(linearFn(values));
        }
    }
    return newCol;
},

/* generates a zoom level */
generateZoomLevel = function(data, zoomLevel) {
    var newData = []; // transpose
    for (var i = 0; i < data[0].length; i++) {
        // transpose matrix to calculate by row
        var col = data.map(function(value,index) { return value[i] });
        newData.push(generateZoomCol(col, zoomLevel));
    }
    var newData_T = [];
    for (i = 0; i < newData[0].length; i++) {
        // transpose matrix back to columns
        newData_T.push(newData.map(function(value, index) { return value[i] }));
    }
    return newData_T;
},

/* main function: creates .csv files of other zoom levels */
fold = function(fileName, factor) {
    parseCSV(fileName).then(function (data) {
        var zoomLevels = getZoomLevels(data[0].length * data.length, factor);
        var newMatrix = [];
        // create a csv for each zoom level (zoom level = 0 is original matrix)
        for (var zoomLevel = 1; zoomLevel < Object.keys(zoomLevels).length; zoomLevel++) {
            newMatrix = generateZoomLevel(data, zoomLevel);
            fs.writeFileSync("zoom_" + zoomLevel.toString() + ".csv", convertToCSV(newMatrix));
        }
    });

    return 0;
}

console.log(fold('./result.csv', 10)) // a little over a minute