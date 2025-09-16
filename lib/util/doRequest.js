var makeSharepointResponsesLessAwful = require('./odata');
var createSecurityMiddleware = require('./securityMiddleware');

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  
  // Initialize security middleware if enabled
  var securityMiddleware = null;
  if (client.enableInputSanitization || client.enableRateLimiting) {
    try {
      securityMiddleware = createSecurityMiddleware(client);
    } catch (err) {
      // Fallback gracefully if security middleware is not available
      console.warn('Security middleware not available:', err.message);
    }
  }
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
    
    if (!client.httpClient) {
      return cb('Error finding login information - please call login() again');
    }
    
    // Apply security checks if middleware is available
    if (securityMiddleware) {
      // Create a copy of opts for security checking (excluding the full URL)
      var optsForSecurity = {
        url: opts.url.replace(client.url, ''),
        method: opts.method,
        json: opts.json,
        headers: opts.headers
      };
      
      securityMiddleware.applySecurityChecks(optsForSecurity, function(securityErr, sanitizedOpts) {
        if (securityErr) {
          return cb(securityErr);
        }
        
        // Update opts with sanitized values
        opts.json = sanitizedOpts.json;
        opts.headers = sanitizedOpts.headers;
        
        // Make the actual HTTP request
        client.httpClient(client, opts, function(err, response, body) {
          handleResponse(err, response, body, byteStreamFlag, isDisableFlag, cb);
        });
      });
    } else {
      // Make the request without security checks
      client.httpClient(client, opts, function(err, response, body) {
        handleResponse(err, response, body, byteStreamFlag, isDisableFlag, cb);
      });
    }
  };
  
  // Extract response handling logic into a separate function
  function handleResponse(err, response, body, byteStreamFlag, isDisableFlag, cb) {
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
  }
};
