# SharePoint Connector Usage Examples

This document provides comprehensive usage examples for the `sharepointconnector` library in both JavaScript and TypeScript.

## JavaScript Examples

### Basic Setup and Authentication

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'your-username@company.com',
  password: 'your-password',
  type: 'ntlm', // Authentication types: 'ntlm', 'basic', 'online', 'onlinesaml'
  url: 'https://your-sharepoint-site.com'
});

// Login to SharePoint
sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  console.log('Successfully logged in to SharePoint!');
  
  // Your SharePoint operations go here...
});
```

### Advanced Configuration Options

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'your-username@company.com',
  password: 'your-password',
  type: 'online',
  url: 'https://your-company.sharepoint.com',
  
  // Optional configuration
  context: 'sites/mysite', // Custom site context (default: 'web')
  verbose: false, // Return filtered responses (default: false)
  proxy: undefined, // Proxy hostname if needed
  strictSSL: true, // SSL certificate validation (default: true)
  
  // Query options
  fieldValuesAsText: true, // Return lookup field values as text
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Department', value: 'IT' }
  ],
  selectFields: ['Title', 'Status', 'Created', 'Modified'],
  expandFields: ['Author', 'Editor'],
  orOperator: false, // Use OR instead of AND for filters
  andOrOperator: false, // Enable mixed AND/OR operations
  $top: '1000' // Limit response count (default: 5000)
});
```

### Working with Lists

```javascript
// List all SharePoint lists
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.list(function(err, lists) {
    if (err) return console.error('Error listing lists:', err);
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id}, Items: ${list.ItemCount})`);
    });
  });
});

// Read a specific list by ID
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.read('your-list-id', function(err, list) {
    if (err) return console.error('Error reading list:', err);
    
    console.log(`List: ${list.Title}`);
    console.log(`Description: ${list.Description}`);
    console.log(`Fields: ${list.Fields.length}`);
    console.log(`Items: ${list.Items.length}`);
  });
});

// Read a list by title
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.read({ title: 'My Custom List' }, function(err, list) {
    if (err) return console.error('Error reading list:', err);
    
    console.log('List details:', list);
  });
});

// Create a new list
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.create({
    title: 'My New List',
    description: 'A list created via the API'
  }, function(err, newList) {
    if (err) return console.error('Error creating list:', err);
    
    console.log('Created list:', newList.Title, 'with ID:', newList.Id);
  });
});

// Update a list
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.update('list-id', {
    Title: 'Updated List Title',
    Description: 'Updated description'
  }, function(err, updatedList) {
    if (err) return console.error('Error updating list:', err);
    
    console.log('Updated list successfully');
  });
});

// Delete a list
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.del('list-id-to-delete', function(err) {
    if (err) return console.error('Error deleting list:', err);
    
    console.log('List deleted successfully');
  });
});
```

### Working with List Items

```javascript
// Get all items from a list
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.list('My List Name', function(err, items, nextUrl) {
    if (err) return console.error('Error listing items:', err);
    
    console.log(`Found ${items.length} items`);
    items.forEach(item => {
      console.log(`- ${item.Title} (ID: ${item.Id})`);
    });
    
    // Handle pagination
    if (nextUrl) {
      console.log('More items available at:', nextUrl);
    }
  });
});

// Get ALL items from a list (handles pagination automatically)
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.listAll('My List Name', function(err, allItems) {
    if (err) return console.error('Error listing all items:', err);
    
    console.log(`Retrieved all ${allItems.length} items from the list`);
  });
});

// Read a specific item
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.read('My List Name', 123, function(err, item) {
    if (err) return console.error('Error reading item:', err);
    
    console.log('Item details:', item);
    
    // Check if item has an attached file
    if (item.File) {
      console.log('Item has attached file:', item.File.Name);
    }
  });
});

// Create a new item
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  const newItem = {
    Title: 'New Item Title',
    Description: 'Item created via API',
    Status: 'Active'
  };
  
  sharepoint.listItems.create('My List Name', newItem, function(err, createdItem) {
    if (err) return console.error('Error creating item:', err);
    
    console.log('Created item with ID:', createdItem.Id);
  });
});

