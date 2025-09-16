#!/usr/bin/env node
/**
 * Simple test script to verify logging functionality
 */

console.log('Testing SharePoint Connector Logging...');

try {
  // Test logger module
  var loggerModule = require('./lib/util/logger');
  var testClient = { logLevel: 'trace', verbose: false };
  var logger = loggerModule.createLogger(testClient, 'test');
  
  console.log('Logger module loaded successfully');
  console.log('Available log levels:', Object.keys(loggerModule.LOG_LEVELS));
  
  // Test logging output
  logger.trace('This is a trace message');
  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
  
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}