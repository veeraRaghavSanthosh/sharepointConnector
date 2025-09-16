/**
 * Integration tests for security features (input sanitization + rate limiting)
 */

var assert = require('assert');
var nock = require('nock');

describe('Security Integration Tests', function() {
  var SharePointConnector;
  var mockServer;
  
  before(function() {
    SharePointConnector = require('../../sharepointconnector');
  });
  
  beforeEach(function() {
    // Mock SharePoint server
    mockServer = nock('https://test.sharepoint.com')
      .persist()
      .post('/_api/contextinfo')
      .reply(200, {
        d: {
          GetContextWebInformation: {
            FormDigestValue: 'mock-digest-value'
          }
        }
      })
      .get(/\/_api\/web\/lists/)
      .reply(200, {
        d: {
          results: [
            {
              Id: '12345678-1234-1234-1234-123456789abc',
              Title: 'Test List'
            }
          ]
        }
      });
  });
  
  afterEach(function() {
    nock.cleanAll();
  });
  
  describe('Client initialization with input sanitization', function() {
    it('should reject malicious input in client parameters', function() {
      var maliciousParams = {
        username: '<script>alert("xss")</script>',
        password: 'password',
        url: 'https://test.sharepoint.com'
      };
      
      assert.throws(function() {
        SharePointConnector(maliciousParams);
      }, /dangerous content/);
    });
    
    it('should reject invalid URL formats', function() {
      var invalidParams = {
        username: 'testuser',
        password: 'password',
        url: 'not-a-valid-url'
      };
      
      assert.throws(function() {
        SharePointConnector(invalidParams);
      }, /Invalid URL format/);
    });
    
    it('should reject invalid authentication types', function() {
      var invalidParams = {
        username: 'testuser',
        password: 'password',
        url: 'https://test.sharepoint.com',
        type: 'invalid-auth-type'
      };
      
      assert.throws(function() {
        SharePointConnector(invalidParams);
      }, /Invalid authentication type/);
    });
    
    it('should accept valid parameters', function() {
      var validParams = {
        username: 'testuser',
        password: 'password',
        url: 'https://test.sharepoint.com',
        type: 'basic'
      };
      
      var client = SharePointConnector(validParams);
      assert(client);
      assert(typeof client.login === 'function');
      assert(typeof client.lists === 'object');
    });
  });
  
  describe('List operations with input validation', function() {
    var client;
    
    beforeEach(function() {
      client = SharePointConnector({
        username: 'testuser',
        password: 'password',
        url: 'https://test.sharepoint.com',
        type: 'basic',
        rateLimitOptions: {
          enabled: false // Disable for these tests
        }
      });
    });
    
    it('should reject invalid GUIDs in list operations', function(done) {
      client.login(function(err) {
        if (err) return done(err);
        
        client.lists.read({ guid: 'invalid-guid' }, function(err, result) {
          assert(err);
          assert(err.message.indexOf('Invalid list GUID') !== -1);
          done();
        });
      });
    });
    
    it('should reject malicious list titles', function(done) {
      client.login(function(err) {
        if (err) return done(err);
        
        client.lists.create({
          title: '<script>alert("xss")</script>'
        }, function(err, result) {
          assert(err);
          assert(err.message.indexOf('dangerous content') !== -1);
          done();
        });
      });
    });
    
    it('should accept valid list operations', function(done) {
      client.login(function(err) {
        if (err) return done(err);
        
        client.lists.read({ guid: '12345678-1234-1234-1234-123456789abc' }, function(err, result) {
          assert(!err);
          assert(result);
          done();
        });
      });
    });
  });
  
  describe('Rate limiting integration', function() {
    var client;
    
    beforeEach(function() {
      client = SharePointConnector({
        username: 'testuser',
        password: 'password',
        url: 'https://test.sharepoint.com',
        type: 'basic',
        rateLimitOptions: {
          enabled: true,
          limits: {
            READ: { requests: 2, window: 1000 },
            GLOBAL: { requests: 5, window: 1000 }
          }
        }
      });
    });
    
    it('should enforce rate limits on API calls', function(done) {
      client.login(function(err) {
        if (err) return done(err);
        
        var requestCount = 0;
        var errors = 0;
        var validGuid = '12345678-1234-1234-1234-123456789abc';
        
        // Make multiple requests rapidly
        for (var i = 0; i < 5; i++) {
          client.lists.read({ guid: validGuid }, function(err, result) {
            requestCount++;
            if (err && err.code === 'RATE_LIMIT_EXCEEDED') {
              errors++;
            }
            
            // Check results after all requests complete
            if (requestCount === 5) {
              assert(errors > 0, 'Expected some requests to be rate limited');
              done();
            }
          });
        }
      });
    });
    
    it('should allow requests after rate limit window expires', function(done) {
      this.timeout(3000); // Increase timeout for this test
      
      client.login(function(err) {
        if (err) return done(err);
        
        var validGuid = '12345678-1234-1234-1234-123456789abc';
        
        // Use up rate limit
        client.lists.read({ guid: validGuid }, function(err1) {
          client.lists.read({ guid: validGuid }, function(err2) {
            client.lists.read({ guid: validGuid }, function(err3) {
              // This should be rate limited
              assert(err3);
              assert(err3.code === 'RATE_LIMIT_EXCEEDED');
              
              // Wait for rate limit window to expire
              setTimeout(function() {
                client.lists.read({ guid: validGuid }, function(err4, result) {
                  // This should succeed
                  assert(!err4);
                  assert(result);
                  done();
                });
              }, 1100);
            });
          });
        });
      });
    });
  });
  
  describe('Combined security features', function() {
    var client;
    
    beforeEach(function() {
      client = SharePointConnector({
        username: 'testuser',
        password: 'password',
        url: 'https://test.sharepoint.com',
        type: 'basic',
        rateLimitOptions: {
          enabled: true,
          limits: {
            READ: { requests: 1, window: 1000 }
          }
        }
      });
    });
    
    it('should apply input validation before rate limiting', function(done) {
      client.login(function(err) {
        if (err) return done(err);
        
        // First request with invalid GUID should fail validation
        client.lists.read({ guid: 'invalid-guid' }, function(err1) {
          assert(err1);
          assert(err1.message.indexOf('Invalid list GUID') !== -1);
          
          // Second request with valid GUID should succeed (rate limit not used up due to validation failure)
          client.lists.read({ guid: '12345678-1234-1234-1234-123456789abc' }, function(err2, result) {
            assert(!err2);
            assert(result);
            
            // Third request should be rate limited
            client.lists.read({ guid: '12345678-1234-1234-1234-123456789abc' }, function(err3) {
              assert(err3);
              assert(err3.code === 'RATE_LIMIT_EXCEEDED');
              done();
            });
          });
        });
      });
    });
  });
});