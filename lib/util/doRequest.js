var makeSharepointResponsesLessAwful = require('./odata');
var rateLimiter = require('./rateLimiter');
var inputSanitizer = require('./inputSanitizer');

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  
  // Initialize rate limiter for this client
  var clientRateLimiter = rateLimiter.createRateLimiter(client.rateLimitOptions);
  
  return function doRequest(opts, cb) {
    // Determine operation type for rate limiting
    var operation = rateLimiter.getOperationType(opts);
    
    // Apply rate limiting
    try {
      var rateLimitResult = clientRateLimiter.checkLimit(client, operation);
      if (!rateLimitResult.allowed) {
        // Rate limit error already thrown by checkLimit
        return;
      }
    } catch (rateLimitError) {
      return cb(rateLimitError);
    }
    
    // Input validation for URL parameters
    var byteStreamFlag = false;
    if (typeof opts === 'string') {
      try {
        // Validate URL segment (only if it's not empty after removing client URL)
        var urlSegment = opts.replace(client.url || '', '');
        if (urlSegment) {
          inputSanitizer.validateUrlSegment(urlSegment);
        }
      } catch (validationError) {
        return cb(new Error('Invalid URL parameter: ' + validationError.message));
      }
      
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
    
    // Additional URL validation
    if (opts.url && typeof opts.url === 'string') {
      try {
        var urlPath = opts.url.replace(client.url || '', '');
        if (urlPath && urlPath.length > 1) { // Only validate non-empty paths
          // Skip validation for SharePoint API paths that may contain special characters
          if (urlPath.indexOf('/_api/') === -1) {
            inputSanitizer.validateUrlSegment(urlPath);
          }
        }
      } catch (validationError) {
        return cb(new Error('Invalid URL in request options: ' + validationError.message));
      }
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
