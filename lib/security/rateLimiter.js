/**
 * Rate Limiting Module for SharePoint Connector
 * Implements token bucket algorithm to prevent abuse and protect SharePoint servers
 * while maintaining backward compatibility.
 */

/**
 * Default rate limiting configuration
 */
var DEFAULT_CONFIG = {
  // Maximum number of requests per time window
  maxRequests: 100,
  
  // Time window in milliseconds (default: 1 minute)
  windowMs: 60 * 1000,
  
  // Maximum burst requests (token bucket capacity)
  burstLimit: 10,
  
  // Token refill rate (tokens per second)
  refillRate: 2,
  
  // Enable rate limiting by default
  enabled: true,
  
  // Skip rate limiting for certain operations
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  // Custom identifier function (default uses client URL + username)
  keyGenerator: null,
  
  // Custom handler for rate limit exceeded
  onLimitReached: null
};

/**
 * In-memory storage for rate limiting data
 * In production, this could be replaced with Redis or other external storage
 */
var rateLimitStore = {};

/**
 * Cleanup interval for removing expired entries
 */
var cleanupInterval = null;

/**
 * Creates a unique key for rate limiting based on client configuration
 * @param {Object} client - SharePoint client configuration
 * @returns {string} - Unique identifier for rate limiting
 */
function generateKey(client) {
  if (DEFAULT_CONFIG.keyGenerator && typeof DEFAULT_CONFIG.keyGenerator === 'function') {
    return DEFAULT_CONFIG.keyGenerator(client);
  }
  
  // Default key generation: URL + username
  var baseKey = (client.url || 'unknown') + ':' + (client.auth.username || 'anonymous');
  
  // Add additional context if available
  if (client.siteContext && client.siteContext !== 'web') {
    baseKey += ':' + client.siteContext;
  }
  
  return baseKey;
}

/**
 * Token bucket implementation for rate limiting
 * @param {string} key - Unique identifier
 * @param {Object} config - Rate limiting configuration
 * @returns {Object} - Token bucket state
 */
