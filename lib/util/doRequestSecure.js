var makeSharepointResponsesLessAwful = require('./odata');
var inputSanitizer = require('./inputSanitizer');
var rateLimiter = require('./rateLimiter');

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  
  // Generate a client identifier for rate limiting
  var clientId = client.auth.username + '@' + (client.url || 'unknown');
  
  return function doRequest(opts, cb) {
    var byteStreamFlag = false;
    
    // Input sanitization
    if (typeof opts === 'string') {
      // Sanitize URL string
      var sanitizedUrl = inputSanitizer.sanitizePath(opts);
      if (!sanitizedUrl) {
        return cb({
          message: 'Invalid URL provided',
          statusCode: 400
        });
      }
      
      if ((opts.indexOf('GetFolderByServerRelativeUrl') >= 0) || (opts.indexOf('GetFileByServerRelativeUrl') >= 0)) {
        byteStreamFlag = true;
      }
      opts = {
        url: sanitizedUrl,
        method: 'get'
      };
    } else {
      // Sanitize options object
      var sanitizedOpts = inputSanitizer.sanitizeRequestOptions(opts);
      if (!sanitizedOpts) {
        return cb({
          message: 'Invalid request options provided',
          statusCode: 400
        });
      }
      opts = sanitizedOpts;
    }
    
    if (opts.type === 'pagination') {
      isDisableFlag = false;
      opts = {
        url: opts.host,
        method: 'get'
      };
    }
    
    // Determine operation type for rate limiting
    var operationType = 'general';
    if (opts.url && opts.url.indexOf('contextinfo') >= 0) {
      operationType = 'auth';
    } else if (byteStreamFlag || (opts.url && (opts.url.indexOf('File') >= 0 || opts.url.indexOf('Folder') >= 0))) {
      operationType = 'file';
    }
    
    // Rate limiting check
    var rateLimitResult = rateLimiter.globalRateLimiter.isAllowed(clientId, operationType, 1);
    if (!rateLimitResult.allowed) {
      return cb({
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }
    
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    
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
        if (response && response.statusCode && response.statusCode.toString()[0] !== '2') {
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