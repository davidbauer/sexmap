var $twitter = $('.icon-twitter');
var $facebook = $('.icon-facebook');
var $linkedin = $('.icon-linkedin');
var $email = $('.icon-email');

var shareConfig = {
  facebook: {
    baseUrl: 'https://www.facebook.com/dialog/feed?',
    app_id: '676492505769612', // fb app id
    link: '', // url to story page
    name: '', // headline
    picture: '', // url to image file
    caption: 'qz.com', // little fb credit thing
    description: '', // text under the headline
    message: '', // not sure what this does
    redirect_uri: 'http://qz.com'
  },
  twitter: {
    baseUrl: 'https://twitter.com/intent/tweet?',
    url: '',
    text: '',
    related: 'quartzthings',
    via: 'qz'
  },
  linkedin: {
    baseUrl: 'http://linkedin.com/shareArticle?',
    mini: 'true',
    url: '',
    title: '',
    summary: ''
  },
  email: {
    baseUrl: 'mailto:?',
    subject: ''
  }
};
function updateHref (args) {
  if(arguments.length) {
    shareConfig = $.extend(true,shareConfig,args)
  }
  
  var hrefs = {};

  hrefs.twitter = [
    shareConfig.twitter.baseUrl,
    'url=' + shareConfig.twitter.url,
    '&text=' + shareConfig.twitter.text,
    '&via=' + shareConfig.twitter.via,
    '&related=' + shareConfig.twitter.via
  ].join('');

  hrefs.facebook = [
    shareConfig.facebook.base_url,
    'app_id=' + shareConfig.facebook.app_id,
    '&name=' + shareConfig.facebook.name,
    '&link=' + shareConfig.facebook.link,
    '&picture=' + shareConfig.facebook.picture,
    '&caption=' + shareConfig.facebook.caption,
    '&description=' + shareConfig.facebook.description,
    '&message=' + shareConfig.facebook.message,
    '&redirect_uri=' + shareConfig.facebook.redirect_uri
  ].join('');

  hrefs.linkedin = [
    shareConfig.linkedin.base_url,
    'mini=' + shareConfig.linkedin.mini,
    '&url=' + shareConfig.linkedin.url,
    '&title=' + shareConfig.linkedin.title,
    '&summary=' + shareConfig.linkedin.summary
  ].join('');

  hrefs.email = [
    shareConfig.email.base_url,
    shareConfig.email.subject
  ].join('');


  $twitter.attr('href', encodeURI(hrefs.twitter));
  $facebook.attr('href', encodeURI(hrefs.facebook));
  $linkedin.attr('href', encodeURI(hrefs.linkedin));
  $email.attr('href', encodeURI(hrefs.email));
}

module.exports = updateHref;

