var makeSharepointResponsesLessAwful = require('./odata');
module.exports = function(client) {
  var verbosityFilter = require('./verbosityFilter')(client);
  return function doRequest(opts, cb) {
    var byteStreamFlag = false;
    if (typeof opts === 'string') {
      if (opts.indexOf('GetFolderByServerRelativeUrl') >= 0) {
        byteStreamFlag = true;
      }
      opts = {
        url: opts,
        method: 'get'
      };
    }
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    if (!client.httpClient) {
      return cb('Error finding login information - please call login() again');
    }
    client.httpClient(client, opts, function(err, response, body) {
      // console.log("response --->", response);
      // console.log("body --->", body);
      if (err) {
        return cb(err);
      }
      if (byteStreamFlag) {
        return cb(null, response);
      } else {
        if (response.statusCode.toString()[0] !== '2') {
          var msg = 'Invalid status code received: ' + response.statusCode;
          if (body && body.error && body.error.message) {
            msg = body.error.message;
          }
          return cb({
            message: msg,
            body: body,
            statusCode: response.statusCode
          });
        }
        body = makeSharepointResponsesLessAwful(body);
        body = verbosityFilter(body, opts.url);
        //TODO: Apply conveniences Here
        return cb(null, body);
      }
    });
  };
};
