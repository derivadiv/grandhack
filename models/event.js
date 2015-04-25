var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var eventSchema = mongoose.Schema({
    title: String, //required
    category: String,
    dateAdded: {type: Date, default: Date.now},
    comments: String
});


// create user model, expose to app
module.exports = mongoose.model('Event', eventSchema);