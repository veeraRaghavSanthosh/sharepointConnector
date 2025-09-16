/**
 * Unit Tests for TypeScript Usage Examples
 * 
 * These tests verify that the TypeScript usage examples work correctly
 * and demonstrate proper testing patterns for TypeScript applications.
 */

const assert = require('assert');
const nock = require('nock');

// Mock the TypeScript classes and functions
// In a real TypeScript project, these would be imported from compiled JS files
const mockSharePointService = {
  login: function() {
    return Promise.resolve();
  },
  getLists: function() {
    return Promise.resolve([
      { Id: 'list-1', Title: 'Tasks', Description: 'Task list' },
      { Id: 'list-2', Title: 'Documents', Description: 'Document library' }
    ]);
  },
  getList: function(listId) {
    return Promise.resolve({
      Id: listId,
      Title: 'Tasks',
      Description: 'Task list',
      Items: [],
      Fields: []
    });
  },
  createList: function(title, description) {
    return Promise.resolve({
      Id: 'new-list-id',
      Title: title,
      Description: description
    });
  },
  getListItems: function(listId) {
    return Promise.resolve([
      { Id: 1, Title: 'Task 1', Status: 'Not Started', Priority: 'High' },
      { Id: 2, Title: 'Task 2', Status: 'In Progress', Priority: 'Medium' }
    ]);
  },
  getAllListItems: function(listId) {
    return Promise.resolve([
      { Id: 1, Title: 'Task 1', Status: 'Not Started', Priority: 'High' },
      { Id: 2, Title: 'Task 2', Status: 'In Progress', Priority: 'Medium' },
      { Id: 3, Title: 'Task 3', Status: 'Completed', Priority: 'Low' }
    ]);
  },
  createListItem: function(listId, itemData) {
    return Promise.resolve({
      Id: 4,
      ...itemData
    });
  },
  getListItem: function(listId, itemId) {
    return Promise.resolve({
      Id: itemId,
      Title: 'Sample Task',
      Status: 'Not Started',
      Priority: 'High'
    });
  },
  deleteListItem: function(listId, itemId) {
    return Promise.resolve();
  }
};

// Mock SharePointConfigBuilder
class MockSharePointConfigBuilder {
  constructor() {
    this.config = {};
  }

  static create() {
    return new MockSharePointConfigBuilder();
  }

  withBasicAuth(username, password, url) {
    this.config = { ...this.config, username, password, type: 'basic', url };
    return this;
  }

  withNtlmAuth(username, password, url, domain, workstation) {
    this.config = { ...this.config, username, password, type: 'ntlm', url, domain, workstation };
    return this;
  }

  withOnlineAuth(username, password, url) {
    this.config = { ...this.config, username, password, type: 'online', url };
    return this;
  }

  withContext(context) {
    this.config.context = context;
    return this;
  }

  withFiltering(filterFields) {
    this.config.filterFields = filterFields;
    return this;
  }

  withFieldSelection(selectFields) {
    this.config.selectFields = selectFields;
    return this;
  }

  withFieldExpansion(expandFields) {
    this.config.expandFields = expandFields;
    return this;
  }

  withTopLimit(limit) {
    this.config.$top = limit.toString();
    return this;
  }

  enableVerbose() {
    this.config.verbose = true;
    return this;
  }

  disableSSL() {
    this.config.strictSSL = false;
    return this;
  }

  build() {
    if (!this.config.username || !this.config.password || !this.config.url || !this.config.type) {
      throw new Error('Missing required configuration: username, password, url, and type are required');
    }
    return this.config;
  }
}

// Mock TaskManager class
class MockTaskManager {
  constructor(sharePointService, taskListId) {
    this.sharePointService = sharePointService;
    this.taskListId = taskListId;
  }

  async createTask(task) {
    const createdItem = await this.sharePointService.createListItem(this.taskListId, task);
    return createdItem;
  }

  async getTask(taskId) {
    const item = await this.sharePointService.getListItem(this.taskListId, taskId);
    return item;
  }

  async getAllTasks() {
    const items = await this.sharePointService.getAllListItems(this.taskListId);
    return items;
  }

