var request = require('request'),
_ = require('underscore');

module.exports = function(client, httpOpts, cb){
  var logger = require('../util/logger').createLogger(client, 'auth.basic');
  
  logger.trace('Basic authentication called', {
    url: httpOpts.url,
    method: httpOpts.method,
    username: client.auth.username ? client.auth.username.substring(0, 3) + '***' : 'not provided'
  });
  
  httpOpts = _.extend({}, httpOpts, client.baseHTTPOptions, {
    auth : {
      username: client.auth.username,
      password: client.auth.password,
      sendImmediately: true
    },
    json : httpOpts.json || true
  }, httpOpts);
  
  logger.debug('Making basic auth request', {
    url: httpOpts.url,
    method: httpOpts.method,
    hasAuth: !!httpOpts.auth,
    sendImmediately: httpOpts.auth.sendImmediately
  });
  
  return request(httpOpts, function(err, response, body) {
    if (err) {
      logger.error('Basic auth request failed', {
        error: err,
        url: httpOpts.url,
        method: httpOpts.method
      });
    } else {
      logger.debug('Basic auth request completed', {
        statusCode: response ? response.statusCode : 'unknown',
        url: httpOpts.url,
        hasBody: !!body
      });
    }
    return cb(err, response, body);
  });
};
