/*
 * db.js
 * Connects to the db (named test in this case)
 */

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to DB');
});

module.exports = db;