// Update an existing item
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  const updatedItem = {
    itemId: 123, // Required: ID of item to update
    Title: 'Updated Item Title',
    Status: 'Completed'
  };
  
  sharepoint.listItems.update('My List Name', updatedItem, function(err, result) {
    if (err) return console.error('Error updating item:', err);
    
    console.log('Item updated:', result.status);
  });
});

// Delete an item
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.del('My List Name', 123, function(err) {
    if (err) return console.error('Error deleting item:', err);
    
    console.log('Item deleted successfully');
  });
});
```

### Working with Files and Binary Content

```javascript
// Get binary stream for a file
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.byteStream('Documents', 'myfile.pdf', function(err, serviceReqObj) {
    if (err) return console.error('Error getting file stream:', err);
    
    // Use with Express.js to pipe file to response
    const request = require('request');
    request.get(serviceReqObj).on('response', function(response) {
      response.pipe(res); // 'res' is your Express response object
    });
  });
});

// Get binary stream by file path
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  const filePath = '/sites/mysite/Shared Documents/myfile.pdf';
  
  sharepoint.listItems.byteStreamByFilePath(filePath, function(err, serviceReqObj) {
    if (err) return console.error('Error getting file by path:', err);
    
    const request = require('request');
    request.get(serviceReqObj).on('response', function(response) {
      response.pipe(res);
    });
  });
});

// Move a file
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  const oldPath = '/sites/mysite/Documents/oldfile.pdf';
  const newPath = '/sites/mysite/Archive/newfile.pdf';
  
  sharepoint.listItems.moveTo(oldPath, newPath, function(err, result) {
    if (err) return console.error('Error moving file:', err);
    
    console.log('File moved:', result.status);
  });
});
```

### Getting Current User Information

```javascript
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.listItems.currentuser("Title eq 'Administrator'", function(err, user) {
    if (err) return console.error('Error getting current user:', err);
    
    console.log('Current user:', user);
  });
});
```

### Convenience Methods

```javascript
// Using convenience methods on list objects
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.list(function(err, lists) {
    if (err) return console.error(err);
    
    const firstList = lists[0];
    
    // Read list using convenience method
    firstList.read(function(err, listDetails) {
      if (err) return console.error(err);
      
      console.log('List details:', listDetails.Title);
      
      // Create item using convenience method
      listDetails.createItem({
        Title: 'Item via convenience method'
      }, function(err, newItem) {
        if (err) return console.error(err);
        
        console.log('Created item:', newItem.Id);
        
        // Delete the item we just created
        newItem.del(function(err) {
          if (err) return console.error(err);
          
          console.log('Item deleted via convenience method');
        });
      });
    });
  });
});
```

## TypeScript Examples

### Type Definitions

```typescript
// types/sharepoint-connector.d.ts
declare module 'sharepointconnector' {
  interface SharePointConfig {
    username: string;
    password: string;
    type: 'ntlm' | 'basic' | 'online' | 'onlinesaml';
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
  }

  interface SharePointList {
    Id: string;
    Title: string;
    Description?: string;
    ItemCount: number;
    Fields?: SharePointField[];
    Items?: SharePointListItem[];
    read(callback: (err: any, list?: SharePointList) => void): void;
    update(data: Partial<SharePointList>, callback: (err: any, result?: any) => void): void;
    delete(callback: (err: any) => void): void;
    createItem(item: any, callback: (err: any, item?: SharePointListItem) => void): void;
  }

  interface SharePointListItem {
    Id: number;
    Title: string;
    Created: string;
    Modified: string;
    File?: SharePointFile;
    [key: string]: any;
    read(callback: (err: any, item?: SharePointListItem) => void): void;
    del(callback: (err: any) => void): void;
  }

  interface SharePointField {
    Id: string;
    Title: string;
    InternalName: string;
    TypeAsString: string;
  }

