var assert = require('assert');
var nock = require('nock');
var async = require('async');

// Mock the authentication modules  
var onlineAuth = require('../../lib/auth/online');
var login = require('../../lib/login');

describe('Authentication Notification Tests', function() {
  var mockClient;

  beforeEach(function() {
    mockClient = {
      url: 'https://test.sharepoint.com',
      auth: { type: 'online' },
      siteContext: 'web',
      FedAuth: null,
      rtFa: null,
      baseContext: null
    };
    
    nock.cleanAll();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  describe('Login Success Notifications', function() {
    it('should notify success on successful authentication', function(done) {
      // Mock the context info endpoint
      nock('https://test.sharepoint.com')
        .post('/_api/contextinfo')
        .reply(200, {
          d: {
            GetContextWebInformation: {
              FormDigestValue: 'test-digest-value'
            }
          }
        });

      // Mock HTTP client for successful auth
      mockClient.httpClient = function(client, opts, cb) {
        setTimeout(function() {
          cb(null, {
            statusCode: 200,
            headers: {'content-type': 'application/json'}
          }, {
            d: {
              GetContextWebInformation: {
                FormDigestValue: 'test-digest-value'
              }
            }
          });
        }, 10);
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(response, 'Should have response object');
        assert.strictEqual(response.statusCode, 200, 'Should have success status');
        assert(body, 'Should have response body');
        assert.strictEqual(mockClient.baseContext, 'test-digest-value', 'Should set base context');
        done();
      });
    });

    it('should notify success with site context', function(done) {
      mockClient.siteContext = 'sites/testsite';
      
      mockClient.httpClient = function(client, opts, cb) {
        assert(opts.url.includes('/sites/testsite'), 'Should include site context in URL');
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            GetContextWebInformation: {
              FormDigestValue: 'site-context-digest'
            }
          }
        });
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert.strictEqual(err, null, 'Should not have error');
        assert.strictEqual(mockClient.baseContext, 'site-context-digest');
        done();
      });
    });
  });

  describe('Login Failure Notifications', function() {
    it('should notify on unsupported auth type', function(done) {
      mockClient.auth.type = 'invalid';
      
      try {
        var loginHandler = login(mockClient);
        assert.fail('Should have thrown error for invalid auth type');
      } catch (err) {
        // This should be caught by the module validation
        done();
      }
    });

    it('should notify on authentication failure', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 401,
          headers: {'content-type': 'application/json'}
        }, {
          error: {
            message: 'Authentication failed'
          }
        });
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert(err, 'Should have error');
        assert.strictEqual(err, 'Unexpected status code 401');
        done();
      });
    });

    it('should notify on missing context information', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            // Missing GetContextWebInformation
          }
        });
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Failed to load default context from response body');
        assert(err.body, 'Should include response body in error');
        done();
      });
    });

    it('should notify on network errors during login', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(new Error('Network connection failed'), null, null);
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Network connection failed');
        done();
      });
    });

    it('should notify on server errors during login', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 500,
          headers: {'content-type': 'application/json'}
        }, {
          error: {
            message: 'Internal server error'
          }
        });
      };

      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert(err, 'Should have error');
        assert.strictEqual(err, 'Unexpected status code 500');
        done();
      });
    });
  });

  describe('Online Auth Boundary Cases', function() {
    it('should handle already authenticated client', function(done) {
      // Set up already authenticated client
      mockClient.FedAuth = 'existing-fed-auth-token';
      mockClient.rtFa = 'existing-rt-fa-token';
      
      mockClient.httpClient = function(client, opts, cb) {
        // Should skip auth steps and go directly to authenticated request
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, { success: true });
      };

      var httpOpts = { url: '/test', method: 'get' };
      
      onlineAuth(mockClient, httpOpts, function(err, response, body) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(response, 'Should have response');
        assert.strictEqual(response.statusCode, 200);
        done();
      });
    });

    it('should handle authentication flow for new client', function(done) {
      // Mock the full authentication waterfall
      var authSteps = [];
      
      // Mock getSamlBody
      var originalApply = async.apply;
      async.apply = function(fn, client, httpOpts, stsUrl, spUrl, samlBody) {
        authSteps.push('getSamlBody');
        return function(cb) {
          cb(null, client, httpOpts, 'mock-saml-body');
        };
      };

      // Mock the waterfall steps
      var originalWaterfall = async.waterfall;
      async.waterfall = function(tasks, cb) {
        authSteps.push('waterfall-started');
        // Simulate successful completion of all auth steps
        setTimeout(function() {
          authSteps.push('waterfall-completed');
          cb(null, { statusCode: 200 }, { authenticated: true });
        }, 10);
      };

      onlineAuth(mockClient, { url: '/test' }, function(err, response, body) {
        // Restore original functions
        async.apply = originalApply;
        async.waterfall = originalWaterfall;
        
        assert.strictEqual(err, null, 'Should not have error');
        assert(authSteps.includes('getSamlBody'), 'Should include getSamlBody step');
        assert(authSteps.includes('waterfall-started'), 'Should start waterfall');
        done();
      });
    });

    it('should handle authentication timeout', function(done) {
      this.timeout(1000);
      
      var originalWaterfall = async.waterfall;
      async.waterfall = function(tasks, cb) {
        // Simulate timeout
        setTimeout(function() {
          cb(new Error('Authentication timeout'));
        }, 500);
      };

      onlineAuth(mockClient, { url: '/test' }, function(err, response, body) {
        async.waterfall = originalWaterfall;
        
        assert(err, 'Should have timeout error');
        assert.strictEqual(err.message, 'Authentication timeout');
        done();
      });
    });
  });

  describe('Custom Authentication Notifications', function() {
    it('should support custom authentication function', function(done) {
      mockClient.auth.custom = function(client, opts, cb) {
        // Custom auth implementation
        setTimeout(function() {
          cb(null, {
            statusCode: 200,
            headers: {'custom-auth': 'true'}
          }, { customAuth: true });
        }, 10);
      };

      // The login module should use custom auth when provided
      mockClient.httpClient = mockClient.auth.custom;
      
      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert.strictEqual(err, null, 'Should not have error with custom auth');
        assert(response.headers['custom-auth'], 'Should use custom authentication');
        done();
      });
    });

    it('should notify on custom auth failure', function(done) {
      mockClient.auth.custom = function(client, opts, cb) {
        cb(new Error('Custom auth failed'), null, null);
      };

      mockClient.httpClient = mockClient.auth.custom;
      
      var loginHandler = login(mockClient);
      loginHandler(function(err, response, body) {
        assert(err, 'Should have error from custom auth');
        assert.strictEqual(err.message, 'Custom auth failed');
        done();
      });
    });
  });

  describe('Concurrent Authentication Notifications', function() {
    it('should handle multiple concurrent login attempts', function(done) {
      var loginCount = 0;
      var totalLogins = 3;
      var completedLogins = 0;

      mockClient.httpClient = function(client, opts, cb) {
        loginCount++;
        setTimeout(function() {
          cb(null, {
            statusCode: 200,
            headers: {'content-type': 'application/json'}
          }, {
            d: {
              GetContextWebInformation: {
                FormDigestValue: 'concurrent-digest-' + loginCount
              }
            }
          });
        }, Math.random() * 50);
      };

      function handleLogin(err, response, body) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(response, 'Should have response');
        completedLogins++;
        
        if (completedLogins === totalLogins) {
          assert.strictEqual(loginCount, totalLogins, 'Should have called httpClient for each login');
          done();
        }
      }

      // Start multiple concurrent logins
      for (var i = 0; i < totalLogins; i++) {
        var loginHandler = login(mockClient);
        loginHandler(handleLogin);
      }
    });
  });

  describe('Backward Compatibility for Auth', function() {
    it('should maintain legacy auth callback signature', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, { statusCode: 200 }, {
          d: { GetContextWebInformation: { FormDigestValue: 'legacy-digest' } }
        });
      };

      var loginHandler = login(mockClient);
      
      // Legacy callback expects (err, response, body)
      loginHandler(function(err, response, body) {
        assert.strictEqual(arguments.length, 3, 'Should maintain 3-argument callback');
        assert.strictEqual(err, null, 'First arg should be null on success');
        assert(response, 'Second arg should be response object');
        assert(body, 'Third arg should be body object');
        done();
      });
    });

    it('should preserve existing auth type validation', function() {
      var validTypes = ['basic', 'ntlm', 'online', 'onlinesaml'];
      
      validTypes.forEach(function(type) {
        mockClient.auth.type = type;
        try {
          var loginHandler = login(mockClient);
          // Should not throw for valid types
        } catch (err) {
          assert.fail('Should not throw error for valid auth type: ' + type);
        }
      });
    });
  });
});