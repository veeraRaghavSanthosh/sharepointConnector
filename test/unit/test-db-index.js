var assert = require('assert');
var db = require('../../src/db/index');

describe('Database Module', function() {
    
    describe('validateInput', function() {
        it('should throw TypeError when input is null', function() {
            assert.throws(function() {
                db.validateInput(null);
            }, TypeError, 'input cannot be null');
        });
        
        it('should throw TypeError when input is undefined', function() {
            assert.throws(function() {
                db.validateInput(undefined);
            }, TypeError, 'input cannot be undefined');
        });
        
        it('should throw TypeError with custom field name when input is null', function() {
            assert.throws(function() {
                db.validateInput(null, 'customField');
            }, TypeError, 'customField cannot be null');
        });
        
        it('should return true for valid input', function() {
            assert.strictEqual(db.validateInput('valid string'), true);
            assert.strictEqual(db.validateInput(123), true);
            assert.strictEqual(db.validateInput({}), true);
            assert.strictEqual(db.validateInput([]), true);
            assert.strictEqual(db.validateInput(false), true);
        });
    });
    
    describe('processListData', function() {
        it('should throw TypeError when data is null', function() {
            assert.throws(function() {
                db.processListData(null);
            }, TypeError, 'data cannot be null');
        });
        
        it('should throw TypeError when data is undefined', function() {
            assert.throws(function() {
                db.processListData(undefined);
            }, TypeError, 'data cannot be undefined');
        });
        
        it('should throw TypeError when data is not an object', function() {
            assert.throws(function() {
                db.processListData('string');
            }, TypeError, 'data must be an object');
            
            assert.throws(function() {
                db.processListData(123);
            }, TypeError, 'data must be an object');
        });
        
        it('should process valid data object correctly', function() {
            var input = {
                title: '  Test Title  ',
                description: 'Test Description',
                count: 42,
                nullValue: null,
                undefinedValue: undefined
            };
            
            var result = db.processListData(input);
            
            assert.strictEqual(result.title, 'Test Title');
            assert.strictEqual(result.description, 'Test Description');
            assert.strictEqual(result.count, 42);
            assert.strictEqual(result.nullValue, null);
            assert.strictEqual(result.undefinedValue, null);
        });
        
        it('should handle empty object', function() {
            var result = db.processListData({});
            assert.deepEqual(result, {});
        });
    });
    
    describe('transformItem', function() {
        it('should throw TypeError when item is null', function() {
            assert.throws(function() {
                db.transformItem(null);
            }, TypeError, 'item cannot be null');
        });
        
        it('should throw TypeError when item is undefined', function() {
            assert.throws(function() {
                db.transformItem(undefined);
            }, TypeError, 'item cannot be undefined');
        });
        
        it('should throw TypeError when item is not an object', function() {
            assert.throws(function() {
                db.transformItem('string');
            }, TypeError, 'item must be an object');
        });
        
        it('should transform SharePoint item correctly', function() {
            var input = {
                Id: 123,
                Title: 'Test Item',
                Created: '2023-01-01T00:00:00Z',
                Modified: '2023-01-02T00:00:00Z',
                Author: {
                    Id: 456,
                    Title: 'John Doe',
                    EMail: 'john@example.com'
                },
                Editor: {
                    Id: 789,
                    Title: 'Jane Smith',
                    EMail: 'jane@example.com'
                }
            };
            
            var result = db.transformItem(input);
            
            assert.strictEqual(result.id, 123);
            assert.strictEqual(result.title, 'Test Item');
            assert.strictEqual(result.created, '2023-01-01T00:00:00Z');
            assert.strictEqual(result.modified, '2023-01-02T00:00:00Z');
            assert.deepEqual(result.author, {
                id: 456,
                title: 'John Doe',
                email: 'john@example.com'
            });
            assert.deepEqual(result.editor, {
                id: 789,
                title: 'Jane Smith',
                email: 'jane@example.com'
            });
        });
        
        it('should handle missing fields gracefully', function() {
            var input = {};
            var result = db.transformItem(input);
            
            assert.strictEqual(result.id, null);
            assert.strictEqual(result.title, '');
            assert.strictEqual(result.created, null);
            assert.strictEqual(result.modified, null);
            assert.strictEqual(result.author, null);
            assert.strictEqual(result.editor, null);
        });
        
        it('should handle null Author and Editor', function() {
            var input = {
                Id: 123,
                Author: null,
                Editor: undefined
            };
            var result = db.transformItem(input);
            
            assert.strictEqual(result.author, null);
            assert.strictEqual(result.editor, null);
        });
    });
    
    describe('safeGet', function() {
        it('should return default value when object is null', function() {
            assert.strictEqual(db.safeGet(null, 'path'), null);
            assert.strictEqual(db.safeGet(null, 'path', 'default'), 'default');
        });
        
        it('should return default value when object is undefined', function() {
            assert.strictEqual(db.safeGet(undefined, 'path'), null);
            assert.strictEqual(db.safeGet(undefined, 'path', 'default'), 'default');
        });
        
        it('should throw TypeError when path is not a string', function() {
            assert.throws(function() {
                db.safeGet({}, 123);
            }, TypeError, 'path must be a string');
        });
        
        it('should get nested property correctly', function() {
            var obj = {
                level1: {
                    level2: {
                        value: 'found'
                    }
                }
            };
            
            assert.strictEqual(db.safeGet(obj, 'level1.level2.value'), 'found');
        });
        
        it('should return default value for non-existent path', function() {
            var obj = {
                level1: {
                    level2: 'value'
                }
            };
            
            assert.strictEqual(db.safeGet(obj, 'level1.nonexistent'), null);
            assert.strictEqual(db.safeGet(obj, 'level1.nonexistent', 'default'), 'default');
        });
        
        it('should handle null values in path', function() {
            var obj = {
                level1: null
            };
            
            assert.strictEqual(db.safeGet(obj, 'level1.level2'), null);
            assert.strictEqual(db.safeGet(obj, 'level1.level2', 'default'), 'default');
        });
    });
    
    describe('formatQueryParams', function() {
        it('should return empty object when params is null', function() {
            var result = db.formatQueryParams(null);
            assert.deepEqual(result, {});
        });
        
        it('should return empty object when params is undefined', function() {
            var result = db.formatQueryParams(undefined);
            assert.deepEqual(result, {});
        });
        
        it('should throw TypeError when params is not an object after null check', function() {
            assert.throws(function() {
                db.formatQueryParams('string');
            }, TypeError, 'params must be an object');
        });
        
        it('should format query parameters correctly', function() {
            var input = {
                filter: '  title eq "test"  ',
                select: 'Id,Title',
                top: 10,
                nullValue: null,
                undefinedValue: undefined
            };
            
            var result = db.formatQueryParams(input);
            
            assert.strictEqual(result.filter, 'title eq "test"');
            assert.strictEqual(result.select, 'Id,Title');
            assert.strictEqual(result.top, 10);
            assert.strictEqual(result.nullValue, undefined);
            assert.strictEqual(result.undefinedValue, undefined);
        });
        
        it('should handle empty object', function() {
            var result = db.formatQueryParams({});
            assert.deepEqual(result, {});
        });
    });
});