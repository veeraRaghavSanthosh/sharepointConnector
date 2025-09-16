#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs the legacy_id field migration for SharePoint lists.
 * 
 * Usage:
 *   node scripts/run-legacy-id-migration.js [listName]
 * 
 * Environment Variables:
 *   SP_USERNAME - SharePoint username
 *   SP_PASSWORD - SharePoint password  
 *   SP_HOST - SharePoint host URL
 *   SP_AUTH_TYPE - Authentication type (ntlm|basic|online|onlinesaml)
 */

var sharepointconnector = require('../sharepointconnector');

// Configuration from environment variables
var config = {
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_HOST,
  type: process.env.SP_AUTH_TYPE || 'ntlm'
};

// Get list name from command line arguments or default to "Orders"
var listName = process.argv[2] || 'Orders';

// Validate configuration
if (!config.username || !config.password || !config.url) {
  console.error('Error: Missing required environment variables');
  console.error('Please set: SP_USERNAME, SP_PASSWORD, SP_HOST');
  console.error('Optionally set: SP_AUTH_TYPE (default: ntlm)');
  process.exit(1);
}

console.log('Connecting to SharePoint:', config.url);
console.log('Authentication type:', config.type);
console.log('Target list:', listName);

// Initialize SharePoint client
var sharepoint = sharepointconnector(config);

sharepoint.login(function(err) {
  if (err) {
    console.error('Failed to login to SharePoint:', err);
    process.exit(1);
  }
  
  console.log('Successfully logged in to SharePoint');
  
  // Load the migration module
  var migration = require('../lib/migrations/add-legacy-id-field')(sharepoint);
  
  // Run the migration
  migration.run(listName, function(err, results) {
    if (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
    
    console.log('\n=== Migration Results ===');
    console.log('Field Creation:', results.fieldCreation.status);
    console.log('Backfill Status:', results.backfill.status);
    
    if (results.backfill.updated !== undefined) {
      console.log('Items Updated:', results.backfill.updated);
      console.log('Items Skipped:', results.backfill.skipped);
      console.log('Total Items:', results.backfill.total);
    }
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
  });
});