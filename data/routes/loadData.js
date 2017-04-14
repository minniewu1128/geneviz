var fs = require('fs');
var readline = require('readline')

var Data = require('../model/dataModel');
var SNP = require('../model/snpModel');

exports.load = function (src, dst) {
    return new Promise((resolve, reject) => {
        // open stream
        const rl = readline.createInterface({
            input: fs.createReadStream(src),
            output: process.stdout,
            terminal: false
        });

        rl.on('line', (input) => {
            var row = input.split(",").filter(String);
            var newSNP = new SNP({
                rid: parseInt(row[0]),
                name: row[1],
                allels: row[2],
                chrom: row[3],
                basePair: parseInt(row[4])
            });
            
            var newData = new Data({
                fileName: dst,
                index: parseInt(row[4]),
                data: row.slice(5, row.length),
                zoomLevel: 0 // for now all are at level 0
            });

            newSNP.save();
            newData.save();

        }).on('close', () => {
            // after data is loaded, fulfill promise
            resolve("Success!");
        });
    });
}

exports.deleteAll = function() {
    SNP.remove({}, function(){ console.log("removed all SNPs")}).exec();
    Data.remove({}, function(){ console.log("removed all Data")}).exec();
}

exports.get = function() {
    SNP.findOne().then(function (doc) {
        return doc;
    });
}