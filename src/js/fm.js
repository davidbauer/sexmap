
//hash separators
var pair_sep = "_and_";
var key_val_sep = "--";


// @if GULP_ENV='prod'
var urlHostCheck = /[A-za-z0-9_]+\.[A-za-z0-9_]+$/;
var hostName = window.location.hostname.match(urlHostCheck)[0];

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

function scrollToPosition(o) {
  // @if GULP_ENV='prod'
  FM.triggerMessage("QZParent", 'child:scrollToPosition', o);
  // @endif

  // @if GULP_ENV='dev'
  return;
  // @endif
}

function fm_dispatch(event_str, data) {
  //Generic event dispatcher for asyncronous FM responses
  var evnt = new CustomEvent(event_str,{"detail":data});
  document.dispatchEvent(evnt);
}

function getHash() {
  
  // @if GULP_ENV='prod'
  //triggers a lookup of the hash via FM on prod
  FM.triggerMessage('QZParent','child:readHash');
  // @endif

  // @if GULP_ENV='dev'
  //send a fake FM response on dev
  fm_dispatch("parent:readHash", {parsed: hashStringToObject(window.location.hash), raw:"DEV"});
  // @endif
}

function setHash(o) {
  //sets a hash via FM
  var hashstring = objectToHashString(o);

  // @if GULP_ENV='prod'
  FM.triggerMessage('QZParent', 'child:updateHash', { hash : hashstring });
  // @endif

  // @if GULP_ENV='dev'
  window.location.hash = hashstring;
  // @endif

}

// @if GULP_ENV='prod'
//register a listener for the hash response resulting from a getHash()
FM.onMessage("parent:readHash", function(msg) {
  console.log("response",msg)
  if(msg.data && msg.data.hash) {
    console.log("and is valid")
    //if there is data parse it and send it with the original object
    fm_dispatch("parent:readHash", {parsed: hashStringToObject(msg.data.hash), raw:msg});
  }
});
// @endif

function objectToHashString(o) {
  //Stringify an object of keys and string-values 
  var s = []
  for(var prop in o) {
    s.push(to_hashsafe(prop) + key_val_sep + to_hashsafe(o[prop]))
  }

  return "#int/" + s.join(pair_sep)
}

function hashStringToObject(s) {
  //Objectify a strigified object of keys and string-values
  var o = {};
  if(s) {
    s = s.replace("#","").replace("int/","").split(key_val_sep);
    var a = [];

    for (var i = s.length - 1; i >= 0; i--) {
      a = s[i].split(pair_sep);
      o[a[0]] = a[1];
    }
  }
  else {
    o = null;
  }
  

  return o;

}

function to_hashsafe(name) {
  //lowercase and sub spaces
  return name.toLowerCase().split(" ").join("-");
}

module.exports = {
  resize: resize,
  setHash: setHash,
  getHash: getHash,
  scrollToPosition: scrollToPosition
};

