var fs = require('fs');
var path = require('path');
var async = require('async');

/**
 * Migration Runner for SharePoint Lists
 * Handles running and managing migrations
 */
module.exports = function(client) {
  return {
    /**
     * Run a specific migration
     * @param {string} migrationPath - Path to the migration file
     * @param {function} callback - Callback function
     */
    runMigration: function(migrationPath, callback) {
      try {
        var migration = require(migrationPath);
        console.log('Running migration:', migration.name);
        console.log('Description:', migration.description);
        
        migration.up(client, function(err, result) {
          if (err) {
            console.error('Migration failed:', err);
            return callback(err);
          }
          
          console.log('Migration completed successfully');
          callback(null, result);
        });
      } catch (error) {
        console.error('Error loading migration:', error);
        callback(error);
      }
    },
    
    /**
     * Rollback a specific migration
     * @param {string} migrationPath - Path to the migration file
     * @param {function} callback - Callback function
     */
    rollbackMigration: function(migrationPath, callback) {
      try {
        var migration = require(migrationPath);
        console.log('Rolling back migration:', migration.name);
        
        if (!migration.down) {
          return callback(new Error('Migration does not support rollback'));
        }
        
        migration.down(client, function(err, result) {
          if (err) {
            console.error('Migration rollback failed:', err);
            return callback(err);
          }
          
          console.log('Migration rolled back successfully');
          callback(null, result);
        });
      } catch (error) {
        console.error('Error loading migration:', error);
        callback(error);
      }
    },
    
    /**
     * Run all pending migrations in a directory
     * @param {string} migrationsDir - Directory containing migration files
     * @param {function} callback - Callback function
     */
    runAllMigrations: function(migrationsDir, callback) {
      var self = this;
      
      fs.readdir(migrationsDir, function(err, files) {
        if (err) {
          return callback(err);
        }
        
        // Filter and sort migration files
        var migrationFiles = files
          .filter(function(file) {
            return file.endsWith('.js');
          })
          .sort()
          .map(function(file) {
            return path.join(migrationsDir, file);
          });
        
        if (migrationFiles.length === 0) {
          return callback(null, { message: 'No migrations to run' });
        }
        
        console.log('Found', migrationFiles.length, 'migration(s) to run');
        
        // Run migrations in sequence
        async.eachSeries(migrationFiles, function(migrationPath, migrationCallback) {
          self.runMigration(migrationPath, migrationCallback);
        }, function(err) {
          if (err) {
            return callback(err);
          }
          
          callback(null, { 
            message: 'All migrations completed successfully',
            migrationsRun: migrationFiles.length
          });
        });
      });
    }
  };
};