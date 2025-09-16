/**
 * Integration tests for billing with SharePoint Connector
 * Tests billing integration with actual SharePoint operations
 */

var assert = require('assert');
var _ = require('underscore');
var BillingManager = require('../../lib/billing/billingManager');

// Integration tests that work with the SharePoint connector
exports.it_should_track_billing_during_sharepoint_operations = function(done) {
  var billingManager = new BillingManager();
  var testUserId = 'integration_test_user';
  
  // Create billing account
  var userData = {
    user_id: testUserId,
    email: 'integration@test.com',
    subscription_type: 'sharepoint_enterprise'
  };
  
  billingManager.createBillingAccount(userData, function(err, account) {
    assert.ok(!err, 'Should create billing account: ' + JSON.stringify(err));
    assert.ok(account, 'Should return account data');
    
    // Simulate SharePoint operations with billing tracking
    var operations = [
      { type: 'document_upload', count: 10 },
      { type: 'document_download', count: 50 },
      { type: 'search_query', count: 25 },
      { type: 'api_call', count: 100 }
    ];
    
    var trackOperations = function(callback) {
      var tasks = [];
      
      _.each(operations, function(op) {
        for (var i = 0; i < op.count; i++) {
          tasks.push(function(cb) {
            billingManager.trackApiUsage(testUserId, op.type, cb);
          });
        }
      });
      
      require('async').parallelLimit(tasks, 10, callback);
    };
    
    trackOperations(function(err) {
      assert.ok(!err, 'Should track all operations: ' + JSON.stringify(err));
      
      // Calculate bill after operations
      billingManager.calculateMonthlyBill(testUserId, function(err, bill) {
        assert.ok(!err, 'Should calculate bill: ' + JSON.stringify(err));
        assert.ok(bill.total_amount > 0, 'Should have positive bill amount');
        
        // Verify usage was tracked correctly
        var usage = billingManager.usage_data[testUserId];
        assert.equal(usage.document_uploads, 10, 'Should track 10 uploads');
        assert.equal(usage.document_downloads, 50, 'Should track 50 downloads');
        assert.equal(usage.search_queries, 25, 'Should track 25 searches');
        assert.equal(usage.api_calls, 100, 'Should track 100 API calls');
        
        done(null, bill);
      });
    });
  });
};

exports.it_should_handle_concurrent_sharepoint_billing_operations = function(done) {
  var billingManager = new BillingManager();
  var userCount = 5;
  var users = [];
  
  // Create multiple users
  for (var i = 1; i <= userCount; i++) {
    users.push({
      user_id: 'concurrent_user_' + i,
      email: 'user' + i + '@concurrent.test',
      subscription_type: 'basic'
    });
  }
  
  // Create accounts for all users
  var createAccounts = function(callback) {
    require('async').map(users, function(userData, cb) {
      billingManager.createBillingAccount(userData, cb);
    }, callback);
  };
  
  createAccounts(function(err, accounts) {
    assert.ok(!err, 'Should create all accounts: ' + JSON.stringify(err));
    assert.equal(accounts.length, userCount, 'Should create correct number of accounts');
    
    // Simulate concurrent operations for all users
    var simulateOperations = function(callback) {
      var allOperations = [];
      
      _.each(users, function(user) {
        // Each user performs different operations
        var userOperations = [
          { userId: user.user_id, type: 'document_upload', count: 5 },
          { userId: user.user_id, type: 'api_call', count: 20 },
          { userId: user.user_id, type: 'search_query', count: 10 }
        ];
        
        _.each(userOperations, function(op) {
          for (var i = 0; i < op.count; i++) {
            allOperations.push(function(cb) {
              billingManager.trackApiUsage(op.userId, op.type, cb);
            });
          }
        });
      });
      
      // Execute all operations concurrently
      require('async').parallelLimit(allOperations, 20, callback);
    };
    
    simulateOperations(function(err) {
      assert.ok(!err, 'Should complete all concurrent operations: ' + JSON.stringify(err));
      
      // Calculate bills for all users
      var calculateBills = function(callback) {
        require('async').map(users, function(user, cb) {
          billingManager.calculateMonthlyBill(user.user_id, cb);
        }, callback);
      };
      
      calculateBills(function(err, bills) {
        assert.ok(!err, 'Should calculate all bills: ' + JSON.stringify(err));
        assert.equal(bills.length, userCount, 'Should have bill for each user');
        
        // Verify each bill
        _.each(bills, function(bill, index) {
          assert.ok(bill.total_amount >= 0, 'Bill ' + index + ' should have valid amount');
          assert.ok(bill.breakdown.length > 0, 'Bill ' + index + ' should have breakdown');
          
          var user = users[index];
          var usage = billingManager.usage_data[user.user_id];
          assert.equal(usage.document_uploads, 5, 'User ' + index + ' should have 5 uploads');
          assert.equal(usage.api_calls, 20, 'User ' + index + ' should have 20 API calls');
          assert.equal(usage.search_queries, 10, 'User ' + index + ' should have 10 searches');
        });
        
        done(null, bills);
      });
    });
  });
};

