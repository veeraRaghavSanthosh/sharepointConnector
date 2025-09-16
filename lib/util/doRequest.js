var makeSharepointResponsesLessAwful = require('./odata');
module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  var logger = require('./logger')(client);
  return function doRequest(opts, cb) {
    var startTime = Date.now();
    var byteStreamFlag = false;
    
    if (typeof opts === 'string') {
      if ( (opts.indexOf('GetFolderByServerRelativeUrl') >= 0) ||(opts.indexOf('GetFileByServerRelativeUrl') >= 0)) {
        byteStreamFlag = true;
      }
      opts = {
        url: opts,
        method: 'get'
      };
    }
    
    // Log the request details at TRACE level
    logger.trace('REQUEST', 'Initiating SharePoint request', {
      url: opts.url,
      method: opts.method || 'GET',
      byteStream: byteStreamFlag,
      hasJsonBody: !!opts.json
    });
    if (opts.type === 'pagination') {
      isDisableFlag = false;
      opts = {
        url: opts.host,
        method: 'get'
      };
    }
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    if (!client.httpClient) {
      return cb('Error finding login information - please call login() again');
    }
    client.httpClient(client, opts, function(err, response, body) {
      // Log HTTP activity
      logger.http(opts, response, err);
      
      if (err) {
        logger.error('REQUEST', 'SharePoint request failed', { 
          error: err, 
          url: opts.url,
          duration: Date.now() - startTime 
        });
        return cb(err);
      }
      if (byteStreamFlag) {
        logger.timing('ByteStream Request', startTime, { url: opts.url });
        return cb(null, response);
      } else {
        var __next;
        if (response&&response.statusCode&&response.statusCode.toString()[0] !== '2') {
          var msg = 'Invalid status code received: ' + response.statusCode;
          if (body && body.error && body.error.message) {
            msg = body.error.message;
          }
          
          logger.error('REQUEST', 'SharePoint request returned error status', {
            statusCode: response.statusCode,
            message: msg,
            url: opts.url,
            duration: Date.now() - startTime
          });
          
          return cb({
            message: msg,
            body: body,
            statusCode: response.statusCode
          });
        }
        if (isDisableFlag) {
          if (body && body.d && body.d['__next']) {
            __next = body.d['__next'];
          }
          body = makeSharepointResponsesLessAwful(body);
          body = verbosityFilter(body, opts.url);
        }
        if (__next) {
          return cb(null, body, __next);
        } else {
          return cb(null, body);
        }
      }
    });
  };
};
