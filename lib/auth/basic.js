var request = require('request'),
{ promisify } = require('util'),
_ = require('underscore');

const requestAsync = promisify(request);

module.exports = async function(client, httpOpts, cb){
  try {
    httpOpts = _.extend({}, httpOpts, client.baseHTTPOptions, {
      auth : {
        username: client.auth.username,
        password: client.auth.password,
        sendImmediately: true
      },
      json : httpOpts.json || true
    }, httpOpts);
    
    const result = await requestAsync(httpOpts);
    
    // Call callback for backward compatibility
    if (cb) cb(null, result[0], result[1]);
    return result;
    
  } catch (error) {
    // Call callback with error for backward compatibility
    if (cb) cb(error);
    throw error;
  }
};