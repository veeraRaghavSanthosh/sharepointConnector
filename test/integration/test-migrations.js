var assert = require('assert');
var sharepoint = require('../../sharepointconnector');

describe('SharePoint Migrations Integration', function() {
  var sp;
  
  // Skip integration tests if environment variables are not set
  before(function() {
    if (!process.env.SP_USERNAME || !process.env.SP_PASSWORD || !process.env.SP_HOST) {
      this.pending();
    }
    
    sp = sharepoint({
      username: process.env.SP_USERNAME,
      password: process.env.SP_PASSWORD,
      url: process.env.SP_HOST,
      type: process.env.SP_AUTH_TYPE || 'basic'
    });
  });
  
  describe('Migration System Integration', function() {
    
    it('should connect to SharePoint and verify migration system is available', function(done) {
      sp.login(function(err) {
        assert.ifError(err);
        assert.ok(sp.migrations);
        assert.ok(sp.migrationRunner);
        assert.ok(typeof sp.migrations.addField === 'function');
        assert.ok(typeof sp.migrations.fieldExists === 'function');
        assert.ok(typeof sp.migrations.backfillField === 'function');
        assert.ok(typeof sp.migrations.runMigration === 'function');
        done();
      });
    });
    
    it('should check if orders list exists', function(done) {
      sp.login(function(err) {
        assert.ifError(err);
        
        sp.lists.read('orders', function(err, list) {
          if (err) {
            console.log('Orders list does not exist - this is expected for a fresh SharePoint instance');
            console.log('You may need to create the orders list first before running migrations');
            return done();
          }
          
          assert.ok(list);
          assert.equal(list.Title, 'orders');
          done();
        });
      });
    });
    
    // Note: These tests are commented out to avoid modifying production data
    // Uncomment and run in a test environment only
    
    /*
    it('should run the legacy_id migration on orders list', function(done) {
      this.timeout(30000); // Increase timeout for SharePoint operations
      
      sp.login(function(err) {
        assert.ifError(err);
        
        var migration = require('../../migrations/001_add_legacy_id_to_orders');
        
        migration.up(sp, function(err, result) {
          assert.ifError(err);
          assert.ok(result);
          console.log('Migration result:', result);
          done();
        });
      });
    });
    
    it('should verify legacy_id field was added to orders list', function(done) {
      sp.login(function(err) {
        assert.ifError(err);
        
        sp.migrations.fieldExists('orders', 'legacy_id', function(err, exists) {
          assert.ifError(err);
          assert.equal(exists, true);
          done();
        });
      });
    });
    
    it('should rollback the legacy_id migration', function(done) {
      this.timeout(30000);
      
      sp.login(function(err) {
        assert.ifError(err);
        
        var migration = require('../../migrations/001_add_legacy_id_to_orders');
        
        migration.down(sp, function(err, result) {
          assert.ifError(err);
          console.log('Rollback completed');
          done();
        });
      });
    });
    */
  });
});