  interface SharePointFile {
    Name: string;
    ServerRelativeUrl: string;
    Length: number;
  }

  interface SharePointClient {
    login(callback: (err: any) => void): void;
    lists: {
      list(callback: (err: any, lists?: SharePointList[]) => void): void;
      read(id: string, callback: (err: any, list?: SharePointList) => void): void;
      read(params: { title: string }, callback: (err: any, list?: SharePointList) => void): void;
      create(params: { title: string; description?: string }, callback: (err: any, list?: SharePointList) => void): void;
      update(id: string, data: Partial<SharePointList>, callback: (err: any, result?: any) => void): void;
      del(id: string, callback: (err: any) => void): void;
    };
    listItems: {
      list(listId: string, callback: (err: any, items?: SharePointListItem[], nextUrl?: string) => void): void;
      listAll(listId: string, callback: (err: any, items?: SharePointListItem[]) => void): void;
      read(listId: string, itemId: number, callback: (err: any, item?: SharePointListItem) => void): void;
      create(listId: string, item: any, callback: (err: any, item?: SharePointListItem) => void): void;
      update(listId: string, item: any, callback: (err: any, result?: any) => void): void;
      del(listId: string, itemId: number, callback: (err: any) => void): void;
      currentuser(filter: string, callback: (err: any, user?: any) => void): void;
      byteStream(folderName: string, filename: string, callback: (err: any, serviceReqObj?: any) => void): void;
      byteStreamByFilePath(filePath: string, callback: (err: any, serviceReqObj?: any) => void): void;
      moveTo(oldPath: string, newPath: string, callback: (err: any, result?: any) => void): void;
    };
  }

  function createClient(config: SharePointConfig): SharePointClient;
  export = createClient;
}
```

### TypeScript Usage Examples

```typescript
import * as sharepoint from 'sharepointconnector';

// Configuration with proper typing
const config: sharepoint.SharePointConfig = {
  username: 'your-username@company.com',
  password: 'your-password',
  type: 'online',
  url: 'https://your-company.sharepoint.com',
  context: 'sites/mysite',
  fieldValuesAsText: true,
  selectFields: ['Title', 'Status', 'Created'],
  $top: '1000'
};

// Create client instance
const client: sharepoint.SharePointClient = sharepoint(config);

