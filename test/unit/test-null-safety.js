var assert = require('assert');
var db = require('../../src/db/index.js');
var urlBuilder = require('../../lib/util/urlBuilderTools.js');

describe('Null Safety Tests', function() {
  
  describe('Database Module - validateInput', function() {
    it('should return empty string for null string input', function() {
      assert.strictEqual(db.validateInput(null, 'string'), '');
    });
    
    it('should return empty array for null array input', function() {
      assert.deepStrictEqual(db.validateInput(null, 'array'), []);
    });
    
    it('should return the original input if not null', function() {
      assert.strictEqual(db.validateInput('test', 'string'), 'test');
    });
  });
  
  describe('Database Module - safeTrim', function() {
    it('should not throw TypeError for null input', function() {
      assert.doesNotThrow(function() {
        db.safeTrim(null);
      });
    });
    
    it('should return empty string for null input', function() {
      assert.strictEqual(db.safeTrim(null), '');
    });
    
    it('should trim valid string input', function() {
      assert.strictEqual(db.safeTrim('  hello  '), 'hello');
    });
  });
  
  describe('URL Builder - augmentURL', function() {
    it('should throw descriptive error for null URL', function() {
      assert.throws(function() {
        urlBuilder.augmentURL(null);
      }, /URL parameter must be a non-null string/);
    });
    
    it('should handle valid URL without throwing TypeError', function() {
      assert.doesNotThrow(function() {
        urlBuilder.augmentURL('/api/test');
      });
    });
    
    it('should return valid URL string', function() {
      var result = urlBuilder.augmentURL('/api/test');
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result, '/api/test');
    });
  });
});