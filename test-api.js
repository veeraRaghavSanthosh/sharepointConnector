const assert = require('assert');
const SharePointConnector = require('./sharepointconnector.js');

describe('SharePoint Connector API Tests', function() {
  let sharepoint;
  let mockConfig;

  beforeEach(function() {
    mockConfig = {
      username: 'test@example.com',
      password: 'testpassword',
      url: 'https://test.sharepoint.com'
    };
    sharepoint = SharePointConnector(mockConfig);
  });

  describe('Initialization', function() {
    it('should throw error when username is missing', function() {
      assert.throws(() => {
        SharePointConnector({
          password: 'password',
          url: 'https://test.com'
        });
      }, /SharePoint client needs a username, password and instance URL/);
    });

    it('should create connector instance with valid config', function() {
      const connector = SharePointConnector(mockConfig);
      assert.ok(connector);
      assert.ok(connector.login);
      assert.ok(connector.lists);
      assert.ok(connector.listItems);
    });
  });

  describe('Lists API', function() {
    it('should have all required list methods', function() {
      assert.ok(sharepoint.lists.list);
      assert.ok(sharepoint.lists.create);
      assert.ok(sharepoint.lists.read);
      assert.ok(sharepoint.lists.update);
      assert.ok(sharepoint.lists.del);
    });
  });

  describe('List Items API', function() {
    it('should have all required listItems methods', function() {
      assert.ok(sharepoint.listItems.list);
      assert.ok(sharepoint.listItems.listAll);
      assert.ok(sharepoint.listItems.create);
      assert.ok(sharepoint.listItems.read);
      assert.ok(sharepoint.listItems.del);
      assert.ok(sharepoint.listItems.currentuser);
    });
  });

  describe('Promise Wrapper', function() {
    function promisify(fn) {
      return function(...args) {
        return new Promise((resolve, reject) => {
          fn(...args, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      };
    }

    it('should create promise wrapper correctly', function() {
      const promiseLogin = promisify(sharepoint.login.bind(sharepoint));
      assert.ok(promiseLogin);
      assert.equal(typeof promiseLogin, 'function');
    });
  });
});