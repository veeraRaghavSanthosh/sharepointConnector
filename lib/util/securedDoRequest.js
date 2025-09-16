var makeSharepointResponsesLessAwful = require('./odata');

module.exports = function(client) {
  var isDisableFlag = true;
  var verbosityFilter = require('./verbosityFilter')(client);
  
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
    
    // Apply input sanitization to URL if enabled
    if (client.security && client.security.enableSanitization && client.security.inputSanitizer) {
      var sanitizer = client.security.inputSanitizer;
      
      // Sanitize URL path components
      if (opts.url && typeof opts.url === 'string') {
        // Extract and sanitize path components while preserving SharePoint API structure
        var urlParts = opts.url.split('/');
        var sanitizedParts = [];
        
        for (var i = 0; i < urlParts.length; i++) {
          var part = urlParts[i];
          if (part && part !== '_api' && part !== 'web' && part !== 'lists' && part !== 'items') {
            // Check if this looks like a GUID
            if (part.match(/^[({]?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[)}]?$/i)) {
              var sanitizedGuid = sanitizer.sanitizeGuid(part.replace(/[(){}]/g, ''));
              if (sanitizedGuid) {
                sanitizedParts.push(part); // Keep original format for SharePoint compatibility
              } else {
                return cb('Invalid GUID in URL: ' + part);
              }
            } else if (part.indexOf('getbytitle') >= 0) {
              // Handle getbytitle operations - extract and sanitize the title
              var titleMatch = part.match(/getbytitle\('([^']+)'\)/i);
              if (titleMatch && titleMatch[1]) {
                var sanitizedTitle = sanitizer.sanitizeListName(titleMatch[1]);
                if (sanitizedTitle) {
                  sanitizedParts.push("getbytitle('" + sanitizedTitle + "')");
                } else {
                  return cb('Invalid list name in URL: ' + titleMatch[1]);
                }
              } else {
                sanitizedParts.push(part);
              }
            } else if (part.indexOf('guid') >= 0) {
              // Handle GUID parameters in URL
              sanitizedParts.push(part);
            } else {
              // General URL component sanitization
              var sanitizedPart = sanitizer.sanitizeUrlPath(part);
              if (sanitizedPart !== null) {
                sanitizedParts.push(decodeURIComponent(sanitizedPart)); // Decode for SharePoint compatibility
              } else {
                return cb('Invalid URL component: ' + part);
              }
            }
          } else {
            sanitizedParts.push(part);
          }
        }
        
        opts.url = sanitizedParts.join('/');
      }
    }
    
    opts.url = client.url + opts.url;
    opts.method = opts.method || 'get';
    
    if (!client.httpClient) {
      return cb('Error finding login information - please call login() again');
    }
    
    // Apply rate limiting if enabled
    if (client.security && client.security.enableRateLimit && client.security.rateLimiter) {
      client.security.rateLimiter(client, opts, function(rateLimitErr, rateLimitResult) {
        if (rateLimitErr) {
          return cb(rateLimitErr);
        }
        
        // Continue with the actual request
        performRequest();
      });
    } else {
      performRequest();
    }
    
    function performRequest() {
      client.httpClient(client, opts, function(err, response, body) {
        var requestSuccess = !err && response && response.statusCode && response.statusCode.toString()[0] === '2';
        
        // Record request result for rate limiting
        if (client.security && client.security.enableRateLimit && client.security.rateLimiter) {
          var rateLimiterModule = require('../security/rateLimiter');
          rateLimiterModule.recordRequest(client, opts, requestSuccess);
        }
        
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
    }
  };
};