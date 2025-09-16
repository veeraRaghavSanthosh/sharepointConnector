/**
 * Rate limiting utilities for SharePoint connector
 * Implements token bucket algorithm to prevent API abuse
 */

/**
 * Rate limiter class using token bucket algorithm
 * @param {object} options - Configuration options
 * @param {number} options.maxRequests - Maximum requests per window (default: 100)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.maxBurst - Maximum burst requests (default: 10)
 */
function RateLimiter(options) {
  options = options || {};
  
  this.maxRequests = options.maxRequests || 100;
  this.windowMs = options.windowMs || 60000; // 1 minute
  this.maxBurst = options.maxBurst || 10;
  
  // Store for tracking requests per identifier (e.g., username, IP, client instance)
  this.buckets = new Map();
  
  // Cleanup interval to remove old entries
  this.cleanupInterval = setInterval(this._cleanup.bind(this), this.windowMs);
}

/**
 * Check if a request should be allowed
 * @param {string} identifier - Unique identifier for the client (username, IP, etc.)
 * @returns {object} - Result object with allowed status and retry info
 */
RateLimiter.prototype.checkLimit = function(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    identifier = 'default';
  }

  var now = Date.now();
  var bucket = this.buckets.get(identifier);

  if (!bucket) {
    // First request from this identifier
    bucket = {
      tokens: this.maxRequests - 1,
      lastRefill: now,
      burstTokens: this.maxBurst - 1,
      requestCount: 1,
      windowStart: now
    };
    this.buckets.set(identifier, bucket);
    
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetTime: now + this.windowMs,
      retryAfter: null
    };
  }

  // Refill tokens based on time passed
  var timePassed = now - bucket.lastRefill;
  var tokensToAdd = Math.floor((timePassed / this.windowMs) * this.maxRequests);
  
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if we're in a new window
  if (now - bucket.windowStart >= this.windowMs) {
    bucket.requestCount = 0;
    bucket.windowStart = now;
    bucket.burstTokens = this.maxBurst;
  }

  // Check burst limit first
  if (bucket.burstTokens <= 0) {
    return {
      allowed: false,
      remaining: bucket.tokens,
      resetTime: bucket.windowStart + this.windowMs,
      retryAfter: Math.ceil((bucket.windowStart + this.windowMs - now) / 1000),
      reason: 'Burst limit exceeded'
    };
  }

  // Check overall rate limit
  if (bucket.tokens <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.lastRefill + this.windowMs,
      retryAfter: Math.ceil((bucket.lastRefill + this.windowMs - now) / 1000),
      reason: 'Rate limit exceeded'
    };
  }

  // Allow the request
  bucket.tokens--;
  bucket.burstTokens--;
  bucket.requestCount++;

  return {
    allowed: true,
    remaining: bucket.tokens,
    resetTime: bucket.lastRefill + this.windowMs,
    retryAfter: null
  };
};

/**
 * Get current status for an identifier
 * @param {string} identifier - Unique identifier
 * @returns {object} - Current status
 */
RateLimiter.prototype.getStatus = function(identifier) {
  var bucket = this.buckets.get(identifier || 'default');
  if (!bucket) {
    return {
      remaining: this.maxRequests,
      resetTime: Date.now() + this.windowMs,
      requestCount: 0
    };
  }

  return {
    remaining: bucket.tokens,
    resetTime: bucket.lastRefill + this.windowMs,
    requestCount: bucket.requestCount,
    burstRemaining: bucket.burstTokens
  };
};

/**
 * Reset limits for a specific identifier
 * @param {string} identifier - Unique identifier
 */
RateLimiter.prototype.reset = function(identifier) {
  if (identifier) {
    this.buckets.delete(identifier);
  } else {
    this.buckets.clear();
  }
};

/**
 * Clean up old entries to prevent memory leaks
 * @private
 */
RateLimiter.prototype._cleanup = function() {
  var now = Date.now();
  var cutoff = now - (this.windowMs * 2); // Keep entries for 2 windows

  for (var [identifier, bucket] of this.buckets) {
    if (bucket.lastRefill < cutoff && bucket.windowStart < cutoff) {
      this.buckets.delete(identifier);
    }
  }
};

/**
 * Destroy the rate limiter and clean up resources
 */
RateLimiter.prototype.destroy = function() {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }
  this.buckets.clear();
};

/**
 * Create a rate limiting middleware function
 * @param {object} options - Rate limiter options
 * @returns {function} - Middleware function
 */
function createRateLimitMiddleware(options) {
  var limiter = new RateLimiter(options);
  
  return function rateLimitMiddleware(identifier, callback) {
    var result = limiter.checkLimit(identifier);
    
    if (!result.allowed) {
      var error = new Error('Rate limit exceeded: ' + (result.reason || 'Too many requests'));
      error.rateLimitExceeded = true;
      error.retryAfter = result.retryAfter;
      error.resetTime = result.resetTime;
      return callback(error);
    }
    
    // Add rate limit info to be used by caller
    callback.rateLimitInfo = {
      remaining: result.remaining,
      resetTime: result.resetTime
    };
    
    callback(null);
  };
}

/**
 * Default rate limiter instance
 */
var defaultRateLimiter = new RateLimiter({
  maxRequests: 100,   // 100 requests per minute
  windowMs: 60000,    // 1 minute window
  maxBurst: 10        // Max 10 requests in quick succession
});

module.exports = {
  RateLimiter: RateLimiter,
  createRateLimitMiddleware: createRateLimitMiddleware,
  defaultRateLimiter: defaultRateLimiter
};