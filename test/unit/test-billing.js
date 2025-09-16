/**
 * Unit tests for billing functionality
 * Covers success cases, failure cases, and boundary conditions
 */

var assert = require('assert');
var Billing = require('../../lib/billing');

describe('Billing Module', function() {
  var billing;

  beforeEach(function() {
    billing = new Billing({
      currency: 'USD',
      taxRate: 0.08,
      basePrice: 0.01,
      premiumMultiplier: 2.0,
      maxCredits: 10000,
      minCredits: 1
    });
  });

  describe('Constructor', function() {
    it('should initialize with default options', function() {
      var defaultBilling = new Billing();
      assert.equal(defaultBilling.options.currency, 'USD');
      assert.equal(defaultBilling.options.taxRate, 0.08);
      assert.equal(defaultBilling.options.basePrice, 0.01);
      assert.equal(defaultBilling.credits, 0);
    });

    it('should accept custom options', function() {
      var customBilling = new Billing({
        currency: 'EUR',
        taxRate: 0.20,
        basePrice: 0.02
      });
      assert.equal(customBilling.options.currency, 'EUR');
      assert.equal(customBilling.options.taxRate, 0.20);
      assert.equal(customBilling.options.basePrice, 0.02);
    });
  });

  describe('calculateCost', function() {
    // Success cases
    it('should calculate cost for basic tier operations', function() {
      var result = billing.calculateCost(100, 'basic');
      assert.equal(result.subtotal, 1.00);
      assert.equal(result.tax, 0.08);
      assert.equal(result.total, 1.08);
      assert.equal(result.operations, 100);
      assert.equal(result.tier, 'basic');
      assert.equal(result.currency, 'USD');
    });

    it('should calculate cost for premium tier operations', function() {
      var result = billing.calculateCost(100, 'premium');
      assert.equal(result.subtotal, 2.00);
      assert.equal(result.tax, 0.16);
      assert.equal(result.total, 2.16);
      assert.equal(result.tier, 'premium');
    });

    it('should default to basic tier when tier not specified', function() {
      var result = billing.calculateCost(50);
      assert.equal(result.tier, 'basic');
      assert.equal(result.subtotal, 0.50);
    });

    // Boundary cases
    it('should handle zero operations', function() {
      var result = billing.calculateCost(0);
      assert.equal(result.subtotal, 0);
      assert.equal(result.tax, 0);
      assert.equal(result.total, 0);
      assert.equal(result.operations, 0);
    });

    it('should handle large operation counts', function() {
      var result = billing.calculateCost(1000000, 'basic');
      assert.equal(result.subtotal, 10000);
      assert.equal(result.tax, 800);
      assert.equal(result.total, 10800);
    });

    it('should round to 2 decimal places', function() {
      var result = billing.calculateCost(333, 'basic'); // Should result in 3.33
      assert.equal(result.subtotal, 3.33);
      assert.equal(result.tax, 0.27);
      assert.equal(result.total, 3.60);
    });

    // Failure cases
    it('should throw error for negative operation count', function() {
      assert.throws(function() {
        billing.calculateCost(-1);
      }, /Operation count must be a non-negative number/);
    });

    it('should throw error for non-numeric operation count', function() {
      assert.throws(function() {
        billing.calculateCost('invalid');
      }, /Operation count must be a non-negative number/);
    });

    it('should throw error for null operation count', function() {
      assert.throws(function() {
        billing.calculateCost(null);
      }, /Operation count must be a non-negative number/);
    });
  });

  describe('addCredits', function() {
    // Success cases
    it('should add credits to account', function() {
      var result = billing.addCredits(100);
      assert.equal(result.previousBalance, 0);
      assert.equal(result.added, 100);
      assert.equal(result.currentBalance, 100);
      assert.equal(billing.credits, 100);
    });

    it('should add credits to existing balance', function() {
      billing.credits = 50;
      var result = billing.addCredits(25);
      assert.equal(result.previousBalance, 50);
      assert.equal(result.added, 25);
      assert.equal(result.currentBalance, 75);
    });

    // Boundary cases
    it('should add credits up to maximum limit', function() {
      billing.credits = 9999;
      var result = billing.addCredits(1);
      assert.equal(result.currentBalance, 10000);
    });

    it('should handle decimal credit amounts', function() {
      var result = billing.addCredits(50.5);
      assert.equal(result.currentBalance, 50.5);
    });

    // Failure cases
    it('should throw error when exceeding maximum credits', function() {
      billing.credits = 9999;
      assert.throws(function() {
        billing.addCredits(2);
      }, /Cannot exceed maximum credit limit/);
    });

    it('should throw error for negative credit amount', function() {
      assert.throws(function() {
        billing.addCredits(-10);
      }, /Credit amount must be a positive number/);
    });

    it('should throw error for zero credit amount', function() {
      assert.throws(function() {
        billing.addCredits(0);
      }, /Credit amount must be a positive number/);
    });

    it('should throw error for non-numeric credit amount', function() {
      assert.throws(function() {
        billing.addCredits('invalid');
      }, /Credit amount must be a positive number/);
    });
  });

  describe('deductCredits', function() {
    beforeEach(function() {
      billing.credits = 100;
    });

    // Success cases
    it('should deduct credits from account', function() {
      var result = billing.deductCredits(25);
      assert.equal(result.deducted, 25);
      assert.equal(result.remainingBalance, 75);
      assert.equal(billing.credits, 75);
    });

    it('should deduct all credits', function() {
      var result = billing.deductCredits(100);
      assert.equal(result.remainingBalance, 0);
      assert.equal(billing.credits, 0);
    });

    // Boundary cases
    it('should handle decimal deduction amounts', function() {
      var result = billing.deductCredits(25.5);
      assert.equal(result.remainingBalance, 74.5);
    });

    // Failure cases
    it('should throw error for insufficient credits', function() {
      assert.throws(function() {
        billing.deductCredits(101);
      }, /Insufficient credits/);
    });

    it('should throw error for negative deduction amount', function() {
      assert.throws(function() {
        billing.deductCredits(-10);
      }, /Deduction amount must be a positive number/);
    });

    it('should throw error for zero deduction amount', function() {
      assert.throws(function() {
        billing.deductCredits(0);
      }, /Deduction amount must be a positive number/);
    });

    it('should throw error for non-numeric deduction amount', function() {
      assert.throws(function() {
        billing.deductCredits('invalid');
      }, /Deduction amount must be a positive number/);
    });
  });

  describe('processPayment', function() {
    var validPaymentData;

    beforeEach(function() {
      validPaymentData = {
        amount: 100.00,
        method: 'credit_card',
        currency: 'USD',
        cardNumber: '**** **** **** 1234'
      };
    });

    // Success cases
    it('should process valid payment', function() {
      var result = billing.processPayment(validPaymentData);
      assert.ok(result.transactionId);
      assert.equal(result.amount, 100.00);
      assert.equal(result.currency, 'USD');
      assert.equal(result.method, 'credit_card');
      assert.equal(result.status, 'completed');
      assert.ok(result.timestamp);
    });

    it('should generate unique transaction IDs', function() {
      var result1 = billing.processPayment(validPaymentData);
      var result2 = billing.processPayment(validPaymentData);
      assert.notEqual(result1.transactionId, result2.transactionId);
    });

    // Boundary cases
    it('should handle minimum payment amount', function() {
      validPaymentData.amount = 0.01;
      var result = billing.processPayment(validPaymentData);
      assert.equal(result.amount, 0.01);
      assert.equal(result.status, 'completed');
    });

    it('should handle large payment amounts', function() {
      validPaymentData.amount = 99999.99;
      var result = billing.processPayment(validPaymentData);
      assert.equal(result.amount, 99999.99);
    });

    // Failure cases
    it('should throw error for missing payment data', function() {
      assert.throws(function() {
        billing.processPayment();
      }, /Payment data is required/);
    });

    it('should throw error for null payment data', function() {
      assert.throws(function() {
        billing.processPayment(null);
      }, /Payment data is required/);
    });

    it('should throw error for missing amount', function() {
      delete validPaymentData.amount;
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Missing required field: amount/);
    });

    it('should throw error for missing method', function() {
      delete validPaymentData.method;
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Missing required field: method/);
    });

    it('should throw error for missing currency', function() {
      delete validPaymentData.currency;
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Missing required field: currency/);
    });

    it('should throw error for negative amount', function() {
      validPaymentData.amount = -50;
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Payment amount must be a positive number/);
    });

    it('should throw error for zero amount', function() {
      validPaymentData.amount = 0;
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Payment amount must be a positive number/);
    });

    it('should throw error for non-numeric amount', function() {
      validPaymentData.amount = 'invalid';
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Payment amount must be a positive number/);
    });

    it('should throw error for currency mismatch', function() {
      validPaymentData.currency = 'EUR';
      assert.throws(function() {
        billing.processPayment(validPaymentData);
      }, /Currency mismatch/);
    });
  });

  describe('createSubscription', function() {
    var validSubscriptionData;

    beforeEach(function() {
      validSubscriptionData = {
        plan: 'basic',
        billingCycle: 'monthly',
        userId: 'user123'
      };
    });

    // Success cases
    it('should create basic monthly subscription', function() {
      var result = billing.createSubscription(validSubscriptionData);
      assert.ok(result.id);
      assert.equal(result.plan, 'basic');
      assert.equal(result.billingCycle, 'monthly');
      assert.equal(result.status, 'active');
      assert.ok(result.createdAt);
      assert.ok(result.nextBillingDate);
    });

    it('should create premium yearly subscription', function() {
      validSubscriptionData.plan = 'premium';
      validSubscriptionData.billingCycle = 'yearly';
      var result = billing.createSubscription(validSubscriptionData);
      assert.equal(result.plan, 'premium');
      assert.equal(result.billingCycle, 'yearly');
    });

    it('should store subscription in subscriptions object', function() {
      var result = billing.createSubscription(validSubscriptionData);
      assert.ok(billing.subscriptions[result.id]);
      assert.equal(billing.subscriptions[result.id].plan, 'basic');
    });

    it('should generate unique subscription IDs', function() {
      var result1 = billing.createSubscription(validSubscriptionData);
      var result2 = billing.createSubscription(validSubscriptionData);
      assert.notEqual(result1.id, result2.id);
    });

    // Boundary cases
    it('should create enterprise subscription', function() {
      validSubscriptionData.plan = 'enterprise';
      var result = billing.createSubscription(validSubscriptionData);
      assert.equal(result.plan, 'enterprise');
    });

    // Failure cases
    it('should throw error for missing subscription data', function() {
      assert.throws(function() {
        billing.createSubscription();
      }, /Subscription data is required/);
    });

    it('should throw error for null subscription data', function() {
      assert.throws(function() {
        billing.createSubscription(null);
      }, /Subscription data is required/);
    });

    it('should throw error for missing plan', function() {
      delete validSubscriptionData.plan;
      assert.throws(function() {
        billing.createSubscription(validSubscriptionData);
      }, /Missing required field: plan/);
    });

    it('should throw error for missing billing cycle', function() {
      delete validSubscriptionData.billingCycle;
      assert.throws(function() {
        billing.createSubscription(validSubscriptionData);
      }, /Missing required field: billingCycle/);
    });

    it('should throw error for invalid plan', function() {
      validSubscriptionData.plan = 'invalid';
      assert.throws(function() {
        billing.createSubscription(validSubscriptionData);
      }, /Invalid plan/);
    });

    it('should throw error for invalid billing cycle', function() {
      validSubscriptionData.billingCycle = 'invalid';
      assert.throws(function() {
        billing.createSubscription(validSubscriptionData);
      }, /Invalid billing cycle/);
    });
  });

  describe('getUsageStats', function() {
    // Success cases
    it('should return zero stats for new billing instance', function() {
      var stats = billing.getUsageStats();
      assert.equal(stats.totalOperations, 0);
      assert.equal(stats.totalCost, 0);
      assert.equal(stats.currentCredits, 0);
      assert.equal(stats.recordCount, 0);
      assert.equal(stats.currency, 'USD');
    });

    it('should calculate stats from usage records', function() {
      billing.usage = [
        { operations: 100, cost: 1.08 },
        { operations: 50, cost: 0.54 }
      ];
      billing.credits = 25;

      var stats = billing.getUsageStats();
      assert.equal(stats.totalOperations, 150);
      assert.equal(stats.totalCost, 1.62);
      assert.equal(stats.currentCredits, 25);
      assert.equal(stats.recordCount, 2);
    });

    // Boundary cases
    it('should handle empty usage records with partial data', function() {
      billing.usage = [
        { operations: 100 }, // missing cost
        { cost: 0.54 } // missing operations
      ];

      var stats = billing.getUsageStats();
      assert.equal(stats.totalOperations, 100);
      assert.equal(stats.totalCost, 0.54);
      assert.equal(stats.recordCount, 2);
    });

    it('should round total cost to 2 decimal places', function() {
      billing.usage = [
        { operations: 333, cost: 3.5964 }
      ];

      var stats = billing.getUsageStats();
      assert.equal(stats.totalCost, 3.60);
    });
  });

  describe('recordUsage', function() {
    // Success cases
    it('should record usage with provided data', function() {
      var usageData = {
        operations: 100,
        cost: 1.08,
        endpoint: '/api/lists'
      };

      billing.recordUsage(usageData);
      assert.equal(billing.usage.length, 1);
      assert.equal(billing.usage[0].operations, 100);
      assert.equal(billing.usage[0].cost, 1.08);
      assert.equal(billing.usage[0].endpoint, '/api/lists');
      assert.ok(billing.usage[0].timestamp);
    });

    it('should record multiple usage entries', function() {
      billing.recordUsage({ operations: 50, cost: 0.54 });
      billing.recordUsage({ operations: 25, cost: 0.27 });
      
      assert.equal(billing.usage.length, 2);
    });

    // Boundary cases
    it('should use default values for missing fields', function() {
      billing.recordUsage({});
      
      assert.equal(billing.usage.length, 1);
      assert.equal(billing.usage[0].operations, 0);
      assert.equal(billing.usage[0].cost, 0);
      assert.ok(billing.usage[0].timestamp);
    });

    it('should override defaults with provided values', function() {
      billing.recordUsage({
        operations: 200,
        cost: 2.16,
        customField: 'test'
      });
      
      assert.equal(billing.usage[0].operations, 200);
      assert.equal(billing.usage[0].cost, 2.16);
      assert.equal(billing.usage[0].customField, 'test');
    });

    // Failure cases
    it('should throw error for missing usage data', function() {
      assert.throws(function() {
        billing.recordUsage();
      }, /Usage data is required/);
    });

    it('should throw error for null usage data', function() {
      assert.throws(function() {
        billing.recordUsage(null);
      }, /Usage data is required/);
    });
  });

  describe('Integration Tests', function() {
    it('should handle complete billing workflow', function() {
      // Add credits
      billing.addCredits(1000);
      assert.equal(billing.credits, 1000);

      // Calculate cost
      var cost = billing.calculateCost(500, 'premium');
      assert.equal(cost.total, 10.80);

      // Deduct credits
      billing.deductCredits(cost.total);
      assert.equal(billing.credits, 989.2);

      // Record usage
      billing.recordUsage({
        operations: 500,
        cost: cost.total,
        tier: 'premium'
      });

      // Check stats
      var stats = billing.getUsageStats();
      assert.equal(stats.totalOperations, 500);
      assert.equal(stats.totalCost, 10.80);
      assert.equal(stats.currentCredits, 989.2);
    });

    it('should handle subscription creation and payment processing', function() {
      // Create subscription
      var subscription = billing.createSubscription({
        plan: 'premium',
        billingCycle: 'yearly'
      });
      assert.equal(subscription.status, 'active');

      // Process payment
      var payment = billing.processPayment({
        amount: 240.00,
        method: 'credit_card',
        currency: 'USD'
      });
      assert.equal(payment.status, 'completed');

      // Verify subscription exists
      assert.ok(billing.subscriptions[subscription.id]);
    });
  });

  describe('Edge Cases and Error Handling', function() {
    it('should handle floating point precision issues', function() {
      var cost = billing.calculateCost(333, 'basic');
      // 333 * 0.01 = 3.33, tax = 3.33 * 0.08 = 0.2664, total = 3.5964
      assert.equal(cost.subtotal, 3.33);
      assert.equal(cost.tax, 0.27); // rounded
      assert.equal(cost.total, 3.60); // rounded
    });

    it('should handle very large numbers', function() {
      var cost = billing.calculateCost(Number.MAX_SAFE_INTEGER);
      assert.ok(typeof cost.total === 'number');
      assert.ok(!isNaN(cost.total));
    });

    it('should maintain state consistency after errors', function() {
      billing.credits = 100;
      
      try {
        billing.deductCredits(-10); // Should fail
      } catch (e) {
        // Error expected
      }
      
      // Credits should remain unchanged
      assert.equal(billing.credits, 100);
    });

    it('should handle concurrent operations', function() {
      var promises = [];
      
      for (var i = 0; i < 10; i++) {
        promises.push(new Promise(function(resolve) {
          billing.recordUsage({ operations: 10, cost: 0.11 });
          resolve();
        }));
      }
      
      return Promise.all(promises).then(function() {
        assert.equal(billing.usage.length, 10);
      });
    });
  });
});