var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var eventSchema = mongoose.Schema({
    title: String, //required
    category: String,
    dateAdded: {type: Date, default: Date.now},
    comments: String,
    dateStart: {type: Date, default: Date.now},
    dateEnd: Date,
    compliance_history: [{
        date_event: Date,
        has_complied: Boolean
    }],
    frequency: {type: String, default: 'day'},
    time: {type: String, default: '23:00'},
    last_reward_date: Date
});


// create user model, expose to app
module.exports = {
	model: mongoose.model('Event', eventSchema),
	schema: eventSchema
};