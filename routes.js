module.exports = function(app) {
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

}

// make sure a user is logged in ("route middleware")
function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}
