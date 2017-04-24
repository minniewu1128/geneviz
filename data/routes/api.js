var Data = require('../model/dataModel');
var SNP = require('../model/snpModel');
var db = require('../db');

var getZoomFactor = function(zoom) {
    return Math.pow(10, zoom);
}

exports.getRange = function (start, end, factor=1) {
    if (parseInt(start) == 0) {
        start = 1;
    }

    if (factor <= 1) {
        return new Promise((resolve, reject) => {
            Data.find({
                index: { $gte: start, $lte: end }
            }).exec(function (err, result) {
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
    
    else {
        return new Promise((resolve, reject) => {

            var aggregateResults = [];
            start = parseInt(start);
            end = parseInt(end);
            factor = parseInt(factor);
            var aggregate = Data.aggregate(
                [
                    { "$match": { "index": {"$gte": start, "$lt": end}}},
                    { "$unwind": { "path": "$data", "includeArrayIndex": "arrayIndex"}},
                    { "$group": { 
                        "_id": {
                            "idx": {"$floor": {"$divide": ["$index", factor]}}, 
                            "aridx": "$arrayIndex"
                        }, 
                        "maxValue": {"$max": "$data"}
                      }
                    },
                    {"$sort": {"_id.aridx": 1}},
                    { "$group": {
                        "_id": "$_id.idx", 
                        "data": { "$push": { "values": "$maxValue"}}}
                    },
                    {"$sort": {"_id": 1}}
                ], function(err, result) {
                    for (var i = 0; i < result.length; i++) {
                        var col = result[i];
                        var obj = new Object();
                        var row = [];

                        var offset = col._id;
                        var startIndex = start + offset * factor;
                        obj.index = (startIndex).toString() + "-" + (startIndex+factor).toString();

                        for (var j = 0; j < col.data.length; j++) {
                            row.push(col.data[j].values);
                        }
                        obj.data = row;

                        aggregateResults.push(obj);
                    }
                    
                    resolve(aggregateResults);
            });
        });
    }
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