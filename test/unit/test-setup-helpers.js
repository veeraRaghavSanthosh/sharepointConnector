/**
 * Unit tests for setup.test.js helper functions
 * 
 * These tests verify the functionality of the extracted helper functions
 * and ensure they handle edge cases properly.
 */

var assert = require('assert');
var setupHelpers = require('../../tests/setup.test');

// Mock objects for testing
var mockApi = {
  done: function() { this.doneCalled = true; },
  doneCalled: false
};

var mockIntegrationTest = {
  testFunction: function() { return 'test'; }
};

// Test createAfterHook function
exports.test_createAfterHook_single_api = function(done) {
  var api = { done: function() { done(); } };
  var afterHook = setupHelpers.createAfterHook(api, function() {});
  afterHook();
};

exports.test_createAfterHook_multiple_apis = function() {
  var api1 = { done: function() { this.called = true; }, called: false };
  var api2 = { done: function() { this.called = true; }, called: false };
  var finishCalled = false;
  
  var afterHook = setupHelpers.createAfterHook([api1, api2], function() {
    finishCalled = true;
  });
  
  afterHook();
  
  assert.ok(api1.called, 'First API instance done should be called');
  assert.ok(api2.called, 'Second API instance done should be called');
  assert.ok(finishCalled, 'Finish callback should be called');
};

exports.test_createAfterHook_null_api = function() {
  var finishCalled = false;
  var afterHook = setupHelpers.createAfterHook(null, function() {
    finishCalled = true;
  });
  
  // Should not throw an error
  assert.doesNotThrow(function() {
    afterHook();
  });
  
  assert.ok(finishCalled, 'Finish callback should still be called');
};

exports.test_createAfterHook_no_done_method = function() {
  var apiWithoutDone = { someOtherMethod: function() {} };
  var finishCalled = false;
  
  var afterHook = setupHelpers.createAfterHook(apiWithoutDone, function() {
    finishCalled = true;
  });
  
  // Should not throw an error
  assert.doesNotThrow(function() {
    afterHook();
  });
  
  assert.ok(finishCalled, 'Finish callback should be called even without done method');
};

// Test createUnitTestModule function
exports.test_createUnitTestModule_basic = function() {
  var apiFactory = function() { return mockApi; };
  var result = setupHelpers.createUnitTestModule(mockIntegrationTest, apiFactory);
  
  assert.ok(result.testFunction, 'Should preserve integration test functions');
  assert.ok(typeof result.after === 'function', 'Should add after hook');
  assert.equal(result.testFunction(), 'test', 'Should preserve original functionality');
};

exports.test_createUnitTestModule_multiple_factories = function() {
  var apiFactory1 = function() { return { done: function() {} }; };
  var apiFactory2 = function() { return { done: function() {} }; };
  
  var result = setupHelpers.createUnitTestModule(mockIntegrationTest, [apiFactory1, apiFactory2]);
  
  assert.ok(typeof result.after === 'function', 'Should create after hook for multiple factories');
};

exports.test_createUnitTestModule_direct_api = function() {
  var directApiInstance = { done: function() {} };
  
  assert.doesNotThrow(function() {
    setupHelpers.createUnitTestModule(mockIntegrationTest, directApiInstance);
  }, 'Should handle direct API instances');
};

// Test createApiMock function
exports.test_createApiMock_list = function() {
  var mock = setupHelpers.createApiMock('list');
  assert.ok(mock, 'Should return a mock object');
  assert.ok(typeof mock.done === 'function', 'Mock should have done method');
};

exports.test_createApiMock_create = function() {
  var mock = setupHelpers.createApiMock('create');
  assert.ok(mock, 'Should return a mock object');
  assert.ok(typeof mock.done === 'function', 'Mock should have done method');
};

exports.test_createApiMock_listitems = function() {
  var mock = setupHelpers.createApiMock('listitems');
  assert.ok(mock, 'Should return a mock object');
  assert.ok(typeof mock.done === 'function', 'Mock should have done method');
};

exports.test_createApiMock_unknown_type = function() {
  var mock = setupHelpers.createApiMock('unknown');
  assert.ok(mock, 'Should return a fallback mock object');
  assert.ok(typeof mock.done === 'function', 'Fallback mock should have done method');
  
  // Should not throw when calling done on fallback
  assert.doesNotThrow(function() {
    mock.done();
  });
};

