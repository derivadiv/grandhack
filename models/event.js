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
    last_reward_date: Date,
    reminders: {
        nextReminder: Date,
        nextReminderObject: mongoose.Schema.Types.Mixed,
        frequency: String,
        time: String //todo
    },
    missedReminders: {type: [Date], default: []},
    progress: Number
});


// create user model, expose to app
module.exports = {
	model: mongoose.model('Event', eventSchema),
	schema: eventSchema
};