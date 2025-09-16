#!/usr/bin/env node

/**
 * SharePoint Migration CLI Tool
 * Usage: node bin/migrate.js [command] [options]
 */

var sharepoint = require('../sharepointconnector');
var path = require('path');

// Parse command line arguments
var args = process.argv.slice(2);
var command = args[0];
var migrationFile = args[1];

// Configuration from environment variables
var config = {
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_HOST,
  type: process.env.SP_AUTH_TYPE || 'basic'
};

// Validate configuration
if (!config.username || !config.password || !config.url) {
  console.error('Error: Missing SharePoint configuration.');
  console.error('Please set the following environment variables:');
  console.error('- SP_USERNAME: SharePoint username');
  console.error('- SP_PASSWORD: SharePoint password');
  console.error('- SP_HOST: SharePoint host URL');
  console.error('- SP_AUTH_TYPE: Authentication type (optional, defaults to "basic")');
  process.exit(1);
}

// Show usage information
function showUsage() {
  console.log('SharePoint Migration Tool');
  console.log('');
  console.log('Usage:');
  console.log('  node bin/migrate.js up [migration-file]    - Run a migration');
  console.log('  node bin/migrate.js down [migration-file]  - Rollback a migration');
  console.log('  node bin/migrate.js run-all                - Run all pending migrations');
  console.log('');
  console.log('Examples:');
  console.log('  node bin/migrate.js up migrations/001_add_legacy_id_to_orders.js');
  console.log('  node bin/migrate.js down migrations/001_add_legacy_id_to_orders.js');
  console.log('  node bin/migrate.js run-all');
  console.log('');
  console.log('Environment Variables:');
  console.log('  SP_USERNAME   - SharePoint username');
  console.log('  SP_PASSWORD   - SharePoint password');
  console.log('  SP_HOST       - SharePoint host URL');
  console.log('  SP_AUTH_TYPE  - Authentication type (ntlm, basic, online, onlinesaml)');
}

// Main execution
function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showUsage();
    return;
  }
  
  // Create SharePoint client
  var sp = sharepoint(config);
  
  // Login to SharePoint
  console.log('Connecting to SharePoint...');
  sp.login(function(err) {
    if (err) {
      console.error('Failed to connect to SharePoint:', err.message);
      process.exit(1);
    }
    
    console.log('Connected to SharePoint successfully.');
    
    // Execute command
    switch (command) {
      case 'up':
        if (!migrationFile) {
          console.error('Error: Migration file path is required for "up" command.');
          showUsage();
          process.exit(1);
        }
        runMigration(sp, migrationFile);
        break;
        
      case 'down':
        if (!migrationFile) {
          console.error('Error: Migration file path is required for "down" command.');
          showUsage();
          process.exit(1);
        }
        rollbackMigration(sp, migrationFile);
        break;
        
      case 'run-all':
        runAllMigrations(sp);
        break;
        
      default:
        console.error('Error: Unknown command "' + command + '"');
        showUsage();
        process.exit(1);
    }
  });
}

function runMigration(sp, migrationFile) {
  var migrationPath = path.resolve(migrationFile);
  console.log('Running migration:', migrationPath);
  
  sp.migrationRunner.runMigration(migrationPath, function(err, result) {
    if (err) {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    process.exit(0);
  });
}

function rollbackMigration(sp, migrationFile) {
  var migrationPath = path.resolve(migrationFile);
  console.log('Rolling back migration:', migrationPath);
  
  sp.migrationRunner.rollbackMigration(migrationPath, function(err, result) {
    if (err) {
      console.error('Migration rollback failed:', err.message);
      process.exit(1);
    }
    
    console.log('Migration rolled back successfully!');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    process.exit(0);
  });
}

function runAllMigrations(sp) {
  var migrationsDir = path.join(__dirname, '../migrations');
  console.log('Running all migrations from:', migrationsDir);
  
  sp.migrationRunner.runAllMigrations(migrationsDir, function(err, result) {
    if (err) {
      console.error('Failed to run migrations:', err.message);
      process.exit(1);
    }
    
    console.log('All migrations completed successfully!');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    process.exit(0);
  });
}

// Run the CLI
main();