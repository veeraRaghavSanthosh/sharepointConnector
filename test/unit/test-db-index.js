/**
 * Unit tests for src/db/index.js
 * Tests for null input validation and error handling
 */

var assert = require('assert');
var db = require('../../src/db/index');

describe('Database Index Module', function() {
  
  describe('validateInput', function() {
    it('should return false for null input', function() {
      assert.strictEqual(db.validateInput(null), false);
    });
    
    it('should return false for undefined input', function() {
      assert.strictEqual(db.validateInput(undefined), false);
    });
    
    it('should return false for string input', function() {
      assert.strictEqual(db.validateInput('test'), false);
    });
    
    it('should return false for number input', function() {
      assert.strictEqual(db.validateInput(123), false);
    });
    
    it('should return true for valid object input', function() {
      assert.strictEqual(db.validateInput({}), true);
      assert.strictEqual(db.validateInput({test: 'value'}), true);
    });
    
    it('should return true for array input', function() {
      assert.strictEqual(db.validateInput([]), true);
      assert.strictEqual(db.validateInput([1, 2, 3]), true);
    });
  });
  
  describe('processQueryResult', function() {
    it('should throw TypeError when data is null', function() {
      assert.throws(function() {
        db.processQueryResult(null);
      }, TypeError, 'Input data must be a valid object, received: object');
    });
    
    it('should throw TypeError when data is undefined', function() {
      assert.throws(function() {
        db.processQueryResult(undefined);
      }, TypeError, 'Input data must be a valid object, received: undefined');
    });
    
    it('should throw TypeError when data is string', function() {
      assert.throws(function() {
        db.processQueryResult('test');
      }, TypeError, 'Input data must be a valid object, received: string');
    });
    
    it('should process valid object data', function() {
      var input = {
        items: [{id: 1}, {id: 2}],
        count: 2,
        metadata: {type: 'test'}
      };
      
      var result = db.processQueryResult(input);
      
      assert.deepEqual(result, {
        items: [{id: 1}, {id: 2}],
        count: 2,
        metadata: {type: 'test'}
      });
    });
    
    it('should provide default values for missing properties', function() {
      var input = {};
      var result = db.processQueryResult(input);
      
      assert.deepEqual(result, {
        items: [],
        count: 0,
        metadata: {}
      });
    });
    
    it('should apply transform function when provided', function() {
      var input = {
        items: [{id: 1}, {id: 2}]
      };
      var options = {
        transform: function(item) {
          return {id: item.id, transformed: true};
        }
      };
      
      var result = db.processQueryResult(input, options);
      
      assert.deepEqual(result.items, [
        {id: 1, transformed: true},
        {id: 2, transformed: true}
      ]);
    });
  });
  
  describe('safeProcessQueryResult', function() {
    it('should return error object for null input', function() {
      var result = db.safeProcessQueryResult(null);
      
      assert.deepEqual(result, {
        items: [],
        count: 0,
        metadata: {},
        error: 'Invalid input data: expected object, received null'
      });
    });
    
    it('should return error object for undefined input', function() {
      var result = db.safeProcessQueryResult(undefined);
      
      assert.deepEqual(result, {
        items: [],
        count: 0,
        metadata: {},
        error: 'Invalid input data: expected object, received undefined'
      });
    });
    
    it('should return error object for string input', function() {
      var result = db.safeProcessQueryResult('test');
      
      assert.deepEqual(result, {
        items: [],
        count: 0,
        metadata: {},
        error: 'Invalid input data: expected object, received string'
      });
    });
    
    it('should process valid input successfully', function() {
      var input = {
        items: [{id: 1}],
        count: 1,
        metadata: {type: 'test'}
      };
      
      var result = db.safeProcessQueryResult(input);
      
      assert.deepEqual(result, {
        items: [{id: 1}],
        count: 1,
        metadata: {type: 'test'}
      });
      assert.strictEqual(result.error, undefined);
    });
  });
  
  describe('transformListData', function() {
    it('should throw TypeError for null input', function() {
      assert.throws(function() {
        db.transformListData(null);
      }, TypeError, 'List data must be a valid object, received: null');
    });
    
    it('should throw TypeError for undefined input', function() {
      assert.throws(function() {
        db.transformListData(undefined);
      }, TypeError, 'List data must be a valid object, received: undefined');
    });
    
    it('should transform valid SharePoint list data', function() {
      var input = {
        Id: 'list-123',
        Title: 'Test List',
        Created: '2023-01-01',
        Modified: '2023-01-02',
        Items: [{id: 1}, {id: 2}]
      };
      
      var result = db.transformListData(input);
      
      assert.deepEqual(result, {
        id: 'list-123',
        title: 'Test List',
        created: '2023-01-01',
        modified: '2023-01-02',
        items: [{id: 1}, {id: 2}]
      });
    });
    
    it('should provide default values for missing properties', function() {
      var input = {};
      var result = db.transformListData(input);
      
      assert.deepEqual(result, {
        id: null,
        title: '',
        created: null,
        modified: null,
        items: []
      });
    });
  });
  
  describe('safeTransformListData', function() {
    it('should return error object for null input', function() {
      var result = db.safeTransformListData(null);
      
      assert.deepEqual(result, {
        id: null,
        title: '',
        created: null,
        modified: null,
        items: [],
        error: 'Invalid list data: expected object, received null'
      });
    });
    
    it('should return error object for undefined input', function() {
      var result = db.safeTransformListData(undefined);
      
      assert.deepEqual(result, {
        id: null,
        title: '',
        created: null,
        modified: null,
        items: [],
        error: 'Invalid list data: expected object, received undefined'
      });
    });
    
    it('should transform valid input successfully', function() {
      var input = {
        Id: 'list-456',
        Title: 'Another List',
        Items: [{id: 3}]
      };
      
      var result = db.safeTransformListData(input);
      
      assert.deepEqual(result, {
        id: 'list-456',
        title: 'Another List',
        created: null,
        modified: null,
        items: [{id: 3}]
      });
      assert.strictEqual(result.error, undefined);
    });
  });
});
