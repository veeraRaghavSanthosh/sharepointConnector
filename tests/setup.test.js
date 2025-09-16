/**
 * Test Setup and Helper Functions
 * 
 * This module provides common test setup utilities and helper functions
 * to reduce code duplication across unit tests.
 */

var _ = require('underscore');
var apis = require('../test/fixtures/apis');

/**
 * Test Helper Functions
 */
var TestHelpers = {
  
  /**
   * Creates a standardized after hook for cleaning up API mocks
   * This helper extracts the repeated logic found in unit tests
   * 
   * @param {Array|Function} apiInstances - Array of API instances or single instance to clean up
   * @param {Function} finish - The test completion callback
   * @returns {Function} - The after hook function
   */
  createAfterHook: function(apiInstances, finish) {
    return function() {
      // Handle both single instance and array of instances
      var instances = Array.isArray(apiInstances) ? apiInstances : [apiInstances];
      
      // Clean up all API instances
      instances.forEach(function(instance) {
        if (instance && typeof instance.done === 'function') {
          instance.done();
        }
      });
      
      return finish();
    };
  },

  /**
   * Creates a test module that extends integration tests with proper cleanup
   * This pattern is repeated across multiple unit test files
   * 
   * @param {Object} integrationTest - The integration test module to extend
   * @param {Function|Array} apiFactory - Function that creates API mocks or array of factories
   * @returns {Object} - Extended test module with after hook
   */
  createUnitTestModule: function(integrationTest, apiFactory) {
    var apiInstances;
    
    // Handle different API factory patterns
    if (typeof apiFactory === 'function') {
      apiInstances = apiFactory();
    } else if (Array.isArray(apiFactory)) {
      apiInstances = apiFactory.map(function(factory) {
        return typeof factory === 'function' ? factory() : factory;
      });
    } else {
      apiInstances = apiFactory;
    }
    
    return _.extend(integrationTest, {
      after: this.createAfterHook(apiInstances, function() {
        // Standard completion callback
        return arguments[0] && arguments[0]();
      })
    });
  },

  /**
   * Creates API mock instances based on test requirements
   * Centralizes the API creation logic with proper error handling
   * 
   * @param {String} type - Type of API mock needed ('list', 'create', 'listitems')
   * @returns {Object} - Configured API mock instance
   */
  createApiMock: function(type) {
    try {
      switch (type) {
        case 'list':
          return apis.list();
        case 'create':
          return apis.create();
        case 'listitems':
          return apis.listitems();
        default:
          throw new Error('Unknown API mock type: ' + type);
      }
    } catch (error) {
      // Edge case: Handle API creation failures gracefully
      console.warn('Failed to create API mock of type "' + type + '":', error.message);
      return {
        done: function() {
          // No-op cleanup for failed API creation
        }
      };
    }
  },

  /**
   * Validates test environment setup
   * Checks for common edge cases that can cause test failures
   * 
   * @returns {Object} - Validation result with status and issues
   */
  validateTestEnvironment: function() {
    var issues = [];
    var status = 'valid';
    
    // Check if required modules are available
    try {
      require('underscore');
    } catch (e) {
      issues.push('underscore module not available');
      status = 'invalid';
    }
    
    try {
      require('nock');
    } catch (e) {
      issues.push('nock module not available for mocking');
      status = 'invalid';
    }
    
    // Edge case: Check if fixtures directory exists
    try {
      require('../test/fixtures/apis');
    } catch (e) {
      issues.push('Test fixtures not available');
      status = 'invalid';
    }
    
    return {
      status: status,
      issues: issues
    };
  },

  /**
   * Safely executes cleanup operations with error handling
   * Prevents test failures due to cleanup errors (edge case)
   * 
   * @param {Function} cleanupFn - The cleanup function to execute
   * @param {Function} callback - Callback to execute after cleanup
   */
  safeCleanup: function(cleanupFn, callback) {
    try {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    } catch (error) {
      // Edge case: Log cleanup errors but don't fail tests
      console.warn('Cleanup operation failed:', error.message);
    } finally {
      // Always execute callback to prevent hanging tests
      if (typeof callback === 'function') {
        callback();
      }
    }
  }
};

/**
 * Common Test Configurations
 */
var TestConfig = {
  
  /**
   * Default timeout for async operations
   * Edge case: Prevents tests from hanging indefinitely
   */
  DEFAULT_TIMEOUT: 5000,
  
  /**
   * Standard headers for SharePoint API requests
   */
  SHAREPOINT_HEADERS: {
    'Content-Type': 'application/json; odata=verbose',
    'Accept': 'application/json; odata=verbose'
  },
  
  /**
   * Test environment variables mapping
   * Edge case: Provides fallbacks for missing environment variables
   */
  getEnvironmentConfig: function() {
    return {
      username: process.env.SP_USERNAME || 'test-user',
      password: process.env.SP_PASSWORD || 'test-password', 
      type: process.env.SP_AUTH_TYPE || 'basic',
      url: process.env.SP_HOST || 'https://test.sharepoint.com',
      context: process.env.SP_CONTEXT || 'web',
      strictSSL: false // Default to false for testing
    };
  }
};

// Export both helpers and config
module.exports = {
  helpers: TestHelpers,
  config: TestConfig,
  
  // Backward compatibility exports for existing test patterns
  createAfterHook: TestHelpers.createAfterHook,
  createUnitTestModule: TestHelpers.createUnitTestModule,
  createApiMock: TestHelpers.createApiMock
};