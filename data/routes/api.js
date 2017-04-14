var Data = require('../model/dataModel');
var SNP = require('../model/snpModel');


exports.getRange = function (start, end, zoom) {
    return new Promise((resolve, reject) => {
        Data.find({
            zoomLevel: zoom, 
            index: { $gte: start, $lte: end }
        }, function (err, result) {
            if (err) {
                console.error(err);
                reject(err);
            }
            if (!result || result.length == 0) {
                resolve(null);
            }
            else {
                resolve(result);
            }
        });
    });
}
/*
[{data_1}, {data_2}, ...]
*/

exports.getCol = function (range, colIndex) {
    return range[colIndex].data;
}

exports.getRow = function (range, rowIndex) {
    var row = [];
    for (var i = 0; i < range.length; i++) {
        row.push(range[i].data[rowIndex]);
    }
    return row;
}

exports.getIndex = function (range, resultIndex) {
    return range[resultIndex].index;
}

exports.getRowLength = function (range) {
    return range[0].data.length;
}

exports.getColLength = function (range) {
    return range.length;
}