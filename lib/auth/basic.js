var request = require('request'),
_ = require('underscore');

module.exports = function(client, httpOpts, cb){
  httpOpts = _.extend({}, httpOpts, client.baseHTTPOptions, {
    auth : {
      username: client.auth.username,
      password: client.auth.password,
      sendImmediately: true
    },
    json : httpOpts.json || true
  }, httpOpts);
  return request(httpOpts, cb);
};
