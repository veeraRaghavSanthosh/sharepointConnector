var assert = require('assert');
var sharepointConnector = require('../sharepointconnector.js');

exports.test_null_input_validation = function(done) {
  try {
    sharepointConnector(null);
    assert.fail('Should have thrown TypeError for null input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError for null input');
    assert.ok(error.message.includes('null'), 'Error message should mention null');
  }
  done();
};

exports.test_undefined_input_validation = function(done) {
  try {
    sharepointConnector(undefined);
    assert.fail('Should have thrown TypeError for undefined input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError for undefined input');
    assert.ok(error.message.includes('undefined'), 'Error message should mention undefined');
  }
  done();
};

exports.test_non_object_input_validation = function(done) {
  try {
    sharepointConnector('string');
    assert.fail('Should have thrown TypeError for string input');
  } catch (error) {
    assert.ok(error instanceof TypeError, 'Should throw TypeError for non-object input');
    assert.ok(error.message.includes('object'), 'Error message should mention object requirement');
  }
  done();
};

exports.test_backward_compatibility = function(done) {
  var client = sharepointConnector({
    username: 'test',
    password: 'test',
    url: 'https://test.com'
  });
  assert.ok(client, 'Client should be created');
  assert.ok(client.login, 'Client should have login method');
  assert.ok(client.lists, 'Client should have lists object');
  assert.ok(client.listItems, 'Client should have listItems object');
  done();
};
