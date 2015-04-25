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
		res.render('login.ejs', {
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
		res.render('signup.ejs', {
			message: 'That e-mail address is taken.'
		});
	});	

	// Profile: protected, using "route middleware"
	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile.ejs', {
			user: req.user // get the user out of session and pass to template
		});
	});

	// Add event (only if logged in)
	app.post('/addevent', isLoggedIn, function(req, res){
		var events = req.user.events;

		var newevent = {
    		title: req.body.eventtitle,
    	};

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

}

// make sure a user is logged in ("route middleware")
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}
