/**
 * SharePoint Connector - TypeScript Usage Examples
 * 
 * This file demonstrates various ways to use the SharePoint Connector library
 * with TypeScript, including type definitions and interfaces.
 */

// Type definitions for SharePoint Connector
interface SharePointConfig {
  username: string;
  password: string;
  type: 'basic' | 'ntlm' | 'online' | 'onlinesaml';
  url: string;
  context?: string;
  verbose?: boolean;
  proxy?: string;
  strictSSL?: boolean;
  federatedAuthUrl?: string;
  rtFa?: string;
  FedAuth?: string;
  fieldValuesAsText?: boolean;
  filterFields?: Array<{ field: string; value: string }>;
  selectFields?: string[];
  expandFields?: string[];
  orOperator?: boolean;
  andOrOperator?: boolean;
  $top?: string;
  domain?: string;
  workstation?: string;
}

interface SharePointList {
  Id: string;
  Title: string;
  Description?: string;
  Items?: SharePointListItem[];
  Fields?: SharePointField[];
  read?: (callback: (err: any, result?: SharePointList) => void) => void;
  update?: (data: Partial<SharePointList>, callback: (err: any, result?: SharePointList) => void) => void;
  delete?: (callback: (err: any) => void) => void;
}

interface SharePointListItem {
  Id: number;
  Title: string;
  [key: string]: any;
  File?: any;
  read?: (callback: (err: any, result?: SharePointListItem) => void) => void;
  delete?: (callback: (err: any) => void) => void;
}

interface SharePointField {
  Id: string;
  Title: string;
  InternalName: string;
  TypeAsString: string;
  Required: boolean;
  [key: string]: any;
}

interface SharePointClient {
  login: (callback: (err: any) => void) => void;
  lists: {
    list: (callback: (err: any, lists?: SharePointList[], nextUrl?: string) => void) => void;
    read: (listId: string | { title: string }, callback: (err: any, list?: SharePointList) => void) => void;
    create: (listData: { title: string; description: string }, callback: (err: any, list?: SharePointList) => void) => void;
    update: (listId: string, updateData: Partial<SharePointList>, callback: (err: any, list?: SharePointList) => void) => void;
    del: (listId: string, callback: (err: any) => void) => void;
  };
  listItems: {
    list: (listId: string, callback: (err: any, items?: SharePointListItem[], nextUrl?: string) => void) => void;
    listAll: (listId: string, callback: (err: any, items?: SharePointListItem[]) => void) => void;
    read: (listId: string, itemId: string | number, callback: (err: any, item?: SharePointListItem) => void) => void;
    create: (listId: string, itemData: Partial<SharePointListItem>, callback: (err: any, item?: SharePointListItem) => void) => void;
    del: (listId: string, itemId: string | number, callback: (err: any) => void) => void;
    currentuser: (listId: string, callback: (err: any, user?: any) => void) => void;
    byteStream: (folderName: string, fileName: string, callback: (err: any, serviceReqObj?: any) => void) => void;
    byteStreamByFilePath: (filePath: string, callback: (err: any, serviceReqObj?: any) => void) => void;
  };
}

// Import the SharePoint connector (assuming it's available as a module)
declare const sharepoint: (config: SharePointConfig) => SharePointClient;

// Example 1: Basic Authentication with TypeScript
class SharePointService {
  private client: SharePointClient;
  private config: SharePointConfig;

  constructor(config: SharePointConfig) {
    this.config = config;
    this.client = sharepoint(config);
  }

