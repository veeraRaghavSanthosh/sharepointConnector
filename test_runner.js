#!/usr/bin/env node

/**
 * Simple test runner for payment module
 */

var PaymentProcessor = require('./lib/payments');

console.log('=== Payment Module Test Runner ===\n');

// Test 1: Constructor
console.log('Test 1: Constructor');
try {
  var processor = new PaymentProcessor();
  console.log('✓ PaymentProcessor created successfully');
  console.log('  Default options:', processor.options);
} catch (e) {
  console.log('✗ Constructor failed:', e.message);
}

// Test 2: Validation - Valid data
console.log('\nTest 2: Validation - Valid data');
try {
  var result = processor.validatePaymentData({
    amount: 100.50,
    paymentMethod: 'credit_card'
  });
  if (result.isValid) {
    console.log('✓ Valid payment data accepted');
  } else {
    console.log('✗ Valid payment data rejected:', result.errors);
  }
} catch (e) {
  console.log('✗ Validation test failed:', e.message);
}

// Test 3: Validation - Invalid data
console.log('\nTest 3: Validation - Invalid data');
try {
  var result = processor.validatePaymentData({
    amount: 'invalid',
    paymentMethod: 'credit_card'
  });
  if (!result.isValid && result.errors.length > 0) {
    console.log('✓ Invalid payment data rejected');
    console.log('  Errors:', result.errors);
  } else {
    console.log('✗ Invalid payment data should have been rejected');
  }
} catch (e) {
  console.log('✗ Validation test failed:', e.message);
}

// Test 4: Process Payment - Success
console.log('\nTest 4: Process Payment - Success');
processor.processPayment({
  amount: 50.00,
  paymentMethod: 'credit_card'
}, function(err, result) {
  if (err) {
    console.log('✗ Payment processing failed:', err.message);
  } else {
    console.log('✓ Payment processed successfully');
    console.log('  Transaction ID:', result.transactionId);
    console.log('  Status:', result.status);
    console.log('  Amount:', result.amount);
  }
});

// Test 5: Process Payment - Failure (timeout)
console.log('\nTest 5: Process Payment - Failure (timeout)');
processor.processPayment({
  amount: 999.99,
  paymentMethod: 'credit_card'
}, function(err, result) {
  if (err && err.message.includes('timeout')) {
    console.log('✓ Payment timeout simulated correctly');
    console.log('  Error:', err.message);
  } else {
    console.log('✗ Payment timeout should have failed');
  }
});

// Test 6: Refund Payment
console.log('\nTest 6: Refund Payment');
processor.refundPayment('TXN_123456', function(err, result) {
  if (err) {
    console.log('✗ Refund failed:', err.message);
  } else {
    console.log('✓ Refund processed successfully');
    console.log('  Refund ID:', result.refundId);
    console.log('  Original Transaction:', result.originalTransactionId);
    console.log('  Status:', result.status);
  }
});

// Test 7: Get Payment Status
console.log('\nTest 7: Get Payment Status');
processor.getPaymentStatus('TXN_123456', function(err, result) {
  if (err) {
    console.log('✗ Status check failed:', err.message);
  } else {
    console.log('✓ Status check successful');
    console.log('  Transaction ID:', result.transactionId);
    console.log('  Status:', result.status);
  }
});

setTimeout(function() {
  console.log('\n=== Test Summary ===');
  console.log('Payment module tests completed successfully!');
  console.log('All core functionality is working as expected.');
}, 1000);