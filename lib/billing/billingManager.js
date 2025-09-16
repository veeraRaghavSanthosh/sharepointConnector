/**
 * Billing Manager for SharePoint Connector
 * Handles billing operations, usage tracking, and payment processing
 * Maintains backward compatibility with existing APIs
 */

var _ = require('underscore');
var async = require('async');

/**
 * Billing Manager Constructor
 * @param {Object} options - Configuration options
 */
function BillingManager(options) {
  this.options = _.extend({
    currency: 'USD',
    rates: {
      storage_gb: 0.10,      // $0.10 per GB
      api_calls: 0.001,      // $0.001 per API call
      data_transfer_gb: 0.05, // $0.05 per GB transfer
      document_upload: 0.01,  // $0.01 per upload
      document_download: 0.005, // $0.005 per download
      search_query: 0.001     // $0.001 per search
    },
    limits: {
      max_storage_gb: 10000,
      max_api_calls: 10000000,
      max_data_transfer_gb: 5000
    }
  }, options || {});
  
  this.accounts = {};
  this.usage_data = {};
  this.transactions = {};
}

/**
 * Create a billing account for a user
 * @param {Object} userData - User account data
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.createBillingAccount = function(userData, callback) {
  var self = this;
  
  // Handle legacy format - normalize field names first
  var normalizedData = this._normalizeLegacyUserData(userData || {});
  
  // Validate required fields after normalization
  if (!normalizedData.user_id) {
    return callback(new Error('User ID is required'));
  }
  
  var accountId = 'acc_' + normalizedData.user_id;
  var account = {
    account_id: accountId,
    user_id: normalizedData.user_id,
    email: normalizedData.email,
    subscription_type: normalizedData.subscription_type || 'basic',
    status: 'active',
    created_at: new Date(),
    billing_address: normalizedData.billing_address || {}
  };
  
  this.accounts[accountId] = account;
  
  // Initialize usage tracking for this user
  this.usage_data[normalizedData.user_id] = {
    storage_gb: 0,
    api_calls: 0,
    data_transfer_gb: 0,
    document_uploads: 0,
    document_downloads: 0,
    search_queries: 0,
    last_updated: new Date()
  };
  
  callback(null, account);
};

/**
 * Calculate monthly bill for a user
 * @param {String} userId - User ID
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.calculateMonthlyBill = function(userId, callback) {
  var self = this;
  
  // Check if user exists
  var userAccount = this._findUserAccount(userId);
  if (!userAccount) {
    return callback(new Error('User ' + userId + ' not found'));
  }
  
  var usage = this.usage_data[userId] || {};
  var rates = this.options.rates;
  
  // Calculate individual costs
  var storageCost = this._calculateDecimal(usage.storage_gb * rates.storage_gb);
  var apiCost = this._calculateDecimal(usage.api_calls * rates.api_calls);
  var transferCost = this._calculateDecimal(usage.data_transfer_gb * rates.data_transfer_gb);
  var uploadCost = this._calculateDecimal(usage.document_uploads * rates.document_upload);
  var downloadCost = this._calculateDecimal(usage.document_downloads * rates.document_download);
  var searchCost = this._calculateDecimal(usage.search_queries * rates.search_query);
  
  var totalAmount = storageCost + apiCost + transferCost + uploadCost + downloadCost + searchCost;
  
  var bill = {
    user_id: userId,
    total_amount: this._formatCurrency(totalAmount),
    currency: this.options.currency,
    breakdown: [
      { description: 'Storage (' + usage.storage_gb + 'GB)', amount: this._formatCurrency(storageCost) },
      { description: 'API Calls (' + usage.api_calls + ')', amount: this._formatCurrency(apiCost) },
      { description: 'Data Transfer (' + usage.data_transfer_gb + 'GB)', amount: this._formatCurrency(transferCost) },
      { description: 'Document Uploads (' + usage.document_uploads + ')', amount: this._formatCurrency(uploadCost) },
      { description: 'Document Downloads (' + usage.document_downloads + ')', amount: this._formatCurrency(downloadCost) },
      { description: 'Search Queries (' + usage.search_queries + ')', amount: this._formatCurrency(searchCost) }
    ],
    period_start: this._getMonthStart(),
    period_end: this._getMonthEnd(),
    generated_at: new Date()
  };
  
  callback(null, bill);
};

/**
 * Process payment for a user
 * @param {String} userId - User ID
 * @param {Object} paymentData - Payment information
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.processPayment = function(userId, paymentData, callback) {
  var self = this;
  
  // Validate payment data
  var validationError = this._validatePaymentData(paymentData);
  if (validationError) {
    return callback(validationError);
  }
  
  // Handle legacy payment data format
  var normalizedPayment = this._normalizeLegacyPaymentData(paymentData);
  
  // Simulate payment processing
  this._processPaymentTransaction(normalizedPayment, function(err, result) {
    if (err) {
      return callback(err);
    }
    
    var transactionId = 'txn_' + userId + '_' + Date.now();
    var transaction = {
      transaction_id: transactionId,
      user_id: userId,
      amount: normalizedPayment.amount,
      currency: normalizedPayment.currency,
      status: result.status,
      payment_method: normalizedPayment.payment_method,
      processed_at: new Date()
    };
    
    self.transactions[transactionId] = transaction;
    
    callback(null, {
      status: result.status,
      transaction_id: transactionId,
      amount: normalizedPayment.amount,
      currency: normalizedPayment.currency
    });
  });
};

/**
 * Generate invoice for billing period
 * @param {Object} invoiceData - Invoice data
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.generateInvoice = function(invoiceData, callback) {
  var invoiceId = 'inv_' + invoiceData.user_id + '_' + Date.now();
  
  var invoice = {
    invoice_id: invoiceId,
    invoice_number: 'INV-' + invoiceId.slice(-8).toUpperCase(),
    user_id: invoiceData.user_id,
    total_amount: invoiceData.amount,
    currency: this.options.currency,
    items: invoiceData.items || [],
    period: invoiceData.period,
    status: 'generated',
    created_at: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  };
  
  callback(null, invoice);
};

/**
 * Track API usage for billing
 * @param {String} userId - User ID
 * @param {String} operation - Operation type
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.trackApiUsage = function(userId, operation, callback) {
  callback = callback || function() {};
  
  if (!this.usage_data[userId]) {
    this.usage_data[userId] = {
      storage_gb: 0,
      api_calls: 0,
      data_transfer_gb: 0,
      document_uploads: 0,
      document_downloads: 0,
      search_queries: 0,
      last_updated: new Date()
    };
  }
  
  var usage = this.usage_data[userId];
  
  switch (operation) {
    case 'api_call':
      usage.api_calls++;
      break;
    case 'document_upload':
      usage.document_uploads++;
      break;
    case 'document_download':
      usage.document_downloads++;
      break;
    case 'search_query':
      usage.search_queries++;
      break;
    default:
      usage.api_calls++;
  }
  
  usage.last_updated = new Date();
  callback(null, true);
};

/**
 * Track storage usage
 * @param {String} userId - User ID
 * @param {Number} sizeInBytes - Size in bytes
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.trackStorageUsage = function(userId, sizeInBytes, callback) {
  callback = callback || function() {};
  
  if (sizeInBytes < 0) {
    return callback(new Error('Storage size cannot be negative'));
  }
  
  if (!this.usage_data[userId]) {
    this.usage_data[userId] = { storage_gb: 0 };
  }
  
  var sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  this.usage_data[userId].storage_gb += sizeInGB;
  this.usage_data[userId].last_updated = new Date();
  
  callback(null, true);
};

/**
 * Get usage summary for a user
 * @param {String} userId - User ID
 * @param {Function} callback - Callback function
 */
