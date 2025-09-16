/**
 * Security middleware for SharePoint Connector
 * Integrates input sanitization and rate limiting
 */

// Import our security modules
var inputSanitizer = require('./inputSanitizer');
var createRateLimiter = require('./rateLimiter');

module.exports = function(client) {
  
  // Initialize rate limiter with client options
  var rateLimiterOptions = {
    requestsPerSecond: client.rateLimits && client.rateLimits.requestsPerSecond || 10,
    requestsPerMinute: client.rateLimits && client.rateLimits.requestsPerMinute || 100,
    requestsPerHour: client.rateLimits && client.rateLimits.requestsPerHour || 1000
  };
  
  var rateLimiter = createRateLimiter(rateLimiterOptions);
  
  return {
    
    /**
     * Apply security checks before processing request
     * @param {object} opts - Request options
     * @param {function} callback - Callback function
     */
    applySecurityChecks: function(opts, callback) {
      var self = this;
      
      // Apply rate limiting first
      rateLimiter.checkLimit(function(err, allowed, message) {
        if (err) {
          return callback(err);
        }
        
        if (!allowed) {
          var rateLimitError = {
            message: message,
            type: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
          };
          return callback(rateLimitError);
        }
        
        // Apply input sanitization
        try {
          opts = self.sanitizeRequestOptions(opts);
          return callback(null, opts);
        } catch (sanitizeError) {
          var inputError = {
            message: 'Input validation failed: ' + sanitizeError.message,
            type: 'INPUT_VALIDATION_ERROR',
            statusCode: 400
          };
          return callback(inputError);
        }
      });
    },
    
    /**
     * Sanitize request options
     * @param {object} opts - Request options to sanitize
     * @returns {object} - Sanitized options
     */
    sanitizeRequestOptions: function(opts) {
      if (!opts) {
        return opts;
      }
      
      // Sanitize URL if it's a string
      if (typeof opts === 'string') {
        var sanitizedPath = inputSanitizer.sanitizePath(opts);
        if (sanitizedPath === null) {
          throw new Error('Invalid URL path provided');
        }
        return sanitizedPath;
      }
      
      // Sanitize URL in options object
      if (opts.url && typeof opts.url === 'string') {
        // Extract the path part (after the domain)
        var urlParts = opts.url.split('/_api/');
        if (urlParts.length > 1) {
          var apiPath = '/_api/' + urlParts[1];
          var sanitizedApiPath = inputSanitizer.sanitizePath(apiPath);
          if (sanitizedApiPath === null) {
            throw new Error('Invalid API path in URL');
          }
          opts.url = urlParts[0] + sanitizedApiPath;
        }
      }
      
      // Sanitize JSON payload
      if (opts.json && typeof opts.json === 'object') {
        opts.json = this.sanitizeJsonPayload(opts.json);
      }
      
      // Sanitize headers
      if (opts.headers && typeof opts.headers === 'object') {
        opts.headers = this.sanitizeHeaders(opts.headers);
      }
      
      return opts;
    },
    
    /**
     * Sanitize JSON payload
     * @param {object} json - JSON payload to sanitize
     * @returns {object} - Sanitized JSON
     */
    sanitizeJsonPayload: function(json) {
      if (!json || typeof json !== 'object') {
        return json;
      }
      
      var sanitized = {};
      
      for (var key in json) {
        if (json.hasOwnProperty(key)) {
          var value = json[key];
          
          // Sanitize string values
          if (typeof value === 'string') {
            sanitized[inputSanitizer.sanitizeString(key, { maxLength: 100 })] = 
              inputSanitizer.sanitizeString(value, { maxLength: 1000 });
          } else if (typeof value === 'object' && value !== null) {
            // Recursively sanitize nested objects
            sanitized[inputSanitizer.sanitizeString(key, { maxLength: 100 })] = 
              this.sanitizeJsonPayload(value);
          } else {
            // Keep non-string values as-is (numbers, booleans, etc.)
            sanitized[inputSanitizer.sanitizeString(key, { maxLength: 100 })] = value;
          }
        }
      }
      
      return sanitized;
    },
    
    /**
     * Sanitize HTTP headers
     * @param {object} headers - Headers to sanitize
     * @returns {object} - Sanitized headers
     */
    sanitizeHeaders: function(headers) {
      if (!headers || typeof headers !== 'object') {
        return headers;
      }
      
      var sanitized = {};
      var allowedHeaders = [
        'accept', 'content-type', 'authorization', 'x-requestdigest',
        'if-match', 'x-http-method', 'user-agent'
      ];
      
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          var lowerKey = key.toLowerCase();
          
          // Only allow known safe headers
          if (allowedHeaders.indexOf(lowerKey) !== -1) {
            var value = headers[key];
            if (typeof value === 'string') {
              sanitized[key] = inputSanitizer.sanitizeString(value, { 
                maxLength: 500, 
                escapeHtml: false 
              });
            } else {
              sanitized[key] = value;
            }
          }
        }
      }
      
      return sanitized;
    },
    
    /**
     * Get rate limiter statistics
     * @returns {object} - Rate limiter stats
     */
    getRateLimiterStats: function() {
      return rateLimiter.getStats();
    },
    
    /**
     * Update rate limits
     * @param {object} newLimits - New rate limit configuration
     */
    updateRateLimits: function(newLimits) {
      return rateLimiter.updateLimits(newLimits);
    },
    
    /**
     * Reset rate limiter statistics
     */
    resetRateLimiter: function() {
      return rateLimiter.resetStats();
    }
  };
};