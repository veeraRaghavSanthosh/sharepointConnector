var makeSharepointResponsesLessAwful = require('./odata');
module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  var logger = require('./logger').createLogger(client, 'doRequest');
  return function doRequest(opts, cb) {
    var byteStreamFlag = false;
    var originalOpts = JSON.parse(JSON.stringify(opts)); // Deep copy for logging
    
    logger.trace('doRequest() called', { opts: originalOpts });
    
    if (typeof opts === 'string') {
      logger.debug('Converting string URL to options object', { url: opts });
      
      if ( (opts.indexOf('GetFolderByServerRelativeUrl') >= 0) ||(opts.indexOf('GetFileByServerRelativeUrl') >= 0)) {
        byteStreamFlag = true;
        logger.debug('Detected byte stream request', { url: opts });
      }
      opts = {
        url: opts,
        method: 'get'
      };
    }
    if (opts.type === 'pagination') {
      logger.debug('Pagination request detected', { host: opts.host });
      isDisableFlag = false;
      opts = {
        url: opts.host,
        method: 'get'
      };
    }
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    
    logger.debug('Prepared SharePoint request', {
      url: opts.url,
      method: opts.method,
      isByteStream: byteStreamFlag,
      isPagination: opts.type === 'pagination'
    });
    if (!client.httpClient) {
      return cb('Error finding login information - please call login() again');
    }
    client.httpClient(client, opts, function(err, response, body) {
      if (err) {
        return cb(err);
      }
      if (byteStreamFlag) {
        return cb(null, response);
      } else {
        var __next;
        if (response&&response.statusCode&&response.statusCode.toString()[0] !== '2') {
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
