var assert = require('assert');
var rateLimiter = require('../../lib/util/rateLimiter');

describe('Rate Limiting', function() {
  
  describe('Token Bucket', function() {
    it('should create a token bucket with default values', function() {
      var bucket = new rateLimiter.TokenBucket();
      assert.equal(bucket.capacity, 100);
      assert.equal(bucket.tokens, 100);
      assert.equal(bucket.refillRate, 10);
      assert.equal(bucket.refillPeriod, 1000);
    });
    
    it('should create a token bucket with custom values', function() {
      var bucket = new rateLimiter.TokenBucket(50, 5, 2000);
      assert.equal(bucket.capacity, 50);
      assert.equal(bucket.tokens, 50);
      assert.equal(bucket.refillRate, 5);
      assert.equal(bucket.refillPeriod, 2000);
    });
    
    it('should consume tokens when available', function() {
      var bucket = new rateLimiter.TokenBucket(10, 1, 1000);
      
      var result1 = bucket.consume(5);
      assert.equal(result1, true);
      assert.equal(bucket.getTokens(), 5);
      
      var result2 = bucket.consume(3);
      assert.equal(result2, true);
      assert.equal(bucket.getTokens(), 2);
    });
    
    it('should reject consumption when insufficient tokens', function() {
      var bucket = new rateLimiter.TokenBucket(5, 1, 1000);
      
      var result1 = bucket.consume(3);
      assert.equal(result1, true);
      assert.equal(bucket.getTokens(), 2);
      
      var result2 = bucket.consume(5); // More than available
      assert.equal(result2, false);
      assert.equal(bucket.getTokens(), 2); // Should remain unchanged
    });
    
    it('should refill tokens over time', function(done) {
      var bucket = new rateLimiter.TokenBucket(10, 10, 100); // Refill every 100ms
      
      // Consume all tokens
      bucket.consume(10);
      assert.equal(bucket.getTokens(), 0);
      
      // Wait for refill
      setTimeout(function() {
        assert.equal(bucket.getTokens(), 10); // Should be refilled
        done();
      }, 150);
    });
    
    it('should not exceed capacity when refilling', function(done) {
      var bucket = new rateLimiter.TokenBucket(5, 10, 50); // High refill rate
      
      // Wait longer than refill period
      setTimeout(function() {
        assert.equal(bucket.getTokens(), 5); // Should not exceed capacity
        done();
      }, 200);
    });
  });
  
  describe('Rate Limiter Manager', function() {
    var manager;
    
    beforeEach(function() {
      manager = new rateLimiter.RateLimiterManager({
        generalCapacity: 10,
        generalRefillRate: 10,
        generalRefillPeriod: 1000,
        authCapacity: 5,
        authRefillRate: 5,
        authRefillPeriod: 5000
      });
    });
    
    afterEach(function() {
      if (manager) {
        manager.destroy();
      }
    });
    
    it('should create rate limiters for different clients', function() {
      var result1 = manager.isAllowed('client1', 'general', 1);
      var result2 = manager.isAllowed('client2', 'general', 1);
      
      assert.equal(result1.allowed, true);
      assert.equal(result2.allowed, true);
      assert.equal(result1.remaining, 9);
      assert.equal(result2.remaining, 9);
    });
    
    it('should enforce different limits for different operation types', function() {
      // General operations
      var generalResult = manager.isAllowed('client1', 'general', 8);
      assert.equal(generalResult.allowed, true);
      assert.equal(generalResult.remaining, 2);
      
      // Auth operations (different limit)
      var authResult = manager.isAllowed('client1', 'auth', 3);
      assert.equal(authResult.allowed, true);
      assert.equal(authResult.remaining, 2);
    });
    
    it('should block requests when rate limit exceeded', function() {
      // Consume all tokens
      var result1 = manager.isAllowed('client1', 'general', 10);
      assert.equal(result1.allowed, true);
      assert.equal(result1.remaining, 0);
      
      // Next request should be blocked
      var result2 = manager.isAllowed('client1', 'general', 1);
      assert.equal(result2.allowed, false);
      assert.equal(result2.remaining, 0);
    });
    
    it('should provide rate limiting statistics', function() {
      manager.isAllowed('client1', 'general', 3);
      manager.isAllowed('client1', 'auth', 2);
      
      var stats = manager.getStats('client1');
      assert.equal(stats.general.tokens, 7);
      assert.equal(stats.general.capacity, 10);
      assert.equal(stats.auth.tokens, 3);
      assert.equal(stats.auth.capacity, 5);
    });
    
    it('should handle cleanup of old limiters', function() {
      // Create a limiter
      manager.isAllowed('client1', 'general', 1);
      
      // Manually trigger cleanup (normally happens automatically)
      // First, artificially age the limiter
      var key = 'client1:general';
      manager.limiters[key].lastUsed = Date.now() - 3700000; // 1 hour + 1 minute ago
      
      manager.cleanup();
      
      // Limiter should be removed
      assert.equal(manager.limiters[key], undefined);
    });
    
    it('should use default operation type when none specified', function() {
      var result = manager.isAllowed('client1'); // No operation type
      assert.equal(result.allowed, true);
      assert.equal(result.remaining, 9); // Should use general limits
    });
  });
  
  describe('Global Rate Limiter Integration', function() {
    it('should provide a global rate limiter instance', function() {
      assert.notEqual(rateLimiter.globalRateLimiter, null);
      assert.equal(typeof rateLimiter.globalRateLimiter.isAllowed, 'function');
    });
    
    it('should work with the global instance', function() {
      var result = rateLimiter.globalRateLimiter.isAllowed('test-client', 'general', 1);
      assert.equal(result.allowed, true);
      assert.equal(typeof result.remaining, 'number');
      assert.equal(typeof result.resetTime, 'number');
    });
  });
});