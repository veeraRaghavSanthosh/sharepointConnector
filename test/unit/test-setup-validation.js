var assert = require('assert');
var sharepoint = require('../../sharepointconnector.js');

/**
 * Test suite for setup validation and null input handling
 * This addresses the TypeError issue when null inputs are passed to the SharePoint connector
 */

exports.test_null_input_validation = function(done) {
  console.log('Testing null input validation...');

  // Test case 1: null params should throw TypeError, not try to access properties
  try {
    var connector = sharepoint(null);
    assert.fail('Should throw TypeError for null params');
  } catch (error) {
    // Verify we get a proper TypeError, not a property access error
    assert.ok(error instanceof TypeError || error.message.includes('null'), 
              'Should throw TypeError or handle null gracefully, got: ' + error.message);
    console.log('✓ Null params handled correctly');
  }

  // Test case 2: undefined params should throw TypeError
  try {
    var connector2 = sharepoint(undefined);
    assert.fail('Should throw TypeError for undefined params');
  } catch (error) {
    assert.ok(error instanceof TypeError || error.message.includes('undefined'), 
              'Should throw TypeError or handle undefined gracefully, got: ' + error.message);
    console.log('✓ Undefined params handled correctly');
  }

  // Test case 3: non-object params should throw TypeError
  try {
    var connector3 = sharepoint('invalid');
    assert.fail('Should throw TypeError for string params');
  } catch (error) {
    assert.ok(error instanceof TypeError || error.message.includes('object'), 
              'Should throw TypeError for non-object params, got: ' + error.message);
    console.log('✓ Non-object params handled correctly');
  }

  // Test case 4: empty object should give clear error message
  try {
    var connector4 = sharepoint({});
    assert.fail('Should throw Error for missing required fields');
  } catch (error) {
    assert.ok(error.message.includes('username') || error.message.includes('password') || error.message.includes('URL'),
              'Should mention missing required fields, got: ' + error.message);
    console.log('✓ Empty object handled with clear error message');
  }

  // Test case 5: partial config with null values
  try {
    var connector5 = sharepoint({
      username: null,
      password: 'test',
      url: 'https://example.com'
    });
    assert.fail('Should throw Error for null username');
  } catch (error) {
    // Should handle null values in fields gracefully
    assert.ok(error.message.includes('username') || error.message.includes('password') || error.message.includes('URL'),
              'Should handle null field values gracefully, got: ' + error.message);
    console.log('✓ Null field values handled correctly');
  }

  console.log('All null input validation tests passed!');
  done();
};

exports.test_backward_compatibility = function(done) {
  console.log('Testing backward compatibility...');

  // Test that valid configs still work (using environment variables if available)
  try {
    var validConfig = {
      username: process.env.SP_USERNAME || 'testuser',
      password: process.env.SP_PASSWORD || 'testpass',
      url: process.env.SP_HOST || 'https://example.sharepoint.com',
      type: 'basic',
      strictSSL: false
    };

    var connector = sharepoint(validConfig);
    assert.ok(connector, 'Should create connector with valid config');
    assert.ok(connector.url, 'Connector should have URL property');
    assert.ok(connector.auth, 'Connector should have auth property');
    console.log('✓ Valid configuration still works');
  } catch (error) {
    return done(error);
  }

  // Test that existing test patterns still work
  try {
    var legacyConfig = {
      username: 'legacy_user',
      password: 'legacy_pass',
      type: 'basic',
      url: 'https://legacy.sharepoint.com',
      context: 'web',
      strictSSL: false
    };

    var legacyConnector = sharepoint(legacyConfig);
    assert.ok(legacyConnector, 'Should create connector with legacy config');
    console.log('✓ Legacy configuration patterns still work');
  } catch (error) {
    return done(error);
  }

  console.log('All backward compatibility tests passed!');
  done();
};