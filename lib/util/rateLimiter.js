/**
 * Rate Limiting Module
 * Implements token bucket algorithm to prevent abuse of SharePoint connector
 */

/**
 * Token Bucket Rate Limiter
 * @param {number} capacity - Maximum number of tokens in bucket
 * @param {number} refillRate - Number of tokens added per second
 * @param {number} refillPeriod - Period in milliseconds for refill (default: 1000ms)
 */
function TokenBucket(capacity, refillRate, refillPeriod) {
  this.capacity = capacity || 100;
  this.tokens = capacity || 100;
  this.refillRate = refillRate || 10;
  this.refillPeriod = refillPeriod || 1000;
  this.lastRefill = Date.now();
}

/**
 * Refills the token bucket based on elapsed time
 */
TokenBucket.prototype.refill = function() {
  var now = Date.now();
  var elapsed = now - this.lastRefill;
  
  if (elapsed >= this.refillPeriod) {
    var tokensToAdd = Math.floor(elapsed / this.refillPeriod) * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
};

/**
 * Attempts to consume tokens from the bucket
 * @param {number} tokens - Number of tokens to consume (default: 1)
 * @returns {boolean} - True if tokens were consumed, false if rate limited
 */
TokenBucket.prototype.consume = function(tokens) {
  tokens = tokens || 1;
  this.refill();
  
  if (this.tokens >= tokens) {
    this.tokens -= tokens;
    return true;
  }
  
  return false;
};

/**
 * Gets the current number of tokens available
 * @returns {number} - Current token count
 */
TokenBucket.prototype.getTokens = function() {
  this.refill();
  return this.tokens;
};

/**
 * Rate Limiter Manager
 * Manages rate limiters for different clients/users
 */
function RateLimiterManager(options) {
  options = options || {};
  
  // Default rate limiting configuration
  this.config = {
    // General API calls: 100 requests per minute
    general: {
      capacity: options.generalCapacity || 100,
      refillRate: options.generalRefillRate || 100,
      refillPeriod: options.generalRefillPeriod || 60000
    },
    // Authentication calls: 20 requests per 5 minutes (more restrictive)
    auth: {
      capacity: options.authCapacity || 20,
      refillRate: options.authRefillRate || 20,
      refillPeriod: options.authRefillPeriod || 300000
    },
    // File operations: 50 requests per minute
    file: {
      capacity: options.fileCapacity || 50,
      refillRate: options.fileRefillRate || 50,
      refillPeriod: options.fileRefillPeriod || 60000
    }
  };
  
  // Store rate limiters by client identifier and operation type
  this.limiters = {};
  
  // Cleanup interval for unused limiters (every 10 minutes)
  this.cleanupInterval = setInterval(this.cleanup.bind(this), 600000);
}

/**
 * Gets a rate limiter for a specific client and operation type
 * @param {string} clientId - Unique identifier for the client
 * @param {string} operationType - Type of operation (general, auth, file)
 * @returns {TokenBucket} - Rate limiter instance
 */
RateLimiterManager.prototype.getLimiter = function(clientId, operationType) {
  operationType = operationType || 'general';
  var key = clientId + ':' + operationType;
  
  if (!this.limiters[key]) {
    var config = this.config[operationType] || this.config.general;
    this.limiters[key] = {
      bucket: new TokenBucket(config.capacity, config.refillRate, config.refillPeriod),
      lastUsed: Date.now()
    };
  }
  
  this.limiters[key].lastUsed = Date.now();
  return this.limiters[key].bucket;
};

/**
 * Checks if a request is allowed for a client
 * @param {string} clientId - Unique identifier for the client
 * @param {string} operationType - Type of operation (general, auth, file)
 * @param {number} tokens - Number of tokens to consume (default: 1)
 * @returns {object} - Result object with allowed status and remaining tokens
 */
RateLimiterManager.prototype.isAllowed = function(clientId, operationType, tokens) {
  var limiter = this.getLimiter(clientId, operationType);
  var allowed = limiter.consume(tokens || 1);
  
  return {
    allowed: allowed,
    remaining: limiter.getTokens(),
    resetTime: limiter.lastRefill + limiter.refillPeriod
  };
};

/**
 * Cleans up unused rate limiters (older than 1 hour)
 */
RateLimiterManager.prototype.cleanup = function() {
  var now = Date.now();
  var maxAge = 3600000; // 1 hour
  
  for (var key in this.limiters) {
    if (this.limiters.hasOwnProperty(key)) {
      if (now - this.limiters[key].lastUsed > maxAge) {
        delete this.limiters[key];
      }
    }
  }
};

/**
 * Destroys the rate limiter manager and cleans up intervals
 */
RateLimiterManager.prototype.destroy = function() {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }
  this.limiters = {};
};

// Create a global rate limiter instance
var globalRateLimiter = new RateLimiterManager();

module.exports = {
  TokenBucket: TokenBucket,
  RateLimiterManager: RateLimiterManager,
  globalRateLimiter: globalRateLimiter
};