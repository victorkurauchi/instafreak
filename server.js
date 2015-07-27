"use strict";

var express = require('express');
var port = process.env.PORT || 4000;
var app = express();
var instagram = require('instagram-node').instagram();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var redirect_uri = 'http://127.0.0.1:4000/handleauth',
    access_token = '196583629.507df13.a94369cccf074f6a8d0386caf39538b6';

// configure
app.set('view engine', 'ejs');
app.use(express.static('public'));

instagram.use({
  client_id: "507df1304aa140dfb90133fd40057f3b",
  client_secret: "1a1edd7e91814c22be0bdc888e8b5141"
});

// routes
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

// private methods
var checkForNewMedias = function(min_tag_id, tag) {
  console.log('checkin for new medias...', min_tag_id, tag);

  instagram.tag_media_recent(tag, {count:20, min_id:min_tag_id}, function(err, medias, remaining, limit) {
    if (err) {
      console.log(err);
      io.emit('loadingError', {msg: err});
    } else {
      var last = medias[medias.length - 1];
      if (last.id !== min_tag_id) {
        console.log('new medias...');
        io.emit('newMedias', {medias: medias, last_tag: last.id});
      } else {
        console.log('nothing new...');
        checkForNewMedias(last.id, tag);
      }
    }
  });
};

var getMedias = function(tag) {
  console.log(tag);
  instagram.tag_media_recent(tag, {count: 20}, function(err, medias, remaining, limit) {
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
app.get('/authorize_user', function(req, res) {
  res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
});

// This is your redirect URI
app.get('/handleauth', function(req, res) {
  instagram.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      res.send("Didn't work");
    } else {
      access_token = result.access_token;
    }
  });
});

// search by username
app.get('/search/:user', function(req, res) {
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
});

// get medias from user
app.get('/media/user/:id', function(req, res) {
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
});

// search for hashtag
app.get('/hashtag/:hashtag', function(req, res) {
  var hashtag = req.params.hashtag;
  getMedias(hashtag);
});

// socket io on user connected
io.on('connection', function(socket){
  console.log('user has connected');

  // after connected, the client sends a request do get more medias
  socket.on('checkForNewMedias', function(socket) {
    checkForNewMedias(socket.last_tag, socket.tag);
  });
});

// creating server
var server = http.listen(port, function () {
  var host = server.address().address;

  console.log('app listening at http://%s:%s', host, port);
});