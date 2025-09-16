/**
 * Unit tests for src/api/user.js
 * Tests null input validation and error handling
 */

var assert = require('assert');
var user = require('../../src/api/user');

describe('User API', function() {
  
  describe('validateInput', function() {
    it('should return false for null input', function() {
      assert.strictEqual(user.validateInput(null), false);
    });

    it('should return false for undefined input', function() {
      assert.strictEqual(user.validateInput(undefined), false);
    });

    it('should return true for valid object input', function() {
      assert.strictEqual(user.validateInput({}), true);
    });

    it('should return true for string input', function() {
      assert.strictEqual(user.validateInput('test'), true);
    });

    it('should return true for number input', function() {
      assert.strictEqual(user.validateInput(123), true);
    });

    it('should return true for boolean input', function() {
      assert.strictEqual(user.validateInput(true), true);
    });
  });

  describe('getUserInfo', function() {
    it('should return error when input is null', function(done) {
      user.getUserInfo(null, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is undefined', function(done) {
      user.getUserInfo(undefined, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is not an object', function(done) {
      user.getUserInfo('invalid', function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput must be an object');
        assert.strictEqual(err.code, 'INVALID_INPUT_TYPE');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return user info for valid object input', function(done) {
      var input = { id: '123', name: 'John Doe', email: 'john@example.com' };
      user.getUserInfo(input, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert.strictEqual(result.id, '123');
        assert.strictEqual(result.name, 'John Doe');
        assert.strictEqual(result.email, 'john@example.com');
        assert(result.timestamp);
        done();
      });
    });

    it('should return user info with defaults for empty object', function(done) {
      user.getUserInfo({}, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert.strictEqual(result.id, null);
        assert.strictEqual(result.name, 'Unknown User');
        assert.strictEqual(result.email, null);
        assert(result.timestamp);
        done();
      });
    });
  });

  describe('updateUser', function() {
    it('should return error when input is null', function(done) {
      user.updateUser(null, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is undefined', function(done) {
      user.updateUser(undefined, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is not an object', function(done) {
      user.updateUser('invalid', function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput must be an object');
        assert.strictEqual(err.code, 'INVALID_INPUT_TYPE');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when user ID is missing', function(done) {
      user.updateUser({ name: 'John' }, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: user ID is required for updates');
        assert.strictEqual(err.code, 'MISSING_USER_ID');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return updated user for valid input', function(done) {
      var input = { id: '123', name: 'John Updated', email: 'john.updated@example.com' };
      user.updateUser(input, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert.strictEqual(result.id, '123');
        assert.strictEqual(result.name, 'John Updated');
        assert.strictEqual(result.email, 'john.updated@example.com');
        assert(result.lastModified);
        done();
      });
    });
  });

  describe('createUser', function() {
    it('should return error when input is null', function(done) {
      user.createUser(null, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is undefined', function(done) {
      user.createUser(undefined, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput cannot be null or undefined');
        assert.strictEqual(err.code, 'INVALID_INPUT');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when input is not an object', function(done) {
      user.createUser('invalid', function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: userInput must be an object');
        assert.strictEqual(err.code, 'INVALID_INPUT_TYPE');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return error when user name is missing', function(done) {
      user.createUser({ email: 'test@example.com' }, function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Invalid input: user name is required for creation');
        assert.strictEqual(err.code, 'MISSING_USER_NAME');
        assert.strictEqual(result, undefined);
        done();
      });
    });

    it('should return new user for valid input', function(done) {
      var input = { name: 'Jane Doe', email: 'jane@example.com' };
      user.createUser(input, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert(result.id);
        assert.strictEqual(result.name, 'Jane Doe');
        assert.strictEqual(result.email, 'jane@example.com');
        assert(result.created);
        done();
      });
    });

    it('should return new user with null email when email is not provided', function(done) {
      var input = { name: 'Jane Doe' };
      user.createUser(input, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert(result.id);
        assert.strictEqual(result.name, 'Jane Doe');
        assert.strictEqual(result.email, null);
        assert(result.created);
        done();
      });
    });
  });

  describe('Edge cases and error handling', function() {
    it('should handle empty object gracefully in getUserInfo', function(done) {
      user.getUserInfo({}, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert.strictEqual(result.name, 'Unknown User');
        done();
      });
    });

    it('should handle objects with null properties in getUserInfo', function(done) {
      var input = { id: null, name: null, email: null };
      user.getUserInfo(input, function(err, result) {
        assert.strictEqual(err, null);
        assert(result);
        assert.strictEqual(result.id, null);
        assert.strictEqual(result.name, 'Unknown User');
        assert.strictEqual(result.email, null);
        done();
      });
    });

    it('should validate callback parameter existence', function() {
      // This test ensures the functions don't throw when callback is called
      assert.doesNotThrow(function() {
        user.getUserInfo(null, function() {});
      });
      
      assert.doesNotThrow(function() {
        user.updateUser(null, function() {});
      });
      
      assert.doesNotThrow(function() {
        user.createUser(null, function() {});
      });
    });
  });
});