module.exports = function(app, usermodel, schedule) {
	passport = require('passport');
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	// Process login; passport. TODO
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));

	app.get('/login', function(req, res) {
		res.render('index.ejs', {
			message: 'Invalid credentials.'
		});
	});

	// Process signup; passport. 
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/signupfail', 
		failureFlash: true
	}));

	// Signup fail
	app.get('/signupfail', function(req, res) {
		res.render('index.ejs', {
			message: 'That e-mail address is taken.'
		});
	});	

	// Profile: protected, using "route middleware"
	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile.ejs', {
			user: req.user // get the user out of session and pass to template
		});
	});

	// Update details (todo)
	app.get('/updateevent', isLoggedIn, function(req, res){
		res.render('updateevent.ejs', {
			user: req.user,
			event: req.body.event // get the user out of session and pass to template
		});
	});

	// Add or update event (only if logged in) (index is -1 if adding an event)
	app.post('/addevent', isLoggedIn, function(req, res){
		var events = req.user.events;
		var pastid = req.body['goal-id'];
		var defaultfreq = 'day';
		var defaulttime = '9:00';
		var email;
		if (req.user.local){
			email = req.user.local.email;
		}
		else { //assume fb?
			email = req.user.facebook.email;
		}

		if (pastid == -1){
			var defaultDate = new Date();
			// Adding a brand new event, assume daily reminders at 9AM
			var newevent = {
	    		title: req.body.eventtitle,
	    		category: req.body.category,
	    		dateAdded: defaultDate,
	    		reminders: {
	    			frequency: defaultfreq,
	    			time: defaulttime
	    		}
	    	};
	    	// TODO reminder handling
	    	newevent.reminders.nextReminder = nextReminder(
	    		newevent.dateAdded, defaultfreq, defaulttime
	    	);

	    	newevent.reminders.nextReminderObject = emailOnDate(schedule, newevent.reminders.nextReminder, email, newevent.title);

	    	events.push(newevent);
	    	usermodel.update({
				"_id": req.user._id
			}, {
				"events": events
			},{}, function(err, numAffected) {
				if (err) {
					console.log('we messed something up, sorry.');
					res.redirect('back');
				}
				else{
					console.log('something worked. yay?')
					res.render('profile.ejs', {
						user: req.user 
					});
				}
			});
		} else {
			// try to update existing event with this id
			for (var e in events) {
				if (events[e]._id == pastid) {
					var newevent = {
			    		title: req.body.eventtitle,
			    		dateAdded: events[e].dateAdded,
			    		category: req.body.category,
			    		comments: events[e].comments,
			    		reminders: events[e].reminders
			    	};
			    	if (newevent.reminders.frequency === undefined | newevent.reminders.time === undefined) {
			    		newevent.reminders.frequency = defaultfreq;
			    		newevent.reminders.time = defaulttime;
			    	}

				  	newevent.reminders.nextReminder = nextReminder(
			    		events[e].dateAdded, newevent.reminders.frequency, newevent.reminders.time
	    			);
	    			console.log(schedule);
			    	newevent.reminders.nextReminderObject = emailOnDate(
						schedule, newevent.reminders.nextReminder, 
						email, newevent.title
					);
					if (events[e].nextReminderObject) {
		    			events[e].nextReminderObject.cancel();
					}
		
			    	events[e] = newevent;
			    	usermodel.update({
						"_id": req.user._id
					}, {
						"events": events
					},{}, function(err, numAffected) {
						if (err) {
							console.log('we messed something up, sorry.');
							res.redirect('back');
						}
						else{
							console.log('something worked. yay?')
							res.render('profile.ejs', {
								user: req.user 
							});
						}
					});
					return;
				}
			}
			// if here, we failed :(	
		}
	});

	// Delete/ complete event (only if logged in)
	app.post('/completeevent', isLoggedIn, function(req, res){
		var events = req.user.events;

		pastid = req.body.eventid;
		for (var e in events) {
			if (events[e]._id == pastid) {
				events[e].dateEnd = new Date();
				events[e].nextReminderObject.cancel();
		    	usermodel.update({
					"_id": req.user._id
				}, {
					"events": events
				},{}, function(err, numAffected) {
					if (err) {
						console.log('we messed something up, sorry.');
						res.redirect('back');
					}
					else{
						console.log('something worked. yay?')
						res.render('profile.ejs', {
							user: req.user 
						});
					}
				});
				return;
			}
		}
		// if we get here, we failed :(

	});


}

// make sure a user is logged in ("route middleware")
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}


// calculate next reminder info
function nextReminder(startDate, freq, timestr){
	var now = new Date();

	var a = timestr.split(':');
	var s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(),
	 parseInt(a[0]),parseInt(a[1]),0,0);
	if (s>=now){
		var x = 1;
		if (freq == '2days'){
			x = 2;
		} 
		else if (freq == 'week') {
			x = 7;
		}
		return new Date(s.getFullYear(), s.getMonth(), s.getDate()+x,
	 parseInt(a[0]),parseInt(a[1]),0,0);
	}

	if (freq == 'day') {
		while (s<now) {
			s.setDate(s.getDate() + 1);
		}
		return new Date(s.getFullYear(), s.getMonth(), s.getDate()+1,
	 parseInt(a[0]),parseInt(a[1]),0,0);
	} else if (freq == '2days') {
		while (s<now) {
			s.setDate(s.getDate() + 2);
		}
		return new Date(s.getFullYear(), s.getMonth(), s.getDate()+2,
	 parseInt(a[0]),parseInt(a[1]),0,0);
	} else if (freq == 'week') {
		while (s<now) {
			s.setDate(s.getDate() + 7);
		}
		return new Date(s.getFullYear(), s.getMonth(), s.getDate()+7,
	 parseInt(a[0]),parseInt(a[1]),0,0);
	}
	return;
}

// job to send reminder email
function emailOnDate(schedule, date, email, goaltext){
	console.log(schedule);
	
	// return schedule.scheduleJob(date, function(){
	// 	// email user reminder for now?
	// 	var mailOptions = {
	// 		from: 'oper8or.contact@gmail.com',
	// 		to: email,
	// 		subject: 'Goal reminder',
	// 		text: goaltext
	// 	};
	// 	// sending the message
	// 	transporter.sendMail(mailOptions, function(err) {
	// 		//req.flash('info', 'An email was sent to '+ user.email + ' with further instructions.');
	// 		done(err, 'done');
	// 	});
	// });
}

// TODO fine-tune this function
function calcProgress(event){
	if (event.missedReminders.length == 0) {
		return 0.9;
	}
	if (event.missedReminders.length < 5 ){
		return 0.3;
	}
	return 0.5;
}