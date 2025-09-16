/**
 * Migration: Add legacy_id column to orders list
 * 
 * This migration adds a legacy_id field to the orders SharePoint list
 * and backfills existing records with generated legacy IDs.
 */

var crypto = require('crypto');

module.exports = {
  name: 'add_legacy_id_to_orders',
  description: 'Add legacy_id column to orders list and backfill existing rows',
  
  /**
   * Run the migration
   * @param {object} sharepoint - SharePoint client instance
   * @param {function} callback - Callback function
   */
  up: function(sharepoint, callback) {
    var migrations = require('../lib/migrations')(sharepoint);
    
    // Configuration for the legacy_id field
    var fieldConfig = {
      Title: 'legacy_id',
      FieldTypeKind: 2, // Text field
      Description: 'Legacy identifier for orders migrated from previous system',
      Required: false,
      MaxLength: 50,
      DefaultValue: ''
    };
    
    /**
     * Generate a legacy ID for an order item
     * Format: LEGACY-{timestamp}-{hash}
     * @param {object} item - The SharePoint list item
     * @returns {string} Generated legacy ID
     */
    function generateLegacyId(item) {
      var timestamp = new Date(item.Created || new Date()).getTime();
      var hash = crypto.createHash('md5')
        .update(item.Id.toString() + (item.Title || ''))
        .digest('hex')
        .substring(0, 8);
      
      return 'LEGACY-' + timestamp + '-' + hash.toUpperCase();
    }
    
    // Run the migration
    migrations.runMigration('orders', fieldConfig, generateLegacyId, function(err, result) {
      if (err) {
        return callback(err);
      }
      
      console.log('Migration completed successfully:');
      console.log('- Field added:', result.fieldAdded);
      console.log('- Field already existed:', result.fieldExists);
      console.log('- Items updated:', result.backfillResult.updated);
      
      callback(null, result);
    });
  },
  
  /**
   * Rollback the migration (remove the field)
   * @param {object} sharepoint - SharePoint client instance
   * @param {function} callback - Callback function
   */
  down: function(sharepoint, callback) {
    var doRequest = require('../lib/util/doRequest')(sharepoint);
    var host = sharepoint.BASE_LIST_URL + "/getByTitle('orders')/Fields/getByInternalNameOrTitle('legacy_id')";
    
    doRequest({
      url: host,
      method: 'POST',
      headers: {
        'X-RequestDigest': sharepoint.baseContext,
        'IF-MATCH': '*',
        'X-HTTP-Method': 'DELETE'
      }
    }, function(err, result) {
      if (err) {
        return callback(err);
      }
      
      console.log('Migration rolled back: legacy_id field removed from orders list');
      callback(null, result);
    });
  }
};