  async login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.login((err) => {
        if (err) {
          reject(new Error(`Login failed: ${err}`));
        } else {
          resolve();
        }
      });
    });
  }

  async getLists(): Promise<SharePointList[]> {
    return new Promise((resolve, reject) => {
      this.client.lists.list((err, lists) => {
        if (err) {
          reject(new Error(`Failed to get lists: ${err}`));
        } else {
          resolve(lists || []);
        }
      });
    });
  }

  async getList(listId: string): Promise<SharePointList> {
    return new Promise((resolve, reject) => {
      this.client.lists.read(listId, (err, list) => {
        if (err) {
          reject(new Error(`Failed to get list: ${err}`));
        } else if (!list) {
          reject(new Error('List not found'));
        } else {
          resolve(list);
        }
      });
    });
  }

  async createList(title: string, description: string): Promise<SharePointList> {
    return new Promise((resolve, reject) => {
      this.client.lists.create({ title, description }, (err, list) => {
        if (err) {
          reject(new Error(`Failed to create list: ${err}`));
        } else if (!list) {
          reject(new Error('Failed to create list'));
        } else {
          resolve(list);
        }
      });
    });
  }

  async getListItems(listId: string): Promise<SharePointListItem[]> {
    return new Promise((resolve, reject) => {
      this.client.listItems.list(listId, (err, items) => {
        if (err) {
          reject(new Error(`Failed to get list items: ${err}`));
        } else {
          resolve(items || []);
        }
      });
    });
  }

  async getAllListItems(listId: string): Promise<SharePointListItem[]> {
    return new Promise((resolve, reject) => {
      this.client.listItems.listAll(listId, (err, items) => {
        if (err) {
          reject(new Error(`Failed to get all list items: ${err}`));
        } else {
          resolve(items || []);
        }
      });
    });
  }

  async createListItem(listId: string, itemData: Partial<SharePointListItem>): Promise<SharePointListItem> {
    return new Promise((resolve, reject) => {
      this.client.listItems.create(listId, itemData, (err, item) => {
        if (err) {
          reject(new Error(`Failed to create list item: ${err}`));
        } else if (!item) {
          reject(new Error('Failed to create list item'));
        } else {
          resolve(item);
        }
      });
    });
  }

  async getListItem(listId: string, itemId: number): Promise<SharePointListItem> {
    return new Promise((resolve, reject) => {
      this.client.listItems.read(listId, itemId, (err, item) => {
        if (err) {
          reject(new Error(`Failed to get list item: ${err}`));
        } else if (!item) {
          reject(new Error('List item not found'));
        } else {
          resolve(item);
        }
      });
    });
  }

  async deleteListItem(listId: string, itemId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.listItems.del(listId, itemId, (err) => {
        if (err) {
          reject(new Error(`Failed to delete list item: ${err}`));
        } else {
          resolve();
        }
      });
    });
  }
}

// Example 2: Type-safe configuration factory
class SharePointConfigBuilder {
  private config: Partial<SharePointConfig> = {};

  static create(): SharePointConfigBuilder {
    return new SharePointConfigBuilder();
  }

  withBasicAuth(username: string, password: string, url: string): SharePointConfigBuilder {
    this.config = {
      ...this.config,
      username,
      password,
      type: 'basic',
      url
    };
    return this;
  }

  withNtlmAuth(username: string, password: string, url: string, domain?: string, workstation?: string): SharePointConfigBuilder {
    this.config = {
      ...this.config,
      username,
      password,
      type: 'ntlm',
      url,
      domain,
      workstation
    };
    return this;
  }

  withOnlineAuth(username: string, password: string, url: string): SharePointConfigBuilder {
    this.config = {
      ...this.config,
      username,
      password,
      type: 'online',
      url
    };
    return this;
  }

  withContext(context: string): SharePointConfigBuilder {
    this.config.context = context;
    return this;
  }

  withFiltering(filterFields: Array<{ field: string; value: string }>): SharePointConfigBuilder {
    this.config.filterFields = filterFields;
    return this;
  }

  withFieldSelection(selectFields: string[]): SharePointConfigBuilder {
    this.config.selectFields = selectFields;
    return this;
  }

  withFieldExpansion(expandFields: string[]): SharePointConfigBuilder {
    this.config.expandFields = expandFields;
    return this;
  }

  withTopLimit(limit: number): SharePointConfigBuilder {
    this.config.$top = limit.toString();
    return this;
  }

  enableVerbose(): SharePointConfigBuilder {
    this.config.verbose = true;
    return this;
  }

  disableSSL(): SharePointConfigBuilder {
    this.config.strictSSL = false;
    return this;
  }

  build(): SharePointConfig {
    if (!this.config.username || !this.config.password || !this.config.url || !this.config.type) {
      throw new Error('Missing required configuration: username, password, url, and type are required');
    }
    return this.config as SharePointConfig;
  }
}

// Example 3: Advanced task management system
interface Task extends SharePointListItem {
  Title: string;
  Description?: string;
  Status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled';
  Priority: 'Low' | 'Medium' | 'High' | 'Critical';
  AssignedTo?: string;
  DueDate?: string;
  CreatedBy?: string;
  ModifiedBy?: string;
}

class TaskManager {
  private sharePointService: SharePointService;
  private taskListId: string;

  constructor(sharePointService: SharePointService, taskListId: string) {
    this.sharePointService = sharePointService;
    this.taskListId = taskListId;
  }

  async createTask(task: Omit<Task, 'Id'>): Promise<Task> {
    const createdItem = await this.sharePointService.createListItem(this.taskListId, task);
    return createdItem as Task;
  }

  async getTask(taskId: number): Promise<Task> {
    const item = await this.sharePointService.getListItem(this.taskListId, taskId);
    return item as Task;
  }

  async getAllTasks(): Promise<Task[]> {
    const items = await this.sharePointService.getAllListItems(this.taskListId);
    return items as Task[];
  }

