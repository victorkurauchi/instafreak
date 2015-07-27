(function() {

  var App = App || {};

  var socket = io();

  App.insta = {
    TAG: '',
    HOST: 'http://localhost:4000',
    MEDIAS_PER_PAGE: 20,

    init: function() {
      this.onPressEnter();
      this.onPressTab();
      this.onAvaiableMedias();
      this.onNewMedias();
      this.onError();
    },

    convert: function(obj) {
      return [
        '<div class="current-medias col-xs-6 col-md-3" id="'+ obj.id + '">',
        '<a href="/media/user/'+ obj.user.id + '" class="thumbnail">',
        '<img src="' + obj.images.standard_resolution.url + '">',
        '</a>',
        '</div>'
      ].join("");
    },

    convertError: function(message) {
      return [
        '<div class="row">',
        '<div class="col-md-12">',
        '<div class="alert alert-danger" role="alert">',
        message,
        '</div>',
        '</div>',
        '</div>'
      ].join("");
    },

    render: function(item) {
      var self = this;
      var html = self.convert(item);
      $("#medias").prepend(html);
    },

    renderError: function(message) {
      var self = this;
      var html = self.convertError(message);
      $('#search-tags').after(html);
    },

    onAvaiableMedias: function() {
      var self = this;
      socket.on('availableMedias', function(result){
        result.medias.forEach(function(item) {
          self.render(item);
        });
      });
    },

    onNewMedias: function() {
      var self = this;
      socket.on('newMedias', function(result) {
        var _lastid = result.last_tag;
        var total = result.medias.length;

        if (total === MEDIAS_PER_PAGE) {
          $('.current-medias').remove();
        }

        result.medias.forEach(function(item) {
          self.render(item);
        });

        socket.emit('checkForNewMedias', {last_tag: _lastid, tag: self.TAG});
        
      });
    },

    onError: function() {
      var self = this;
      socket.on('loadingError', function(error) {
        self.renderError(error.msg.error_message);
      });
    },

    onPressEnter: function() {
      var self = this;
      $(document).keypress(function(e) {
        if(e.which == 13) {
          self.TAG = $("#inputHashtag").val();
          self.getWithHastag();
        }
      });
    },

    onPressTab: function() {
      var self = this;
      $("#inputHashtag").keydown(function(e) {
        if(e.keyCode == 9) {
          self.TAG = $(this).val();;
          self.getWithHastag();
        }
      });
    },

    getWithHastag: function(callback) {
      var self = this;
      if (self.TAG) {
        $.ajax({
            url: self.HOST + '/hashtag/' + self.TAG,
            method: "GET",
            dataType: "json"
          }).done(function(result) {
            console.log(resut);
            if (callback) {
              callback(null, result);
            }
          });
      }
    }

  };

  App.insta.init();

})(this);