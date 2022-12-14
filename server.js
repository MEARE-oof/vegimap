var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars')
var handlebars = require('handlebars')
var app  = express();
var port = process.env.PORT || 6969;
var cookieParser = require('cookie-parser');

// Database
var Database = require('./libs/db/db.js');
var db = Database.get_instance()  // raw db access
db.prepopulate();
var db_interface = require('./libs/db/interface.js');  // abstracted access like db_interface.signup.signup(req, res)
const _ = require('lodash');
var db_signup = new db_interface.Signup(db);
var db_users = new db_interface.Users(db);
var db_markers = new db_interface.Markers(db);

app.use(express.static(path.join(__dirname, 'Public', 'scripts')));
app.use(express.json())
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.use(express.static('Public'))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function(req, res, next) {
	res.locals.cookies = req.cookies;

	let result = db_users.get_user_profile_by_id(req.cookies.user_id);
	if (result.success) {
		res.locals.profile_data = result.profile[0];
	} else {
		res.locals.profile_data = null;
	}

	next();
});

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

app.get('/users/:username', function (req, res, next){
	var username = req.params.username
	var userData = []
	var userData = db_users.get_user_profile(username)
	console.log(userData)
	if (userData){
		res.status(200).render('profile', {
		profile: userData
	  });
	}
	else {
		res.status(404).render('noUser', {username: req.params.username});
	}

});

app.get('/leaderboard', function (req, res) {
	
	var userData = []
	var temp = db_users.get_top_users()
	var userData = temp.users
	/*userData = [{"profileUrl": "/users/shrek",
				"pfpUrl": "shrek1.png",
				"username": "shrek",
				"dateJoined": "1/01/2002",
				"profilePoints": "69420"},
			
				{"profileUrl": "/users/raffaele",
				"pfpUrl": "image01.png",
				"username": "Raffaele",
				"dateJoined": "1/01/2002",
				"profilePoints": "0"}]
	*/

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

app.get('/users/:username/markers', function(req, res){
	var username = req.params.username
	var markerData = []
	var temp = db_markers.list_user_markers(username)
	var markerData = temp.markers

	if (markerData){
		res.status(200).render('myMarkers', {
			marker: markerData
		});
	}
});

//#region API
//#region Signup

/**
 * @api {post} /api/register Register a new user
 * 
 * @apiParam {String} username Username
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 *
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} user_id User token
 * 
 * @apiError {String} message Error message
 */
app.post('/api/register', (req, res) => {
	let result = db_signup.register(req);
	if (result.success) {
		res.status(200)
		.cookie('user_id', result.user_id, { maxAge: 900000, httpOnly: true })
		.send(JSON.stringify({
			message: 'Successfully registered.',
			user_id: result.user_id
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/login Login
 * 
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 * 
 * @apiSuccess {String} user_id User id
 * 
 * @apiError {String} message Error message
 */
app.post('/api/login', (req, res) => {
	let result = db_signup.login(req);
	if (result.success) {
		res.status(200).cookie('user_id', result.user_id, { maxAge: 900000, httpOnly: true }).send(JSON.stringify({
			message: 'Successfully logged in.',
			user_id: result.user_id
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
 * @api {get} /api/markers/get_id Get the next marker id and send it
 * 
 * @apiSuccess {int} next_id Next marker id (has been reserved)
 * 
 * @apiError {String} message Error message
 */
app.get('/api/markers/get_id', (req, res) => {
	let result = db_markers.get_id(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			next_id: result.next_id
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/add Add a marker
 * 
 * @apiParam {String} plant_marker_id Plant marker id
 * @apiParam {String} name Marker name
 * @apiParam {String} description Marker description
 * @apiParam {String} latitude Marker latitude
 * @apiParam {String} longitude Marker longitude
 * @apiParam {String} image Marker image url
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
 * @api {post} /api/markers/list_own List all markers owned by user
 * 
 * @apiName ListOwnMarkers
 * @apiGroup Markers
 * 
 * @apiSuccess {Array[Marker]} markers List of markers
 * 
 * @apiError {String} message Error message
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
 * @api {post} /api/markers/get Get info on a single marker
 * @apiName GetMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {{ plant_marker_id: int, user_id: int, marker_post_date: string, marker_name: string, marker_description: string, marker_image: string, marker_lat: float, marker_long: float, plant_ratings: [{}], tags: [{}]}} marker Marker info
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/get', (req, res) => {
	let result = db_markers.get(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			marker: result.marker
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/upvote Upvote a marker
 * @apiName UpvoteMarker
 * @apiGroup Markers
 * 
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {String} message Success message
 * @apiSuccess {int} plant_points New marker rating
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/upvote', (req, res) => {
	let result = db_markers.upvote(req);
	console.log(JSON.stringify(result));
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully upvoted marker.',
			plant_points: result.plant_points
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
 * @apiParam {String} plant_marker_id Marker ID
 * 
 * @apiSuccess {String} message Success message
 * @apiSuccess {int} plant_points New marker rating
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/downvote', (req, res) => {
	let result = db_markers.downvote(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully downvoted marker.',
			plant_points: result.plant_points
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

/**
 * @api {post} /api/markers/edit Edit marker with description
 * 
 * @apiParam {Int} plant_marker_id The plant marker id
 * @apiParam {String} description The new description
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/markers/edit', (req, res) => {
	let result = db_markers.edit(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			message: 'Successfully edited marker.',
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/markers/check_owner check if the given user is the owner of the marker
 * 
 * @apiParam {Int} plant_marker_id The plant marker id
 * @apiParam {Int} user_id The user id
 * 
 * @apiSuccess {Boolean} is_owner True if the user is the owner of the marker
 * @apiSuccess {String} message Success message
 * 
 * @apiError {Boolean} is_owner False if the user is not the owner of the marker
 * @apiError {String} message Error message
 */
app.post('/api/markers/check_owner', (req, res) => {
	let result = db_markers.check_owner(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			is_owner: result.success,
			message: 'User is the owner of the marker.',
		}));
	} else {
		res.status(200).send(JSON.stringify({
			is_owner: result.success,
			message: result.message
		}));
	}
});

//#endregion
//#region Users
/**
 * TODO: Documentation
 */
app.get('/api/top_users', (req, res) => {
	let result = db_users.get_top_users(req);
	if (result.success) {
		res.status(200).send(JSON.stringify({
			users: result.users
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: result.message
		}));
	}
});

/**
 * @api {post} /api/users/get Get user info
 * 
 * @apiParam {String} username The username [optional]
 * @apiParam {Int} user_id The user id [optional]
 * 
 * @apiSuccess {{ user_id: int, username: string, dateJoined: string, profilePoints: int, pfpUrl: string, profileUrl: string }} user The user object
 * @apiSuccess {String} message Success message
 * 
 * @apiError {String} message Error message
 */
app.post('/api/users/get', (req, res) => {
	let user = db_users.get_user_profile(req.body.username);
	if (user) {
		res.status(200).send(JSON.stringify({
			user: user,
			message: 'Successfully retrieved user.',
		}));
	} else {
		res.status(400).send(JSON.stringify({
			message: 'User not found.'
		}));
	}
});
//#endregion

//#endregion

app.get('*', function (req, res) {
	res.status(404).render('404', {url: req.url});
});

app.listen(port, function () {
    console.log("== Server is listening on port", port);
});


