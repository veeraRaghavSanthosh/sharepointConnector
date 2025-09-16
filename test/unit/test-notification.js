var assert = require('assert'),
    nock = require('nock'),
    doRequestFactory = require('../../lib/util/doRequest');

exports.test_notification_success_cases = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      // Mock successful response
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = {
        d: {
          results: [{ Title: 'Test Item', Id: 1 }]
        }
      };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(!err, 'Should not return error for successful response');
    assert.ok(body, 'Should return processed body');
    assert.ok(Array.isArray(body), 'Should return array from d.results');
    assert.equal(body[0].Title, 'Test Item', 'Should preserve item data');
    done();
  });
};

exports.test_notification_success_with_pagination = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = {
        d: {
          results: [{ Title: 'Test Item', Id: 1 }],
          '__next': 'https://test.sharepoint.com/_api/web/lists?$skiptoken=abc123'
        }
      };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body, nextUrl) {
    assert.ok(!err, 'Should not return error for successful response');
    assert.ok(body, 'Should return processed body');
    assert.ok(nextUrl, 'Should return next URL for pagination');
    assert.equal(nextUrl, 'https://test.sharepoint.com/_api/web/lists?$skiptoken=abc123', 'Should return correct next URL');
    done();
  });
};

exports.test_notification_success_bytestream = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 200,
        headers: { 'content-type': 'application/octet-stream' },
        body: Buffer.from('file content')
      };
      callback(null, mockResponse, 'raw file data');
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/GetFileByServerRelativeUrl(\'/test.txt\')', function(err, response) {
    assert.ok(!err, 'Should not return error for successful file download');
    assert.ok(response, 'Should return raw response for file downloads');
    assert.equal(response.statusCode, 200, 'Should preserve response object');
    done();
  });
};

exports.test_notification_failure_cases = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      // Mock HTTP error
      callback(new Error('Network timeout'));
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(err, 'Should return error for network failures');
    assert.equal(err.message, 'Network timeout', 'Should preserve original error message');
    assert.ok(!body, 'Should not return body on error');
    done();
  });
};

exports.test_notification_failure_invalid_status_code = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 404,
        headers: {}
      };
      var mockBody = {
        error: {
          message: 'List not found'
        }
      };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists/invalid', function(err, body) {
    assert.ok(err, 'Should return error for 4xx status codes');
    assert.equal(err.message, 'List not found', 'Should extract error message from response body');
    assert.equal(err.statusCode, 404, 'Should include status code in error');
    assert.ok(err.body, 'Should include response body in error');
    done();
  });
};

exports.test_notification_failure_invalid_status_code_no_message = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 500,
        headers: {}
      };
      var mockBody = {};
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(err, 'Should return error for 5xx status codes');
    assert.equal(err.message, 'Invalid status code received: 500', 'Should use default error message when none provided');
    assert.equal(err.statusCode, 500, 'Should include status code in error');
    done();
  });
};

exports.test_notification_failure_no_http_client = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false
    // httpClient is missing
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(err, 'Should return error when httpClient is missing');
    assert.equal(err, 'Error finding login information - please call login() again', 'Should return login error message');
    assert.ok(!body, 'Should not return body on error');
    done();
  });
};

exports.test_notification_boundary_cases = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = null; // Empty response
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(!err, 'Should not return error for empty response');
    assert.ok(Array.isArray(body), 'Should return empty array for null body');
    assert.equal(body.length, 0, 'Should return empty array');
    done();
  });
};

exports.test_notification_boundary_string_url = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      assert.equal(opts.url, 'https://test.sharepoint.com/web/lists', 'Should construct full URL');
      assert.equal(opts.method, 'get', 'Should default to GET method');
      
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = { d: { Title: 'Test' } };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  // Test passing string URL instead of options object
  doRequest('/web/lists', function(err, body) {
    assert.ok(!err, 'Should handle string URL parameter');
    assert.equal(body.Title, 'Test', 'Should return processed body');
    done();
  });
};

exports.test_notification_boundary_pagination_type = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      assert.equal(opts.url, 'https://test.sharepoint.com/continuation/url', 'Should use host URL for pagination');
      assert.equal(opts.method, 'get', 'Should use GET method for pagination');
      
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = { d: { results: [{ Id: 2 }] } };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  // Test pagination request
  doRequest({ type: 'pagination', host: '/continuation/url' }, function(err, body) {
    assert.ok(!err, 'Should handle pagination requests');
    assert.ok(Array.isArray(body), 'Should return array for pagination results');
    done();
  });
};

exports.test_notification_boundary_verbose_mode = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: true, // Verbose mode enabled
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = {
        d: {
          results: [{ Title: 'Test', __metadata: { type: 'SP.List' } }]
        }
      };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(!err, 'Should not return error in verbose mode');
    assert.ok(body[0].__metadata, 'Should preserve metadata in verbose mode');
    assert.equal(body[0].__metadata.type, 'SP.List', 'Should preserve metadata fields');
    done();
  });
};

exports.test_notification_boundary_malformed_response = function(done) {
  var mockClient = {
    url: 'https://test.sharepoint.com',
    verbose: false,
    httpClient: function(client, opts, callback) {
      var mockResponse = {
        statusCode: 200,
        headers: {}
      };
      var mockBody = {
        // Missing 'd' property - malformed SharePoint response
        results: [{ Title: 'Test' }]
      };
      callback(null, mockResponse, mockBody);
    }
  };

  var doRequest = doRequestFactory(mockClient);
  
  doRequest('/web/lists', function(err, body) {
    assert.ok(!err, 'Should handle malformed responses gracefully');
    assert.ok(body, 'Should return the body as-is for malformed responses');
    assert.ok(body.results, 'Should preserve original structure');
    done();
  });
};

// Cleanup function for nock
exports.after = function(finish) {
  // Clean up any nock interceptors
  nock.cleanAll();
  return finish();
};