/**
 * Unit tests for rate limiting functionality
 */

var assert = require('assert');
var rateLimiter = require('../../lib/util/rateLimiter');

describe('Rate Limiting', function() {
  
  describe('createRateLimiter', function() {
    var limiter;
    var mockClient;
    
    beforeEach(function() {
      mockClient = {
        auth: { username: 'testuser' },
        url: 'https://test.sharepoint.com'
      };
      
      limiter = rateLimiter.createRateLimiter({
        enabled: true,
        limits: {
          READ: { requests: 5, window: 1000 }, // 5 requests per second for testing
          WRITE: { requests: 2, window: 1000 },
          GLOBAL: { requests: 10, window: 1000 }
        }
      });
    });
    
    afterEach(function() {
      if (limiter && limiter._cleanupInterval) {
        clearInterval(limiter._cleanupInterval);
      }
      // Clear the rate limit store
      if (limiter && limiter._store) {
        Object.keys(limiter._store).forEach(function(key) {
          delete limiter._store[key];
        });
      }
    });
    
    it('should allow requests within rate limit', function() {
      var result1 = limiter.checkLimit(mockClient, 'READ');
      var result2 = limiter.checkLimit(mockClient, 'READ');
      
      assert.strictEqual(result1.allowed, true);
      assert.strictEqual(result2.allowed, true);
      assert(result1.remaining >= 0);
      assert(result2.remaining < result1.remaining);
    });
    
    it('should block requests exceeding rate limit', function() {
      // Use up all allowed requests
      for (var i = 0; i < 5; i++) {
        limiter.checkLimit(mockClient, 'READ');
      }
      
      // This should throw an error
      assert.throws(function() {
        limiter.checkLimit(mockClient, 'READ');
      }, /Rate limit exceeded/);
    });
    
    it('should enforce different limits for different operations', function() {
      // Use up READ requests
      for (var i = 0; i < 5; i++) {
        limiter.checkLimit(mockClient, 'READ');
      }
      
      // WRITE should still be allowed
      var writeResult = limiter.checkLimit(mockClient, 'WRITE');
      assert.strictEqual(writeResult.allowed, true);
    });
    
    it('should enforce global rate limit', function() {
      // Use up global requests with mixed operations
      for (var i = 0; i < 5; i++) {
        limiter.checkLimit(mockClient, 'READ');
      }
      for (var i = 0; i < 2; i++) {
        limiter.checkLimit(mockClient, 'WRITE');
      }
      // We've used 7 requests, should have 3 left globally
      
      // READ limit should be exceeded
      assert.throws(function() {
        limiter.checkLimit(mockClient, 'READ');
      }, /Rate limit exceeded/);
      
      // But we should still be able to make DELETE requests until global limit
      var deleteResult = limiter.checkLimit(mockClient, 'DELETE');
      assert.strictEqual(deleteResult.allowed, true);
    });
    
    it('should reset rate limits after window expires', function(done) {
      // Use up all allowed requests
      for (var i = 0; i < 5; i++) {
        limiter.checkLimit(mockClient, 'READ');
      }
      
      // Should be blocked now
      assert.throws(function() {
        limiter.checkLimit(mockClient, 'READ');
      }, /Rate limit exceeded/);
      
      // Wait for window to expire and test again
      setTimeout(function() {
        var result = limiter.checkLimit(mockClient, 'READ');
        assert.strictEqual(result.allowed, true);
        done();
      }, 1100); // Wait slightly longer than the 1000ms window
    });
    
    it('should provide accurate statistics', function() {
      limiter.checkLimit(mockClient, 'READ');
      limiter.checkLimit(mockClient, 'WRITE');
      
      var stats = limiter.getStats(mockClient);
      assert.strictEqual(stats.enabled, true);
      assert(stats.current.READ.count === 1);
      assert(stats.current.WRITE.count === 1);
      assert(stats.current.GLOBAL.count === 2);
    });
    
    it('should be disabled when configured', function() {
      var disabledLimiter = rateLimiter.createRateLimiter({ enabled: false });
      
      var result = disabledLimiter.checkLimit(mockClient, 'READ');
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.remaining, Infinity);
      
      var stats = disabledLimiter.getStats(mockClient);
      assert.strictEqual(stats.enabled, false);
      
      clearInterval(disabledLimiter._cleanupInterval);
    });
    
    it('should reset rate limits when requested', function() {
      limiter.checkLimit(mockClient, 'READ');
      limiter.checkLimit(mockClient, 'WRITE');
      
      var statsBefore = limiter.getStats(mockClient);
      assert(statsBefore.current.READ.count === 1);
      
      limiter.reset(mockClient);
      
      var statsAfter = limiter.getStats(mockClient);
      assert(statsAfter.current.READ.count === 0);
    });
  });
  
  describe('getOperationType', function() {
    it('should identify login operations', function() {
      var loginOpts = [
        { url: '/contextinfo', method: 'POST' },
        { url: '/login', method: 'POST' },
        { url: 'https://test.com/contextinfo' }
      ];
      
      loginOpts.forEach(function(opts) {
        var result = rateLimiter.getOperationType(opts);
        assert.strictEqual(result, 'LOGIN');
      });
    });
    
    it('should identify write operations', function() {
      var writeOpts = [
        { method: 'POST' },
        { method: 'POST', headers: {} },
        { method: 'POST', headers: { 'X-HTTP-Method': 'MERGE' } }
      ];
      
      writeOpts.forEach(function(opts) {
        var result = rateLimiter.getOperationType(opts);
        assert(result === 'WRITE' || result === 'WRITE');
      });
    });
    
    it('should identify delete operations', function() {
      var deleteOpts = [
        { method: 'DELETE' },
        { method: 'POST', headers: { 'X-HTTP-Method': 'DELETE' } }
      ];
      
      deleteOpts.forEach(function(opts) {
        var result = rateLimiter.getOperationType(opts);
        assert.strictEqual(result, 'DELETE');
      });
    });
    
    it('should default to read operations', function() {
      var readOpts = [
        { method: 'GET' },
        {},
        null,
        undefined
      ];
      
      readOpts.forEach(function(opts) {
        var result = rateLimiter.getOperationType(opts);
        assert.strictEqual(result, 'READ');
      });
    });
  });
  
  describe('middleware functionality', function() {
    var limiter;
    var mockClient;
    
    beforeEach(function() {
      mockClient = {
        auth: { username: 'testuser' },
        url: 'https://test.sharepoint.com'
      };
      
      limiter = rateLimiter.createRateLimiter({
        enabled: true,
        limits: {
          READ: { requests: 2, window: 1000 }
        }
      });
    });
    
    afterEach(function() {
      if (limiter && limiter._cleanupInterval) {
        clearInterval(limiter._cleanupInterval);
      }
    });
    
    it('should call next() when within rate limit', function(done) {
      limiter.middleware(mockClient, 'READ', function(error) {
        assert.strictEqual(error, undefined);
        done();
      });
    });
    
    it('should call next() with error when rate limit exceeded', function(done) {
      // Create a fresh client for this test
      var testClient = {
        auth: { username: 'testuser2' },
        url: 'https://test2.sharepoint.com'
      };
      
      // Use up allowed requests
      limiter.checkLimit(testClient, 'READ');
      limiter.checkLimit(testClient, 'READ');
      
      limiter.middleware(testClient, 'READ', function(error) {
        assert(error instanceof Error);
        assert(error.message.indexOf('Rate limit exceeded') !== -1);
        assert.strictEqual(error.code, 'RATE_LIMIT_EXCEEDED');
        done();
      });
    });
  });
  
  describe('cleanup functionality', function() {
    it('should remove expired rate limit records', function() {
      var limiter = rateLimiter.createRateLimiter({
        enabled: true,
        limits: {
          READ: { requests: 5, window: 100 } // Very short window for testing
        }
      });
      
      var mockClient = {
        auth: { username: 'testuser' },
        url: 'https://test.sharepoint.com'
      };
      
      // Create some rate limit records
      limiter.checkLimit(mockClient, 'READ');
      
      // Verify records exist
      var keysBefore = Object.keys(limiter._store);
      assert(keysBefore.length > 0);
      
      // Wait for expiration and run cleanup
      setTimeout(function() {
        limiter.cleanup();
        var keysAfter = Object.keys(limiter._store);
        assert(keysAfter.length === 0);
        
        clearInterval(limiter._cleanupInterval);
      }, 150);
    });
  });
});