// Setup validation tests for SharePoint connector
// Addresses TypeError when input is null

var assert = require('assert');
var sharepoint = require('../sharepointconnector.js');

// Test null input handling
exports.test_null_input_handling = function(done) {
  try {
    sharepoint(null);
    done(new Error('Should have thrown TypeError for null input'));
  } catch (error) {
    if (error instanceof TypeError) {
      console.log('✓ Properly throws TypeError for null input');
      done();
    } else {
      done(new Error('Expected TypeError but got: ' + error.constructor.name));
    }
  }
};

// Test undefined input handling  
exports.test_undefined_input_handling = function(done) {
  try {
    sharepoint(undefined);
    done(new Error('Should have thrown TypeError for undefined input'));
  } catch (error) {
    if (error instanceof TypeError) {
      console.log('✓ Properly throws TypeError for undefined input');
      done();
    } else {
      done(new Error('Expected TypeError but got: ' + error.constructor.name));
    }
  }
};