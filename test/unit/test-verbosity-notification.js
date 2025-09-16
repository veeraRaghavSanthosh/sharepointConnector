var assert = require('assert');
var _ = require('underscore');

// Mock the verbosity filter
var verbosityFilter = require('../../lib/util/verbosityFilter');

describe('Verbosity Filter Notification Tests', function() {
  var mockClient;
  var filterHandler;

  beforeEach(function() {
    mockClient = {
      verbose: false
    };
    filterHandler = verbosityFilter(mockClient);
  });

  describe('Success Notifications with Filtering', function() {
    it('should notify success with filtered single item', function() {
      var mockItem = {
        Id: 1,
        Title: 'Test Item',
        Created: '2023-01-01T00:00:00Z',
        Modified: '2023-01-01T00:00:00Z',
        __metadata: {
          type: 'SP.ListItem'
        }
      };

      var result = filterHandler(mockItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Test Item', 'Should preserve Title');
      // Verbose fields should be filtered out when verbose is false
      assert.strictEqual(result.__metadata, undefined, 'Should filter out metadata');
    });

    it('should notify success with filtered array of items', function() {
      var mockItems = [
        {
          Id: 1,
          Title: 'Item 1',
          Created: '2023-01-01T00:00:00Z',
          __metadata: { type: 'SP.ListItem' }
        },
        {
          Id: 2,
          Title: 'Item 2',
          Modified: '2023-01-01T00:00:00Z',
          __metadata: { type: 'SP.ListItem' }
        }
      ];

      var result = filterHandler(mockItems, '/_api/web/lists/items');
      
      assert(Array.isArray(result), 'Should return array');
      assert.strictEqual(result.length, 2, 'Should have both items');
      assert.strictEqual(result[0].Id, 1, 'Should preserve first item Id');
      assert.strictEqual(result[1].Id, 2, 'Should preserve second item Id');
      // Metadata should be filtered out
      assert.strictEqual(result[0].__metadata, undefined, 'Should filter metadata from first item');
      assert.strictEqual(result[1].__metadata, undefined, 'Should filter metadata from second item');
    });

    it('should notify success in verbose mode without filtering', function() {
      mockClient.verbose = true;
      filterHandler = verbosityFilter(mockClient);

      var mockItem = {
        Id: 1,
        Title: 'Test Item',
        Created: '2023-01-01T00:00:00Z',
        Modified: '2023-01-01T00:00:00Z',
        __metadata: {
          type: 'SP.ListItem',
          uri: 'https://test.sharepoint.com/_api/web/lists/items(1)'
        }
      };

      var result = filterHandler(mockItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Test Item', 'Should preserve Title');
      assert.strictEqual(result.Created, '2023-01-01T00:00:00Z', 'Should preserve Created in verbose mode');
      assert.strictEqual(result.Modified, '2023-01-01T00:00:00Z', 'Should preserve Modified in verbose mode');
      assert(result.__metadata, 'Should preserve metadata in verbose mode');
      assert.strictEqual(result.__metadata.type, 'SP.ListItem', 'Should preserve metadata type');
    });
  });

  describe('Boundary Case Notifications', function() {
    it('should handle items without metadata type', function() {
      var mockItem = {
        Id: 1,
        Title: 'No Metadata Item',
        Created: '2023-01-01T00:00:00Z'
      };

      var result = filterHandler(mockItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'No Metadata Item', 'Should preserve Title');
      // Should apply default filtering
      assert.strictEqual(result.Created, undefined, 'Should filter Created by default');
    });

    it('should handle empty arrays', function() {
      var result = filterHandler([], '/_api/web/lists/items');
      
      assert(Array.isArray(result), 'Should return array');
      assert.strictEqual(result.length, 0, 'Should have empty array');
    });

    it('should handle null and undefined items', function() {
      var nullResult = filterHandler(null, '/_api/web/lists/items');
      var undefinedResult = filterHandler(undefined, '/_api/web/lists/items');
      
      assert.strictEqual(nullResult, null, 'Should return null for null input');
      assert.strictEqual(undefinedResult, undefined, 'Should return undefined for undefined input');
    });

    it('should handle items with SP. prefix in type', function() {
      var mockItem = {
        Id: 1,
        Title: 'SP Prefixed Item',
        __metadata: {
          type: 'SP.Data.ListItem'
        }
      };

      var result = filterHandler(mockItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      // Should handle SP. prefix removal
      assert.strictEqual(result.__metadata, undefined, 'Should filter metadata');
    });

    it('should handle array with type override from URL', function() {
      var mockItems = [
        { Id: 1, Title: 'Item 1', Created: '2023-01-01' },
        { Id: 2, Title: 'Item 2', Modified: '2023-01-02' }
      ];

      var result = filterHandler(mockItems, '/_api/web/lists/getbytitle(\'TestList\')/items');
      
      assert(Array.isArray(result), 'Should return array');
      assert.strictEqual(result.length, 2, 'Should have both items');
      // Should apply filtering based on URL context
      assert.strictEqual(result[0].Created, undefined, 'Should filter verbose fields');
      assert.strictEqual(result[1].Modified, undefined, 'Should filter verbose fields');
    });

    it('should handle large datasets efficiently', function() {
      var largeDataset = [];
      for (var i = 0; i < 1000; i++) {
        largeDataset.push({
          Id: i,
          Title: 'Item ' + i,
          Created: '2023-01-01T00:00:00Z',
          Modified: '2023-01-01T00:00:00Z',
          __metadata: { type: 'SP.ListItem' }
        });
      }

      var result = filterHandler(largeDataset, '/_api/web/lists/items');
      
      assert(Array.isArray(result), 'Should return array');
      assert.strictEqual(result.length, 1000, 'Should handle large datasets');
      assert.strictEqual(result[0].Id, 0, 'Should preserve first item Id');
      assert.strictEqual(result[999].Id, 999, 'Should preserve last item Id');
      // Should filter verbose fields from all items
      assert.strictEqual(result[0].__metadata, undefined, 'Should filter metadata from all items');
      assert.strictEqual(result[999].__metadata, undefined, 'Should filter metadata from all items');
    });

    it('should handle mixed item types in array', function() {
      var mixedItems = [
        {
          Id: 1,
          Title: 'List Item',
          __metadata: { type: 'SP.ListItem' }
        },
        {
          Id: 2,
          Title: 'List',
          __metadata: { type: 'SP.List' }
        },
        {
          Id: 3,
          Title: 'Field',
          __metadata: { type: 'SP.Field' }
        }
      ];

      var result = filterHandler(mixedItems, '/_api/web/lists');
      
      assert(Array.isArray(result), 'Should return array');
      assert.strictEqual(result.length, 3, 'Should have all items');
      // Should apply appropriate filtering to each item type
      result.forEach(function(item, index) {
        assert(item.Id, 'Should preserve Id for item ' + index);
        assert(item.Title, 'Should preserve Title for item ' + index);
        assert.strictEqual(item.__metadata, undefined, 'Should filter metadata for item ' + index);
      });
    });
  });

  describe('Error Handling in Filter', function() {
    it('should handle malformed metadata gracefully', function() {
      var malformedItem = {
        Id: 1,
        Title: 'Malformed Item',
        __metadata: 'invalid-metadata-string'
      };

      // Should not throw error
      var result = filterHandler(malformedItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Malformed Item', 'Should preserve Title');
    });

    it('should handle circular references safely', function() {
      var circularItem = {
        Id: 1,
        Title: 'Circular Item'
      };
      circularItem.self = circularItem; // Create circular reference

      // Should not cause infinite loop
      var result = filterHandler(circularItem, '/_api/web/lists/items');
      
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Circular Item', 'Should preserve Title');
    });
  });

  describe('Performance Notifications', function() {
    it('should handle concurrent filtering operations', function(done) {
      var completedOps = 0;
      var totalOps = 5;
      var testData = {
        Id: 1,
        Title: 'Concurrent Test Item',
        Created: '2023-01-01T00:00:00Z',
        __metadata: { type: 'SP.ListItem' }
      };

      function checkCompletion() {
        completedOps++;
        if (completedOps === totalOps) {
          done();
        }
      }

      // Run multiple concurrent filtering operations
      for (var i = 0; i < totalOps; i++) {
        setTimeout(function() {
          var result = filterHandler(testData, '/_api/web/lists/items');
          assert(result, 'Should have result');
          assert.strictEqual(result.Id, 1, 'Should preserve Id');
          checkCompletion();
        }, Math.random() * 10);
      }
    });
  });

  describe('Backward Compatibility for Verbosity Filter', function() {
    it('should maintain existing filter behavior', function() {
      var legacyItem = {
        Id: 1,
        Title: 'Legacy Item',
        Created: '2023-01-01T00:00:00Z',
        Modified: '2023-01-01T00:00:00Z',
        Author: { Id: 1, Title: 'Test User' },
        __metadata: {
          type: 'SP.ListItem',
          uri: 'https://test.sharepoint.com/_api/web/lists/items(1)'
        }
      };

      var result = filterHandler(legacyItem, '/_api/web/lists/items');
      
      // Should maintain backward compatibility with existing filtering rules
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Legacy Item', 'Should preserve Title');
      // Standard verbose fields should be filtered
      assert.strictEqual(result.Created, undefined, 'Should filter Created');
      assert.strictEqual(result.Modified, undefined, 'Should filter Modified');
      assert.strictEqual(result.__metadata, undefined, 'Should filter metadata');
    });

    it('should preserve verbose mode behavior', function() {
      mockClient.verbose = true;
      filterHandler = verbosityFilter(mockClient);

      var verboseItem = {
        Id: 1,
        Title: 'Verbose Item',
        Created: '2023-01-01T00:00:00Z',
        Modified: '2023-01-01T00:00:00Z',
        __metadata: { type: 'SP.ListItem' }
      };

      var result = filterHandler(verboseItem, '/_api/web/lists/items');
      
      // In verbose mode, all fields should be preserved (backward compatibility)
      assert(result, 'Should have result');
      assert.strictEqual(result.Id, 1, 'Should preserve Id');
      assert.strictEqual(result.Title, 'Verbose Item', 'Should preserve Title');
      assert.strictEqual(result.Created, '2023-01-01T00:00:00Z', 'Should preserve Created in verbose mode');
      assert.strictEqual(result.Modified, '2023-01-01T00:00:00Z', 'Should preserve Modified in verbose mode');
      assert(result.__metadata, 'Should preserve metadata in verbose mode');
    });
  });
});