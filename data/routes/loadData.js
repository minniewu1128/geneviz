var fs = require('fs');
var readline = require('readline')
var db = require('../db')
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
        var bulkSNP = [];
        var bulkData = [];
        rl.on('line', (input) => { // for each line in the CSV file

            if (bulkSNP.length == 2000 && bulkData.length == 2000) {
                SNP.collection.insert(bulkSNP);
                Data.collection.insert(bulkData);
                bulkSNP = [];
                bulkData = [];
            }

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
                index: row[4],
                data: row.slice(5, row.length).map(parseFloat),
                zoomLevel: 0 // for now all are at level 0
            });

            bulkSNP.push(newSNP);
            bulkData.push(newData);
            
        }).on('close', () => {
            // insert remainder bulk & fulfill promise
            SNP.collection.insert(bulkSNP);
            Data.collection.insert(bulkData);

            SNP.collection.createIndex({basePair: "1"});
            Data.collection.createIndex({index: "1"});
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