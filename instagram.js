var instagram = require('instagram-node').instagram();

instagram.use({
  client_id: "507df1304aa140dfb90133fd40057f3b",
  client_secret: "1a1edd7e91814c22be0bdc888e8b5141"
});

var redirect_uri = 'http://127.0.0.1:4000/handleauth';
var access_token = '196583629.507df13.a94369cccf074f6a8d0386caf39538b6';
var MAIN_TAG = 'haikaiss';
var LAST_TAG_ID = '';

var _Instagram = function() {

	console.log('pey');

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
	};

	return {
		search: function(req, res) {
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
		},

		mediaFromUser: function(req, res) {
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
		},

		findHashtag: function(req, res) {
		  var hashtag = req.params.hashtag || MAIN_TAG;
		  getMedias(hashtag);
		},

		checkForNewMedias: function(min_tag_id, tag) {
		  console.log('checkin for new medias...', min_tag_id, tag);
		  var self = this;

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
		}

	};

};

module.exports.Instagram = _Instagram;