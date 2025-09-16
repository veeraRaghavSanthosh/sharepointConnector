/**
 * Unit Tests for SharePoint Connector Usage Examples
 * 
 * These tests verify that the usage examples work correctly and demonstrate
 * proper testing patterns for SharePoint Connector applications.
 */

const assert = require('assert');
const nock = require('nock');
const sharepoint = require('../../sharepointconnector');
const examples = require('../../examples/usage-examples');

// Mock SharePoint responses
const mockResponses = {
  contextInfo: {
    d: {
      GetContextWebInformation: {
        FormDigestValue: 'mock-digest-value'
      }
    }
  },
  lists: {
    d: {
      results: [
        {
          Id: 'mock-list-id-1',
          Title: 'Sample List',
          Description: 'A sample list for testing',
          ItemCount: 5
        },
        {
          Id: 'mock-list-id-2',
          Title: 'Tasks',
          Description: 'Task management list',
          ItemCount: 10
        }
      ]
    }
  },
  listDetails: {
    d: {
      Id: 'mock-list-id-1',
      Title: 'Sample List',
      Description: 'A sample list for testing',
      Items: {
        results: [
          {
            Id: 1,
            Title: 'Sample Item 1',
            Status: 'Active'
          },
          {
            Id: 2,
            Title: 'Sample Item 2',
            Status: 'Completed'
          }
        ]
      },
      Fields: {
        results: [
          {
            Id: 'field-1',
            Title: 'Title',
            InternalName: 'Title',
            TypeAsString: 'Text'
          },
          {
            Id: 'field-2',
            Title: 'Status',
            InternalName: 'Status',
            TypeAsString: 'Choice'
          }
        ]
      }
    }
  },
  createList: {
    d: {
      Id: 'new-list-id',
      Title: 'Sample List',
      Description: 'A sample list created via the API'
    }
  },
  updateList: {
    d: {
      Id: 'new-list-id',
      Title: 'Updated Sample List',
      Description: 'Updated description'
    }
  },
  listItems: {
    d: {
      results: [
        {
          Id: 1,
          Title: 'Sample Task',
          Description: 'A sample task',
          Status: 'Not Started'
        },
        {
          Id: 2,
          Title: 'Another Task',
          Description: 'Another sample task',
          Status: 'In Progress'
        }
      ]
    }
  },
  createItem: {
    d: {
      Id: 3,
      Title: 'Sample Task',
      Description: 'A sample task created via the API',
      Status: 'Not Started'
    }
  },
  readItem: {
    d: {
      Id: 3,
      Title: 'Sample Task',
      Description: 'A sample task created via the API',
      Status: 'Not Started',
      File: null
    }
  },
  currentUser: {
    d: {
      Id: 1,
      Title: 'Test User',
      Email: 'test@example.com'
    }
  }
};

