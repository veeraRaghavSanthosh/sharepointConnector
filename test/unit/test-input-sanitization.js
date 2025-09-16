/**
 * Unit tests for input sanitization functionality
 */

var assert = require('assert');
var inputSanitizer = require('../../lib/util/inputSanitizer');

describe('Input Sanitization', function() {
  
  describe('sanitizeString', function() {
    it('should throw error for dangerous script patterns', function() {
      var input = '<script>alert("xss")</script>';
      assert.throws(function() {
        inputSanitizer.sanitizeString(input, 100);
      }, /dangerous content/);
    });
    
    it('should sanitize safe content without errors', function() {
      var safeInput = 'Hello World 123';
      var result = inputSanitizer.sanitizeString(safeInput, 100);
      assert.strictEqual(result, safeInput);
    });
    
    it('should throw error for more dangerous patterns', function() {
      var dangerousInputs = [
        'javascript:alert("xss")',
        'SELECT * FROM users',
        'DROP TABLE users'
      ];
      
      dangerousInputs.forEach(function(input) {
        assert.throws(function() {
          inputSanitizer.sanitizeString(input, 100);
        }, /dangerous content/);
      });
    });
    
    it('should throw error when exceeding max length', function() {
      var longString = 'a'.repeat(101);
      assert.throws(function() {
        inputSanitizer.sanitizeString(longString, 100);
      }, /maximum length/);
    });
    
    it('should return empty string for null/undefined input', function() {
      assert.strictEqual(inputSanitizer.sanitizeString(null, 100), '');
      assert.strictEqual(inputSanitizer.sanitizeString(undefined, 100), '');
      assert.strictEqual(inputSanitizer.sanitizeString('', 100), '');
    });
  });
  
  describe('validateGuid', function() {
    it('should validate correct GUID format', function() {
      var validGuids = [
        '12345678-1234-1234-1234-123456789abc',
        'ABCDEF12-3456-7890-ABCD-EF1234567890'
      ];
      
      validGuids.forEach(function(guid) {
        var result = inputSanitizer.validateGuid(guid);
        assert.strictEqual(result, guid.toLowerCase());
      });
    });
    
    it('should throw error for invalid GUID format', function() {
      var invalidGuids = [
        'invalid-guid',
        '12345678-1234-1234-1234-12345678',
        '12345678-1234-1234-1234-123456789abcd',
        '',
        null
      ];
      
      invalidGuids.forEach(function(guid) {
        assert.throws(function() {
          inputSanitizer.validateGuid(guid);
        }, /Invalid GUID format|GUID must be a non-empty string/);
      });
    });
  });
  
  describe('validateFieldName', function() {
    it('should validate correct field names', function() {
      var validNames = [
        'FieldName',
        'field_name',
        'Field123',
        'f'
      ];
      
      validNames.forEach(function(name) {
        var result = inputSanitizer.validateFieldName(name);
        assert.strictEqual(result, name);
      });
    });
    
    it('should throw error for invalid field names', function() {
      var invalidNames = [
        '123field', // starts with number
        'field name', // contains space
        'field-name', // contains hyphen
        'a'.repeat(33), // too long
        '',
        null
      ];
      
      invalidNames.forEach(function(name) {
        assert.throws(function() {
          inputSanitizer.validateFieldName(name);
        }, /Invalid field name format|Field name must be a non-empty string/);
      });
    });
  });
  
  describe('validateListTitle', function() {
    it('should validate and sanitize correct list titles', function() {
      var validTitles = [
        'My List',
        'List_123',
        'Test-List'
      ];
      
      validTitles.forEach(function(title) {
        var result = inputSanitizer.validateListTitle(title);
        assert(result.length > 0);
      });
    });
    
    it('should throw error for invalid list titles', function() {
      var invalidTitles = [
        '<script>alert("xss")</script>',
        'a'.repeat(256), // too long
        '',
        null
      ];
      
      invalidTitles.forEach(function(title) {
        assert.throws(function() {
          inputSanitizer.validateListTitle(title);
        }, /Invalid list title format|List title must be a non-empty string|dangerous content|maximum length/);
      });
    });
  });
  
  describe('validateFilterFields', function() {
    it('should validate correct filter fields', function() {
      var validFilters = [
        ['{"field": "Title", "value": "Test"}'],
        [{"field": "Status", "value": "Active"}]
      ];
      
      validFilters.forEach(function(filters) {
        var result = inputSanitizer.validateFilterFields(filters);
        assert(Array.isArray(result));
        assert(result.length > 0);
      });
    });
    
    it('should throw error for invalid filter fields', function() {
      var invalidFilters = [
        ['{"invalid": "json"}'], // missing required fields
        [{"field": "123invalid", "value": "test"}], // invalid field name
        ['invalid json'], // malformed JSON
        'not an array' // not an array
      ];
      
      invalidFilters.forEach(function(filters) {
        assert.throws(function() {
          inputSanitizer.validateFilterFields(filters);
        }, /Invalid JSON|Filter field must have|Invalid field name|Filter fields must be an array/);
      });
    });
    
    it('should return null for null/undefined input', function() {
      assert.strictEqual(inputSanitizer.validateFilterFields(null), null);
      assert.strictEqual(inputSanitizer.validateFilterFields(undefined), null);
    });
  });
  
  describe('validateSelectFields', function() {
    it('should validate correct select fields', function() {
      var validFields = [
        ['Title', 'Status'],
        ['field1', 'field_2']
      ];
      
      validFields.forEach(function(fields) {
        var result = inputSanitizer.validateSelectFields(fields);
        assert(Array.isArray(result));
        assert.strictEqual(result.length, fields.length);
      });
    });
    
    it('should throw error for invalid select fields', function() {
      var invalidFields = [
        ['123invalid'], // invalid field name
        'not an array' // not an array
      ];
      
      invalidFields.forEach(function(fields) {
        assert.throws(function() {
          inputSanitizer.validateSelectFields(fields);
        }, /Invalid field name|Select fields must be an array/);
      });
    });
  });
  
  describe('validateTopValue', function() {
    it('should validate correct $top values', function() {
      var validValues = [
        '100',
        100,
        '5000'
      ];
      
      validValues.forEach(function(value) {
        var result = inputSanitizer.validateTopValue(value);
        assert(typeof result === 'string');
        assert(parseInt(result) > 0);
      });
    });
    
    it('should throw error for invalid $top values', function() {
      var invalidValues = [
        '0',
        '-1',
        'invalid',
        '99999'
      ];
      
      invalidValues.forEach(function(value) {
        assert.throws(function() {
          inputSanitizer.validateTopValue(value);
        }, /positive integer|exceeds maximum/);
      });
    });
    
    it('should return null for null/undefined input', function() {
      assert.strictEqual(inputSanitizer.validateTopValue(null), null);
      assert.strictEqual(inputSanitizer.validateTopValue(undefined), null);
    });
  });
  
  describe('validateClientParams', function() {
    it('should validate correct client parameters', function() {
      var validParams = {
        username: 'testuser',
        password: 'testpass',
        url: 'https://test.sharepoint.com',
        type: 'ntlm'
      };
      
      var result = inputSanitizer.validateClientParams(validParams);
      assert.strictEqual(result.username, validParams.username);
      assert.strictEqual(result.password, validParams.password);
      assert.strictEqual(result.url, validParams.url);
      assert.strictEqual(result.type, validParams.type);
    });
    
    it('should throw error for missing required parameters', function() {
      var invalidParams = [
        {}, // missing everything
        { username: 'test' }, // missing password and url
        { username: 'test', password: 'pass' }, // missing url
        { username: 'test', url: 'https://test.com' } // missing password
      ];
      
      invalidParams.forEach(function(params) {
        assert.throws(function() {
          inputSanitizer.validateClientParams(params);
        }, /required|must be a string/);
      });
    });
    
    it('should throw error for invalid URL format', function() {
      var invalidParams = {
        username: 'test',
        password: 'pass',
        url: 'invalid-url'
      };
      
      assert.throws(function() {
        inputSanitizer.validateClientParams(invalidParams);
      }, /Invalid URL format/);
    });
    
    it('should throw error for invalid authentication type', function() {
      var invalidParams = {
        username: 'test',
        password: 'pass',
        url: 'https://test.com',
        type: 'invalid-type'
      };
      
      assert.throws(function() {
        inputSanitizer.validateClientParams(invalidParams);
      }, /Invalid authentication type/);
    });
    
    it('should set default values for optional parameters', function() {
      var params = {
        username: 'test',
        password: 'pass',
        url: 'https://test.com'
      };
      
      var result = inputSanitizer.validateClientParams(params);
      assert.strictEqual(result.verbose, false);
      assert.strictEqual(result.fieldValuesAsText, false);
      assert.strictEqual(result.strictSSL, true);
    });
  });
});