// Async/await wrapper for better TypeScript experience
function loginAsync(): Promise<void> {
  return new Promise((resolve, reject) => {
    client.login((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getListsAsync(): Promise<sharepoint.SharePointList[]> {
  return new Promise((resolve, reject) => {
    client.lists.list((err, lists) => {
      if (err) reject(err);
      else resolve(lists || []);
    });
  });
}

function getListAsync(listId: string): Promise<sharepoint.SharePointList> {
  return new Promise((resolve, reject) => {
    client.lists.read(listId, (err, list) => {
      if (err) reject(err);
      else resolve(list!);
    });
  });
}

function createListItemAsync(listId: string, item: any): Promise<sharepoint.SharePointListItem> {
  return new Promise((resolve, reject) => {
    client.listItems.create(listId, item, (err, createdItem) => {
      if (err) reject(err);
      else resolve(createdItem!);
    });
  });
}

// Usage with async/await
async function demonstrateTypeScriptUsage(): Promise<void> {
  try {
    // Login
    await loginAsync();
    console.log('Successfully logged in!');

    // Get all lists
    const lists: sharepoint.SharePointList[] = await getListsAsync();
    console.log(`Found ${lists.length} lists`);

    // Find a specific list
    const targetList = lists.find(list => list.Title === 'My Target List');
    if (!targetList) {
      throw new Error('Target list not found');
    }

    // Get detailed list information
    const detailedList: sharepoint.SharePointList = await getListAsync(targetList.Id);
    console.log(`List "${detailedList.Title}" has ${detailedList.ItemCount} items`);

    // Create a new item with proper typing
    interface CustomListItem {
      Title: string;
      Status: 'Active' | 'Inactive' | 'Pending';
      Priority: number;
      Description?: string;
    }

    const newItem: CustomListItem = {
      Title: 'TypeScript Created Item',
      Status: 'Active',
      Priority: 1,
      Description: 'This item was created using TypeScript'
    };

    const createdItem: sharepoint.SharePointListItem = await createListItemAsync(targetList.Id, newItem);
    console.log(`Created item with ID: ${createdItem.Id}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Class-based approach for better organization
class SharePointService {
  private client: sharepoint.SharePointClient;

  constructor(config: sharepoint.SharePointConfig) {
    this.client = sharepoint(config);
  }

  async login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.login((err) => {
        if (err) reject(new Error(`Login failed: ${err}`));
        else resolve();
      });
    });
  }

  async getAllLists(): Promise<sharepoint.SharePointList[]> {
    return new Promise((resolve, reject) => {
      this.client.lists.list((err, lists) => {
        if (err) reject(new Error(`Failed to get lists: ${err}`));
        else resolve(lists || []);
      });
    });
  }

  async getListByTitle(title: string): Promise<sharepoint.SharePointList> {
    return new Promise((resolve, reject) => {
      this.client.lists.read({ title }, (err, list) => {
        if (err) reject(new Error(`Failed to get list "${title}": ${err}`));
        else resolve(list!);
      });
    });
  }

  async createListItem<T>(listId: string, item: T): Promise<sharepoint.SharePointListItem> {
    return new Promise((resolve, reject) => {
      this.client.listItems.create(listId, item, (err, createdItem) => {
        if (err) reject(new Error(`Failed to create item: ${err}`));
        else resolve(createdItem!);
      });
    });
  }

  async getListItems(listId: string): Promise<sharepoint.SharePointListItem[]> {
    return new Promise((resolve, reject) => {
      this.client.listItems.listAll(listId, (err, items) => {
        if (err) reject(new Error(`Failed to get items: ${err}`));
        else resolve(items || []);
      });
    });
  }

  async downloadFile(folderName: string, fileName: string): Promise<NodeJS.ReadableStream> {
    return new Promise((resolve, reject) => {
      this.client.listItems.byteStream(folderName, fileName, (err, serviceReqObj) => {
        if (err) reject(new Error(`Failed to get file stream: ${err}`));
        else {
          const request = require('request');
          resolve(request.get(serviceReqObj));
        }
      });
    });
  }
}

// Usage example with the service class
async function useSharePointService(): Promise<void> {
  const service = new SharePointService({
    username: 'user@company.com',
    password: 'password',
    type: 'online',
    url: 'https://company.sharepoint.com'
  });

  try {
    await service.login();
    
    const lists = await service.getAllLists();
    console.log(`Available lists: ${lists.map(l => l.Title).join(', ')}`);

    const myList = await service.getListByTitle('Tasks');
    console.log(`Tasks list has ${myList.ItemCount} items`);

    const newTask = await service.createListItem(myList.Id, {
      Title: 'New Task from TypeScript',
      Status: 'Not Started',
      Priority: 'High'
    });
    console.log(`Created task with ID: ${newTask.Id}`);

  } catch (error) {
    console.error('Service error:', error);
  }
}

// Export for use in other modules
export { SharePointService, demonstrateTypeScriptUsage, useSharePointService };
```

## Error Handling Best Practices

### JavaScript Error Handling

```javascript
function handleSharePointOperation() {
  sharepoint.login(function(err) {
    if (err) {
      console.error('Login Error Details:', {
        message: err.message || err,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      return;
    }

    sharepoint.lists.list(function(err, lists) {
      if (err) {
        console.error('Lists Error:', err);
        return;
      }

      if (!lists || lists.length === 0) {
        console.log('No lists found');
        return;
      }

      // Process lists safely
      lists.forEach(list => {
        try {
          console.log(`Processing list: ${list.Title}`);
          // Your list processing logic here
        } catch (processingError) {
          console.error(`Error processing list ${list.Title}:`, processingError);
        }
      });
    });
  });
}
```

### TypeScript Error Handling

```typescript
class SharePointError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'SharePointError';
  }
}

async function safeSharePointOperation(): Promise<void> {
  const service = new SharePointService(config);
  
  try {
    await service.login();
  } catch (error) {
    throw new SharePointError('Authentication failed', error);
  }

  try {
    const lists = await service.getAllLists();
    
    for (const list of lists) {
      try {
        const items = await service.getListItems(list.Id);
        console.log(`List "${list.Title}" has ${items.length} items`);
      } catch (itemError) {
        console.warn(`Could not retrieve items for list "${list.Title}":`, itemError);
        // Continue with other lists
      }
    }
  } catch (error) {
    throw new SharePointError('Failed to retrieve lists', error);
  }
}
```

## Complete Working Examples

### JavaScript: Task Management System

```javascript
const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: 'online',
  url: process.env.SP_URL
});

function createTaskManagementSystem() {
  sharepoint.login(function(err) {
    if (err) {
      console.error('Failed to login:', err);
      return;
    }

    // Create a Tasks list
    sharepoint.lists.create({
      title: 'API Tasks',
      description: 'Tasks managed via SharePoint API'
    }, function(err, tasksList) {
      if (err) {
        console.error('Failed to create tasks list:', err);
        return;
      }

      console.log(`Created tasks list: ${tasksList.Title}`);

      // Add some sample tasks
      const tasks = [
        { Title: 'Setup SharePoint Integration', Status: 'In Progress', Priority: 'High' },
        { Title: 'Create API Documentation', Status: 'Not Started', Priority: 'Medium' },
        { Title: 'Write Unit Tests', Status: 'Not Started', Priority: 'Low' }
      ];

      let completedTasks = 0;
      tasks.forEach(task => {
        sharepoint.listItems.create(tasksList.Id, task, function(err, createdTask) {
          if (err) {
            console.error(`Failed to create task "${task.Title}":`, err);
          } else {
            console.log(`Created task: ${createdTask.Title} (ID: ${createdTask.Id})`);
          }
          
          completedTasks++;
          if (completedTasks === tasks.length) {
            console.log('All tasks created successfully!');
            
            // Retrieve and display all tasks
            displayAllTasks(tasksList.Id);
          }
        });
      });
    });
  });
}

function displayAllTasks(listId) {
  sharepoint.listItems.listAll(listId, function(err, allTasks) {
    if (err) {
      console.error('Failed to retrieve tasks:', err);
      return;
    }

    console.log('\n=== All Tasks ===');
    allTasks.forEach(task => {
      console.log(`${task.Title} - Status: ${task.Status}, Priority: ${task.Priority}`);
    });
  });
}

// Run the example
createTaskManagementSystem();
```

### TypeScript: Document Management System

```typescript
import * as sharepoint from 'sharepointconnector';
import * as fs from 'fs';
import * as path from 'path';

interface Document {
  Title: string;
  Category: string;
  Author: string;
  Tags?: string;
  Description?: string;
}

class DocumentManagementSystem {
  private client: sharepoint.SharePointClient;
  private documentsListId?: string;

  constructor(config: sharepoint.SharePointConfig) {
    this.client = sharepoint(config);
  }

  async initialize(): Promise<void> {
    await this.login();
    await this.ensureDocumentsListExists();
  }

  private async login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.login((err) => {
        if (err) reject(new Error(`Login failed: ${err}`));
        else resolve();
      });
    });
  }

  private async ensureDocumentsListExists(): Promise<void> {
    try {
      const list = await this.getListByTitle('API Documents');
      this.documentsListId = list.Id;
      console.log('Using existing documents list');
    } catch {
      // List doesn't exist, create it
      const newList = await this.createList({
        title: 'API Documents',
        description: 'Documents managed via SharePoint API'
      });
      this.documentsListId = newList.Id;
      console.log('Created new documents list');
    }
  }

  private async getListByTitle(title: string): Promise<sharepoint.SharePointList> {
    return new Promise((resolve, reject) => {
      this.client.lists.read({ title }, (err, list) => {
        if (err) reject(err);
        else resolve(list!);
      });
    });
  }

  private async createList(params: { title: string; description: string }): Promise<sharepoint.SharePointList> {
    return new Promise((resolve, reject) => {
      this.client.lists.create(params, (err, list) => {
        if (err) reject(err);
        else resolve(list!);
      });
    });
  }

  async addDocument(document: Document): Promise<sharepoint.SharePointListItem> {
    if (!this.documentsListId) {
      throw new Error('Documents list not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client.listItems.create(this.documentsListId!, document, (err, item) => {
        if (err) reject(err);
        else resolve(item!);
      });
    });
  }

  async getAllDocuments(): Promise<sharepoint.SharePointListItem[]> {
    if (!this.documentsListId) {
      throw new Error('Documents list not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client.listItems.listAll(this.documentsListId!, (err, items) => {
        if (err) reject(err);
        else resolve(items || []);
      });
    });
  }

  async searchDocuments(category: string): Promise<sharepoint.SharePointListItem[]> {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => doc.Category === category);
  }

  async updateDocument(itemId: number, updates: Partial<Document>): Promise<void> {
    if (!this.documentsListId) {
      throw new Error('Documents list not initialized');
    }

    return new Promise((resolve, reject) => {
      const updateData = { ...updates, itemId };
      this.client.listItems.update(this.documentsListId!, updateData, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteDocument(itemId: number): Promise<void> {
    if (!this.documentsListId) {
      throw new Error('Documents list not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client.listItems.del(this.documentsListId!, itemId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Usage example
async function runDocumentManagementExample(): Promise<void> {
  const config: sharepoint.SharePointConfig = {
    username: process.env.SP_USERNAME!,
    password: process.env.SP_PASSWORD!,
    type: 'online',
    url: process.env.SP_URL!
  };

  const docSystem = new DocumentManagementSystem(config);

  try {
    await docSystem.initialize();

    // Add some documents
    const documents: Document[] = [
      {
        Title: 'API Integration Guide',
        Category: 'Documentation',
        Author: 'John Doe',
        Tags: 'API, Integration, Guide',
        Description: 'Comprehensive guide for API integration'
      },
      {
        Title: 'Security Best Practices',
        Category: 'Security',
        Author: 'Jane Smith',
        Tags: 'Security, Best Practices',
        Description: 'Security guidelines for development'
      }
    ];

    for (const doc of documents) {
      const createdDoc = await docSystem.addDocument(doc);
      console.log(`Added document: ${createdDoc.Title} (ID: ${createdDoc.Id})`);
    }

    // Retrieve all documents
    const allDocs = await docSystem.getAllDocuments();
    console.log(`\nTotal documents: ${allDocs.length}`);

    // Search for security documents
    const securityDocs = await docSystem.searchDocuments('Security');
    console.log(`Security documents: ${securityDocs.length}`);

    // Update a document
    if (allDocs.length > 0) {
      await docSystem.updateDocument(allDocs[0].Id, {
        Tags: 'Updated, API, Integration'
      });
      console.log(`Updated document: ${allDocs[0].Title}`);
    }

  } catch (error) {
    console.error('Document management error:', error);
  }
}

// Export for use
export { DocumentManagementSystem, runDocumentManagementExample };
```

## Environment Setup

Create a `.env` file for your credentials:

```bash
# SharePoint Credentials
SP_USERNAME=your-username@company.com
SP_PASSWORD=your-password
SP_URL=https://your-company.sharepoint.com
SP_AUTH_TYPE=online
SP_CONTEXT=web
```

Load environment variables in your application:

```javascript
// For Node.js applications
require('dotenv').config();

const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE || 'online',
  url: process.env.SP_URL,
  context: process.env.SP_CONTEXT || 'web'
});
```

These examples demonstrate the comprehensive capabilities of the `sharepointconnector` library, from basic authentication to complex document management scenarios. Choose the approach that best fits your project's needs and authentication requirements.