describe('SharePoint Connector Usage Examples', function() {
  let mockScope;

  beforeEach(function() {
    // Set up nock to intercept HTTP requests
    mockScope = nock('https://your-sharepoint-site.com');
  });

  afterEach(function() {
    // Clean up nock interceptors
    nock.cleanAll();
  });

  describe('Authentication Examples', function() {
    it('should handle basic authentication correctly', function(done) {
      // Mock the context info request
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      // Create a mock client
      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      // Test login
      client.login((err) => {
        assert.strictEqual(err, null, 'Login should succeed');
        assert(client.baseContext, 'Base context should be set');
        done();
      });
    });

    it('should handle NTLM authentication correctly', function(done) {
      // Mock the context info request
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      const client = sharepoint({
        username: 'domain\\test-user',
        password: 'test-password',
        type: 'ntlm',
        url: 'https://your-sharepoint-site.com',
        domain: 'test-domain',
        workstation: 'test-workstation'
      });

      client.login((err) => {
        assert.strictEqual(err, null, 'NTLM login should succeed');
        assert(client.baseContext, 'Base context should be set');
        done();
      });
    });

    it('should handle authentication errors gracefully', function(done) {
      // Mock authentication failure
      mockScope
        .post('/web/_api/contextinfo')
        .reply(401, { error: 'Unauthorized' });

      const client = sharepoint({
        username: 'invalid-user',
        password: 'invalid-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert(err, 'Login should fail with invalid credentials');
        assert.strictEqual(err, 'Unexpected status code 401');
        done();
      });
    });
  });

  describe('List Operations', function() {
    beforeEach(function() {
      // Mock login
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);
    });

    it('should list all SharePoint lists', function(done) {
      // Mock lists request
      mockScope
        .get('/web/_api/web/lists')
        .reply(200, mockResponses.lists);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.lists.list((err, lists) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(Array.isArray(lists), 'Should return array of lists');
          assert.strictEqual(lists.length, 2, 'Should return 2 lists');
          assert.strictEqual(lists[0].Title, 'Sample List');
          assert.strictEqual(lists[1].Title, 'Tasks');
          done();
        });
      });
    });

    it('should create a new list', function(done) {
      // Mock create list request
      mockScope
        .post('/web/_api/web/lists')
        .reply(200, mockResponses.createList);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.lists.create({
          title: 'Sample List',
          description: 'A sample list created via the API'
        }, (err, newList) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(newList, 'Should return created list');
          assert.strictEqual(newList.Title, 'Sample List');
          assert.strictEqual(newList.Id, 'new-list-id');
          done();
        });
      });
    });

    it('should read list details with items and fields', function(done) {
      // Mock read list request
      mockScope
        .get('/web/_api/web/lists(guid\'mock-list-id-1\')')
        .reply(200, mockResponses.listDetails);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.lists.read('mock-list-id-1', (err, listDetails) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(listDetails, 'Should return list details');
          assert.strictEqual(listDetails.Title, 'Sample List');
          assert(listDetails.Items, 'Should include items');
          assert(listDetails.Fields, 'Should include fields');
          assert.strictEqual(listDetails.Items.length, 2);
          assert.strictEqual(listDetails.Fields.length, 2);
          done();
        });
      });
    });

    it('should update list properties', function(done) {
      // Mock update list request
      mockScope
        .post('/web/_api/web/lists(guid\'new-list-id\')')
        .reply(200, mockResponses.updateList);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.lists.update('new-list-id', {
          Title: 'Updated Sample List',
          Description: 'Updated description'
        }, (err, updatedList) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(updatedList, 'Should return updated list');
          assert.strictEqual(updatedList.Title, 'Updated Sample List');
          done();
        });
      });
    });
  });

  describe('List Item Operations', function() {
    beforeEach(function() {
      // Mock login
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);
    });

    it('should list items from a SharePoint list', function(done) {
      // Mock list items request
      mockScope
        .get('/web/_api/web/lists/getByTitle(\'Tasks\')/Items')
        .reply(200, mockResponses.listItems);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.listItems.list('Tasks', (err, items, nextUrl) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(Array.isArray(items), 'Should return array of items');
          assert.strictEqual(items.length, 2, 'Should return 2 items');
          assert.strictEqual(items[0].Title, 'Sample Task');
          assert.strictEqual(items[1].Title, 'Another Task');
          done();
        });
      });
    });

    it('should create a new list item', function(done) {
      // Mock create item request
      mockScope
        .post('/web/_api/web/lists/getByTitle(\'Tasks\')/Items')
        .reply(200, mockResponses.createItem);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        const newItem = {
          Title: 'Sample Task',
          Description: 'A sample task created via the API',
          Status: 'Not Started'
        };

        client.listItems.create('Tasks', newItem, (err, createdItem) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(createdItem, 'Should return created item');
          assert.strictEqual(createdItem.Title, 'Sample Task');
          assert.strictEqual(createdItem.Id, 3);
          done();
        });
      });
    });

    it('should read a specific list item', function(done) {
      // Mock read item request
      mockScope
        .get('/web/_api/web/lists/getByTitle(\'Tasks\')/Items(3)')
        .reply(200, mockResponses.readItem);
      
      // Mock file request (returns 404 since no file attached)
      mockScope
        .get('/web/_api/web/lists/getByTitle(\'Tasks\')/Items(3)/File')
        .reply(404, { error: 'File not found' });

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.listItems.read('Tasks', 3, (err, item) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(item, 'Should return item');
          assert.strictEqual(item.Title, 'Sample Task');
          assert.strictEqual(item.Id, 3);
          done();
        });
      });
    });
  });

  describe('Advanced Query Operations', function() {
    it('should handle filtered queries', function(done) {
      // Mock filtered query request
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      mockScope
        .get('/web/_api/web/lists/getByTitle(\'Tasks\')/Items')
        .query(true) // Accept any query parameters
        .reply(200, {
          d: {
            results: [
              {
                Id: 1,
                Title: 'High Priority Task',
                Status: 'Active',
                Priority: 'High'
              }
            ]
          }
        });

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com',
        fieldValuesAsText: true,
        filterFields: [
          { field: 'Status', value: 'Active' },
          { field: 'Priority', value: 'High' }
        ],
        selectFields: ['Title', 'Status', 'Priority', 'Created'],
        $top: '100'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.listItems.list('Tasks', (err, filteredItems) => {
          assert.strictEqual(err, null, 'Should not have error');
          assert(Array.isArray(filteredItems), 'Should return array');
          assert.strictEqual(filteredItems.length, 1);
          assert.strictEqual(filteredItems[0].Priority, 'High');
          done();
        });
      });
    });
  });

  describe('File Operations', function() {
    it('should handle byte stream requests', function(done) {
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        // Mock the byte stream method behavior
        client.listItems.byteStream('Documents', 'test-file.txt', (err, serviceReqObj) => {
          // For this test, we'll just verify the method can be called without error
          // In a real implementation, serviceReqObj would contain request configuration
          assert.strictEqual(err, null, 'Should not have error');
          done();
        });
      });
    });
  });

  describe('Error Handling', function() {
    it('should handle network errors gracefully', function(done) {
      // Don't mock any responses to simulate network error
      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://nonexistent-sharepoint-site.com'
      });

      client.login((err) => {
        assert(err, 'Should have error for network failure');
        done();
      });
    });

    it('should handle SharePoint API errors', function(done) {
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      mockScope
        .get('/web/_api/web/lists')
        .reply(500, { error: 'Internal Server Error' });

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      client.login((err) => {
        assert.strictEqual(err, null);

        client.lists.list((err, lists) => {
          assert(err, 'Should have error for server error');
          done();
        });
      });
    });
  });

  describe('Promise Wrapper Utility', function() {
    it('should convert callback-based methods to promises', function(done) {
      mockScope
        .post('/web/_api/contextinfo')
        .reply(200, mockResponses.contextInfo);

      mockScope
        .get('/web/_api/web/lists')
        .reply(200, mockResponses.lists);

      const client = sharepoint({
        username: 'test-user',
        password: 'test-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      // Use the promisify utility from examples
      const login = examples.promisifySharePointMethod(client.login);
      const listLists = examples.promisifySharePointMethod(client.lists.list);

      login()
        .then(() => {
          return listLists();
        })
        .then((lists) => {
          assert(Array.isArray(lists), 'Should return array of lists');
          assert.strictEqual(lists.length, 2);
          done();
        })
        .catch(done);
    });

    it('should handle promise rejections correctly', function(done) {
      mockScope
        .post('/web/_api/contextinfo')
        .reply(401, { error: 'Unauthorized' });

      const client = sharepoint({
        username: 'invalid-user',
        password: 'invalid-password',
        type: 'basic',
        url: 'https://your-sharepoint-site.com'
      });

      const login = examples.promisifySharePointMethod(client.login);

      login()
        .then(() => {
          done(new Error('Should have rejected'));
        })
        .catch((err) => {
          assert(err, 'Should have error');
          done();
        });
    });
  });
});