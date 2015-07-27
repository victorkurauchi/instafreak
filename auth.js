var Authentication = (function() {

	function authorize_user(req, res) {
	  res.redirect(instagram.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
	};

	function handleauth(req, res) {
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

	return {
		authorize_user: authorize_user,
		handleauth: handleauth
	}

})();

module.exports.Authentication = Authentication;