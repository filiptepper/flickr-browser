(function() {
  var Slide = function(node, i) {
    this._node = node;
    if (i >= 0) {
      this._count = i + 1;
    }
    if (this._node) {
      $(this._node).addClass(this._node, "slide distant-slide");
    }
  };

  Slide.prototype = {
    _node: null,
    _count: 0,
    _currentState: '',
    _states: [ 'distant-slide', 'far-past',
               'past', 'current', 'future',
               'far-future', 'distant-slide' ],
    setState: function(state) {
      if (typeof state != 'string') {
        state = this._states[state];
      }
      $(this._node).removeClass(this._states.join(" ")).addClass(state);
      this._currentState = state;
    }
  };

  var SlideShow = function(slides) {
    this._slides = (slides || []).map(function(i, node) {
      $(node).removeClass();
      $(node).addClass("photo");
      return new Slide(node, i);
    });
    this.current = (!this.current) ? $(".photo")[0].id : this.current.replace('#', '');
    var _t = this;

    $(document).keydown(function(e) { _t.handleKeys(e); }, false);
    this._update();
  };

  SlideShow.prototype = {
    _presentationCounter: $("#counter")[0],
    _slides: [],
    _getCurrentIndex: function() {
      var me = this;
      var slideCount = null;
      $(".photo").each(function(i, slide) {
        if (slide.id == me.current) {
          slideCount = i;
        }
      });
      return slideCount + 1;
    },

    _update: function(dontPush) {
      var docElem = document.documentElement;
      var elem = document.elementFromPoint( docElem.clientWidth / 2, docElem.clientHeight / 2);
      var currentIndex = this._getCurrentIndex();
      if (elem && elem.className != 'presentation') {
          this._presentationCounter.textContent = currentIndex;
      }
      for (var x = currentIndex - 1; x < currentIndex + 7; x++) {
        if (this._slides[x - 4]) {
          this._slides[x - 4].setState(Math.max(0, x - currentIndex));
        }
      }
    },

    current: 0,

    next: function() {
      var next = $('#' + this.current + ' + .photo')[0];
      this.current = (next) ? next.id : this.current;
      this._update();
    },
    prev: function() {
      var prev = $('.photo:nth-child(' + (this._getCurrentIndex() - 1) + ')')[0];
      this.current = (prev) ? prev.id : this.current;
      this._update();
    },

    handleKeys: function(e) {
      if (e.target.nodeName === "input") return;

      switch (e.keyCode) {
        case 37:
          this.prev(); break;
        case 39:
        case 32:
          this.next(); break;
        case 71:
          Application.show(this.current); break;
        case 73:
          Application.info(this.current); break;
      }
      
      if (e.keyCode === 83 && e.ctrlKey === true) {
        $("#search").focus();
      }
    }
  };

  var Application = {
    render: function(photo) {
      item = {
        "id": photo.id,
        "src": "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + 
          "/" + photo.id + "_" + photo.secret + ".jpg",
        "url": "http://flickr.com/photos/" + photo.owner + "/" + photo.id
      };
      $.tmpl($("#photo-template"), item).appendTo(".photos");
    },
    
    show: function(id) {
      if (!id) return;
      
      var w = window.open();
      w.opener = null;
      w.document.location = $("#" + id).attr("data-url");
    },
    
    info: function(id) {
      if (!id) return;
      if ($("#" + id + " .info").length > 0) {
        $("#" + id + " .info").toggle();
      } else {
        Flickr.info(id);
      }
    }
  };
  
  var Flickr = {
    url: "http://api.flickr.com/services/rest/?api_key=9759baebe02eb663b55f2a91383865ac&jsoncallback=?&format=json",
    
    get: function(url) {
      $.getJSON(Flickr.url + url, function(data) {
        $(".photos").empty();
        $.each(data.photos.photo, function(i, item) {
          Application.render(item);    
        });
        $("#search").blur();
        var slideshow = new SlideShow($(".photo"));
        $(".photos").css("display", "block");
      });
    },
    
    interesting: function() {
      Flickr.get("&method=flickr.interestingness.getList");
    },
    
    search: function(query) {
      Flickr.get("&method=flickr.photos.search&text=" + escape(query));
    },
    
    info: function(id) {
      $.getJSON(Flickr.url + "&method=flickr.photos.getInfo&photo_id=" + id, function(data) {
        item = {
          "title": data.photo.title["_content"],
          "description": $("<span />").html(data.photo.description["_content"]).text(),
          "username": data.photo.owner.username,
          "taken": data.photo.dates.taken
        };
        
        $.tmpl($("#info-template"), item).appendTo("#" + id);
      });
    }
  };
  
  $("#throbber").ajaxStart(function() {
    $(this).fadeIn();
  });
  $("#throbber").ajaxStop(function() {
    $(this).fadeOut();
  });
  
  // Load interesting photos on start.
  Flickr.interesting();
  
  // Call search on submit.
  $("#search-form").submit(function(e) {
    Flickr.search($("#search").val());
    e.preventDefault();
    e.stopPropagation();
  });

  // Select text on input on focus.
  $("#search").focus(function(e) {
    $(this).select();
  });
})();