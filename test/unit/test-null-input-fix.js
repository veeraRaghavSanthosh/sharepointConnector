var assert = require('assert');
var sharepoint = require('../../sharepointconnector.js');

/**
 * Test suite to verify the null input TypeError fix
 * These tests ensure that the SharePoint connector properly handles null/undefined inputs
 * and maintains backward compatibility with existing functionality
 */

exports.test_null_input_fix = function(done) {
  console.log('Testing null input fix...');

  // Test 1: null input should throw TypeError (not property access error)
  try {
    sharepoint(null);
    assert.fail('Should throw TypeError for null input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError, got: ' + error.constructor.name);
    assert.ok(error.message.includes('null'), 'Error message should mention null');
    console.log('✓ Null input properly handled with TypeError');
  }

  // Test 2: undefined input should throw TypeError  
  try {
    sharepoint(undefined);
    assert.fail('Should throw TypeError for undefined input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError, got: ' + error.constructor.name);
    assert.ok(error.message.includes('undefined'), 'Error message should mention undefined');
    console.log('✓ Undefined input properly handled with TypeError');
  }

  // Test 3: string input should throw TypeError
  try {
    sharepoint('invalid');
    assert.fail('Should throw TypeError for string input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError, got: ' + error.constructor.name);
    assert.ok(error.message.includes('object'), 'Error message should mention object requirement');
    console.log('✓ String input properly rejected with TypeError');
  }

  // Test 4: number input should throw TypeError
  try {
    sharepoint(123);
    assert.fail('Should throw TypeError for number input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError, got: ' + error.constructor.name);
    console.log('✓ Number input properly rejected with TypeError');
  }

  // Test 5: empty object should throw Error (not TypeError) about missing fields
  try {
    sharepoint({});
    assert.fail('Should throw Error for empty object');
  } catch (error) {
    assert.ok(error instanceof Error && !(error instanceof TypeError), 
              'Should throw Error (not TypeError), got: ' + error.constructor.name);
    assert.ok(error.message.includes('username') || error.message.includes('password') || error.message.includes('URL'),
              'Error message should mention required fields');
    console.log('✓ Empty object properly handled with descriptive Error');
  }

  console.log('All null input fix tests passed!');
  done();
};

exports.test_backward_compatibility = function(done) {
  console.log('Testing backward compatibility...');

  // Test that valid configuration still works
  try {
    var validConfig = {
      username: 'testuser',
      password: 'testpass', 
      url: 'https://example.sharepoint.com',
      type: 'basic',
      strictSSL: false
    };

    var connector = sharepoint(validConfig);
    assert.ok(connector, 'Should create connector with valid config');
    assert.equal(connector.url, validConfig.url, 'Should preserve URL');
    assert.equal(connector.auth.username, validConfig.username, 'Should preserve username');
    assert.equal(connector.auth.password, validConfig.password, 'Should preserve password');
    assert.equal(connector.auth.type, validConfig.type, 'Should preserve auth type');
    console.log('✓ Valid configuration still works correctly');
  } catch (error) {
    return done(error);
  }

  // Test that optional fields still work
  try {
    var configWithOptionals = {
      username: 'user',
      password: 'pass',
      url: 'https://test.com',
      context: 'sites/test',
      workstation: 'WORKSTATION',
      domain: 'DOMAIN',
      federatedAuthUrl: 'https://fed.com'
    };

    var connector2 = sharepoint(configWithOptionals);
    assert.ok(connector2, 'Should create connector with optional fields');
    assert.equal(connector2.siteContext, configWithOptionals.context, 'Should preserve context');
    assert.equal(connector2.auth.workstation, configWithOptionals.workstation, 'Should preserve workstation');
    assert.equal(connector2.auth.domain, configWithOptionals.domain, 'Should preserve domain');
    console.log('✓ Optional configuration fields still work');
  } catch (error) {
    return done(error);
  }

  console.log('All backward compatibility tests passed!');
  done();
};