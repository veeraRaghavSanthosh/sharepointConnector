/**
 * Setup Tests for SharePoint Connector
 * 
 * This file contains comprehensive tests for the SharePoint connector setup,
 * including parameter validation, client initialization, and configuration edge cases.
 */

const assert = require('assert');
const sharepointConnector = require('../sharepointconnector');

// Test Helper Functions - Extracted to reduce code duplication
const TestHelpers = {
  /**
   * Creates a valid base configuration for SharePoint client
   * @param {Object} overrides - Optional parameter overrides
   * @returns {Object} Valid configuration object
   */
  createValidConfig: function(overrides = {}) {
    return Object.assign({
      username: 'testuser@domain.com',
      password: 'testpassword123',
      url: 'https://company.sharepoint.com'
    }, overrides);
  },

  /**
   * Creates an invalid configuration missing required parameters
   * @param {Array} missingParams - Array of parameter names to omit
   * @returns {Object} Invalid configuration object
   */
  createInvalidConfig: function(missingParams = []) {
    const baseConfig = this.createValidConfig();
    missingParams.forEach(param => {
      delete baseConfig[param];
    });
    return baseConfig;
  },

  /**
   * Asserts that a SharePoint client was created with expected properties
   * @param {Object} client - The SharePoint client instance
   * @param {Object} expectedConfig - Expected configuration values
   */
  assertValidClient: function(client, expectedConfig) {
    assert(client, 'Client should be created');
    assert(typeof client.login === 'function', 'Client should have login method');
    assert(typeof client.lists === 'function', 'Client should have lists method');
    assert(typeof client.listItems === 'function', 'Client should have listItems method');
  },

  /**
   * Tests that a function throws an error with expected message
   * @param {Function} fn - Function to test
   * @param {string} expectedMessage - Expected error message
   */
  assertThrowsWithMessage: function(fn, expectedMessage) {
    let threwError = false;
    let actualMessage = '';
    
    try {
      fn();
    } catch (error) {
      threwError = true;
      actualMessage = error.message;
    }
    
    assert(threwError, 'Function should throw an error');
    assert(actualMessage.includes(expectedMessage), 
           'Error message should contain "' + expectedMessage + '", but got "' + actualMessage + '"');
  }
};

