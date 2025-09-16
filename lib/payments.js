/**
 * Payment processing module for SharePoint connector
 * Handles payment transactions with validation and error handling
 */

var _ = require('underscore');

/**
 * Payment processor class
 * @param {Object} options - Configuration options
 */
function PaymentProcessor(options) {
  this.options = _.defaults(options || {}, {
    maxAmount: 10000,
    minAmount: 0.01,
    currency: 'USD',
    timeout: 30000
  });
}

/**
 * Process a payment transaction
 * @param {Object} paymentData - Payment information
 * @param {Function} callback - Callback function (err, result)
 */
PaymentProcessor.prototype.processPayment = function(paymentData, callback) {
  var self = this;
  
  // Validate input
  var validation = this.validatePaymentData(paymentData);
  if (!validation.isValid) {
    return callback(new Error('Validation failed: ' + validation.errors.join(', ')));
  }

  // Simulate async payment processing
  setTimeout(function() {
    try {
      // Simulate different outcomes based on amount
      if (paymentData.amount === 999.99) {
        // Simulate network timeout
        return callback(new Error('Payment timeout - please try again'));
      }
      
      if (paymentData.amount === 888.88) {
        // Simulate insufficient funds
        return callback(new Error('Insufficient funds'));
      }
      
      if (paymentData.amount === 777.77) {
        // Simulate card declined
        return callback(new Error('Card declined by issuer'));
      }

      if (paymentData.amount >= self.options.maxAmount) {
        return callback(new Error('Amount exceeds maximum limit'));
      }

      // Success case
      var result = {
        transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'completed',
        amount: paymentData.amount,
        currency: paymentData.currency || self.options.currency,
        timestamp: new Date().toISOString(),
        paymentMethod: paymentData.paymentMethod
      };

      callback(null, result);
    } catch (error) {
      callback(error);
    }
  }, Math.random() * 100); // Random delay to simulate network latency
};

/**
 * Validate payment data
 * @param {Object} paymentData - Payment data to validate
 * @returns {Object} Validation result
 */
PaymentProcessor.prototype.validatePaymentData = function(paymentData) {
  var errors = [];

  if (!paymentData) {
    errors.push('Payment data is required');
    return { isValid: false, errors: errors };
  }

  // Amount validation
  if (typeof paymentData.amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (paymentData.amount < this.options.minAmount) {
    errors.push('Amount must be at least ' + this.options.minAmount);
  } else if (paymentData.amount > this.options.maxAmount) {
    errors.push('Amount cannot exceed ' + this.options.maxAmount);
  } else if (paymentData.amount <= 0) {
    errors.push('Amount must be positive');
  } else if (!isFinite(paymentData.amount)) {
    errors.push('Amount must be a finite number');
  }

  // Payment method validation
  if (!paymentData.paymentMethod) {
    errors.push('Payment method is required');
  } else if (typeof paymentData.paymentMethod !== 'string') {
    errors.push('Payment method must be a string');
  }

  // Currency validation (if provided)
  if (paymentData.currency && typeof paymentData.currency !== 'string') {
    errors.push('Currency must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Refund a payment
 * @param {string} transactionId - Transaction ID to refund
 * @param {number} amount - Amount to refund (optional, defaults to full amount)
 * @param {Function} callback - Callback function
 */
PaymentProcessor.prototype.refundPayment = function(transactionId, amount, callback) {
  // Handle optional amount parameter
  if (typeof amount === 'function') {
    callback = amount;
    amount = null;
  }

  if (!transactionId || typeof transactionId !== 'string') {
    return callback(new Error('Valid transaction ID is required'));
  }

  if (amount !== null && (typeof amount !== 'number' || amount <= 0)) {
    return callback(new Error('Refund amount must be a positive number'));
  }

  // Simulate async refund processing
  setTimeout(function() {
    // Simulate failure for specific transaction ID
    if (transactionId === 'TXN_FAIL_REFUND') {
      return callback(new Error('Refund failed - transaction not found'));
    }

    var refundResult = {
      refundId: 'REF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      originalTransactionId: transactionId,
      status: 'completed',
      refundAmount: amount || 'full',
      timestamp: new Date().toISOString()
    };

    callback(null, refundResult);
  }, 50);
};

/**
 * Get payment status
 * @param {string} transactionId - Transaction ID to check
 * @param {Function} callback - Callback function
 */
PaymentProcessor.prototype.getPaymentStatus = function(transactionId, callback) {
  if (!transactionId || typeof transactionId !== 'string') {
    return callback(new Error('Valid transaction ID is required'));
  }

  setTimeout(function() {
    // Simulate different statuses based on transaction ID
    var status = 'completed';
    if (transactionId.includes('PENDING')) {
      status = 'pending';
    } else if (transactionId.includes('FAILED')) {
      status = 'failed';
    }

    var statusResult = {
      transactionId: transactionId,
      status: status,
      timestamp: new Date().toISOString()
    };

    callback(null, statusResult);
  }, 25);
};

module.exports = PaymentProcessor;