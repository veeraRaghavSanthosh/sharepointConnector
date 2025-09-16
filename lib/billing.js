/**
 * SharePoint Billing Module
 * Handles billing operations for SharePoint connector usage
 */

var _ = require('underscore');

/**
 * Billing class for managing SharePoint connector billing
 */
function Billing(options) {
  this.options = _.defaults(options || {}, {
    currency: 'USD',
    taxRate: 0.08,
    basePrice: 0.01,
    premiumMultiplier: 2.0,
    maxCredits: 10000,
    minCredits: 1
  });
  
  this.credits = 0;
  this.usage = [];
  this.subscriptions = {};
}

/**
 * Calculate cost for API operations
 */
Billing.prototype.calculateCost = function(operationCount, tier) {
  if (typeof operationCount !== 'number' || operationCount < 0) {
    throw new Error('Operation count must be a non-negative number');
  }
  
  if (!operationCount) {
    return {
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: this.options.currency,
      operations: 0,
      tier: tier || 'basic'
    };
  }
  
  var multiplier = (tier === 'premium') ? this.options.premiumMultiplier : 1;
  var subtotal = operationCount * this.options.basePrice * multiplier;
  var tax = subtotal * this.options.taxRate;
  var total = subtotal + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: this.options.currency,
    operations: operationCount,
    tier: tier || 'basic'
  };
};

/**
 * Add credits to the account
 */
Billing.prototype.addCredits = function(amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Credit amount must be a positive number');
  }
  
  var newTotal = this.credits + amount;
  if (newTotal > this.options.maxCredits) {
    throw new Error('Cannot exceed maximum credit limit of ' + this.options.maxCredits);
  }
  
  this.credits = newTotal;
  return {
    previousBalance: this.credits - amount,
    added: amount,
    currentBalance: this.credits,
    maxCredits: this.options.maxCredits
  };
};

/**
 * Deduct credits for operations
 */
Billing.prototype.deductCredits = function(amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Deduction amount must be a positive number');
  }
  
  if (this.credits < amount) {
    throw new Error('Insufficient credits. Required: ' + amount + ', Available: ' + this.credits);
  }
  
  this.credits -= amount;
  return {
    deducted: amount,
    remainingBalance: this.credits
  };
};

/**
 * Process a payment
 */
Billing.prototype.processPayment = function(paymentData) {
  if (!paymentData || typeof paymentData !== 'object') {
    throw new Error('Payment data is required');
  }
  
  var required = ['amount', 'method', 'currency'];
  for (var i = 0; i < required.length; i++) {
    if (!paymentData[required[i]]) {
      throw new Error('Missing required field: ' + required[i]);
    }
  }
  
  if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
    throw new Error('Payment amount must be a positive number');
  }
  
  if (paymentData.currency !== this.options.currency) {
    throw new Error('Currency mismatch. Expected: ' + this.options.currency + ', Received: ' + paymentData.currency);
  }
  
  var transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  return {
    transactionId: transactionId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    method: paymentData.method,
    status: 'completed',
    timestamp: new Date().toISOString()
  };
};

/**
 * Create a subscription
 */
Billing.prototype.createSubscription = function(subscriptionData) {
  if (!subscriptionData || typeof subscriptionData !== 'object') {
    throw new Error('Subscription data is required');
  }
  
  var required = ['plan', 'billingCycle'];
  for (var i = 0; i < required.length; i++) {
    if (!subscriptionData[required[i]]) {
      throw new Error('Missing required field: ' + required[i]);
    }
  }
  
  var validPlans = ['basic', 'premium', 'enterprise'];
  if (validPlans.indexOf(subscriptionData.plan) === -1) {
    throw new Error('Invalid plan. Valid options: ' + validPlans.join(', '));
  }
  
  var validCycles = ['monthly', 'yearly'];
  if (validCycles.indexOf(subscriptionData.billingCycle) === -1) {
    throw new Error('Invalid billing cycle. Valid options: ' + validCycles.join(', '));
  }
  
  var subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  var subscription = {
    id: subscriptionId,
    plan: subscriptionData.plan,
    billingCycle: subscriptionData.billingCycle,
    status: 'active',
    createdAt: new Date().toISOString(),
    nextBillingDate: this._calculateNextBillingDate(subscriptionData.billingCycle)
  };
  
  this.subscriptions[subscriptionId] = subscription;
  
  return subscription;
};

/**
 * Get current usage statistics
 */
Billing.prototype.getUsageStats = function() {
  var totalOperations = this.usage.reduce(function(sum, record) {
    return sum + (record.operations || 0);
  }, 0);
  
  var totalCost = this.usage.reduce(function(sum, record) {
    return sum + (record.cost || 0);
  }, 0);
  
  return {
    totalOperations: totalOperations,
    totalCost: Math.round(totalCost * 100) / 100,
    currentCredits: this.credits,
    recordCount: this.usage.length,
    currency: this.options.currency
  };
};

/**
 * Record usage for billing
 */
Billing.prototype.recordUsage = function(usageData) {
  if (!usageData || typeof usageData !== 'object') {
    throw new Error('Usage data is required');
  }
  
  var record = _.extend({
    timestamp: new Date().toISOString(),
    operations: 0,
    cost: 0
  }, usageData);
  
  this.usage.push(record);
};

/**
 * Calculate next billing date
 */
Billing.prototype._calculateNextBillingDate = function(cycle) {
  var now = new Date();
  var nextDate = new Date(now);
  
  if (cycle === 'monthly') {
    nextDate.setMonth(now.getMonth() + 1);
  } else if (cycle === 'yearly') {
    nextDate.setFullYear(now.getFullYear() + 1);
  }
  
  return nextDate.toISOString();
};

module.exports = Billing;