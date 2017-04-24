/*
 * loadData.js
 * File with formal logic that 
 * Loads CSV data to db or deletes collections in db
 */

var fs = require('fs');
var readline = require('readline')
var Data = require('../model/dataModel');
var SNP = require('../model/snpModel');

/* Function loads CSV (src) into the db */
exports.load = function (src, dst) {
    return new Promise((resolve, reject) => {
        // open stream to read from csv file (src)
        const rl = readline.createInterface({
            input: fs.createReadStream(src),
            output: process.stdout,
            terminal: false
        });
        var bulkSNP = [];
        var bulkData = [];
        rl.on('line', (input) => { // for each line in the CSV file

            // we are bulk inserting arrays of 2000 data points into mongodb
            if (bulkSNP.length == 2000 && bulkData.length == 2000) {
                // save this bulk of 2000 data points
                SNP.collection.insert(bulkSNP);
                Data.collection.insert(bulkData);
                // start bulk over for next 2000 data points
                bulkSNP = [];
                bulkData = [];
            }

            var row = input.split(",").filter(String);
            
            // TODO: standardize CSV files that are to be loaded
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
                zoomLevel: 0 // for now all are at level 0 (TODO: delete if aggregation is good to go)
            });

            // build up the bulk of data
            bulkSNP.push(newSNP);
            bulkData.push(newData);
            
        }).on('close', () => {
            // insert remainder bulk
            SNP.collection.insert(bulkSNP);
            Data.collection.insert(bulkData);
            // create index for SNP and Data collections
            SNP.collection.createIndex({basePair: "1"});
            Data.collection.createIndex({index: "1"});
            resolve("Data loaded!");
        });
    });
}

/* Function clears the db */
exports.deleteAll = function() {
    SNP.remove({}, function(){ console.log("removed all SNPs")}).exec();
    Data.remove({}, function(){ console.log("removed all Data")}).exec();
}