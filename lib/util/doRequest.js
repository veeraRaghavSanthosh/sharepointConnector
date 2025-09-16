var makeSharepointResponsesLessAwful = require('./odata');
var inputSanitizer = require('./inputSanitizer');

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  return function doRequest(opts, cb) {
    // Rate limiting check
    if (client.rateLimiter) {
      var identifier = client.auth.username || 'anonymous';
      var rateLimitResult = client.rateLimiter.checkLimit(identifier);
      
      if (!rateLimitResult.allowed) {
        var rateLimitError = new Error('Rate limit exceeded: ' + (rateLimitResult.reason || 'Too many requests'));
        rateLimitError.rateLimitExceeded = true;
        rateLimitError.retryAfter = rateLimitResult.retryAfter;
        rateLimitError.resetTime = rateLimitResult.resetTime;
        rateLimitError.statusCode = 429;
        return cb(rateLimitError);
      }
    }

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

    // Input sanitization for URL
    try {
      if (opts.url) {
        // Allow relative URLs for API endpoints
        opts.url = inputSanitizer.sanitizeUrl(opts.url, true);
      }
    } catch (error) {
      return cb(new Error('Invalid URL in request: ' + error.message));
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
