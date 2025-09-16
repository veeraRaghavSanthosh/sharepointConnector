/**
 * Rate Limiting Utility for SharePoint Connector
 * Provides configurable rate limiting to prevent API abuse and ensure
 * fair usage across different clients and operations.
 */

var _ = require('underscore');

// Default rate limiting configurations
var DEFAULT_LIMITS = {
  // Requests per minute for different operation types
  LOGIN: { requests: 10, window: 60000 }, // 10 login attempts per minute
  READ: { requests: 100, window: 60000 }, // 100 read operations per minute
  WRITE: { requests: 50, window: 60000 }, // 50 write operations per minute
  DELETE: { requests: 20, window: 60000 }, // 20 delete operations per minute
  GLOBAL: { requests: 200, window: 60000 } // 200 total requests per minute
};

// Rate limiting storage - in production, this should be Redis or similar
var rateLimitStore = {};

/**
 * Creates a rate limiter instance
 * @param {Object} options - Rate limiting options
 * @returns {Object} - Rate limiter instance
 */
function createRateLimiter(options) {
  options = options || {};
  
  var limits = _.extend({}, DEFAULT_LIMITS, options.limits || {});
  var enabled = options.enabled !== false; // Default to enabled
  var keyGenerator = options.keyGenerator || defaultKeyGenerator;
  var onLimitExceeded = options.onLimitExceeded || defaultLimitExceededHandler;
  
  /**
   * Default key generator - combines client identifier with operation type
   * @param {Object} client - SharePoint client instance
   * @param {string} operation - Operation type (LOGIN, READ, WRITE, DELETE)
   * @returns {string} - Rate limiting key
   */
  function defaultKeyGenerator(client, operation) {
    var clientId = client.auth ? (client.auth.username + '@' + client.url) : 'unknown';
    return clientId + ':' + operation;
  }
  
  /**
   * Default handler for when rate limit is exceeded
   * @param {string} key - Rate limiting key
   * @param {Object} limit - Rate limit configuration
   * @param {number} current - Current request count
   */
  function defaultLimitExceededHandler(key, limit, current) {
    var error = new Error('Rate limit exceeded. Maximum ' + limit.requests + 
                         ' requests per ' + (limit.window / 1000) + ' seconds. ' +
                         'Current: ' + current + ' requests.');
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.retryAfter = Math.ceil(limit.window / 1000);
    throw error;
  }
  
  /**
   * Gets the current request count for a key
   * @param {string} key - Rate limiting key
   * @returns {Object} - Current count and window start time
   */
  function getCurrentCount(key) {
    var now = Date.now();
    var record = rateLimitStore[key];
    
    if (!record) {
      return { count: 0, windowStart: now };
    }
    
    // If the window has expired, reset the count
    if (now - record.windowStart >= record.window) {
      return { count: 0, windowStart: now };
    }
    
    return { count: record.count, windowStart: record.windowStart };
  }
  
  /**
   * Updates the request count for a key
   * @param {string} key - Rate limiting key
   * @param {number} count - New count
   * @param {number} windowStart - Window start time
   * @param {number} window - Window duration in milliseconds
   */
  function updateCount(key, count, windowStart, window) {
    rateLimitStore[key] = {
      count: count,
      windowStart: windowStart,
      window: window,
      lastRequest: Date.now()
    };
  }
  
  /**
   * Checks if a request should be allowed
   * @param {Object} client - SharePoint client instance
   * @param {string} operation - Operation type
   * @returns {Object} - Rate limit check result
   */
  function checkLimit(client, operation) {
    if (!enabled) {
      return { allowed: true, remaining: Infinity };
    }
    
    operation = operation.toUpperCase();
    var limit = limits[operation] || limits.GLOBAL;
    var key = keyGenerator(client, operation);
    var globalKey = keyGenerator(client, 'GLOBAL');
    
    // Check operation-specific limit
    var current = getCurrentCount(key);
    if (current.count >= limit.requests) {
      onLimitExceeded(key, limit, current.count);
      return { allowed: false, remaining: 0 };
    }
    
    // Check global limit
    var globalCurrent = getCurrentCount(globalKey);
    var globalLimit = limits.GLOBAL;
    if (globalCurrent.count >= globalLimit.requests) {
      onLimitExceeded(globalKey, globalLimit, globalCurrent.count);
      return { allowed: false, remaining: 0 };
    }
    
    // Update counts
    updateCount(key, current.count + 1, current.windowStart, limit.window);
    updateCount(globalKey, globalCurrent.count + 1, globalCurrent.windowStart, globalLimit.window);
    
    return {
      allowed: true,
      remaining: Math.min(limit.requests - current.count - 1, globalLimit.requests - globalCurrent.count - 1)
    };
  }
  
  /**
   * Middleware function for rate limiting
   * @param {Object} client - SharePoint client instance
   * @param {string} operation - Operation type
   * @param {Function} next - Next function to call
   */
  function middleware(client, operation, next) {
    try {
      var result = checkLimit(client, operation);
      if (!result.allowed) {
        // Rate limit exceeded, error already thrown by onLimitExceeded
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Gets rate limiting statistics for a client
   * @param {Object} client - SharePoint client instance
   * @returns {Object} - Rate limiting statistics
   */
  function getStats(client) {
    if (!enabled) {
      return { enabled: false };
    }
    
    var stats = { enabled: true, limits: limits, current: {} };
    
    _.each(limits, function(limit, operation) {
      var key = keyGenerator(client, operation);
      var current = getCurrentCount(key);
      stats.current[operation] = {
        count: current.count,
        remaining: limit.requests - current.count,
        resetTime: new Date(current.windowStart + limit.window)
      };
    });
    
    return stats;
  }
  
  /**
   * Resets rate limiting for a client (useful for testing)
   * @param {Object} client - SharePoint client instance
   */
  function reset(client) {
    _.each(limits, function(limit, operation) {
      var key = keyGenerator(client, operation);
      delete rateLimitStore[key];
    });
  }
  
  /**
   * Cleans up expired rate limiting records
   */
  function cleanup() {
    var now = Date.now();
    var keysToDelete = [];
    
    _.each(rateLimitStore, function(record, key) {
      if (now - record.windowStart >= record.window) {
        keysToDelete.push(key);
      }
    });
    
    _.each(keysToDelete, function(key) {
      delete rateLimitStore[key];
    });
  }
  
  // Set up periodic cleanup (every 5 minutes)
  var cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
  
  return {
    checkLimit: checkLimit,
    middleware: middleware,
    getStats: getStats,
    reset: reset,
    cleanup: cleanup,
    enabled: enabled,
    limits: limits,
    // Expose for testing
    _store: rateLimitStore,
    _cleanupInterval: cleanupInterval
  };
}

/**
 * Determines operation type from request options
 * @param {Object} opts - Request options
 * @returns {string} - Operation type
 */
function getOperationType(opts) {
  if (!opts) {
    return 'READ';
  }
  
  var method = (opts.method || 'GET').toUpperCase();
  var url = opts.url || '';
  
  // Login operations
  if (url.indexOf('contextinfo') !== -1 || url.indexOf('login') !== -1) {
    return 'LOGIN';
  }
  
  // Write operations
  if (method === 'POST' && (!opts.headers || !opts.headers['X-HTTP-Method'])) {
    return 'WRITE';
  }
  
  // Update operations (treated as write)
  if (opts.headers && opts.headers['X-HTTP-Method'] === 'MERGE') {
    return 'WRITE';
  }
  
  // Delete operations
  if (method === 'DELETE' || (opts.headers && opts.headers['X-HTTP-Method'] === 'DELETE')) {
    return 'DELETE';
  }
  
  // Default to read
  return 'READ';
}

/**
 * Creates a rate-limited version of doRequest
 * @param {Function} originalDoRequest - Original doRequest function
 * @param {Object} rateLimiter - Rate limiter instance
 * @returns {Function} - Rate-limited doRequest function
 */
function createRateLimitedDoRequest(originalDoRequest, rateLimiter) {
  return function rateLimitedDoRequest(opts, cb) {
    var operation = getOperationType(opts);
    var client = this; // Assuming this is bound to the client
    
    rateLimiter.middleware(client, operation, function(error) {
      if (error) {
        return cb(error);
      }
      
      // Call the original doRequest function
      return originalDoRequest.call(client, opts, cb);
    });
  };
}

module.exports = {
  createRateLimiter: createRateLimiter,
  getOperationType: getOperationType,
  createRateLimitedDoRequest: createRateLimitedDoRequest,
  DEFAULT_LIMITS: DEFAULT_LIMITS
};