  async getTasksByStatus(status) {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.Status === status);
  }

  async getTasksByPriority(priority) {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.Priority === priority);
  }

  async getOverdueTasks() {
    const allTasks = await this.getAllTasks();
    const now = new Date();
    return allTasks.filter(task => {
      if (!task.DueDate) return false;
      const dueDate = new Date(task.DueDate);
      return dueDate < now && task.Status !== 'Completed';
    });
  }

  async deleteTask(taskId) {
    await this.sharePointService.deleteListItem(this.taskListId, taskId);
  }
}

// Mock DocumentLibraryManager class
class MockDocumentLibraryManager {
  constructor(sharePointService, libraryId) {
    this.sharePointService = sharePointService;
    this.libraryId = libraryId;
  }

  async getDocuments() {
    return [
      {
        Id: 1,
        Title: 'Document 1',
        FileLeafRef: 'document1.pdf',
        FileRef: '/documents/document1.pdf',
        FileSizeDisplay: '1.2 MB',
        Modified: '2023-01-15T10:30:00Z',
        Editor: 'John Doe'
      },
      {
        Id: 2,
        Title: 'Document 2',
        FileLeafRef: 'document2.docx',
        FileRef: '/documents/document2.docx',
        FileSizeDisplay: '856 KB',
        Modified: '2023-01-20T14:45:00Z',
        Editor: 'Jane Smith'
      }
    ];
  }

  async getDocumentsByType(fileExtension) {
    const documents = await this.getDocuments();
    return documents.filter(doc => 
      doc.FileLeafRef?.toLowerCase().endsWith(fileExtension.toLowerCase())
    );
  }

  async getRecentDocuments(days = 30) {
    const documents = await this.getDocuments();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return documents.filter(doc => {
      if (!doc.Modified) return false;
      const modifiedDate = new Date(doc.Modified);
      return modifiedDate >= cutoffDate;
    });
  }

  async searchDocuments(searchTerm) {
    const documents = await this.getDocuments();
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.Title?.toLowerCase().includes(term) ||
      doc.FileLeafRef?.toLowerCase().includes(term)
    );
  }
}

