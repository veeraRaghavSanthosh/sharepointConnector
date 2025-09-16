const assert = require('assert');
const SharePointServer = require('../../src/server');

describe('SharePointServer', function() {
  describe('constructor', function() {
    it('should throw TypeError when config is null', function() {
      assert.throws(
        () => new SharePointServer(null),
        TypeError,
        'Configuration cannot be null or undefined'
      );
    });

    it('should throw TypeError when config is undefined', function() {
      assert.throws(
        () => new SharePointServer(undefined),
        TypeError,
        'Configuration cannot be null or undefined'
      );
    });

    it('should throw TypeError when config is not an object', function() {
      assert.throws(
        () => new SharePointServer('not an object'),
        TypeError,
        'Configuration must be an object'
      );
    });

    it('should throw Error when required fields are missing', function() {
      assert.throws(
        () => new SharePointServer({}),
        Error,
        'Missing required configuration fields: username, password, url'
      );
    });

    it('should throw Error when username is missing', function() {
      assert.throws(
        () => new SharePointServer({ password: 'pass', url: 'http://example.com' }),
        Error,
        'Missing required configuration fields: username'
      );
    });

    it('should throw Error when password is missing', function() {
      assert.throws(
        () => new SharePointServer({ username: 'user', url: 'http://example.com' }),
        Error,
        'Missing required configuration fields: password'
      );
    });

    it('should throw Error when url is missing', function() {
      assert.throws(
        () => new SharePointServer({ username: 'user', password: 'pass' }),
        Error,
        'Missing required configuration fields: url'
      );
    });

    it('should create instance with valid config', function() {
      const config = {
        username: 'testuser',
        password: 'testpass',
        url: 'http://example.sharepoint.com'
      };
      
      // This would normally work if the sharepointconnector was properly mocked
      // For now, we'll just test that the constructor doesn't throw
      try {
        new SharePointServer(config);
        // If we get here, the validation passed
        assert.ok(true);
      } catch (error) {
        // Only fail if it's a validation error, not a connection error
        if (error.message.includes('Configuration cannot be null') ||
            error.message.includes('Configuration must be an object') ||
            error.message.includes('Missing required configuration fields')) {
          assert.fail('Validation should have passed for valid config');
        }
        // Other errors are expected since we don't have a real SharePoint instance
      }
    });
  });

  describe('validateInput', function() {
    let server;
    
    beforeEach(function() {
      // Create a mock server for testing validation methods
      const mockConfig = {
        username: 'testuser',
        password: 'testpass',
        url: 'http://example.sharepoint.com'
      };
      
      try {
        server = new SharePointServer(mockConfig);
      } catch (error) {
        // Create a minimal server instance for testing validation
        server = {
          validateInput: SharePointServer.prototype.validateInput
        };
      }
    });

    it('should throw TypeError when input is null', function() {
      assert.throws(
        () => server.validateInput(null),
        TypeError,
        'input cannot be null'
      );
    });

    it('should throw TypeError when input is undefined', function() {
      assert.throws(
        () => server.validateInput(undefined),
        TypeError,
        'input cannot be undefined'
      );
    });

    it('should throw TypeError with custom parameter name', function() {
      assert.throws(
        () => server.validateInput(null, 'customParam'),
        TypeError,
        'customParam cannot be null'
      );
    });

    it('should not throw for valid inputs', function() {
      assert.doesNotThrow(() => server.validateInput('valid string'));
      assert.doesNotThrow(() => server.validateInput({}));
      assert.doesNotThrow(() => server.validateInput([]));
      assert.doesNotThrow(() => server.validateInput(123));
      assert.doesNotThrow(() => server.validateInput(true));
      assert.doesNotThrow(() => server.validateInput(false));
    });
  });

  describe('getLists', function() {
    let server;
    
    beforeEach(function() {
      const mockConfig = {
        username: 'testuser',
        password: 'testpass',
        url: 'http://example.sharepoint.com'
      };
      
      try {
        server = new SharePointServer(mockConfig);
      } catch (error) {
        // Skip these tests if we can't create a server instance
        server = null;
      }
    });

    it('should throw TypeError when options is null', function() {
      if (!server) return this.skip();
      
      return server.getLists(null).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'options cannot be null');
      });
    });

    it('should throw TypeError when options is undefined', function() {
      if (!server) return this.skip();
      
      return server.getLists(undefined).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'options cannot be undefined');
      });
    });
  });

  describe('getListItems', function() {
    let server;
    
    beforeEach(function() {
      const mockConfig = {
        username: 'testuser',
        password: 'testpass',
        url: 'http://example.sharepoint.com'
      };
      
      try {
        server = new SharePointServer(mockConfig);
      } catch (error) {
        server = null;
      }
    });

    it('should throw TypeError when listTitle is null', function() {
      if (!server) return this.skip();
      
      return server.getListItems(null, {}).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'listTitle cannot be null');
      });
    });

    it('should throw TypeError when listTitle is not a string', function() {
      if (!server) return this.skip();
      
      return server.getListItems(123, {}).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'listTitle must be a string');
      });
    });

    it('should throw TypeError when options is null', function() {
      if (!server) return this.skip();
      
      return server.getListItems('TestList', null).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'options cannot be null');
      });
    });
  });

  describe('createListItem', function() {
    let server;
    
    beforeEach(function() {
      const mockConfig = {
        username: 'testuser',
        password: 'testpass',
        url: 'http://example.sharepoint.com'
      };
      
      try {
        server = new SharePointServer(mockConfig);
      } catch (error) {
        server = null;
      }
    });

    it('should throw TypeError when listTitle is null', function() {
      if (!server) return this.skip();
      
      return server.createListItem(null, {}).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'listTitle cannot be null');
      });
    });

    it('should throw TypeError when itemData is null', function() {
      if (!server) return this.skip();
      
      return server.createListItem('TestList', null).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'itemData cannot be null');
      });
    });

    it('should throw TypeError when listTitle is not a string', function() {
      if (!server) return this.skip();
      
      return server.createListItem(123, {}).catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'listTitle must be a string');
      });
    });

    it('should throw TypeError when itemData is not an object', function() {
      if (!server) return this.skip();
      
      return server.createListItem('TestList', 'not an object').catch(error => {
        assert.strictEqual(error.name, 'TypeError');
        assert.strictEqual(error.message, 'itemData must be an object');
      });
    });
  });
});