// Test validateTestEnvironment function
exports.test_validateTestEnvironment = function() {
  var result = setupHelpers.helpers.validateTestEnvironment();
  assert.ok(result, 'Should return result object');
  assert.ok(result.hasOwnProperty('status'), 'Should have status property');
  assert.ok(result.hasOwnProperty('issues'), 'Should have issues property');
  assert.ok(Array.isArray(result.issues), 'Issues should be an array');
  assert.ok(['valid', 'invalid'].indexOf(result.status) !== -1, 'Status should be valid or invalid');
};

// Test safeCleanup function
exports.test_safeCleanup_basic = function() {
  var cleanupCalled = false;
  var callbackCalled = false;
  
  setupHelpers.helpers.safeCleanup(
    function() { cleanupCalled = true; },
    function() { callbackCalled = true; }
  );
  
  assert.ok(cleanupCalled, 'Cleanup function should be called');
  assert.ok(callbackCalled, 'Callback should be called');
};

exports.test_safeCleanup_error_handling = function() {
  var callbackCalled = false;
  
  assert.doesNotThrow(function() {
    setupHelpers.helpers.safeCleanup(
      function() { throw new Error('Cleanup error'); },
      function() { callbackCalled = true; }
    );
  }, 'Should not throw on cleanup errors');
  
  assert.ok(callbackCalled, 'Callback should still be called after cleanup error');
};

exports.test_safeCleanup_null_cleanup = function() {
  var callbackCalled = false;
  
  assert.doesNotThrow(function() {
    setupHelpers.helpers.safeCleanup(
      null,
      function() { callbackCalled = true; }
    );
  }, 'Should handle null cleanup function');
  
  assert.ok(callbackCalled, 'Callback should be called even without cleanup function');
};

exports.test_safeCleanup_null_callback = function() {
  assert.doesNotThrow(function() {
    setupHelpers.helpers.safeCleanup(
      function() { /* cleanup */ },
      null
    );
  }, 'Should handle null callback');
};

// Test TestConfig
exports.test_config_timeout = function() {
  assert.ok(setupHelpers.config.DEFAULT_TIMEOUT, 'Should have default timeout');
  assert.equal(typeof setupHelpers.config.DEFAULT_TIMEOUT, 'number', 'Timeout should be a number');
  assert.ok(setupHelpers.config.DEFAULT_TIMEOUT > 0, 'Timeout should be positive');
};

exports.test_config_headers = function() {
  var headers = setupHelpers.config.SHAREPOINT_HEADERS;
  assert.ok(headers, 'Should have SharePoint headers');
  assert.ok(headers['Content-Type'], 'Should have Content-Type header');
  assert.ok(headers['Accept'], 'Should have Accept header');
};

exports.test_config_environment = function() {
  var config = setupHelpers.config.getEnvironmentConfig();
  assert.ok(config, 'Should return config object');
  assert.ok(config.username, 'Should have username (with fallback)');
  assert.ok(config.password, 'Should have password (with fallback)');
  assert.ok(config.type, 'Should have type (with fallback)');
  assert.ok(config.url, 'Should have url (with fallback)');
  assert.ok(config.context, 'Should have context (with fallback)');
  assert.equal(typeof config.strictSSL, 'boolean', 'strictSSL should be boolean');
};

// Test backward compatibility
exports.test_backward_compatibility = function() {
  assert.ok(typeof setupHelpers.createAfterHook === 'function', 'Should export createAfterHook');
  assert.ok(typeof setupHelpers.createUnitTestModule === 'function', 'Should export createUnitTestModule');
  assert.ok(typeof setupHelpers.createApiMock === 'function', 'Should export createApiMock');
  
  var api = { done: function() { this.called = true; }, called: false };
  var afterHook = setupHelpers.createAfterHook(api, function() {});
  
  afterHook();
  assert.ok(api.called, 'Backward compatibility export should work the same');
};

// Test edge cases integration
exports.test_edge_cases_integration = function() {
  // Simulate a complex scenario with multiple API types and potential failures
  var apiFactories = [
    function() { return setupHelpers.createApiMock('unknown'); }, // Edge case: unknown type
    function() { return null; } // Edge case: factory returns null
  ];
  
  assert.doesNotThrow(function() {
    var testModule = setupHelpers.createUnitTestModule(mockIntegrationTest, apiFactories);
    testModule.after(); // Should handle all edge cases gracefully
  }, 'Should handle complex edge case scenario');
};

// Cleanup after all tests
exports.after = function(done) {
  // No special cleanup needed for these tests
  done();
};