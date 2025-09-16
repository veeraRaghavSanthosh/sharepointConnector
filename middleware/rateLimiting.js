const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for SharePoint connector
 * Implements multiple rate limiting strategies to prevent abuse and ensure fair usage
 */
class RateLimiter {
  constructor(options = {}) {
    this.options = {
      // Rate limiting windows and limits
      globalLimit: options.globalLimit || 1000, // requests per window
      globalWindow: options.globalWindow || 15 * 60 * 1000, // 15 minutes
      
      userLimit: options.userLimit || 100, // requests per user per window
      userWindow: options.userWindow || 15 * 60 * 1000, // 15 minutes
      
      ipLimit: options.ipLimit || 200, // requests per IP per window
      ipWindow: options.ipWindow || 15 * 60 * 1000, // 15 minutes
      
      // SharePoint-specific limits
      uploadLimit: options.uploadLimit || 10, // file uploads per window
      uploadWindow: options.uploadWindow || 60 * 60 * 1000, // 1 hour
      
      queryLimit: options.queryLimit || 50, // complex queries per window
      queryWindow: options.queryWindow || 15 * 60 * 1000, // 15 minutes
      
      ...options
    };
  }

  /**
   * Global rate limiter - applies to all requests
   */
  globalRateLimit() {
    return rateLimit({
      windowMs: this.options.globalWindow,
      max: this.options.globalLimit,
      message: {
        error: 'Too many requests',
        message: 'Global rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(this.options.globalWindow / 1000),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Global rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(this.options.globalWindow / 1000),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Per-user rate limiter
   */
  userRateLimit() {
    return rateLimit({
      windowMs: this.options.userWindow,
      max: this.options.userLimit,
      keyGenerator: (req) => {
        // Use user ID from authentication or fallback to IP
        return req.user?.id || req.user?.email || req.ip;
      },
      message: {
        error: 'Too many requests',
        message: 'User rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(this.options.userWindow / 1000),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  /**
   * Per-IP rate limiter
   */
  ipRateLimit() {
    return rateLimit({
      windowMs: this.options.ipWindow,
      max: this.options.ipLimit,
      keyGenerator: (req) => req.ip,
      message: {
        error: 'Too many requests',
        message: 'IP rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(this.options.ipWindow / 1000),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  /**
   * File upload rate limiter - stricter limits for resource-intensive operations
   */
  uploadRateLimit() {
    return rateLimit({
      windowMs: this.options.uploadWindow,
      max: this.options.uploadLimit,
      keyGenerator: (req) => {
        return `upload:${req.user?.id || req.user?.email || req.ip}`;
      },
      message: {
        error: 'Upload limit exceeded',
        message: 'Too many file uploads. Please try again later.',
        retryAfter: Math.ceil(this.options.uploadWindow / 1000),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Only apply to upload endpoints
        return !req.path.includes('/upload') && !req.path.includes('/file');
      }
    });
  }

  /**
   * Complex query rate limiter - for OData queries and searches
   */
  queryRateLimit() {
    return rateLimit({
      windowMs: this.options.queryWindow,
      max: this.options.queryLimit,
      keyGenerator: (req) => {
        return `query:${req.user?.id || req.user?.email || req.ip}`;
      },
      message: {
        error: 'Query limit exceeded',
        message: 'Too many complex queries. Please try again later.',
        retryAfter: Math.ceil(this.options.queryWindow / 1000),
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Apply to query endpoints or requests with complex OData queries
        const hasComplexQuery = req.query.$filter || req.query.$search || req.query.$expand;
        const isQueryEndpoint = req.path.includes('/query') || req.path.includes('/search');
        return !hasComplexQuery && !isQueryEndpoint;
      }
    });
  }

  /**
   * Comprehensive middleware stack
   */
  middleware() {
    return [
      this.globalRateLimit(),
      this.ipRateLimit(),
      this.userRateLimit(),
      this.uploadRateLimit(),
      this.queryRateLimit()
    ];
  }
}

module.exports = RateLimiter;