/**
 * Security Wrapper for SharePoint Connector
 * Provides a backward-compatible way to add security features to existing modules
 */

var inputSanitizer = require('./inputSanitizer');
var rateLimiter = require('./rateLimiter');

/**
 * Wraps the doRequest function with security features
 * @param {Function} originalDoRequest - Original doRequest function
 * @param {Object} client - SharePoint client configuration
 * @returns {Function} - Wrapped doRequest function
 */
function wrapDoRequest(originalDoRequest, client) {
  return function securedDoRequest(opts, cb) {
    // Apply input sanitization to URL if enabled
    if (client.security && client.security.enableSanitization && opts.url) {
      // Basic URL sanitization for SharePoint paths
      if (typeof opts.url === 'string') {
        // Check for potential injection attempts
        if (opts.url.indexOf('<script') >= 0 || opts.url.indexOf('javascript:') >= 0 || 
            opts.url.indexOf('data:') >= 0 || opts.url.indexOf('vbscript:') >= 0) {
          return cb('Invalid characters detected in URL');
        }
        
        // Additional sanitization for common injection patterns
        if (opts.url.indexOf('..') >= 0 || opts.url.indexOf('\\') >= 0) {
          return cb('Path traversal attempt detected in URL');
        }
      }
    }
    
    // Apply rate limiting if enabled
    if (client.security && client.security.enableRateLimit && client.security.rateLimiter) {
      client.security.rateLimiter(client, opts, function(rateLimitErr, rateLimitResult) {
        if (rateLimitErr) {
          return cb(rateLimitErr);
        }
        
        // Continue with the original request
        performOriginalRequest();
      });
    } else {
      performOriginalRequest();
    }
    
    function performOriginalRequest() {
      // Call the original doRequest function
      originalDoRequest(opts, function(err, response, next) {
        var requestSuccess = !err && response;
        
        // Record request result for rate limiting
        if (client.security && client.security.enableRateLimit) {
          rateLimiter.recordRequest(client, opts, requestSuccess);
        }
        
        // Return the original response
        if (next) {
          return cb(err, response, next);
        } else {
          return cb(err, response);
        }
      });
    }
  };
}

/**
 * Wraps authentication functions with additional security
 * @param {Function} originalAuth - Original authentication function
 * @param {Object} client - SharePoint client configuration
 * @returns {Function} - Wrapped authentication function
 */
function wrapAuthFunction(originalAuth, client) {
  return function securedAuth(authClient, httpOpts, cb) {
    // Apply rate limiting to authentication requests
    if (client.security && client.security.enableRateLimit && client.security.rateLimiter) {
      client.security.rateLimiter(authClient, httpOpts, function(rateLimitErr, rateLimitResult) {
        if (rateLimitErr) {
          return cb(rateLimitErr);
        }
        
        // Continue with original authentication
        performOriginalAuth();
      });
    } else {
      performOriginalAuth();
    }
    
    function performOriginalAuth() {
      // Call the original authentication function
      originalAuth(authClient, httpOpts, function(err, response, body) {
        var requestSuccess = !err && response && response.statusCode && response.statusCode.toString()[0] === '2';
        
        // Record authentication result for rate limiting
        if (client.security && client.security.enableRateLimit) {
          rateLimiter.recordRequest(authClient, httpOpts, requestSuccess);
        }
        
        return cb(err, response, body);
      });
    }
  };
}

/**
 * Sanitizes list operation parameters
 * @param {Object} params - Parameters to sanitize
 * @param {Object} client - SharePoint client configuration
 * @returns {Object} - Sanitized parameters
 */
function sanitizeListParams(params, client) {
  if (!client.security || !client.security.enableSanitization || !params) {
    return params;
  }
  
  var sanitized = {};
  var sanitizer = client.security.inputSanitizer;
  
  // Sanitize common parameters
  if (params.guid || params.id || params.Guid || params.Id) {
    var guid = params.guid || params.id || params.Guid || params.Id;
    var sanitizedGuid = sanitizer.sanitizeGuid(guid);
    if (sanitizedGuid) {
      sanitized.guid = sanitizedGuid;
      sanitized.id = sanitizedGuid;
      sanitized.Guid = sanitizedGuid;
      sanitized.Id = sanitizedGuid;
    } else {
      throw new Error('Invalid GUID provided: ' + guid);
    }
  }
  
  if (params.name || params.title || params.Name || params.Title) {
    var name = params.name || params.title || params.Name || params.Title;
    var sanitizedName = sanitizer.sanitizeListName(name);
    if (sanitizedName) {
      sanitized.name = sanitizedName;
      sanitized.title = sanitizedName;
      sanitized.Name = sanitizedName;
      sanitized.Title = sanitizedName;
    } else {
      throw new Error('Invalid list name provided: ' + name);
    }
  }
  
  if (params.description || params.Description) {
    var desc = params.description || params.Description;
    if (typeof desc === 'string') {
      var sanitizedDesc = sanitizer.encodeHtmlEntities(desc);
      sanitized.description = sanitizedDesc;
      sanitized.Description = sanitizedDesc;
    }
  }
  
  // Copy other parameters as-is (they should be sanitized at the client level)
  Object.keys(params).forEach(function(key) {
    if (!sanitized.hasOwnProperty(key)) {
      sanitized[key] = params[key];
    }
  });
  
  return sanitized;
}

/**
 * Creates a security-enabled version of a module
 * @param {Object} originalModule - Original module to wrap
 * @param {Object} client - SharePoint client configuration
 * @returns {Object} - Security-wrapped module
 */
function wrapModule(originalModule, client) {
  if (!client.security || (!client.security.enableSanitization && !client.security.enableRateLimit)) {
    return originalModule;
  }
  
  var wrappedModule = {};
  
  // Copy all functions from original module
  Object.keys(originalModule).forEach(function(key) {
    if (typeof originalModule[key] === 'function') {
      wrappedModule[key] = function() {
        var args = Array.prototype.slice.call(arguments);
        
        // Apply parameter sanitization if this looks like a CRUD operation
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
          try {
            args[0] = sanitizeListParams(args[0], client);
          } catch (sanitizationError) {
            // If sanitization fails, call the callback with the error
            var callback = args[args.length - 1];
            if (typeof callback === 'function') {
              return callback(sanitizationError.message);
            } else {
              throw sanitizationError;
            }
          }
        }
        
        // Call the original function with sanitized parameters
        return originalModule[key].apply(this, args);
      };
    } else {
      wrappedModule[key] = originalModule[key];
    }
  });
  
  return wrappedModule;
}

module.exports = {
  wrapDoRequest: wrapDoRequest,
  wrapAuthFunction: wrapAuthFunction,
  wrapModule: wrapModule,
  sanitizeListParams: sanitizeListParams
};