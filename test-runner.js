#!/usr/bin/env node

/**
 * Simple test runner for setup validation tests
 */

var setupTests = require('./test/unit/test-setup');

console.log('Running SharePoint Connector setup validation tests...\n');

var testCount = 0;
var passCount = 0;
var failCount = 0;

function runTest(testName, testFunction) {
  testCount++;
  console.log('Running:', testName);
  
  try {
    testFunction(function(error) {
      if (error) {
        console.log('  ✗ FAIL:', error.message);
        failCount++;
      } else {
        console.log('  ✓ PASS');
        passCount++;
      }
    });
  } catch (error) {
    console.log('  ✗ FAIL:', error.message);
    failCount++;
  }
}

// Run all tests
Object.keys(setupTests).forEach(function(testName) {
  if (typeof setupTests[testName] === 'function') {
    runTest(testName, setupTests[testName]);
  }
});

console.log('\n--- Test Results ---');
console.log('Total tests:', testCount);
console.log('Passed:', passCount);
console.log('Failed:', failCount);

if (failCount > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed');
  process.exit(0);
}