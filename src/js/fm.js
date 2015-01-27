// @if GULP_ENV='prod'
var urlHostCheck = /[A-za-z0-9_]+\.[A-za-z0-9_]+$/;
var hostName = window.location.hostname.match(urlHostCheck)[0];
var new_hash = null;

var FM = FM || frameMessager({
  allowFullWindow : false,
  parentDomain : hostName,
  requestHeight : {
    desktop : 629,
    tablet : 629,
    mobile : 449
  }
});

FM.onMessage("app:activePost", function () { resize(); });
FM.onMessage("parent:readHash", function(msg) { new_hash = msg.hash});
// @endif

var $interactive = $('#interactive-content');

function documentHeight () {
  var body = document.body;
  var html = document.documentElement;
  var height =  Math.max( body.scrollHeight, body.offsetHeight,
             html.clientHeight, html.scrollHeight, html.offsetHeight );

  return height;
}

function updateHeight (height) {
  // Add frameMessager call in production build
  // default height check if nothing is given to func

  // @if GULP_ENV='prod'
  height = height || documentHeight();

  FM.triggerMessage('QZParent', 'child:updateHeight', {
    height : height
  });
  // @endif

  // This function will do nothing in development build

  // @if GULP_ENV='dev'
  return;
  // @endif
}

function resize () {
  // resize and call frameMessager
  var height = $interactive.height();
  updateHeight(height);
}

function getHash(response) {
  
  if (!response) {

    // @if GULP_ENV='prod'
    FM.triggerMessage('QZParent','child:readHash');
    return getHash(true)
    // @endif

    // @if GULP_ENV='dev'
    return hashStringToObject(window.location.hash);
    // @endif

  }
  else {
    if(new_hash) {
      var o = hashStringToObject(new_hash);
      new_hash = null;
      return o;
    }
    return getHash(true);
  }
  
  
}

function setHash(o) {
  var hashstring = [];

  for(var prop in o) {
    hashstring.push(to_hashsafe(prop) + ":" + to_hashsafe(o[prop]))
  }

  hashstring = hashstring.join(",")

  // @if GULP_ENV='prod'
  FM.triggerMessage('QZParent', 'child:updateHash', { hash : hashstring });
  // @endif

  // @if GULP_ENV='dev'
  window.location.hash = hashstring;
  // @endif

}

function hashStringToObject(s) {
  var s = s.replace("#","").split(",");
  var o = {}, a = [];

  for (var i = s.length - 1; i >= 0; i--) {
    a = s[i].split(":");
    o[a[0]] = a[1]
  };

  return o

}

function to_hashsafe(name) {
  return name.toLowerCase().split(" ").join("-")
}

module.exports = {
  resize: resize,
  setHash: setHash
};

