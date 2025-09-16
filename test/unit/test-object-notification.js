var assert = require('assert');
var _ = require('underscore');

// Mock the convenience functions
var conveniences = require('../../lib/util/conveniences');

describe('Object Notification Tests', function() {
  var mockCRUDL;
  var convenienceHandler;

  beforeEach(function() {
    // Mock CRUDL operations with notification callbacks
    mockCRUDL = {
      read: function(id, itemId, cb) {
        if (typeof itemId === 'function') {
          cb = itemId;
          itemId = null;
        }
        setTimeout(function() {
          if (id === 'error-list') {
            cb(new Error('List not found'));
          } else if (id === 'empty-list') {
            cb(null, []);
          } else {
            cb(null, itemId ? { Id: itemId, Title: 'Test Item' } : [{ Id: 1, Title: 'Test Item' }]);
          }
        }, 10);
      },

      create: function(parentId, newItem, cb) {
        setTimeout(function() {
          if (parentId === 'readonly-list') {
            cb(new Error('Access denied'));
          } else if (!newItem || !newItem.Title) {
            cb(new Error('Title is required'));
          } else {
            cb(null, { Id: Math.floor(Math.random() * 1000), Title: newItem.Title });
          }
        }, 10);
      },

      createItem: function(listId, newItem, cb) {
        this.create(listId, newItem, cb);
      },

      update: function(id, updatedObject, cb) {
        setTimeout(function() {
          if (id === 'readonly-item') {
            cb(new Error('Item is read-only'));
          } else if (!updatedObject) {
            cb(new Error('Update data required'));
          } else {
            cb(null, _.extend({ Id: id }, updatedObject));
          }
        }, 10);
      },

      del: function(parentId, itemId, cb) {
        if (typeof itemId === 'function') {
          cb = itemId;
          itemId = null;
        }
        setTimeout(function() {
          if (parentId === 'protected-list' || itemId === 'protected-item') {
            cb(new Error('Cannot delete protected item'));
          } else {
            cb(null, { deleted: true });
          }
        }, 10);
      }
    };

    convenienceHandler = conveniences(mockCRUDL);
  });

  describe('List Object Success Notifications', function() {
    it('should notify success for list read operation', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.read(function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have data');
        assert.strictEqual(data.length, 1, 'Should have one item');
        assert.strictEqual(data[0].Title, 'Test Item');
        done();
      });
    });

    it('should notify success for list update operation', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.update({ Title: 'Updated List' }, function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have updated data');
        assert.strictEqual(data.Title, 'Updated List');
        done();
      });
    });

    it('should notify success for list delete operation', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.delete(function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have deletion confirmation');
        assert.strictEqual(data.deleted, true);
        done();
      });
    });

    it('should notify success for list item creation', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.createItem({ Title: 'New Item' }, function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(data, 'Should have created item');
        assert.strictEqual(data.Title, 'New Item');
        assert(data.Id, 'Should have generated ID');
        done();
      });
    });
  });

  describe('Object Failure Notifications', function() {
    it('should notify error for list read failure', function(done) {
      var mockList = { Id: 'error-list', Title: 'Error List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.read(function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'List not found');
        assert.strictEqual(data, undefined, 'Should not have data');
        done();
      });
    });

    it('should notify error for protected list deletion', function(done) {
      var mockList = { Id: 'protected-list', Title: 'Protected List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.delete(function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Cannot delete protected item');
        done();
      });
    });

    it('should notify error for invalid item creation', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.createItem({}, function(err, data) {
        assert(err, 'Should have error');
        assert.strictEqual(err.message, 'Title is required');
        done();
      });
    });
  });

  describe('Boundary Case Notifications', function() {
    it('should handle missing list item ID', function() {
      var mockListItem = { Title: 'No ID Item' }; // Missing Id
      var enhancedItem = convenienceHandler('ListItem', mockListItem, 'parent-list');

      // Should return original item without enhancement when ID is missing
      assert.strictEqual(enhancedItem.read, undefined, 'Should not have read method without ID');
      assert.strictEqual(enhancedItem.delete, undefined, 'Should not have delete method without ID');
    });

    it('should handle empty list items collection', function(done) {
      var mockList = { Id: 'empty-list', Title: 'Empty List' };
      var enhancedList = convenienceHandler('List', mockList);

      enhancedList.read(function(err, data) {
        assert.strictEqual(err, null, 'Should not have error');
        assert(Array.isArray(data), 'Should have array data');
        assert.strictEqual(data.length, 0, 'Should have empty array');
        done();
      });
    });

    it('should handle null or undefined objects', function() {
      var nullResult = convenienceHandler('List', null);
      var undefinedResult = convenienceHandler('List', undefined);

      assert.strictEqual(nullResult, null, 'Should return null for null input');
      assert.strictEqual(undefinedResult, undefined, 'Should return undefined for undefined input');
    });

    it('should handle unknown object types', function() {
      var unknownObject = { Id: 1, Title: 'Unknown' };
      var result = convenienceHandler('UnknownType', unknownObject);

      assert.deepStrictEqual(result, unknownObject, 'Should return original object for unknown type');
    });
  });

  describe('Backward Compatibility for Objects', function() {
    it('should maintain del alias for delete method', function(done) {
      var mockList = { Id: 'test-list', Title: 'Test List' };
      var enhancedList = convenienceHandler('List', mockList);

      // Both delete and del should work
      assert(typeof enhancedList.delete === 'function', 'Should have delete method');
      assert(typeof enhancedList.del === 'function', 'Should have del method');
      assert.strictEqual(enhancedList.delete, enhancedList.del, 'del should be alias for delete');

      enhancedList.del(function(err, data) {
        assert.strictEqual(err, null, 'del alias should work');
        assert(data, 'Should have deletion confirmation');
        done();
      });
    });

    it('should maintain original object properties', function() {
      var originalList = { 
        Id: 'test-list', 
        Title: 'Test List',
        Description: 'Test Description',
        Created: '2023-01-01'
      };
      var enhancedList = convenienceHandler('List', originalList);

      // Original properties should be preserved
      assert.strictEqual(enhancedList.Id, 'test-list');
      assert.strictEqual(enhancedList.Title, 'Test List');
      assert.strictEqual(enhancedList.Description, 'Test Description');
      assert.strictEqual(enhancedList.Created, '2023-01-01');
    });
  });
});