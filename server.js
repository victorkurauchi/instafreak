"use strict";

var express = require('express');
var port = process.env.PORT || 4000;
var app = express();
var instagram = require('instagram-node').instagram();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'ejs');

instagram.use({
  client_id: "YOUR_CLIENT_ID",
  client_secret: "YOUR_CLIENT_SECRET"
});

var redirect_uri = 'http://127.0.0.1:4000/handleauth';
var access_token = 'ACCESS_TOKEN';
var MAIN_TAG = 'haikaiss';
var LAST_TAG_ID = '';

app.get('/', function (req, res) {
  res.render('pages/index');
});

// accept PUT request at /user
app.put('/user', function (req, res) {
  res.send('Got a PUT request at /user');
});

// accept DELETE request at /user
app.delete('/user', function (req, res) {
  res.send('Got a DELETE request at /user');
});

exports.authorize_user = function(req, res) {
  res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
  instagram.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
    	console.log(err);
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Yay! Access token is ' + result.access_token);
      res.send('You made it!!');
    }
  });
};

exports.search = function(req, res) {
	var username = req.params.user || '';

	instagram.use({ access_token: access_token});
	instagram.user_search(username, function(err, users, remaining, limit) {
		if (err) {
			throw err;
		}
		users.forEach(function(u) {
			if (users[users.length - 1] === u ) {
				res.render('pages/profiles', {users: users});
			}
		});
	});
};

exports.mediaFromUser = function(req, res) {
	var id = req.params.id || '';

	instagram.use({ access_token: access_token});
	instagram.user_media_recent(id, function(err, medias, remaining, limit) {
		if (err) {
			throw err;
		}
		medias.forEach(function(u) {
			if (medias[medias.length - 1] === u ) {
				res.render('pages/medias', {medias: medias});
			}
		});
	});
};

exports.findHashtag = function(req, res) {
	var hashtag = req.params.hashtag || MAIN_TAG;
	getMedias(hashtag);
};

// private methods

var checkForNewMedias = function(min_tag_id, tag) {
	console.log('checkin for new medias...', min_tag_id);
	var self = this;

	instagram.tag_media_recent(tag, {count:20, min_id:min_tag_id}, function(err, medias, remaining, limit) {
  	if (err) {
  		io.emit('loadingError', {msg: err});
  	} else {
  		var last = medias[medias.length - 1];
  		if (last.id !== min_tag_id) {
  			io.emit('newMedias', {medias: medias, last_tag: last.id});
  		} else {
  			checkForNewMedias(last.id);
  		}
  	}
  });
};

var getMedias = function(tag) {
	var _tag = tag || MAIN_TAG;
	instagram.tag_media_recent(_tag, {count: 20}, function(err, medias, remaining, limit) {
  	if (err) {
  		io.emit('loadingError', {msg: err});
  	} else {
  		var last = medias[medias.length - 1];

  		io.emit('availableMedias', {medias: medias});
  		checkForNewMedias(last.id, tag);
  	}
  });
}

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);

// This is your redirect URI
app.get('/handleauth', exports.handleauth);

// search by username
app.get('/search/:user', exports.search);

// get medias from user
app.get('/media/user/:id', exports.mediaFromUser);

// search for hashtag
app.get('/hashtag/:hashtag', exports.findHashtag);

// socket io on user connected
io.on('connection', function(socket){
  console.log('user has connected');

	// after connected, the client sends a request do get more medias
	socket.on('checkForNewMedias', function(socket) {
		checkForNewMedias(socket.last_tag);
	});
});

// creating server
var server = http.listen(port, function () {
  var host = server.address().address;

  console.log('Example app listening at http://%s:%s', host, port);
});