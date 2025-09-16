/**
 * SharePoint Migration: Add legacy_id field to Orders list and backfill existing items
 * 
 * This migration adds a legacy_id field to the Orders SharePoint list and 
 * backfills existing list items with generated legacy IDs.
 */

var async = require('async');
var _ = require('underscore');

module.exports = function(sharepointClient) {
  
  /**
   * Add legacy_id field to the specified SharePoint list
   * @param {string} listName - Name of the SharePoint list (e.g., "Orders")
   * @param {function} callback - Callback function
   */
  function addLegacyIdField(listName, callback) {
    console.log('Adding legacy_id field to list:', listName);
    
    var fieldDefinition = {
      __metadata: {
        type: 'SP.FieldText'
      },
      Title: 'Legacy ID',
      FieldTypeKind: 2, // Text field
      Required: false,
      EnforceUniqueValues: false,
      MaxLength: 50,
      StaticName: 'legacy_id',
      InternalName: 'legacy_id',
      Description: 'Legacy system identifier for migration purposes'
    };

    var fieldsUrl = sharepointClient.BASE_LIST_URL + "/getByTitle('" + listName + "')/Fields";
    
    sharepointClient.util.doRequest({
      url: fieldsUrl,
      method: 'POST',
      json: fieldDefinition,
      headers: {
        'X-RequestDigest': sharepointClient.baseContext,
        'Content-Type': 'application/json;odata=verbose',
        'Accept': 'application/json;odata=verbose'
      }
    }, function(err, result) {
      if (err) {
        // Check if field already exists
        if (err.message && err.message.indexOf('already exists') > -1) {
          console.log('legacy_id field already exists in list:', listName);
          return callback(null, { status: 'exists', message: 'Field already exists' });
        }
        return callback(err);
      }
      
      console.log('Successfully added legacy_id field to list:', listName);
      return callback(null, { status: 'created', field: result });
    });
  }

  /**
   * Generate a legacy ID based on item properties
   * @param {object} item - SharePoint list item
   * @param {number} index - Index for uniqueness
   * @returns {string} Generated legacy ID
   */
  function generateLegacyId(item, index) {
    // Generate legacy ID using pattern: LEGACY_[ItemId]_[Timestamp]
    var timestamp = new Date(item.Created || item.Modified || new Date()).getTime();
    return 'LEGACY_' + (item.Id || index) + '_' + timestamp;
  }

  /**
   * Backfill legacy_id for existing items in the list
   * @param {string} listName - Name of the SharePoint list
   * @param {function} callback - Callback function
   */
  function backfillLegacyIds(listName, callback) {
    console.log('Starting backfill process for list:', listName);
    
    // First, get all items from the list
    var listItems = require('../objects/listItems')(sharepointClient);
    
    // Get list by title to get its GUID
    sharepointClient.lists.list({ name: listName }, function(err, lists) {
      if (err) {
        return callback(err);
      }
      
      if (!lists || lists.length === 0) {
        return callback(new Error('List "' + listName + '" not found'));
      }
      
      var listGuid = lists[0].Id;
      
      // Get all items from the list
      listItems.list(listGuid, function(err, items) {
        if (err) {
          return callback(err);
        }
        
        if (!items || items.length === 0) {
          console.log('No items found in list:', listName);
          return callback(null, { status: 'no_items', count: 0 });
        }
        
        console.log('Found', items.length, 'items to backfill');
        var updatedCount = 0;
        var skippedCount = 0;
        
        // Process items in batches to avoid overwhelming SharePoint
        async.eachLimit(items, 5, function(item, itemCallback) {
          // Skip if item already has a legacy_id
          if (item.legacy_id) {
            console.log('Item', item.Id, 'already has legacy_id:', item.legacy_id);
            skippedCount++;
            return itemCallback();
          }
          
          // Generate legacy ID for this item
          var legacyId = generateLegacyId(item, updatedCount);
          
          // Update the item with the legacy_id
          var updateData = {
            itemId: item.Id,
            legacy_id: legacyId,
            __metadata: {
              type: 'SP.FieldStringValues'
            }
          };
          
          listItems.update(listName, updateData, function(err, result) {
            if (err) {
              console.error('Failed to update item', item.Id, ':', err.message);
              return itemCallback(err);
            }
            
            console.log('Updated item', item.Id, 'with legacy_id:', legacyId);
            updatedCount++;
            itemCallback();
          });
          
        }, function(err) {
          if (err) {
            return callback(err);
          }
          
          console.log('Backfill completed. Updated:', updatedCount, 'items. Skipped:', skippedCount, 'items.');
          callback(null, { 
            status: 'completed', 
            updated: updatedCount, 
            skipped: skippedCount,
            total: items.length 
          });
        });
      });
    });
  }

  /**
   * Main migration function
   * @param {string} listName - Name of the SharePoint list (default: "Orders")
   * @param {function} callback - Callback function
   */
  function runMigration(listName, callback) {
    if (typeof listName === 'function') {
      callback = listName;
      listName = 'Orders'; // Default list name
    }
    
    console.log('Starting migration for list:', listName);
    
    async.series([
      // Step 1: Add the legacy_id field
      function(stepCallback) {
        addLegacyIdField(listName, stepCallback);
      },
      
      // Step 2: Backfill existing items
      function(stepCallback) {
        // Wait a moment for field creation to propagate
        setTimeout(function() {
          backfillLegacyIds(listName, stepCallback);
        }, 2000);
      }
      
    ], function(err, results) {
      if (err) {
        console.error('Migration failed:', err);
        return callback(err);
      }
      
      console.log('Migration completed successfully');
      callback(null, {
        fieldCreation: results[0],
        backfill: results[1]
      });
    });
  }

  // Return the migration interface
  return {
    run: runMigration,
    addField: addLegacyIdField,
    backfill: backfillLegacyIds,
    generateLegacyId: generateLegacyId
  };
};