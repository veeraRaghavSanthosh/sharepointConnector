/**
 * Unit tests for BillingManager
 * Tests success cases, failure scenarios, and boundary conditions
 * Maintains backward compatibility with existing APIs
 */

var assert = require('assert');
var _ = require('underscore');
var BillingManager = require('../../lib/billing/billingManager');

describe('BillingManager', function() {
  var billingManager;
  var sampleUserData;
  var samplePaymentData;
  
  beforeEach(function() {
    billingManager = new BillingManager();
    
    sampleUserData = {
      user_id: 'test_user_123',
      email: 'test@example.com',
      subscription_type: 'premium',
      billing_address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        country: 'US'
      }
    };
    
    samplePaymentData = {
      amount: 99.99,
      currency: 'USD',
      payment_method: 'credit_card',
      card_token: 'tok_test_123'
    };
  });
  
  describe('Account Management', function() {
    
    describe('SUCCESS CASES', function() {
      
      it('should create billing account successfully', function(done) {
        billingManager.createBillingAccount(sampleUserData, function(err, result) {
          assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
          assert.ok(result, 'Should return account data');
          assert.ok(result.account_id, 'Should have account ID');
          assert.equal(result.user_id, 'test_user_123', 'Should have correct user ID');
          assert.equal(result.status, 'active', 'Should be active');
          assert.ok(result.created_at, 'Should have creation date');
          done();
        });
      });
      
      it('should initialize usage tracking on account creation', function(done) {
        billingManager.createBillingAccount(sampleUserData, function(err, result) {
          assert.ok(!err, 'Should not have error');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.ok(usage, 'Should have usage data initialized');
          assert.equal(usage.storage_gb, 0, 'Should initialize storage to 0');
          assert.equal(usage.api_calls, 0, 'Should initialize API calls to 0');
          assert.ok(usage.last_updated, 'Should have last updated timestamp');
          done();
        });
      });
      
      it('should handle multiple account creation', function(done) {
        var users = [
          { user_id: 'user1', email: 'user1@test.com' },
          { user_id: 'user2', email: 'user2@test.com' },
          { user_id: 'user3', email: 'user3@test.com' }
        ];
        
        var createAccount = function(userData, callback) {
          billingManager.createBillingAccount(userData, callback);
        };
        
        require('async').map(users, createAccount, function(err, results) {
          assert.ok(!err, 'Should not have error');
          assert.equal(results.length, 3, 'Should create 3 accounts');
          
          _.each(results, function(account, index) {
            assert.equal(account.user_id, users[index].user_id, 'Should have correct user ID');
            assert.equal(account.status, 'active', 'Should be active');
          });
          
          done();
        });
      });
    });
    
    describe('FAILURE CASES', function() {
      
      it('should fail with missing user ID', function(done) {
        var invalidData = { email: 'test@example.com' };
        
        billingManager.createBillingAccount(invalidData, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('User ID is required') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with empty user ID', function(done) {
        var invalidData = { user_id: '', email: 'test@example.com' };
        
        billingManager.createBillingAccount(invalidData, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with null user data', function(done) {
        billingManager.createBillingAccount(null, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
    });
  });
  
  describe('Bill Calculation', function() {
    
    beforeEach(function(done) {
      // Create account and set usage data
      billingManager.createBillingAccount(sampleUserData, function(err) {
        assert.ok(!err, 'Should create account successfully');
        
        // Set sample usage data
        billingManager.usage_data[sampleUserData.user_id] = {
          storage_gb: 50.5,
          api_calls: 10000,
          data_transfer_gb: 25.2,
          document_uploads: 1000,
          document_downloads: 5000,
          search_queries: 2000
        };
        
        done();
      });
    });
    
    describe('SUCCESS CASES', function() {
      
      it('should calculate monthly bill successfully', function(done) {
        billingManager.calculateMonthlyBill(sampleUserData.user_id, function(err, bill) {
          assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
          assert.ok(bill, 'Should return bill');
          assert.ok(bill.total_amount >= 0, 'Should have non-negative total');
          assert.equal(bill.currency, 'USD', 'Should have correct currency');
          assert.ok(bill.breakdown, 'Should have breakdown');
          assert.equal(bill.breakdown.length, 6, 'Should have 6 line items');
          assert.ok(bill.period_start, 'Should have period start');
          assert.ok(bill.period_end, 'Should have period end');
          done();
        });
      });
      
      it('should calculate correct amounts based on usage', function(done) {
        billingManager.calculateMonthlyBill(sampleUserData.user_id, function(err, bill) {
          assert.ok(!err, 'Should not have error');
          
          // Verify individual calculations
          var usage = billingManager.usage_data[sampleUserData.user_id];
          var rates = billingManager.options.rates;
          
          var expectedStorage = usage.storage_gb * rates.storage_gb;
          var expectedApi = usage.api_calls * rates.api_calls;
          var expectedTransfer = usage.data_transfer_gb * rates.data_transfer_gb;
          var expectedUploads = usage.document_uploads * rates.document_upload;
          var expectedDownloads = usage.document_downloads * rates.document_download;
          var expectedSearches = usage.search_queries * rates.search_query;
          
          var expectedTotal = expectedStorage + expectedApi + expectedTransfer + 
                            expectedUploads + expectedDownloads + expectedSearches;
          
          // Round to 2 decimal places for comparison
          expectedTotal = Math.round(expectedTotal * 100) / 100;
          
          assert.equal(bill.total_amount, expectedTotal, 'Should calculate correct total amount');
          done();
        });
      });
    });
    
    describe('FAILURE CASES', function() {
      
      it('should fail for non-existent user', function(done) {
        billingManager.calculateMonthlyBill('nonexistent_user', function(err, bill) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('not found') !== -1, 'Should have appropriate error message');
          assert.ok(!bill, 'Should not return bill');
          done();
        });
      });
    });
    
    describe('BOUNDARY CASES', function() {
      
      it('should handle zero usage', function(done) {
        // Set zero usage
        billingManager.usage_data[sampleUserData.user_id] = {
          storage_gb: 0,
          api_calls: 0,
          data_transfer_gb: 0,
          document_uploads: 0,
          document_downloads: 0,
          search_queries: 0
        };
        
        billingManager.calculateMonthlyBill(sampleUserData.user_id, function(err, bill) {
          assert.ok(!err, 'Should not have error');
          assert.equal(bill.total_amount, 0, 'Should have zero total for zero usage');
          done();
        });
      });
      
      it('should handle maximum usage', function(done) {
        // Set maximum usage
        billingManager.usage_data[sampleUserData.user_id] = {
          storage_gb: 10000,
          api_calls: 10000000,
          data_transfer_gb: 5000,
          document_uploads: 1000000,
          document_downloads: 5000000,
          search_queries: 100000
        };
        
        billingManager.calculateMonthlyBill(sampleUserData.user_id, function(err, bill) {
          assert.ok(!err, 'Should not have error');
          assert.ok(bill.total_amount > 0, 'Should have positive total for maximum usage');
          assert.ok(bill.total_amount < 100000, 'Should have reasonable total amount');
          done();
        });
      });
      
      it('should handle fractional usage values', function(done) {
        // Set fractional usage
        billingManager.usage_data[sampleUserData.user_id] = {
          storage_gb: 10.123456789,
          api_calls: 1,
          data_transfer_gb: 5.987654321,
          document_uploads: 1,
          document_downloads: 1,
          search_queries: 1
        };
        
        billingManager.calculateMonthlyBill(sampleUserData.user_id, function(err, bill) {
          assert.ok(!err, 'Should not have error');
          
          // Check that amounts are properly rounded
          assert.equal(typeof bill.total_amount, 'number', 'Should be a number');
          
          var amountStr = bill.total_amount.toString();
          if (amountStr.indexOf('.') !== -1) {
            var decimalPlaces = amountStr.split('.')[1].length;
            assert.ok(decimalPlaces <= 2, 'Should have at most 2 decimal places');
          }
          
          done();
        });
      });
    });
  });
  
  describe('Payment Processing', function() {
    
    beforeEach(function(done) {
      billingManager.createBillingAccount(sampleUserData, done);
    });
    
    describe('SUCCESS CASES', function() {
      
      it('should process payment successfully', function(done) {
        billingManager.processPayment(sampleUserData.user_id, samplePaymentData, function(err, result) {
          assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
          assert.ok(result, 'Should return payment result');
          assert.equal(result.status, 'success', 'Should have success status');
          assert.ok(result.transaction_id, 'Should have transaction ID');
          assert.equal(result.amount, samplePaymentData.amount, 'Should have correct amount');
          assert.equal(result.currency, samplePaymentData.currency, 'Should have correct currency');
          done();
        });
      });
      
      it('should process minimum payment amount', function(done) {
        var minPayment = _.clone(samplePaymentData);
        minPayment.amount = 0.01;
        
        billingManager.processPayment(sampleUserData.user_id, minPayment, function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.equal(result.status, 'success', 'Should process minimum payment');
          assert.equal(result.amount, 0.01, 'Should have correct amount');
          done();
        });
      });
      
      it('should process maximum payment amount', function(done) {
        var maxPayment = _.clone(samplePaymentData);
        maxPayment.amount = 99999.99;
        
        billingManager.processPayment(sampleUserData.user_id, maxPayment, function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.equal(result.status, 'success', 'Should process maximum payment');
          assert.equal(result.amount, 99999.99, 'Should have correct amount');
          done();
        });
      });
    });
    
    describe('FAILURE CASES', function() {
      
      it('should fail with insufficient funds', function(done) {
        var declinedPayment = _.clone(samplePaymentData);
        declinedPayment.card_token = 'tok_declined';
        
        billingManager.processPayment(sampleUserData.user_id, declinedPayment, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('declined') !== -1 || err.message.indexOf('Insufficient') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with invalid token', function(done) {
        var invalidPayment = _.clone(samplePaymentData);
        invalidPayment.card_token = 'invalid_token';
        
        billingManager.processPayment(sampleUserData.user_id, invalidPayment, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('Invalid') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with zero amount', function(done) {
        var zeroPayment = _.clone(samplePaymentData);
        zeroPayment.amount = 0;
        
        billingManager.processPayment(sampleUserData.user_id, zeroPayment, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('positive') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with negative amount', function(done) {
        var negativePayment = _.clone(samplePaymentData);
        negativePayment.amount = -50.00;
        
        billingManager.processPayment(sampleUserData.user_id, negativePayment, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('positive') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
      
      it('should fail with missing payment token', function(done) {
        var invalidPayment = _.clone(samplePaymentData);
        delete invalidPayment.card_token;
        
        billingManager.processPayment(sampleUserData.user_id, invalidPayment, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('token') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
    });
  });
  
  describe('Usage Tracking', function() {
    
    beforeEach(function(done) {
      billingManager.createBillingAccount(sampleUserData, done);
    });
    
    describe('SUCCESS CASES', function() {
      
      it('should track API usage successfully', function(done) {
        billingManager.trackApiUsage(sampleUserData.user_id, 'api_call', function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.ok(result, 'Should return success');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.equal(usage.api_calls, 1, 'Should increment API calls');
          done();
        });
      });
      
      it('should track document upload usage', function(done) {
        billingManager.trackApiUsage(sampleUserData.user_id, 'document_upload', function(err, result) {
          assert.ok(!err, 'Should not have error');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.equal(usage.document_uploads, 1, 'Should increment document uploads');
          done();
        });
      });
      
      it('should track storage usage successfully', function(done) {
        var sizeInBytes = 1024 * 1024 * 100; // 100MB
        
        billingManager.trackStorageUsage(sampleUserData.user_id, sizeInBytes, function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.ok(result, 'Should return success');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.ok(usage.storage_gb > 0, 'Should have positive storage usage');
          done();
        });
      });
      
      it('should track multiple operations', function(done) {
        var operations = ['api_call', 'document_upload', 'document_download', 'search_query'];
        
        var trackOperation = function(operation, callback) {
          billingManager.trackApiUsage(sampleUserData.user_id, operation, callback);
        };
        
        require('async').each(operations, trackOperation, function(err) {
          assert.ok(!err, 'Should not have error');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.equal(usage.api_calls, 1, 'Should have 1 API call');
          assert.equal(usage.document_uploads, 1, 'Should have 1 upload');
          assert.equal(usage.document_downloads, 1, 'Should have 1 download');
          assert.equal(usage.search_queries, 1, 'Should have 1 search');
          done();
        });
      });
    });
    
    describe('FAILURE CASES', function() {
      
      it('should fail with negative storage size', function(done) {
        billingManager.trackStorageUsage(sampleUserData.user_id, -1000, function(err, result) {
          assert.ok(err, 'Should have error');
          assert.ok(err.message.indexOf('negative') !== -1, 'Should have appropriate error message');
          assert.ok(!result, 'Should not return result');
          done();
        });
      });
    });
    
    describe('BOUNDARY CASES', function() {
      
      it('should handle zero storage size', function(done) {
        billingManager.trackStorageUsage(sampleUserData.user_id, 0, function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.ok(result, 'Should handle zero storage size');
          done();
        });
      });
      
      it('should handle maximum storage size', function(done) {
        var maxSize = 1024 * 1024 * 1024 * 1000; // 1TB
        
        billingManager.trackStorageUsage(sampleUserData.user_id, maxSize, function(err, result) {
          assert.ok(!err, 'Should not have error');
          assert.ok(result, 'Should handle maximum storage size');
          
          var usage = billingManager.usage_data[sampleUserData.user_id];
          assert.ok(usage.storage_gb >= 1000, 'Should have appropriate storage amount');
          done();
        });
      });
    });
  });
  
  describe('Backward Compatibility', function() {
    
    it('should handle legacy user data format', function(done) {
      var legacyUserData = {
        USER_ID: 'legacy_user',
        Email: 'legacy@test.com',
        subscriptionType: 'premium'
      };
      
      billingManager.createBillingAccount(legacyUserData, function(err, result) {
        assert.ok(!err, 'Should handle legacy format');
        assert.equal(result.user_id, 'legacy_user', 'Should normalize user ID');
        assert.equal(result.email, 'legacy@test.com', 'Should normalize email');
        assert.equal(result.subscription_type, 'premium', 'Should normalize subscription type');
        done();
      });
    });
    
    it('should handle legacy payment data format', function(done) {
      billingManager.createBillingAccount(sampleUserData, function(err) {
        assert.ok(!err, 'Should create account');
        
        var legacyPaymentData = {
          amount: '99.99', // String instead of number
          currency: 'USD',
          paymentMethod: 'credit_card', // camelCase
          cardToken: 'tok_test_123' // camelCase
        };
        
        billingManager.processPayment(sampleUserData.user_id, legacyPaymentData, function(err, result) {
          assert.ok(!err, 'Should handle legacy payment format');
          assert.equal(result.status, 'success', 'Should process payment');
          assert.equal(result.amount, 99.99, 'Should convert string amount to number');
          done();
        });
      });
    });
    
    it('should handle missing optional fields gracefully', function(done) {
      var minimalUserData = {
        user_id: 'minimal_user'
        // Missing email, subscription_type, etc.
      };
      
      billingManager.createBillingAccount(minimalUserData, function(err, result) {
        assert.ok(!err, 'Should handle minimal data');
        assert.equal(result.user_id, 'minimal_user', 'Should have user ID');
        assert.equal(result.subscription_type, 'basic', 'Should have default subscription type');
        assert.equal(result.status, 'active', 'Should have default status');
        done();
      });
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should handle complete billing flow', function(done) {
      var userId = 'integration_test_user';
      var userData = { user_id: userId, email: 'integration@test.com' };
      
      // Step 1: Create account
      billingManager.createBillingAccount(userData, function(err, account) {
        assert.ok(!err, 'Should create account');
        assert.equal(account.user_id, userId, 'Should have correct user ID');
        
        // Step 2: Track some usage
        billingManager.trackApiUsage(userId, 'api_call', function(err) {
          assert.ok(!err, 'Should track API usage');
          
          // Track more API calls to ensure positive bill
          billingManager.trackApiUsage(userId, 'document_upload', function(err) {
            assert.ok(!err, 'Should track upload');
            
            billingManager.trackStorageUsage(userId, 1024 * 1024 * 1024, function(err) { // 1GB
              assert.ok(!err, 'Should track storage usage');
              
              // Step 3: Calculate bill
              billingManager.calculateMonthlyBill(userId, function(err, bill) {
                assert.ok(!err, 'Should calculate bill');
                assert.ok(bill.total_amount > 0, 'Should have positive bill amount');
              
              // Step 4: Generate invoice
              var invoiceData = {
                user_id: userId,
                amount: bill.total_amount,
                period: '2025-09',
                items: bill.breakdown
              };
              
              billingManager.generateInvoice(invoiceData, function(err, invoice) {
                assert.ok(!err, 'Should generate invoice');
                assert.ok(invoice.invoice_id, 'Should have invoice ID');
                assert.equal(invoice.total_amount, bill.total_amount, 'Should have correct amount');
                
                // Step 5: Process payment
                var paymentData = {
                  amount: bill.total_amount,
                  currency: 'USD',
                  card_token: 'tok_visa_4242'
                };
                
                billingManager.processPayment(userId, paymentData, function(err, payment) {
                  assert.ok(!err, 'Should process payment: ' + (err ? err.message : ''));
                  assert.equal(payment.status, 'success', 'Should have successful payment');
                  assert.equal(payment.amount, bill.total_amount, 'Should have correct payment amount');
                  
                  done();
                });
              });
            });
            });
          });
        });
      });
    });
  });
});