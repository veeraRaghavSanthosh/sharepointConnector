var assert = require('assert');
var nock = require('nock');
var _ = require('underscore');

// Mock the SharePoint connector modules
var doRequest = require('../../lib/util/doRequest');
var makeSharepointResponsesLessAwful = require('../../lib/util/odata');
var verbosityFilter = require('../../lib/util/verbosityFilter');

describe('Notification System Tests', function() {
  var mockClient;
  var requestHandler;

  beforeEach(function() {
    // Setup mock client with required properties
    mockClient = {
      url: 'https://test.sharepoint.com',
      verbose: false,
      httpClient: null
    };
    
    // Clean nock before each test
    nock.cleanAll();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  describe('Success Notifications', function() {
    beforeEach(function() {
      // Mock successful HTTP client
      mockClient.httpClient = function(client, opts, cb) {
        setTimeout(function() {
          cb(null, {
            statusCode: 200,
            headers: {'content-type': 'application/json'}
          }, {
            d: {
              results: [
                {
                  Id: 1,
                  Title: 'Test Item',
                  __metadata: { type: 'SP.ListItem' }
                }
              ]
            }
          });
        }, 10);
      };
      
      requestHandler = doRequest(mockClient);
    });

    it('should notify success for valid GET request', function(done) {
      var opts = {
        url: '/_api/web/lists',
        method: 'get'
      };

      requestHandler(opts, function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        assert.strictEqual(data.length, 1, 'Should have one item');
        assert.strictEqual(data[0].Id, 1, 'Should have correct ID');
        assert.strictEqual(data[0].Title, 'Test Item', 'Should have correct title');
        done();
      });
    });

    it('should notify success for string URL parameter', function(done) {
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        assert.strictEqual(data.length, 1, 'Should have one item');
        done();
      });
    });

    it('should notify success with pagination data', function(done) {
      // Mock HTTP client with pagination response
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            results: [{ Id: 1, Title: 'Test Item' }],
            '__next': 'https://test.sharepoint.com/_api/web/lists?$skip=100'
          }
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data, nextUrl) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        assert(nextUrl, 'Should have next URL for pagination');
        assert.strictEqual(nextUrl, 'https://test.sharepoint.com/_api/web/lists?$skip=100');
        done();
      });
    });

    it('should notify success for file stream requests', function(done) {
      // Mock HTTP client for file stream
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/octet-stream'},
          body: 'file content'
        }, null);
      };

      requestHandler = doRequest(mockClient);
      var fileUrl = "/_api/web/GetFileByServerRelativeUrl('/Documents/test.pdf')";
      
      requestHandler(fileUrl, function(err, response) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(response, 'Should have response object');
        assert.strictEqual(response.statusCode, 200, 'Should have success status');
        done();
      });
    });

    it('should notify success for pagination type requests', function(done) {
      // Mock HTTP client
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            results: [{ Id: 2, Title: 'Page 2 Item' }]
          }
        });
      };

      requestHandler = doRequest(mockClient);
      var paginationOpts = {
        type: 'pagination',
        host: 'https://test.sharepoint.com/_api/web/lists?$skip=100'
      };

      requestHandler(paginationOpts, function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        assert.strictEqual(data.length, 1, 'Should have one item');
        assert.strictEqual(data[0].Id, 2, 'Should have correct ID');
        done();
      });
    });
  });

  describe('Failure Notifications', function() {
    it('should notify when HTTP client is not available', function(done) {
      mockClient.httpClient = null;
      requestHandler = doRequest(mockClient);

      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err, 'Error finding login information - please call login() again');
        assert.strictEqual(data, undefined, 'Should not have data');
        done();
      });
    });

    it('should notify on network errors', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        setTimeout(function() {
          cb(new Error('Network timeout'), null, null);
        }, 10);
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Network timeout');
        assert.strictEqual(data, undefined, 'Should not have data');
        done();
      });
    });

    it('should notify on HTTP error status codes', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 404,
          headers: {'content-type': 'application/json'}
        }, {
          error: {
            message: 'List not found'
          }
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'List not found');
        assert.strictEqual(err.statusCode, 404);
        assert(err.body, 'Should have error body');
        assert.strictEqual(data, undefined, 'Should not have data');
        done();
      });
    });

    it('should notify on authentication errors (401)', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 401,
          headers: {'content-type': 'application/json'}
        }, {
          error: {
            message: 'Access denied. You do not have permission to perform this action.'
          }
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Access denied. You do not have permission to perform this action.');
        assert.strictEqual(err.statusCode, 401);
        done();
      });
    });

    it('should notify on server errors (500)', function(done) {
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

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Internal server error');
        assert.strictEqual(err.statusCode, 500);
        done();
      });
    });

    it('should notify with generic message when no error details provided', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 403,
          headers: {'content-type': 'application/json'}
        }, {});
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Invalid status code received: 403');
        assert.strictEqual(err.statusCode, 403);
        done();
      });
    });
  });

  describe('Boundary Case Notifications', function() {
    it('should handle empty response body', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, null);
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert.strictEqual(data, null, 'Should have null data');
        done();
      });
    });

    it('should handle malformed JSON response', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, 'invalid json');
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error for malformed JSON');
        assert.strictEqual(data, 'invalid json', 'Should return raw data');
        done();
      });
    });

    it('should handle response without d property', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          results: [{ Id: 1, Title: 'Direct Result' }]
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        done();
      });
    });

    it('should handle very large response data', function(done) {
      var largeDataSet = [];
      for (var i = 0; i < 1000; i++) {
        largeDataSet.push({
          Id: i,
          Title: 'Item ' + i,
          __metadata: { type: 'SP.ListItem' }
        });
      }

      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            results: largeDataSet
          }
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        assert.strictEqual(data.length, 1000, 'Should handle large datasets');
        assert.strictEqual(data[999].Id, 999, 'Should have correct last item');
        done();
      });
    });

    it('should handle concurrent requests', function(done) {
      var completedRequests = 0;
      var totalRequests = 5;

      mockClient.httpClient = function(client, opts, cb) {
        setTimeout(function() {
          cb(null, {
            statusCode: 200,
            headers: {'content-type': 'application/json'}
          }, {
            d: {
              results: [{ Id: Math.random(), Title: 'Concurrent Item' }]
            }
          });
        }, Math.random() * 50);
      };

      requestHandler = doRequest(mockClient);

      function handleResponse(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        completedRequests++;
        if (completedRequests === totalRequests) {
          done();
        }
      }

      // Make multiple concurrent requests
      for (var i = 0; i < totalRequests; i++) {
        requestHandler('/_api/web/lists', handleResponse);
      }
    });

    it('should handle requests with special characters in URL', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            results: [{ Id: 1, Title: 'Special Char Item' }]
          }
        });
      };

      requestHandler = doRequest(mockClient);
      var specialUrl = "/_api/web/lists/getbytitle('Test%20List%20With%20Spaces')";
      
      requestHandler(specialUrl, function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        done();
      });
    });

    it('should handle timeout scenarios', function(done) {
      this.timeout(1000); // Set test timeout to 1 second

      mockClient.httpClient = function(client, opts, cb) {
        // Simulate a request that never completes
        // In real scenarios, this would be handled by the HTTP client timeout
        setTimeout(function() {
          cb(new Error('Request timeout'), null, null);
        }, 800);
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have timeout error');
        assert.strictEqual(err.message, 'Request timeout');
        done();
      });
    });

    it('should handle verbose mode correctly', function(done) {
      mockClient.verbose = true;
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, {
          statusCode: 200,
          headers: {'content-type': 'application/json'}
        }, {
          d: {
            results: [{
              Id: 1,
              Title: 'Verbose Item',
              __metadata: { type: 'SP.ListItem' },
              Created: '2023-01-01T00:00:00Z',
              Modified: '2023-01-01T00:00:00Z'
            }]
          }
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have response data');
        // In verbose mode, all fields should be preserved
        assert(data[0].Created, 'Should preserve Created field in verbose mode');
        assert(data[0].Modified, 'Should preserve Modified field in verbose mode');
        done();
      });
    });
  });

  describe('Callback Pattern Validation', function() {
    it('should ensure callback is called exactly once on success', function(done) {
      var callbackCount = 0;
      
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, { statusCode: 200 }, { d: { results: [] } });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        callbackCount++;
        assert.strictEqual(callbackCount, 1, 'Callback should be called exactly once');
        done();
      });
    });

    it('should ensure callback is called exactly once on error', function(done) {
      var callbackCount = 0;
      
      mockClient.httpClient = function(client, opts, cb) {
        cb(new Error('Test error'), null, null);
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        callbackCount++;
        assert.strictEqual(callbackCount, 1, 'Callback should be called exactly once on error');
        assert(err, 'Should have error');
        done();
      });
    });

    it('should maintain callback context and parameters', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, { statusCode: 200 }, { d: { results: [{ test: 'data' }] } });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data, nextUrl) {
        assert.strictEqual(arguments.length, 2, 'Should have correct number of callback arguments');
        assert.strictEqual(err, null, 'First argument should be null on success');
        assert(data, 'Second argument should be the data');
        assert.strictEqual(nextUrl, undefined, 'Third argument should be undefined when no pagination');
        done();
      });
    });
  });

  describe('Backward Compatibility', function() {
    it('should maintain legacy callback signature', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, { statusCode: 200 }, { d: { results: [] } });
      };

      requestHandler = doRequest(mockClient);
      
      // Test legacy usage patterns
      requestHandler('/_api/web/lists', function(err, data) {
        // Legacy code expects err, data signature
        assert.strictEqual(typeof err, 'object', 'Error should be object or null');
        assert(data !== undefined, 'Data should be defined');
        done();
      });
    });

    it('should support legacy options format', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        assert.strictEqual(opts.method, 'get', 'Should default to GET method');
        cb(null, { statusCode: 200 }, { d: { results: [] } });
      };

      requestHandler = doRequest(mockClient);
      
      // Legacy string URL format
      requestHandler('/_api/web/lists', function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        done();
      });
    });

    it('should preserve existing error object structure', function(done) {
      mockClient.httpClient = function(client, opts, cb) {
        cb(null, { statusCode: 404 }, { 
          error: { message: 'Not found' } 
        });
      };

      requestHandler = doRequest(mockClient);
      requestHandler('/_api/web/lists', function(err, data) {
        assert(err, 'Should have error');
        assert(err.message, 'Error should have message property');
        assert(err.statusCode, 'Error should have statusCode property');
        assert(err.body, 'Error should have body property');
        done();
      });
    });
  });
});