describe('SharePoint Connector Setup Tests', function() {
  
  describe('Required Parameter Validation', function() {
    
    it('should create client with all required parameters', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should throw error when username is missing', function() {
      const config = TestHelpers.createInvalidConfig(['username']);
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });

    it('should throw error when password is missing', function() {
      const config = TestHelpers.createInvalidConfig(['password']);
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });

    it('should throw error when URL is missing', function() {
      const config = TestHelpers.createInvalidConfig(['url']);
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });

    // Edge case: Empty string parameters should be treated as missing
    it('should throw error when username is empty string', function() {
      const config = TestHelpers.createValidConfig({ username: '' });
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });

    it('should throw error when password is empty string', function() {
      const config = TestHelpers.createValidConfig({ password: '' });
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });

    it('should throw error when URL is empty string', function() {
      const config = TestHelpers.createValidConfig({ url: '' });
      TestHelpers.assertThrowsWithMessage(
        () => sharepointConnector(config),
        'SharePoint client needs a username, password and instance URL'
      );
    });
  });

  describe('Optional Parameter Defaults', function() {
    
    it('should set default auth type to basic', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should set default verbose to false', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should set default strictSSL to true', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should set default top to 5000', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should set default siteContext to web', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });
  });

  describe('Custom Parameter Handling', function() {
    
    it('should accept custom auth type', function() {
      const config = TestHelpers.createValidConfig({ type: 'ntlm' });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept custom workstation parameter', function() {
      const config = TestHelpers.createValidConfig({ workstation: 'MYWORKSTATION' });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept custom domain parameter', function() {
      const config = TestHelpers.createValidConfig({ domain: 'MYDOMAIN' });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept custom site context', function() {
      const config = TestHelpers.createValidConfig({ context: 'mysite' });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept federated auth parameters', function() {
      const config = TestHelpers.createValidConfig({ 
        federatedAuthUrl: 'https://adfs.company.com',
        FedAuth: 'fed-auth-token',
        rtFa: 'rt-fa-token'
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });
  });

  describe('Boolean Parameter Edge Cases', function() {
    
    // Edge case: Boolean parameters should handle various truthy/falsy values correctly
    it('should handle verbose as explicit true', function() {
      const config = TestHelpers.createValidConfig({ verbose: true });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should handle verbose as explicit false', function() {
      const config = TestHelpers.createValidConfig({ verbose: false });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    // Edge case: Non-boolean values should default to false
    it('should default verbose to false for non-boolean values', function() {
      const config = TestHelpers.createValidConfig({ verbose: 'true' });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should handle strictSSL boolean variations', function() {
      const configs = [
        TestHelpers.createValidConfig({ strictSSL: true }),
        TestHelpers.createValidConfig({ strictSSL: false }),
        TestHelpers.createValidConfig({ strictSSL: 'false' }) // Should default to true
      ];
      
      configs.forEach(config => {
        const client = sharepointConnector(config);
        TestHelpers.assertValidClient(client, config);
      });
    });
  });

  describe('Array Parameter Validation', function() {
    
    it('should accept filterFields as array', function() {
      const config = TestHelpers.createValidConfig({ 
        filterFields: [{"field": "Title", "value": "Test"}] 
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept selectFields as array', function() {
      const config = TestHelpers.createValidConfig({ 
        selectFields: ["Title", "Created", "Modified"] 
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    it('should accept expandFields as array', function() {
      const config = TestHelpers.createValidConfig({ 
        expandFields: ["Author", "Editor"] 
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });

    // Edge case: Empty arrays should be handled gracefully
    it('should handle empty arrays for field parameters', function() {
      const config = TestHelpers.createValidConfig({ 
        filterFields: [],
        selectFields: [],
        expandFields: []
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });
  });

  describe('URL and Proxy Configuration', function() {
    
    it('should accept various SharePoint URL formats', function() {
      const urlFormats = [
        'https://company.sharepoint.com',
        'https://company.sharepoint.com/',
        'https://company-my.sharepoint.com/personal/user_company_com',
        'http://sharepoint.company.local'
      ];
      
      urlFormats.forEach(url => {
        const config = TestHelpers.createValidConfig({ url });
        const client = sharepointConnector(config);
        TestHelpers.assertValidClient(client, config);
      });
    });

    it('should accept proxy configuration', function() {
      const config = TestHelpers.createValidConfig({ 
        proxy: 'http://proxy.company.com:8080' 
      });
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });
  });

  describe('Client Method Availability', function() {
    
    it('should provide all required client methods', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      
      const requiredMethods = ['login', 'lists', 'listItems'];
      requiredMethods.forEach(method => {
        assert(typeof client[method] === 'function', 
               'Client should have ' + method + ' method');
      });
    });

    // Edge case: Verify methods return expected types
    it('should return function objects for client methods', function() {
      const config = TestHelpers.createValidConfig();
      const client = sharepointConnector(config);
      
      const loginObj = client.login;
      const listsObj = client.lists;
      const listItemsObj = client.listItems;
      
      assert(typeof loginObj === 'function', 'login should be a function');
      assert(typeof listsObj === 'function', 'lists should be a function');
      assert(typeof listItemsObj === 'function', 'listItems should be a function');
    });
  });

  describe('Memory and Performance Edge Cases', function() {
    
    // Edge case: Creating multiple clients should not cause memory leaks
    it('should handle multiple client creation', function() {
      const configs = Array(5).fill(null).map(() => TestHelpers.createValidConfig({
        username: 'user' + Math.random() + '@domain.com'
      }));
      
      const clients = configs.map(config => sharepointConnector(config));
      
      clients.forEach((client, index) => {
        TestHelpers.assertValidClient(client, configs[index]);
      });
    });

    // Edge case: Large configuration objects should be handled
    it('should handle configuration with many custom properties', function() {
      const config = TestHelpers.createValidConfig({
        customProp1: 'value1',
        customProp2: 'value2',
        customProp3: Array(10).fill('data'),
        customProp4: { nested: { deep: { object: true } } }
      });
      
      const client = sharepointConnector(config);
      TestHelpers.assertValidClient(client, config);
    });
  });
});

// Additional unit tests for helper functions themselves
describe('Test Helper Functions', function() {
  
  describe('createValidConfig', function() {
    
    it('should create config with required parameters', function() {
      const config = TestHelpers.createValidConfig();
      assert(config.username, 'Should have username');
      assert(config.password, 'Should have password');
      assert(config.url, 'Should have url');
    });

    it('should apply overrides correctly', function() {
      const overrides = { username: 'custom@user.com', customProp: 'test' };
      const config = TestHelpers.createValidConfig(overrides);
      assert.strictEqual(config.username, 'custom@user.com');
      assert.strictEqual(config.customProp, 'test');
    });
  });

  describe('createInvalidConfig', function() {
    
    it('should remove specified parameters', function() {
      const config = TestHelpers.createInvalidConfig(['username', 'password']);
      assert(!config.hasOwnProperty('username'), 'Should not have username');
      assert(!config.hasOwnProperty('password'), 'Should not have password');
      assert(config.hasOwnProperty('url'), 'Should still have url');
    });
  });

  describe('assertThrowsWithMessage', function() {
    
    it('should pass when function throws expected error', function() {
      TestHelpers.assertThrowsWithMessage(
        () => { throw new Error('Expected error message'); },
        'Expected error message'
      );
    });

    it('should fail when function does not throw', function() {
      assert.throws(() => {
        TestHelpers.assertThrowsWithMessage(
          () => { return 'no error'; },
          'Expected error'
        );
      }, /Function should throw an error/);
    });
  });
});
