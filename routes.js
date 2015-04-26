module.exports = function(app, usermodel) {
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
			event: req.body.event // get the user out of session and pass to template
		});
	});

	// Add event (only if logged in)
	app.post('/addevent', isLoggedIn, function(req, res){
		var events = req.user.events;

		var newevent = {
    		title: req.body.eventtitle,
    		category: req.body.category,
    		comments: req.body.comments,
    		reminders: {
    			frequency: req.body.reminders,
    			time: req.body.remindtime,
    		}
    	};
    	//TODO reminder handling

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
	});

	// Edit event (only if logged in)
	app.post('/editevent', isLoggedIn, function(req, res){
		var events = req.user.events;

		pastid = req.body.eventid;
		for (var e in events) {
			if (events[e]._id == pastid) {
				var newevent = {
		    		title: req.body.eventtitle,
		    		category: req.body.category,
		    		comments: req.body.comments
		    	};
		    	// TODO reminder schedule handling
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
			}
		}
		// if we get here, we failed :(

	});

	// Delete event (only if logged in)
	app.post('/completeevent', isLoggedIn, function(req, res){
		var events = req.user.events;

		pastid = req.body.eventid;
		for (var e in events) {
			if (events[e]._id == pastid) {
				var newevent = events[e];
		    	// TODO reminder schedule handling
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
function nextReminder(){

}