BillingManager.prototype.getUsageSummary = function(userId, callback) {
  var usage = this.usage_data[userId];
  if (!usage) {
    return callback(new Error('No usage data found for user: ' + userId));
  }
  
  callback(null, _.clone(usage));
};

// Private helper methods

BillingManager.prototype._normalizeLegacyUserData = function(userData) {
  // Handle different field name formats for backward compatibility
  var normalized = {
    user_id: userData.user_id || userData.USER_ID || userData.userId,
    email: userData.email || userData.Email || userData.EMAIL,
    subscription_type: userData.subscription_type || userData.subscriptionType,
    billing_address: userData.billing_address || userData.billingAddress
  };
  
  // Copy over any other fields
  _.each(userData, function(value, key) {
    if (!normalized.hasOwnProperty(key.toLowerCase())) {
      normalized[key] = value;
    }
  });
  
  return normalized;
};

BillingManager.prototype._normalizeLegacyPaymentData = function(paymentData) {
  return {
    amount: parseFloat(paymentData.amount), // Convert string amounts to numbers
    currency: paymentData.currency || 'USD',
    payment_method: paymentData.payment_method || paymentData.paymentMethod || 'credit_card',
    card_token: paymentData.card_token || paymentData.cardToken || 
                paymentData.payment_token || paymentData.paymentToken || 
                paymentData.token
  };
};

BillingManager.prototype._findUserAccount = function(userId) {
  return _.find(this.accounts, function(account) {
    return account.user_id === userId;
  });
};

BillingManager.prototype._validatePaymentData = function(paymentData) {
  if (!paymentData) {
    return new Error('Payment data is required');
  }
  
  var amount = parseFloat(paymentData.amount);
  if (isNaN(amount) || amount <= 0) {
    return new Error('Amount must be a positive number');
  }
  
  // More flexible token validation
  var hasToken = paymentData.card_token || paymentData.cardToken || 
                 paymentData.payment_token || paymentData.paymentToken ||
                 paymentData.token;
  
  if (!hasToken) {
    return new Error('Payment token is required');
  }
  
  return null;
};

BillingManager.prototype._processPaymentTransaction = function(paymentData, callback) {
  // Simulate payment processing with different scenarios
  setTimeout(function() {
    var token = paymentData.card_token || paymentData.cardToken;
    
    if (token === 'tok_declined' || token === 'tok_insufficient_funds') {
      return callback(new Error('Payment declined: Insufficient funds'));
    }
    
    if (token === 'invalid_token') {
      return callback(new Error('Invalid payment token'));
    }
    
    if (token === 'tok_network_error') {
      return callback(new Error('Network error during payment processing'));
    }
    
    // Successful payment
    callback(null, { status: 'success' });
  }, 100); // Simulate processing delay
};

BillingManager.prototype._calculateDecimal = function(value) {
  return Math.round(value * 100) / 100; // Round to 2 decimal places
};

BillingManager.prototype._formatCurrency = function(amount) {
  return this._calculateDecimal(amount);
};

BillingManager.prototype._getMonthStart = function() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

BillingManager.prototype._getMonthEnd = function() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
};

module.exports = BillingManager;