function getOrCreateBucket(key, config) {
  var now = Date.now();
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      tokens: config.burstLimit,
      lastRefill: now,
      requests: 0,
      windowStart: now
    };
  }
  
  var bucket = rateLimitStore[key];
  
  // Calculate time elapsed since last refill
  var elapsed = (now - bucket.lastRefill) / 1000;
  
  // Refill tokens based on elapsed time
  if (elapsed > 0) {
    var tokensToAdd = Math.floor(elapsed * config.refillRate);
    bucket.tokens = Math.min(config.burstLimit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
  
  // Reset window if needed
  if (now - bucket.windowStart >= config.windowMs) {
    bucket.requests = 0;
    bucket.windowStart = now;
  }
  
  return bucket;
}

/**
 * Checks if a request should be rate limited
 * @param {Object} client - SharePoint client configuration
 * @param {Object} options - Request options
 * @param {Object} config - Rate limiting configuration (optional)
 * @returns {Object} - Rate limit check result
 */
function checkRateLimit(client, options, config) {
  config = config || DEFAULT_CONFIG;
  
  // Skip if rate limiting is disabled
  if (!config.enabled) {
    return {
      allowed: true,
      remainingTokens: config.burstLimit,
      remainingRequests: config.maxRequests,
      resetTime: null
    };
  }
  
  var key = generateKey(client);
  var bucket = getOrCreateBucket(key, config);
  var now = Date.now();
  
  // Check window-based limit
  if (bucket.requests >= config.maxRequests) {
    var resetTime = bucket.windowStart + config.windowMs;
    return {
      allowed: false,
      remainingTokens: bucket.tokens,
      remainingRequests: 0,
      resetTime: resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
      error: 'Rate limit exceeded: too many requests in time window'
    };
  }
  
  // Check token bucket limit (burst protection)
  if (bucket.tokens < 1) {
    var nextTokenTime = bucket.lastRefill + (1000 / config.refillRate);
    return {
      allowed: false,
      remainingTokens: 0,
      remainingRequests: Math.max(0, config.maxRequests - bucket.requests),
      resetTime: bucket.windowStart + config.windowMs,
      retryAfter: Math.ceil((nextTokenTime - now) / 1000),
      error: 'Rate limit exceeded: burst limit reached'
    };
  }
  
  // Allow the request
  bucket.tokens--;
  bucket.requests++;
  
  return {
    allowed: true,
    remainingTokens: bucket.tokens,
    remainingRequests: Math.max(0, config.maxRequests - bucket.requests),
    resetTime: bucket.windowStart + config.windowMs
  };
}

/**
 * Records the result of a request (for skip policies)
 * @param {Object} client - SharePoint client configuration
 * @param {Object} options - Request options
 * @param {boolean} success - Whether the request was successful
 * @param {Object} config - Rate limiting configuration (optional)
 */
function recordRequest(client, options, success, config) {
  config = config || DEFAULT_CONFIG;
  
  if (!config.enabled) {
    return;
  }
  
  var key = generateKey(client);
  var bucket = rateLimitStore[key];
  
  if (!bucket) {
    return;
  }
  
  // Adjust counters based on skip policies
  if ((success && config.skipSuccessfulRequests) || (!success && config.skipFailedRequests)) {
    // Refund the token and request count
    bucket.tokens = Math.min(config.burstLimit, bucket.tokens + 1);
    bucket.requests = Math.max(0, bucket.requests - 1);
  }
}

/**
 * Creates a rate limiter middleware function
 * @param {Object} customConfig - Custom configuration to override defaults
 * @returns {Function} - Middleware function
 */
function createRateLimiter(customConfig) {
  var config = {};
  
  // Merge custom config with defaults
  Object.keys(DEFAULT_CONFIG).forEach(function(key) {
    config[key] = (customConfig && customConfig[key] !== undefined) ? customConfig[key] : DEFAULT_CONFIG[key];
  });
  
  return function rateLimitMiddleware(client, options, callback) {
    var result = checkRateLimit(client, options, config);
    
    if (!result.allowed) {
      // Call custom handler if provided
      if (config.onLimitReached && typeof config.onLimitReached === 'function') {
        return config.onLimitReached(result, client, options, callback);
      }
      
      // Default behavior: return error
      var error = new Error(result.error);
      error.statusCode = 429; // Too Many Requests
      error.retryAfter = result.retryAfter;
      error.remainingTokens = result.remainingTokens;
      error.remainingRequests = result.remainingRequests;
      error.resetTime = result.resetTime;
      
      return callback(error);
    }
    
    // Add rate limit headers to options for debugging
    if (!options.headers) {
      options.headers = {};
    }
    
    options.headers['X-RateLimit-Remaining-Tokens'] = result.remainingTokens;
    options.headers['X-RateLimit-Remaining-Requests'] = result.remainingRequests;
    options.headers['X-RateLimit-Reset'] = result.resetTime;
    
    // Continue with the request
    return callback(null, result);
  };
}

/**
 * Cleans up expired entries from the rate limit store
 */
function cleanup() {
  var now = Date.now();
  var keysToDelete = [];
  
  Object.keys(rateLimitStore).forEach(function(key) {
    var bucket = rateLimitStore[key];
    
    // Remove entries that haven't been accessed for more than 1 hour
    if (now - bucket.lastRefill > 60 * 60 * 1000) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(function(key) {
    delete rateLimitStore[key];
  });
}

/**
 * Starts the cleanup interval
 * @param {number} intervalMs - Cleanup interval in milliseconds (default: 5 minutes)
 */
function startCleanup(intervalMs) {
  intervalMs = intervalMs || 5 * 60 * 1000; // 5 minutes
  
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(cleanup, intervalMs);
}

/**
 * Stops the cleanup interval
 */
function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Resets rate limiting data for a specific client or all clients
 * @param {Object} client - SharePoint client configuration (optional)
 */
function reset(client) {
  if (client) {
    var key = generateKey(client);
    delete rateLimitStore[key];
  } else {
    rateLimitStore = {};
  }
}

/**
 * Gets current rate limiting statistics
 * @param {Object} client - SharePoint client configuration (optional)
 * @returns {Object} - Rate limiting statistics
 */
function getStats(client) {
  if (client) {
    var key = generateKey(client);
    var bucket = rateLimitStore[key];
    
    if (!bucket) {
      return null;
    }
    
    return {
      key: key,
      tokens: bucket.tokens,
      requests: bucket.requests,
      windowStart: bucket.windowStart,
      lastRefill: bucket.lastRefill
    };
  }
  
  // Return stats for all clients
  var stats = {};
  Object.keys(rateLimitStore).forEach(function(key) {
    var bucket = rateLimitStore[key];
    stats[key] = {
      tokens: bucket.tokens,
      requests: bucket.requests,
      windowStart: bucket.windowStart,
      lastRefill: bucket.lastRefill
    };
  });
  
  return stats;
}

// Start cleanup by default
startCleanup();

/**
 * Main export object
 */
module.exports = {
  // Core functions
  checkRateLimit: checkRateLimit,
  recordRequest: recordRequest,
  createRateLimiter: createRateLimiter,
  
  // Management functions
  reset: reset,
  getStats: getStats,
  cleanup: cleanup,
  startCleanup: startCleanup,
  stopCleanup: stopCleanup,
  
  // Configuration
  DEFAULT_CONFIG: DEFAULT_CONFIG,
  
  // Internal storage (for testing/debugging)
  _store: rateLimitStore
};