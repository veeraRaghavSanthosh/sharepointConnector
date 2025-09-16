var async = require('async');
var _ = require('underscore');

/**
 * SharePoint List Migration System
 * Handles schema changes and data migrations for SharePoint lists
 */
module.exports = function(client) {
  var doRequest = require('../util/doRequest')(client);
  
  return {
    /**
     * Add a field (column) to a SharePoint list
     * @param {string} listId - The list identifier (name or GUID)
     * @param {object} fieldConfig - Field configuration
     * @param {function} callback - Callback function
     */
    addField: function(listId, fieldConfig, callback) {
      if (!listId || !fieldConfig) {
        return callback('List ID and field configuration are required');
      }
      
      var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')/Fields";
      var field = _.extend({
        "__metadata": {
          "type": "SP.Field"
        }
      }, fieldConfig);
      
      return doRequest({
        url: host,
        method: 'POST',
        json: field,
        headers: {
          'X-RequestDigest': client.baseContext,
          'Content-Type': 'application/json;odata=verbose'
        }
      }, function(err, result) {
        if (err) {
          return callback(err);
        }
        return callback(null, result);
      });
    },
    
    /**
     * Check if a field exists in a list
     * @param {string} listId - The list identifier
     * @param {string} fieldName - The field name to check
     * @param {function} callback - Callback function
     */
    fieldExists: function(listId, fieldName, callback) {
      var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')/Fields/getByInternalNameOrTitle('" + fieldName + "')";
      
      return doRequest(host, function(err, result) {
        if (err) {
          // If field doesn't exist, SharePoint returns an error
          if (err.message && err.message.indexOf('does not exist') > -1) {
            return callback(null, false);
          }
          return callback(err);
        }
        return callback(null, true);
      });
    },
    
    /**
     * Backfill data for existing list items
     * @param {string} listId - The list identifier
     * @param {string} fieldName - The field to update
     * @param {function} valueGenerator - Function to generate values for each item
     * @param {function} callback - Callback function
     */
    backfillField: function(listId, fieldName, valueGenerator, callback) {
      var self = this;
      var listItems = require('../objects/listItems')(client);
      
      // Get all items from the list
      listItems.listAll(listId, function(err, items) {
        if (err) {
          return callback(err);
        }
        
        if (!items || items.length === 0) {
          return callback(null, { message: 'No items to backfill', updated: 0 });
        }
        
        var updatedCount = 0;
        
        // Process items in batches to avoid overwhelming SharePoint
        async.eachLimit(items, 5, function(item, itemCallback) {
          // Skip if field already has a value
          if (item[fieldName]) {
            return itemCallback();
          }
          
          var newValue = valueGenerator(item);
          var updateData = {
            itemId: item.Id
          };
          updateData[fieldName] = newValue;
          
          listItems.update(listId, updateData, function(err, result) {
            if (err) {
              console.warn('Failed to update item ' + item.Id + ':', err.message);
              return itemCallback(); // Continue with other items
            }
            updatedCount++;
            itemCallback();
          });
        }, function(err) {
          if (err) {
            return callback(err);
          }
          callback(null, { message: 'Backfill completed', updated: updatedCount });
        });
      });
    },
    
    /**
     * Run a complete migration (add field + backfill)
     * @param {string} listId - The list identifier
     * @param {object} fieldConfig - Field configuration
     * @param {function} valueGenerator - Function to generate values for backfill
     * @param {function} callback - Callback function
     */
    runMigration: function(listId, fieldConfig, valueGenerator, callback) {
      var self = this;
      
      async.series([
        // Check if field already exists
        function(stepCallback) {
          self.fieldExists(listId, fieldConfig.Title, function(err, exists) {
            if (err) {
              return stepCallback(err);
            }
            if (exists) {
              return stepCallback(null, { skipped: true, reason: 'Field already exists' });
            }
            stepCallback(null, { skipped: false });
          });
        },
        // Add the field if it doesn't exist
        function(stepCallback) {
          self.addField(listId, fieldConfig, stepCallback);
        },
        // Backfill existing items
        function(stepCallback) {
          self.backfillField(listId, fieldConfig.Title, valueGenerator, stepCallback);
        }
      ], function(err, results) {
        if (err) {
          return callback(err);
        }
        
        var migrationResult = {
          fieldAdded: !results[0].skipped,
          fieldExists: results[0].skipped,
          backfillResult: results[2]
        };
        
        callback(null, migrationResult);
      });
    }
  };
};