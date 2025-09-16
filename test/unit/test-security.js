var assert = require('assert');
var inputSanitizer = require('../../lib/util/inputSanitizer');
var createRateLimiter = require('../../lib/util/rateLimiter');

// Test Input Sanitization
exports.test_input_sanitizer_sanitizes_strings = function(done) {
  var result = inputSanitizer.sanitizeString('<script>alert("xss")</script>Hello');
  assert.ok(result.indexOf('<script>') === -1, 'Script tags should be removed');
  assert.ok(result.indexOf('Hello') !== -1, 'Safe content should be preserved');
  done();
};

exports.test_input_sanitizer_validates_list_id = function(done) {
  var validGuid = inputSanitizer.sanitizeListId('12345678-1234-1234-1234-123456789abc');
  assert.ok(validGuid !== null, 'Valid GUID should pass validation');
  
  var invalidGuid = inputSanitizer.sanitizeListId('invalid-guid');
  assert.ok(invalidGuid === null, 'Invalid GUID should be rejected');
  done();
};

exports.test_input_sanitizer_validates_item_id = function(done) {
  var validId = inputSanitizer.sanitizeItemId('123');
  assert.equal(validId, 123, 'Valid item ID should be converted to number');
  
  var invalidId = inputSanitizer.sanitizeItemId('invalid');
  assert.ok(invalidId === null, 'Invalid item ID should be rejected');
  
  var negativeId = inputSanitizer.sanitizeItemId('-1');
  assert.ok(negativeId === null, 'Negative item ID should be rejected');
  done();
};

exports.test_input_sanitizer_sanitizes_paths = function(done) {
  var safePath = inputSanitizer.sanitizePath('/sites/mysite/documents');
  assert.ok(safePath !== null, 'Safe path should pass validation');
  
  var maliciousPath = inputSanitizer.sanitizePath('../../../etc/passwd');
  assert.ok(maliciousPath !== null && maliciousPath.indexOf('..') === -1, 'Path traversal should be removed');
  done();
};

exports.test_input_sanitizer_validates_auth_params = function(done) {
  var validParams = {
    username: 'testuser',
    password: 'testpass',
    url: 'https://example.sharepoint.com'
  };
  
  var result = inputSanitizer.validateAuthParams(validParams);
  assert.ok(result.isValid, 'Valid params should pass validation');
  
  var invalidParams = {
    username: 'testuser'
    // missing password and url
  };
  
  var invalidResult = inputSanitizer.validateAuthParams(invalidParams);
  assert.ok(!invalidResult.isValid, 'Invalid params should fail validation');
  assert.ok(invalidResult.errors.length > 0, 'Should return error messages');
  done();
};

// Test Rate Limiting
exports.test_rate_limiter_allows_requests_within_limits = function(done) {
  var rateLimiter = createRateLimiter({
    requestsPerSecond: 5,
    requestsPerMinute: 10,
    requestsPerHour: 20
  });
  
  rateLimiter.checkLimit(function(err, allowed) {
    assert.ok(!err, 'Should not return error');
    assert.ok(allowed, 'Should allow request within limits');
    done();
  });
};

exports.test_rate_limiter_rejects_requests_over_limits = function(done) {
  var rateLimiter = createRateLimiter({
    requestsPerSecond: 1,
    requestsPerMinute: 10,
    requestsPerHour: 20
  });
  
  // Make multiple requests to exceed per-second limit
  rateLimiter.checkLimit(function(err, allowed1) {
    assert.ok(allowed1, 'First request should be allowed');
    
    rateLimiter.checkLimit(function(err, allowed2, message) {
      assert.ok(!allowed2, 'Second request should be rejected');
      assert.ok(message.indexOf('per second') !== -1, 'Should mention per-second limit');
      done();
    });
  });
};

exports.test_rate_limiter_provides_stats = function(done) {
  var rateLimiter = createRateLimiter();
  
  rateLimiter.checkLimit(function(err) {
    assert.ok(!err, 'Should not return error');
    var stats = rateLimiter.getStats();
    assert.ok(stats.totalRequests >= 1, 'Should track total requests');
    assert.ok(typeof stats.uptime === 'string', 'Should provide uptime');
    assert.ok(typeof stats.rejectionRate === 'string', 'Should provide rejection rate');
    done();
  });
};