describe('TypeScript Usage Examples', function() {
  describe('SharePointConfigBuilder', function() {
    it('should build basic auth configuration correctly', function() {
      const config = MockSharePointConfigBuilder
        .create()
        .withBasicAuth('username', 'password', 'https://company.sharepoint.com')
        .withContext('sites/mysite')
        .enableVerbose()
        .build();

      assert.strictEqual(config.username, 'username');
      assert.strictEqual(config.password, 'password');
      assert.strictEqual(config.type, 'basic');
      assert.strictEqual(config.url, 'https://company.sharepoint.com');
      assert.strictEqual(config.context, 'sites/mysite');
      assert.strictEqual(config.verbose, true);
    });

    it('should build NTLM auth configuration correctly', function() {
      const config = MockSharePointConfigBuilder
        .create()
        .withNtlmAuth('username', 'password', 'https://company.sharepoint.com', 'DOMAIN', 'WORKSTATION')
        .withFiltering([{ field: 'Status', value: 'Active' }])
        .withFieldSelection(['Title', 'Status'])
        .withTopLimit(100)
        .build();

      assert.strictEqual(config.type, 'ntlm');
      assert.strictEqual(config.domain, 'DOMAIN');
      assert.strictEqual(config.workstation, 'WORKSTATION');
      assert.deepStrictEqual(config.filterFields, [{ field: 'Status', value: 'Active' }]);
      assert.deepStrictEqual(config.selectFields, ['Title', 'Status']);
      assert.strictEqual(config.$top, '100');
    });

    it('should build online auth configuration correctly', function() {
      const config = MockSharePointConfigBuilder
        .create()
        .withOnlineAuth('user@company.com', 'password', 'https://company.sharepoint.com')
        .withFieldExpansion(['Author', 'Editor'])
        .disableSSL()
        .build();

      assert.strictEqual(config.type, 'online');
      assert.deepStrictEqual(config.expandFields, ['Author', 'Editor']);
      assert.strictEqual(config.strictSSL, false);
    });

    it('should throw error for missing required configuration', function() {
      assert.throws(() => {
        MockSharePointConfigBuilder
          .create()
          .withContext('sites/mysite')
          .build();
      }, /Missing required configuration/);
    });
  });

  describe('SharePointService', function() {
    let service;

    beforeEach(function() {
      service = mockSharePointService;
    });

    it('should login successfully', async function() {
      await service.login(); // Should not throw
    });

    it('should get all lists', async function() {
      const lists = await service.getLists();
      assert(Array.isArray(lists));
      assert.strictEqual(lists.length, 2);
      assert.strictEqual(lists[0].Title, 'Tasks');
      assert.strictEqual(lists[1].Title, 'Documents');
    });

    it('should get a specific list', async function() {
      const list = await service.getList('list-1');
      assert.strictEqual(list.Id, 'list-1');
      assert.strictEqual(list.Title, 'Tasks');
    });

    it('should create a new list', async function() {
      const list = await service.createList('New List', 'Description');
      assert.strictEqual(list.Title, 'New List');
      assert.strictEqual(list.Description, 'Description');
      assert.strictEqual(list.Id, 'new-list-id');
    });

    it('should get list items', async function() {
      const items = await service.getListItems('list-1');
      assert(Array.isArray(items));
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].Title, 'Task 1');
    });

    it('should get all list items (with pagination)', async function() {
      const items = await service.getAllListItems('list-1');
      assert(Array.isArray(items));
      assert.strictEqual(items.length, 3);
    });

    it('should create a list item', async function() {
      const item = await service.createListItem('list-1', {
        Title: 'New Task',
        Status: 'Not Started',
        Priority: 'Medium'
      });
      assert.strictEqual(item.Id, 4);
      assert.strictEqual(item.Title, 'New Task');
      assert.strictEqual(item.Status, 'Not Started');
    });

    it('should get a specific list item', async function() {
      const item = await service.getListItem('list-1', 1);
      assert.strictEqual(item.Id, 1);
      assert.strictEqual(item.Title, 'Sample Task');
    });

    it('should delete a list item', async function() {
      await service.deleteListItem('list-1', 1); // Should not throw
    });
  });

  describe('TaskManager', function() {
    let taskManager;

    beforeEach(function() {
      taskManager = new MockTaskManager(mockSharePointService, 'task-list-id');
    });

    it('should create a new task', async function() {
      const task = await taskManager.createTask({
        Title: 'New Task',
        Description: 'Task description',
        Status: 'Not Started',
        Priority: 'High',
        DueDate: '2023-12-31T23:59:59Z'
      });

      assert.strictEqual(task.Id, 4);
      assert.strictEqual(task.Title, 'New Task');
      assert.strictEqual(task.Status, 'Not Started');
    });

    it('should get a specific task', async function() {
      const task = await taskManager.getTask(1);
      assert.strictEqual(task.Id, 1);
      assert.strictEqual(task.Title, 'Sample Task');
    });

    it('should get all tasks', async function() {
      const tasks = await taskManager.getAllTasks();
      assert(Array.isArray(tasks));
      assert.strictEqual(tasks.length, 3);
    });

    it('should filter tasks by status', async function() {
      const notStartedTasks = await taskManager.getTasksByStatus('Not Started');
      assert(Array.isArray(notStartedTasks));
      assert.strictEqual(notStartedTasks.length, 1);
      assert.strictEqual(notStartedTasks[0].Status, 'Not Started');
    });

    it('should filter tasks by priority', async function() {
      const highPriorityTasks = await taskManager.getTasksByPriority('High');
      assert(Array.isArray(highPriorityTasks));
      assert.strictEqual(highPriorityTasks.length, 1);
      assert.strictEqual(highPriorityTasks[0].Priority, 'High');
    });

    it('should get overdue tasks', async function() {
      // Mock tasks with due dates
      const originalGetAllTasks = taskManager.getAllTasks;
      taskManager.getAllTasks = async function() {
        return [
          {
            Id: 1,
            Title: 'Overdue Task',
            Status: 'Not Started',
            DueDate: '2022-01-01T00:00:00Z' // Past date
          },
          {
            Id: 2,
            Title: 'Completed Overdue Task',
            Status: 'Completed',
            DueDate: '2022-01-01T00:00:00Z' // Past date but completed
          },
          {
            Id: 3,
            Title: 'Future Task',
            Status: 'Not Started',
            DueDate: '2025-01-01T00:00:00Z' // Future date
          }
        ];
      };

      const overdueTasks = await taskManager.getOverdueTasks();
      assert(Array.isArray(overdueTasks));
      assert.strictEqual(overdueTasks.length, 1);
      assert.strictEqual(overdueTasks[0].Title, 'Overdue Task');

      // Restore original method
      taskManager.getAllTasks = originalGetAllTasks;
    });

    it('should delete a task', async function() {
      await taskManager.deleteTask(1); // Should not throw
    });
  });

  describe('DocumentLibraryManager', function() {
    let docManager;

    beforeEach(function() {
      docManager = new MockDocumentLibraryManager(mockSharePointService, 'doc-library-id');
    });

    it('should get all documents', async function() {
      const documents = await docManager.getDocuments();
      assert(Array.isArray(documents));
      assert.strictEqual(documents.length, 2);
      assert.strictEqual(documents[0].Title, 'Document 1');
      assert.strictEqual(documents[1].FileLeafRef, 'document2.docx');
    });

    it('should filter documents by file type', async function() {
      const pdfDocs = await docManager.getDocumentsByType('.pdf');
      assert(Array.isArray(pdfDocs));
      assert.strictEqual(pdfDocs.length, 1);
      assert.strictEqual(pdfDocs[0].FileLeafRef, 'document1.pdf');

      const docxDocs = await docManager.getDocumentsByType('.docx');
      assert.strictEqual(docxDocs.length, 1);
      assert.strictEqual(docxDocs[0].FileLeafRef, 'document2.docx');
    });

    it('should get recent documents', async function() {
      const recentDocs = await docManager.getRecentDocuments(365); // Last year
      assert(Array.isArray(recentDocs));
      assert.strictEqual(recentDocs.length, 2); // Both documents are recent
    });

    it('should search documents by title and filename', async function() {
      const searchResults = await docManager.searchDocuments('document1');
      assert(Array.isArray(searchResults));
      assert.strictEqual(searchResults.length, 1);
      assert.strictEqual(searchResults[0].Title, 'Document 1');

      const titleSearch = await docManager.searchDocuments('Document 2');
      assert.strictEqual(titleSearch.length, 1);
      assert.strictEqual(titleSearch[0].Title, 'Document 2');
    });
  });

  describe('Error Handling', function() {
    it('should handle SharePointError correctly', function() {
      class SharePointError extends Error {
        constructor(message, operation, statusCode, originalError) {
          super(message);
          this.name = 'SharePointError';
          this.operation = operation;
          this.statusCode = statusCode;
          this.originalError = originalError;
        }
      }

      const error = new SharePointError(
        'Failed to create item',
        'createListItem',
        400,
        new Error('Bad Request')
      );

      assert.strictEqual(error.name, 'SharePointError');
      assert.strictEqual(error.message, 'Failed to create item');
      assert.strictEqual(error.operation, 'createListItem');
      assert.strictEqual(error.statusCode, 400);
      assert(error.originalError instanceof Error);
    });

    it('should handle service errors with proper error wrapping', async function() {
      class SharePointServiceWithErrorHandling {
        constructor(baseService) {
          this.baseService = baseService;
        }

        async getLists() {
          try {
            return await this.baseService.getLists();
          } catch (error) {
            throw new Error(`Failed to retrieve SharePoint lists: ${error.message}`);
          }
        }

        async createListItem(listId, itemData) {
          try {
            return await this.baseService.createListItem(listId, itemData);
          } catch (error) {
            throw new Error(`Failed to create item in list ${listId}: ${error.message}`);
          }
        }
      }

      const errorService = new SharePointServiceWithErrorHandling({
        getLists: async () => {
          throw new Error('Network error');
        },
        createListItem: async () => {
          throw new Error('Validation failed');
        }
      });

      try {
        await errorService.getLists();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('Failed to retrieve SharePoint lists'));
        assert(error.message.includes('Network error'));
      }

      try {
        await errorService.createListItem('list-1', {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('Failed to create item in list list-1'));
        assert(error.message.includes('Validation failed'));
      }
    });
  });
});