exports.it_should_integrate_billing_with_sharepoint_list_operations = function(done) {
  var billingManager = new BillingManager();
  var testUserId = 'list_operations_user';
  
  // Create billing account
  billingManager.createBillingAccount({
    user_id: testUserId,
    email: 'listops@test.com'
  }, function(err, account) {
    assert.ok(!err, 'Should create account for list operations');
    
    // Simulate SharePoint list operations that would be billed
    var listOperations = [
      'create_list',
      'read_list',
      'update_list_item',
      'delete_list_item',
      'query_list_items',
      'bulk_insert'
    ];
    
    var simulateListOperations = function(callback) {
      var operations = [];
      
      _.each(listOperations, function(operation) {
        // Each operation type performed multiple times
        var count = operation === 'bulk_insert' ? 5 : 20;
        
        for (var i = 0; i < count; i++) {
          operations.push(function(cb) {
            // Track as API calls for billing
            billingManager.trackApiUsage(testUserId, 'api_call', cb);
          });
        }
      });
      
      require('async').parallel(operations, callback);
    };
    
    simulateListOperations(function(err) {
      assert.ok(!err, 'Should complete list operations simulation');
      
      // Also simulate storage usage from list data
      var listDataSize = 50 * 1024 * 1024; // 50MB of list data
      
      billingManager.trackStorageUsage(testUserId, listDataSize, function(err) {
        assert.ok(!err, 'Should track list storage usage');
        
        billingManager.calculateMonthlyBill(testUserId, function(err, bill) {
          assert.ok(!err, 'Should calculate bill for list operations');
          
          var usage = billingManager.usage_data[testUserId];
          var expectedApiCalls = (5 * 5) + (5 * 20); // 5 bulk + 5 * 20 other operations
          
          assert.equal(usage.api_calls, expectedApiCalls, 'Should track correct API calls');
          assert.ok(usage.storage_gb > 0, 'Should track storage usage');
          assert.ok(bill.total_amount > 0, 'Should have positive bill for list operations');
          
          done(null, bill);
        });
      });
    });
  });
};