  async getTasksByStatus(status: Task['Status']): Promise<Task[]> {
    // Note: This would require configuring the SharePoint service with appropriate filters
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.Status === status);
  }

  async getTasksByPriority(priority: Task['Priority']): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.Priority === priority);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    const now = new Date();
    return allTasks.filter(task => {
      if (!task.DueDate) return false;
      const dueDate = new Date(task.DueDate);
      return dueDate < now && task.Status !== 'Completed';
    });
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.sharePointService.deleteListItem(this.taskListId, taskId);
  }
}

// Example 4: Document library manager
interface Document extends SharePointListItem {
  Title: string;
  FileLeafRef: string;
  FileRef: string;
  FileSizeDisplay: string;
  Modified: string;
  Editor: string;
}

class DocumentLibraryManager {
  private sharePointService: SharePointService;
  private libraryId: string;

  constructor(sharePointService: SharePointService, libraryId: string) {
    this.sharePointService = sharePointService;
    this.libraryId = libraryId;
  }

  async getDocuments(): Promise<Document[]> {
    const items = await this.sharePointService.getAllListItems(this.libraryId);
    return items as Document[];
  }

  async getDocumentsByType(fileExtension: string): Promise<Document[]> {
    const documents = await this.getDocuments();
    return documents.filter(doc => 
      doc.FileLeafRef?.toLowerCase().endsWith(fileExtension.toLowerCase())
    );
  }

  async getRecentDocuments(days: number = 30): Promise<Document[]> {
    const documents = await this.getDocuments();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return documents.filter(doc => {
      if (!doc.Modified) return false;
      const modifiedDate = new Date(doc.Modified);
      return modifiedDate >= cutoffDate;
    });
  }

  async searchDocuments(searchTerm: string): Promise<Document[]> {
    const documents = await this.getDocuments();
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.Title?.toLowerCase().includes(term) ||
      doc.FileLeafRef?.toLowerCase().includes(term)
    );
  }
}

// Example 5: Complete application example
async function completeApplicationExample(): Promise<void> {
  try {
    // Build configuration
    const config = SharePointConfigBuilder
      .create()
      .withBasicAuth('username', 'password', 'https://company.sharepoint.com')
      .withFieldSelection(['Title', 'Status', 'Priority', 'DueDate', 'AssignedTo'])
      .withTopLimit(1000)
      .enableVerbose()
      .build();

    // Initialize service
    const sharePointService = new SharePointService(config);
    await sharePointService.login();
    console.log('Successfully connected to SharePoint');

    // Get all lists
    const lists = await sharePointService.getLists();
    console.log(`Found ${lists.length} lists`);

    // Find task list
    const taskList = lists.find(list => list.Title === 'Tasks');
    if (!taskList) {
      throw new Error('Tasks list not found');
    }

    // Initialize task manager
    const taskManager = new TaskManager(sharePointService, taskList.Id);

    // Create a new task
    const newTask = await taskManager.createTask({
      Title: 'Review TypeScript Examples',
      Description: 'Review and test the TypeScript usage examples',
      Status: 'Not Started',
      Priority: 'High',
      DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });

    console.log(`Created task: ${newTask.Title} (ID: ${newTask.Id})`);

    // Get all high priority tasks
    const highPriorityTasks = await taskManager.getTasksByPriority('High');
    console.log(`Found ${highPriorityTasks.length} high priority tasks`);

    // Get overdue tasks
    const overdueTasks = await taskManager.getOverdueTasks();
    console.log(`Found ${overdueTasks.length} overdue tasks`);

  } catch (error) {
    console.error('Application error:', error);
    throw error;
  }
}

// Example 6: Error handling with custom error types
class SharePointError extends Error {
  constructor(
    message: string,
    public operation: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SharePointError';
  }
}

class SharePointServiceWithErrorHandling extends SharePointService {
  async getLists(): Promise<SharePointList[]> {
    try {
      return await super.getLists();
    } catch (error) {
      throw new SharePointError(
        'Failed to retrieve SharePoint lists',
        'getLists',
        undefined,
        error
      );
    }
  }

  async createListItem(listId: string, itemData: Partial<SharePointListItem>): Promise<SharePointListItem> {
    try {
      return await super.createListItem(listId, itemData);
    } catch (error) {
      throw new SharePointError(
        `Failed to create item in list ${listId}`,
        'createListItem',
        undefined,
        error
      );
    }
  }
}

// Export all classes and interfaces
export {
  SharePointConfig,
  SharePointList,
  SharePointListItem,
  SharePointField,
  SharePointClient,
  SharePointService,
  SharePointConfigBuilder,
  Task,
  TaskManager,
  Document,
  DocumentLibraryManager,
  SharePointError,
  SharePointServiceWithErrorHandling,
  completeApplicationExample
};

// Example usage if running as main module
if (require.main === module) {
  console.log('Running TypeScript SharePoint Connector Examples...');
  
  // Uncomment to run the complete example
  // completeApplicationExample().catch(console.error);
}