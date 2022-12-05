var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars')
var app  = express();
var port = process.env.PORT || 6969;


// Database
var Database = require('./libs/db/db.js');
var db = new Database();  // raw db access
db.prepopulate();
var db_interface = require('./libs/db/interface.js');  // abstracted access like db_interface.signup.signup(req, res)
const { get } = require('lodash');
var db_signup = new db_interface.Signup(db);
var db_profiles = new db_interface.Profiles(db);
var db_markers = new db_interface.Markers(db);

app.use(express.static(path.join(__dirname, 'Public', 'scripts')));
app.use(express.json())
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.use(express.static('Public'))
app.use(express.urlencoded({ extended: true }));

/*
 *	PAGES
 */
app.get('/', function (req, res, next) {
	if (req)
	{
		res.status(200).render('mainmap', {
			helpers: {
				foo() {	return 'foo.';	}
			}
		});
		/*res.status(200).sendFile(path.join(__dirname, '/Public/index.html'))*/
	}
	else
	{
		next();
	}
});


// Currently doesn't load CSS
app.get('/users/:username', function (req, res, next){
	var username = req.params.username

	//var userData = db_users.get_profile(username)

	var userData = []
	userData = [{"profileUrl": "profileUrl",
				 "pfpUrl": "pfp",
				 "username": "shrek",
				 "dateJoined": "1/01/2002",
				 "profilePoints": "69420"}]

	// Unsure how necesary the if statement is
	if (userData){
	  res.status(200).render('profile', {
		profile: userData
	  });
  
	}

});

app.get('/leaderboard', function (req, res) {
	
	var userData = []
	userData = [{"profileUrl": "shrek",
				"pfpUrl": "shrek1.png",
				"username": "shrek",
				"dateJoined": "1/01/2002",
				"profilePoints": "69420"},
			
				{"profileUrl": "Rafaelle",
				"pfpUrl": "image01.png",
				"username": "Rafaelle",
				"dateJoined": "1/01/2002",
				"profilePoints": "0"}]
	if (userData){
		res.status(200).render('leaderboard', {
			leaderUser: userData
		});
	}
});

app.get('/signin', function (req, res) {
	res.status(200).render('signin');
});



app.get('/about', function(req, res){
	res.status(200).render('about');
});

app.get('/:username', function(req, res){
	//res.status(200).render('profile');
	var userData = []
	userData = [{"profileUrl": "shrek",
				 "pfpUrl": "shrek1.png",
				 "username": "shrek",
				 "dateJoined": "1/01/2002",
				 "profilePoints": "69420"}]
	tempProfile = []
	tempProfile[0] = userData
	
	if (userData){
	  res.status(200).render('profile', {
		profile: userData
	  })
  
	}
	else{
	  next()
	}

	
});
//#region API
//#region Signup

/**
 * @api {post} /api/register Register a new user
 * @apiName Register
 * @apiGroup Signup
 * 
 * @apiParam {String} username Username
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 *
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} token User token
 * 
 * @apiError {String} message Error message
 */
app.post('/api/register', (req, res) => {
	let result = db_signup.register(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully registered.',
			token: result.user_id
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/login Login
 * @apiName Login
 * @apiGroup Signup
 * 
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 * 
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} token User token
 * 
 * @apiError {String} message Error message
 */
app.post('/api/login', (req, res) => {
	let result = db_signup.login(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully logged in.',
			token: result.user_id
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});
//#endregion
//#region Markers

/**
 * @api {post} /api/markers/add Add a marker
 * @apiName AddMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} token User token
 * @apiParam {String} name Marker name
 * @apiParam {String} description Marker description
 * @apiParam {String} lat Marker latitude
 * @apiParam {String} lng Marker longitude
 * @apiParam {String} image Marker image
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/add', (req, res) => {
	let result = db_markers.add(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully added marker.',
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {get} /api/markers/list Retrieve a list of all markers
 * @apiName ListMarkers
 * @apiGroup Markers
 * 
 * @apiSuccess {Array[Marker]} markers List of markers
 * 
 * @apiError {String} message Error message
 */
app.get('/api/markers/list', (req, res) => {
	let result = db_markers.list(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			markers: result.markers
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/list_own List all markers owned by user
 */
app.post('/api/markers/list_own', (req, res) => {
	let result = db_markers.list_own(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			markers: result.markers
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/get Get info on marker
 */

/**
 * @api {post} /api/markers/upvote Upvote a marker
 * @apiName UpvoteMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} token User token
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/upvote', (req, res) => {
	let result = db_markers.upvote(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully upvoted marker.',
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/downvote Downvote a marker
 * @apiName DownvoteMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} token User token
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/downvote', (req, res) => {
	let result = db_markers.downvote(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully downvoted marker.',
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/delete Delete marker
 * @apiName DeleteMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} token User token
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/delete', (req, res) => {
	let result = db_markers.delete(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully deleted marker.',
		}));
	} else {
		// forbidden
		res.status(403).send(JSON.stringify({
			message: result.message
		}));
	}
});

//#endregion
//#region Leaderboard

//#endregion

//#endregion

app.get('*', function (req, res) {
	res.status(404).render('404', {url: req.url});
});

app.listen(port, function () {
    console.log("== Server is listening on port", port);
});