exports.it_should_handle_billing_for_large_file_operations = function(done) {
  var billingManager = new BillingManager();
  var testUserId = 'large_file_user';
  
  billingManager.createBillingAccount({
    user_id: testUserId,
    email: 'largefile@test.com'
  }, function(err) {
    assert.ok(!err, 'Should create account for large file operations');
    
    // Simulate uploading large files to SharePoint
    var largeFileOperations = [
      { size: 100 * 1024 * 1024, count: 5 },  // 5 files of 100MB each
      { size: 500 * 1024 * 1024, count: 2 },  // 2 files of 500MB each
      { size: 1024 * 1024 * 1024, count: 1 }  // 1 file of 1GB
    ];
    
    var processLargeFiles = function(callback) {
      var operations = [];
      
      _.each(largeFileOperations, function(fileOp) {
        for (var i = 0; i < fileOp.count; i++) {
          operations.push(function(cb) {
            // Track upload operation
            billingManager.trackApiUsage(testUserId, 'document_upload', function(err) {
              if (err) return cb(err);
              
              // Track storage usage
              billingManager.trackStorageUsage(testUserId, fileOp.size, cb);
            });
          });
        }
      });
      
      require('async').series(operations, callback);
    };
    
    processLargeFiles(function(err) {
      assert.ok(!err, 'Should process large file operations');
      
      billingManager.calculateMonthlyBill(testUserId, function(err, bill) {
        assert.ok(!err, 'Should calculate bill for large file operations');
        
        var usage = billingManager.usage_data[testUserId];
        
        // Verify upload tracking
        var totalUploads = 5 + 2 + 1; // Total number of files
        assert.equal(usage.document_uploads, totalUploads, 'Should track all file uploads');
        
        // Verify storage tracking (approximately 2.5GB total)
        var expectedStorageGB = (5 * 0.1) + (2 * 0.5) + (1 * 1.0); // 0.5 + 1.0 + 1.0 = 2.5GB
        assert.ok(usage.storage_gb >= 2.4 && usage.storage_gb <= 2.6, 'Should track approximately 2.5GB storage');
        
        // Verify billing includes both upload and storage costs
        var uploadCost = _.find(bill.breakdown, function(item) {
          return item.description.indexOf('Uploads') !== -1;
        });
        var storageCost = _.find(bill.breakdown, function(item) {
          return item.description.indexOf('Storage') !== -1;
        });
        
        assert.ok(uploadCost && uploadCost.amount > 0, 'Should have upload costs');
        assert.ok(storageCost && storageCost.amount > 0, 'Should have storage costs');
        
        done(null, bill);
      });
    });
  });
};

exports.it_should_handle_billing_errors_gracefully = function(done) {
  var billingManager = new BillingManager();
  var testUserId = 'error_handling_user';
  
  // Test various error scenarios
  var testScenarios = [
    {
      name: 'Non-existent user bill calculation',
      test: function(callback) {
        billingManager.calculateMonthlyBill('nonexistent_user', function(err, result) {
          assert.ok(err, 'Should have error for non-existent user');
          assert.ok(!result, 'Should not return result');
          callback(null, 'passed');
        });
      }
    },
    {
      name: 'Invalid payment processing',
      test: function(callback) {
        billingManager.createBillingAccount({
          user_id: testUserId,
          email: 'error@test.com'
        }, function(err) {
          assert.ok(!err, 'Should create account');
          
          var invalidPayment = {
            amount: -100, // Invalid negative amount
            currency: 'USD',
            card_token: 'tok_test'
          };
          
          billingManager.processPayment(testUserId, invalidPayment, function(err, result) {
            assert.ok(err, 'Should have error for invalid payment');
            assert.ok(!result, 'Should not return result');
            callback(null, 'passed');
          });
        });
      }
    },
    {
      name: 'Network timeout simulation',
      test: function(callback) {
        billingManager.createBillingAccount({
          user_id: testUserId + '_timeout',
          email: 'timeout@test.com'
        }, function(err) {
          assert.ok(!err, 'Should create account');
          
          var timeoutPayment = {
            amount: 100,
            currency: 'USD',
            card_token: 'tok_network_error'
          };
          
          billingManager.processPayment(testUserId + '_timeout', timeoutPayment, function(err, result) {
            assert.ok(err, 'Should have error for network timeout');
            assert.ok(err.message.indexOf('Network error') !== -1, 'Should have network error message');
            assert.ok(!result, 'Should not return result');
            callback(null, 'passed');
          });
        });
      }
    }
  ];
  
  require('async').map(testScenarios, function(scenario, callback) {
    scenario.test(callback);
  }, function(err, results) {
    assert.ok(!err, 'Should complete all error scenarios');
    assert.equal(results.length, testScenarios.length, 'Should test all scenarios');
    
    _.each(results, function(result) {
      assert.equal(result, 'passed', 'All error scenarios should pass');
    });
    
    done(null, results);
  });
};

// Export for unit test compatibility
exports.after = function(finish) {
  // Cleanup if needed
  return finish();
};