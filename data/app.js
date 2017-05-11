/*
 * app.js
 * Server to load CSV data > db
 *           delete collections in db
 *           display basic table with data (and aggregates)
 */

var express = require('express');
var app = express();
var cheerio = require('cheerio');
var fs = require('fs');
var api = require('./routes/api');

/* Connect to db */
var db = require('./db');

/* Temp Cache till we have a better solution */
var simpleCache = {}

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


/* Main page to access data */
app.get('/', function (req, res, next) {
    // if proper request from fields
    if (req.query.start && req.query.end && req.query.zoom) {

        // fetch values from input boxes
        var response = {
            start: req.query.start,
            end: req.query.end,
            zoom: req.query.zoom
        };

        // we reconstruct the html from index.htm by manually adding the data table and then rendering it
        fs.readFile(__dirname + "/view/" + "index.htm", function(err, data) {
            var $ = cheerio.load(data);
            var table = $('#main');

            if (err) console.log("error");
            else {
                /* see api.js for mongo query code */
                api.getRange(response.start, response.end, response.zoom).then(function(result) {
                    if (result === null) { // nothing returned
                        res.sendFile(__dirname + "/view/" + "index.htm");
                    } else { // add a table with the data we fetched
                        table.innerHTML = ""; // clear contents

                        // create data table
                        for (var i = 0; i < api.getRowLength(result); i++) {
                            var row = api.getRow(result, i);
                            table.append("<tr>")
                            for (var j = 0; j < row.length; j++) {
                                table.append("<td>" + row[j] + "</td>");
                            }
                            table.append("</tr>")
                        }

                        // create "x-axis" (bottom row with ranges)
                        table.append("<tr>");
                        for (var k = 0; k < api.getColLength(result); k++) {
                            table.append("<td>" + api.getIndex(result, k) + "</td>");
                        }
                        table.append("</tr>")

                        // render the new html that we just made
                        res.send($.html());
                    } 
                });
            }   
        });
    }

    // no query was made, so just render the plain index.htm file
    else res.sendFile(__dirname + "/view/" + "index.htm");
})

app.get('/data', function (req, res) {
        var response = {
            start: req.query.start,
            end: req.query.end,
            zoom: req.query.zoom
        };

        if (simpleCache[response.start + ":" + response.end] && simpleCache[response.start + ":" + response.end][response.zoom]){
            console.log("CACHE YES")
            res.send(simpleCache[response.start + ":" + response.end][response.zoom])
        }
           
        api.getRange(response.start, response.end, response.zoom).then(function(result) {
                var f = {}
                f[response.zoom] =  result
                simpleCache[response.start + ":" + response.end] = f
            res.send(result);
        });
})


/* 
 * Go to localhost:3000/get-data to load CSV to MongoDB 
 * The webpage will just say "Loading data" but the db should be filling the db
 * Check the server's console for a "Data loaded!" to know when load is complete
 */
//TODO: add upload feature to upload CSV file (instead of hard-coded 'complete_data.csv')
app.get('/get-data', function (req, res) {
    /* See /routes/loadData.js to see db upload code */
    var result = require('./routes/loadData');
    console.log("Loading data...")
    result.load('./complete_data.csv', 'LR').then(function (a) {
        console.log(a); // should print "Data loaded!" when finished
    });
    res.send("Loading data");
})

/* 
 * Delete all collections from MongoDB 
 * Go to localhost:3000/del-data to delete all collections from MongoDB
 * The console will say "removed all ..." to notify the status of the deletes
 */
app.get('/del-data', function (req, res) {
    var result = require('./routes/loadData');
    result.deleteAll();
    res.send("Deleted data");
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
