module.exports = function(app, usermodel, schedule, dialogueFn) {
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

	// Nikita: not sure if this works - need to be able to connect to run query on mongodb
	app.get('/all_checked', isLoggedIn, function( req, res){
		var events = req.user.events;
		for( var e in events ){

			if( e ){
				var today_comp = e.compliance_history.find( {date_event: new Date() } );
				console.log( today_comp );
				res.write( "y");
				return;
			}
		}
		res.write( "n");
		return;
	});

	// Add or update event (only if logged in) (index is -1 if adding an event)
	app.post('/addevent', isLoggedIn, function(req, res){
		var events = req.user.events;
		var pastid = req.body['goal-id'];
		var email;
		if (req.user.local){
			email = req.user.local.email;
		}
		else { //assume fb?
			email = req.user.facebook.email;
		}
		
		// Adding a brand new event	
		if (pastid == -1) {
			var defaultDate = new Date();
			var newevent = {
	    		title: req.body.eventtitle,
	    		category: req.body.category,
	    		dateAdded: defaultDate,
	    		compliance_history: []
	    	};
	    	// TODO reminder handling

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
					if (req.body.eventtitle){
						events[e].title = req.body.eventtitle
					}
					if (req.body.category){
						events[e].category = req.body.category
					}
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

	// Check off event today
	app.post('/checkevent', isLoggedIn, function(req, res){
		var events = req.user.events;
		var pastid = req.body.eventid;
		var c = new Date();
		c.setHours(0);
		c.setMinutes(0);
		c.setSeconds(0);
		c.setMilliseconds(0);
		console.log(pastid);

		// try to update existing event with this id
		for (var e in events) {
			if (e < events.length){
				if (events[e]._id == pastid) {
					if (events[e].compliance_history){
						var today = events[e].compliance_history.filter(
							function(hist){
								return hist.date_event >= c;
							}
						);
						if (today & today.length > 0) {
							console.log(today);
							// assume if it exists that we complied and want to undo that
							today.has_complied = false; //TODO more
						} else {
							// it doesn't exist: patient has now complied today, add it to history 
							events[e].compliance_history.push({
								date_event: Date.now(),
		        				has_complied: true
							});
							console.log('made it!');

						}						
					}
					else {
						events[e].compliance_history = [{
							date_event: Date.now(),
							has_complied: true
						}];
					}
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
		}
		// if here, we failed :(	
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


	app.get('/voice', function(req, res) {
		res.render('../voice.html');//a little hacky
	});

	// test: voice stuff?
	app.get('/talkgoals', isLoggedIn, function(req, res) {
		var username = "Janet";
		if (req.user.local.name) {
			username = req.user.local.name;
		} else if (req.user.facebook.name){
			username = req.user.facebook.name
		}
		var events = req.user.events;
		var responses = dialogueFn(username, events);
		for (var r in responses){
			if (r<responses.length & r<events.length){
				// complied, check off for today
				if (r==1){
					events[r].compliance_history.push({
						date_event: new Date(),
						has_complied: true
					})
				} else{ //not complied- todo more work
					events[r].compliance_history.push({
						date_event: new Date(),
						has_complied: false
					})
				}
			}
		}
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