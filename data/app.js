var express = require('express');
var app = express();
var cheerio = require('cheerio');
var fs = require('fs');
var api = require('./routes/api');

app.get('/', function (req, res, next) {

    // if request
    if (req.query.start && req.query.end && req.query.zoom) {
        // fetch from input boxes
        var response = {
            start: req.query.start,
            end: req.query.end,
            zoom: req.query.zoom
        };
        fs.readFile(__dirname + "/view/" + "index.htm", function(err, data) {
            var $ = cheerio.load(data);
            var table = $('#main');

            if (err) console.log("error");

                api.getRange(response.start, response.end, response.zoom).then(function(result) {
                    if (result === null) {
                        res.sendFile(__dirname + "/view/" + "index.htm");
                    } else {
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

                    // create "x-axis"
                    table.append("<tr>");
                    for (var k = 0; k < api.getColLength(result); k++) {
                        table.append("<td>" + api.getIndex(result, k) + "</td>");
                    }
                    table.append("</tr>")

                    // render
                    res.send($.html());
                }
                
            });
        });
    }

    // no query
    else res.sendFile(__dirname + "/view/" + "index.htm");
})

/* Loading CSV to MongoDB */
app.get('/get-data', function (req, res) {
    var result = require('./routes/loadData');
    result.load('./complete_data.csv', 'LR').then(function (a) {
        console.log(a);
    });
    res.send("Loading data");
})

/* Delete collections from MongoDB */
app.get('/del-data', function (req, res) {
    var result = require('./routes/loadData');
    result.deleteAll();
    res.send("Deleted data");
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})