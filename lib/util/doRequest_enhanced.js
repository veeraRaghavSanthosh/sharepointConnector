var makeSharepointResponsesLessAwful = require('./odata');
var logger = require('./logger'); // New: Import logger module

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  var log = logger(client); // New: Initialize logger with client config
  
  return function doRequest(opts, cb) {
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
    if (opts.type === 'pagination') {
      isDisableFlag = false;
      opts = {
        url: opts.host,
        method: 'get'
      };
    }
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    
    // New: Log request initiation at trace level
    log.trace('notification', 'Initiating SharePoint request', {
      url: opts.url,
      method: opts.method,
      byteStream: byteStreamFlag,
      pagination: opts.type === 'pagination'
    });
    
    if (!client.httpClient) {
      var errorMsg = 'Error finding login information - please call login() again';
      // New: Log authentication error
      log.error('notification', 'Authentication error in request', { error: errorMsg });
      return cb(errorMsg);
    }
    
    client.httpClient(client, opts, function(err, response, body) {
      if (err) {
        // New: Log request error with details
        log.error('notification', 'SharePoint request failed', {
          url: opts.url,
          method: opts.method,
          error: err
        });
        return cb(err);
      }
      
      // New: Log successful response at trace level
      log.trace('notification', 'SharePoint request completed', {
        url: opts.url,
        method: opts.method,
        statusCode: response ? response.statusCode : 'unknown',
        hasBody: !!body
      });
      
      if (byteStreamFlag) {
        // New: Log byte stream response
        log.debug('notification', 'Returning byte stream response', {
          url: opts.url,
          contentLength: response && response.headers ? response.headers['content-length'] : 'unknown'
        });
        return cb(null, response);
      } else {
        var __next;
        if (response&&response.statusCode&&response.statusCode.toString()[0] !== '2') {
          var msg = 'Invalid status code received: ' + response.statusCode;
          if (body && body.error && body.error.message) {
            msg = body.error.message;
          }
          
          // New: Log status code error with details
          log.warn('notification', 'SharePoint returned non-success status code', {
            url: opts.url,
            method: opts.method,
            statusCode: response.statusCode,
            errorMessage: msg,
            responseBody: body
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
            // New: Log pagination detection
            log.debug('notification', 'Pagination detected in response', {
              url: opts.url,
              nextUrl: __next
            });
          }
          body = makeSharepointResponsesLessAwful(body);
          body = verbosityFilter(body, opts.url);
        }
        
        // New: Log successful response processing
        if (log.isLevelEnabled('trace')) {
          log.trace('notification', 'Response processed successfully', {
            url: opts.url,
            method: opts.method,
            hasPagination: !!__next,
            responseSize: body ? JSON.stringify(body).length : 0
          });
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
