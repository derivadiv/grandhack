var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	local:{
		email: String,
		password: String
	},
	facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    events: {type: Object, default: {}},
    diseases: {type: Object, default: {}}
});

// generating a hash, salted 8x
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// check if password is valid
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

// create user model, expose to app
module.exports = mongoose.model('User', userSchema);