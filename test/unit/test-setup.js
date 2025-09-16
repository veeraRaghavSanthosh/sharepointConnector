var assert = require('assert');

/**
 * Unit tests for SharePoint Connector setup and parameter validation
 * Tests the null input validation fix
 */

// Mock the dependencies to avoid requiring actual SharePoint connection
var originalRequire = require;
require = function(moduleName) {
  if (moduleName === 'request') {
    return function mockRequest() {};
  }
  if (moduleName.startsWith('./')) {
    // Mock internal modules that might require external dependencies
    if (moduleName.includes('auth/') || moduleName.includes('login') || moduleName.includes('objects/')) {
      return function mockModule() {
        return {};
      };
    }
  }
  return originalRequire.apply(this, arguments);
};

var clientModule = require('../../lib/client');

// Restore original require
require = originalRequire;

exports.test_null_input_validation = function(done) {
  try {
    clientModule(null);
    assert.fail('Should have thrown TypeError for null input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError for null input, got: ' + error.constructor.name);
    assert.ok(error.message.includes('null'), 'Error message should mention null, got: ' + error.message);
  }
  done();
};

exports.test_undefined_input_validation = function(done) {
  try {
    clientModule(undefined);
    assert.fail('Should have thrown TypeError for undefined input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError for undefined input, got: ' + error.constructor.name);
    assert.ok(error.message.includes('undefined'), 'Error message should mention undefined, got: ' + error.message);
  }
  done();
};

exports.test_non_object_input_validation = function(done) {
  var nonObjectInputs = ['string', 123, true, [], function() {}];
  
  nonObjectInputs.forEach(function(input, index) {
    try {
      clientModule(input);
      assert.fail('Should have thrown TypeError for input type: ' + typeof input);
    } catch (error) {
      assert.ok(error instanceof TypeError, 'Should throw TypeError for ' + typeof input + ' input, got: ' + error.constructor.name);
      assert.ok(error.message.includes('object'), 'Error message should mention object requirement, got: ' + error.message);
    }
  });
  
  done();
};

exports.test_empty_object_validation = function(done) {
  try {
    clientModule({});
    assert.fail('Should have thrown Error for empty object');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for missing required fields, got: ' + error.constructor.name);
    assert.ok(
      error.message.includes('username') || error.message.includes('password') || error.message.includes('URL'), 
      'Error message should mention missing required fields, got: ' + error.message
    );
  }
  done();
};

exports.test_missing_required_fields = function(done) {
  // Test missing username
  try {
    clientModule({
      password: 'test',
      url: 'https://test.com'
    });
    assert.fail('Should have thrown Error for missing username');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for missing username, got: ' + error.constructor.name);
  }

  // Test missing password
  try {
    clientModule({
      username: 'test',
      url: 'https://test.com'
    });
    assert.fail('Should have thrown Error for missing password');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for missing password, got: ' + error.constructor.name);
  }

  // Test missing URL
  try {
    clientModule({
      username: 'test',
      password: 'test'
    });
    assert.fail('Should have thrown Error for missing URL');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for missing URL, got: ' + error.constructor.name);
  }

  done();
};

exports.test_edge_cases = function(done) {
  // Test empty strings for required fields
  try {
    clientModule({
      username: '',
      password: 'test',
      url: 'https://test.com'
    });
    assert.fail('Should have thrown Error for empty username string');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for empty username string');
  }

  try {
    clientModule({
      username: 'test',
      password: '',
      url: 'https://test.com'
    });
    assert.fail('Should have thrown Error for empty password string');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for empty password string');
  }

  try {
    clientModule({
      username: 'test',
      password: 'test',
      url: ''
    });
    assert.fail('Should have thrown Error for empty URL string');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw Error for empty URL string');
  }

  done();
};