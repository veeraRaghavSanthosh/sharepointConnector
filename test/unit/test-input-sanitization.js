var assert = require('assert');
var inputSanitizer = require('../../lib/util/inputSanitizer');

describe('Input Sanitization', function() {
  
  describe('URL Sanitization', function() {
    it('should accept valid HTTPS URLs', function() {
      var validUrl = 'https://example.sharepoint.com';
      var result = inputSanitizer.sanitizeUrl(validUrl, false);
      assert.equal(result, validUrl);
    });

    it('should accept valid HTTP URLs', function() {
      var validUrl = 'http://example.sharepoint.com';
      var result = inputSanitizer.sanitizeUrl(validUrl, false);
      assert.equal(result, validUrl);
    });

    it('should accept relative URLs when allowed', function() {
      var relativeUrl = '/_api/web/lists';
      var result = inputSanitizer.sanitizeUrl(relativeUrl, true);
      assert.equal(result, relativeUrl);
    });

    it('should reject javascript: protocol', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('javascript:alert(1)', false);
      }, /Suspicious protocol detected/);
    });

    it('should reject data: protocol', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>', false);
      }, /Suspicious protocol detected/);
    });

    it('should reject vbscript: protocol', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('vbscript:msgbox(1)', false);
      }, /Suspicious protocol detected/);
    });

    it('should reject file: protocol', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('file:///etc/passwd', false);
      }, /Suspicious protocol detected/);
    });

    it('should reject relative URLs when not allowed', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('/_api/web/lists', false);
      }, /Absolute URL required/);
    });

    it('should reject excessive parent directory references', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('../../../../../../../etc/passwd', true);
      }, /Too many parent directory references/);
    });

    it('should reject empty or non-string URLs', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeUrl('', false);
      }, /URL must be a non-empty string/);

      assert.throws(function() {
        inputSanitizer.sanitizeUrl(null, false);
      }, /URL must be a non-empty string/);

      assert.throws(function() {
        inputSanitizer.sanitizeUrl(123, false);
      }, /URL must be a non-empty string/);
    });
  });

  describe('String Sanitization', function() {
    it('should return empty string for null/undefined', function() {
      assert.equal(inputSanitizer.sanitizeString(null), '');
      assert.equal(inputSanitizer.sanitizeString(undefined), '');
    });

    it('should convert non-strings to strings', function() {
      assert.equal(inputSanitizer.sanitizeString(123), '123');
      assert.equal(inputSanitizer.sanitizeString(true), 'true');
    });

    it('should reject strings exceeding max length', function() {
      var longString = 'a'.repeat(2000);
      assert.throws(function() {
        inputSanitizer.sanitizeString(longString, 1000);
      }, /exceeds maximum length/);
    });

    it('should remove null bytes and control characters', function() {
      var input = 'hello\x00\x01\x02world\x1F';
      var result = inputSanitizer.sanitizeString(input);
      assert.equal(result, 'helloworld');
    });

    it('should preserve newlines and tabs', function() {
      var input = 'hello\nworld\ttest';
      var result = inputSanitizer.sanitizeString(input);
      assert.equal(result, 'hello\nworld\ttest');
    });

    it('should remove script tags', function() {
      var input = 'hello<script>alert(1)</script>world';
      var result = inputSanitizer.sanitizeString(input);
      assert.equal(result, 'helloworld');
    });

    it('should remove javascript: protocol', function() {
      var input = 'javascript:alert(1)';
      var result = inputSanitizer.sanitizeString(input);
      assert.equal(result, 'alert(1)');
    });

    it('should remove event handlers', function() {
      var input = 'onclick=alert(1) onload=alert(2)';
      var result = inputSanitizer.sanitizeString(input);
      assert.equal(result, 'alert(1) alert(2)');
    });
  });

  describe('Authentication Sanitization', function() {
    it('should sanitize valid auth object', function() {
      var auth = {
        username: 'testuser',
        password: 'testpass',
        domain: 'testdomain',
        workstation: 'testworkstation',
        type: 'ntlm'
      };
      var result = inputSanitizer.sanitizeAuth(auth);
      assert.equal(result.username, 'testuser');
      assert.equal(result.password, 'testpass');
      assert.equal(result.domain, 'testdomain');
      assert.equal(result.workstation, 'testworkstation');
      assert.equal(result.type, 'ntlm');
    });

    it('should reject missing username', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeAuth({ password: 'test' });
      }, /Username is required/);
    });

    it('should reject missing password', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeAuth({ username: 'test' });
      }, /Password is required/);
    });

    it('should reject invalid auth types', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeAuth({
          username: 'test',
          password: 'test',
          type: 'invalid'
        });
      }, /Invalid authentication type/);
    });

    it('should reject empty username after sanitization', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeAuth({
          username: '\x00\x01\x02',
          password: 'test'
        });
      }, /Username cannot be empty after sanitization/);
    });

    it('should reject excessive password length', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeAuth({
          username: 'test',
          password: 'a'.repeat(1001)
        });
      }, /Password exceeds maximum length/);
    });
  });

  describe('Number Sanitization', function() {
    it('should return null for null/undefined/empty', function() {
      assert.equal(inputSanitizer.sanitizeNumber(null), null);
      assert.equal(inputSanitizer.sanitizeNumber(undefined), null);
      assert.equal(inputSanitizer.sanitizeNumber(''), null);
    });

    it('should convert string numbers to numbers', function() {
      assert.equal(inputSanitizer.sanitizeNumber('123'), 123);
      assert.equal(inputSanitizer.sanitizeNumber('123.45'), 123.45);
    });

    it('should reject non-numeric values', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeNumber('abc');
      }, /must be a valid number/);
    });

    it('should enforce minimum values', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeNumber(5, 10);
      }, /must be at least 10/);
    });

    it('should enforce maximum values', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeNumber(15, 1, 10);
      }, /must be at most 10/);
    });
  });

  describe('Filter Fields Sanitization', function() {
    it('should sanitize valid filter fields', function() {
      var filterFields = [
        { field: 'Title', value: 'Test' },
        { field: 'Status', value: 'Active' }
      ];
      var result = inputSanitizer.sanitizeFilterFields(filterFields);
      assert.equal(result.length, 2);
      assert.equal(result[0].field, 'Title');
      assert.equal(result[0].value, 'Test');
    });

    it('should return null for null input', function() {
      assert.equal(inputSanitizer.sanitizeFilterFields(null), null);
    });

    it('should reject non-array input', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeFilterFields('not an array');
      }, /must be an array/);
    });

    it('should reject too many filter fields', function() {
      var manyFields = [];
      for (var i = 0; i < 51; i++) {
        manyFields.push({ field: 'field' + i, value: 'value' + i });
      }
      assert.throws(function() {
        inputSanitizer.sanitizeFilterFields(manyFields);
      }, /Too many filter fields/);
    });

    it('should reject invalid filter field objects', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeFilterFields([{ field: 'test' }]);
      }, /must have both "field" and "value" properties/);
    });
  });

  describe('Fields Array Sanitization', function() {
    it('should sanitize valid fields array', function() {
      var fields = ['Title', 'Status', 'Created'];
      var result = inputSanitizer.sanitizeFieldsArray(fields);
      assert.deepEqual(result, fields);
    });

    it('should return null for null input', function() {
      assert.equal(inputSanitizer.sanitizeFieldsArray(null), null);
    });

    it('should reject non-array input', function() {
      assert.throws(function() {
        inputSanitizer.sanitizeFieldsArray('not an array');
      }, /must be an array/);
    });

    it('should reject too many fields', function() {
      var manyFields = [];
      for (var i = 0; i < 101; i++) {
        manyFields.push('field' + i);
      }
      assert.throws(function() {
        inputSanitizer.sanitizeFieldsArray(manyFields);
      }, /Too many fields specified/);
    });
  });
});