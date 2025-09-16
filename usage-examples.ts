/**
 * SharePoint Connector - TypeScript Usage Examples
 * 
 * This file demonstrates comprehensive usage of the sharepointconnector library
 * with TypeScript type definitions, interfaces, and proper typing.
 */

// Type definitions for the SharePoint connector
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
  filterFields?: Array<{ field: string; value: string | number | boolean }>;
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
  ItemCount?: number;
  Created?: string;
  LastItemModifiedDate?: string;
  Fields?: SharePointField[];
  Items?: SharePointListItem[];
  
  // Convenience methods
  read(callback: (err: any, list?: SharePointListDetails) => void): void;
  update(data: Partial<SharePointList>, callback: (err: any, result?: any) => void): void;
  delete(callback: (err: any) => void): void;
}

interface SharePointListDetails extends SharePointList {
  Fields: SharePointField[];
  Items: SharePointListItem[];
  createItem?: (data: any, callback: (err: any, item?: SharePointListItem) => void) => void;
}

interface SharePointField {
  Id: string;
  Title: string;
  InternalName: string;
  TypeAsString: string;
  Required: boolean;
  Hidden: boolean;
  ReadOnlyField: boolean;
}

interface SharePointListItem {
  Id: number;
  Title: string;
  Created?: string;
  Modified?: string;
  Author?: {
    Title: string;
    Email?: string;
    LoginName?: string;
  };
  Editor?: {
    Title: string;
    Email?: string;
    LoginName?: string;
  };
  File?: SharePointFile;
  [key: string]: any; // Allow additional custom fields
  
  // Convenience methods
  read(callback: (err: any, item?: SharePointListItem) => void): void;
  update(data: Partial<SharePointListItem>, callback: (err: any, result?: any) => void): void;
  delete(callback: (err: any) => void): void;
}

interface SharePointFile {
  Name: string;
  ServerRelativeUrl: string;
  Length: number;
  TimeCreated: string;
  TimeLastModified: string;
  Title?: string;
}

interface SharePointUser {
  Id: number;
  Title: string;
  LoginName: string;
  Email: string;
  IsSiteAdmin: boolean;
}

interface SharePointClient {
  login(callback: (err: any) => void): void;
  
  lists: {
    list(callback: (err: any, lists?: SharePointList[], nextUrl?: string) => void): void;
    create(params: { title: string; description?: string }, callback: (err: any, list?: SharePointList) => void): void;
    read(listId: string | { title: string }, callback: (err: any, list?: SharePointListDetails) => void): void;
    update(listId: string, data: Partial<SharePointList>, callback: (err: any, result?: any) => void): void;
    update(data: Partial<SharePointList> & { Id: string }, callback: (err: any, result?: any) => void): void;
    del(listId: string, callback: (err: any) => void): void;
  };
  
  listItems: {
    list(listId: string, callback: (err: any, items?: SharePointListItem[], nextUrl?: string) => void): void;
    listAll(listId: string, callback: (err: any, items?: SharePointListItem[]) => void): void;
    create(listId: string, item: Partial<SharePointListItem>, callback: (err: any, item?: SharePointListItem) => void): void;
    read(listId: string, itemId: string, callback: (err: any, item?: SharePointListItem) => void): void;
    update(listId: string, itemId: string, data: Partial<SharePointListItem>, callback: (err: any, result?: any) => void): void;
    del(listId: string, itemId: string, callback: (err: any) => void): void;
    currentuser(listId: string, callback: (err: any, user?: SharePointUser) => void): void;
    byteStream(folderName: string, fileName: string, callback: (err: any, requestOptions?: any) => void): void;
    byteStreamByFilePath(filePath: string, callback: (err: any, requestOptions?: any) => void): void;
  };
}

// Import the SharePoint connector (assumes proper module declaration or @types package)
declare function sharepoint(config: SharePointConfig): SharePointClient;

// If using require syntax (Node.js)
const sharepoint = require('sharepointconnector') as (config: SharePointConfig) => SharePointClient;

// ============================================================================
// CONFIGURATION & AUTHENTICATION
// ============================================================================

// Example 1: Basic Authentication with full typing
const spBasicConfig: SharePointConfig = {
  username: 'domain\\username',
  password: 'your-password',
  type: 'basic',
  url: 'https://your-sharepoint-site.com',
  context: 'sites/your-site',
  strictSSL: false
};

const spBasic: SharePointClient = sharepoint(spBasicConfig);

// Example 2: NTLM Authentication
const spNTLMConfig: SharePointConfig = {
  username: 'domain\\username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com',
  domain: 'your-domain',
  workstation: 'your-workstation'
};

const spNTLM: SharePointClient = sharepoint(spNTLMConfig);

// Example 3: SharePoint Online (Office 365)
const spOnlineConfig: SharePointConfig = {
  username: 'user@yourdomain.onmicrosoft.com',
  password: 'your-password',
  type: 'online',
  url: 'https://yourdomain.sharepoint.com'
};

const spOnline: SharePointClient = sharepoint(spOnlineConfig);

// Example 4: Advanced Configuration with filtering
const spAdvancedConfig: SharePointConfig = {
  username: 'user@domain.com',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com',
  context: 'sites/your-site',
  verbose: false,
  fieldValuesAsText: true,
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Priority', value: 'High' }
  ],
  selectFields: ['Title', 'Description', 'Created', 'Author'],
  expandFields: ['Author', 'AssignedTo'],
  orOperator: false,
  $top: '1000',
  proxy: 'http://proxy-server:8080',
  strictSSL: true
};

const spAdvanced: SharePointClient = sharepoint(spAdvancedConfig);

// ============================================================================
// AUTHENTICATION & LOGIN
// ============================================================================

async function authenticateAsync(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    spNTLM.login((err: any) => {
      if (err) {
        reject(new Error(`Authentication failed: ${err.message || err}`));
        return;
      }
      console.log('Successfully authenticated with SharePoint');
      resolve();
    });
  });
}

// Using async/await pattern
async function authenticateAndStart(): Promise<void> {
  try {
    await authenticateAsync();
    await performListOperations();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Traditional callback approach with proper typing
function authenticateTraditional(): void {
  spNTLM.login((err: any) => {
    if (err) {
      console.error('Authentication failed:', err);
      return;
    }
    
    console.log('Successfully authenticated with SharePoint');
    performListOperationsTraditional();
  });
}

// ============================================================================
// LISTS OPERATIONS (Async/Await)
// ============================================================================

async function getListsAsync(): Promise<SharePointList[]> {
  return new Promise<SharePointList[]>((resolve, reject) => {
    spNTLM.lists.list((err: any, lists?: SharePointList[], nextUrl?: string) => {
      if (err) {
        reject(new Error(`Failed to fetch lists: ${err.message || err}`));
        return;
      }
      
      console.log(`Found ${lists?.length || 0} lists`);
      if (nextUrl) {
        console.log('More results available at:', nextUrl);
      }
      
      resolve(lists || []);
    });
  });
}

async function createListAsync(title: string, description?: string): Promise<SharePointList> {
  return new Promise<SharePointList>((resolve, reject) => {
    spNTLM.lists.create({ title, description }, (err: any, newList?: SharePointList) => {
      if (err) {
        reject(new Error(`Failed to create list: ${err.message || err}`));
        return;
      }
      
      if (!newList) {
        reject(new Error('List creation returned no result'));
        return;
      }
      
      console.log('Created new list:', newList.Title);
      resolve(newList);
    });
  });
}

async function readListAsync(listId: string | { title: string }): Promise<SharePointListDetails> {
  return new Promise<SharePointListDetails>((resolve, reject) => {
    spNTLM.lists.read(listId, (err: any, listDetails?: SharePointListDetails) => {
      if (err) {
        reject(new Error(`Failed to read list: ${err.message || err}`));
        return;
      }
      
      if (!listDetails) {
        reject(new Error('List read returned no result'));
        return;
      }
      
      console.log('List details:', {
        title: listDetails.Title,
        itemCount: listDetails.ItemCount,
        fieldsCount: listDetails.Fields?.length || 0,
        itemsCount: listDetails.Items?.length || 0
      });
      
      resolve(listDetails);
    });
  });
}

async function performListOperations(): Promise<void> {
  try {
    // Get all lists
    const lists = await getListsAsync();
    
    // Create a new list
    const newList = await createListAsync('My TypeScript List', 'Created with TypeScript');
    
    // Read a list by title
    const listDetails = await readListAsync({ title: 'My TypeScript List' });
    
    // Access typed properties
    console.log('Fields:', listDetails.Fields.map((f: SharePointField) => f.Title));
    console.log('Items count:', listDetails.Items.length);
    
  } catch (error) {
    console.error('List operations failed:', error);
  }
}

// ============================================================================
// LIST ITEMS OPERATIONS (Async/Await)
// ============================================================================

interface TaskItem extends SharePointListItem {
  Status: string;
  Priority: 'Low' | 'Medium' | 'High';
  DueDate?: string;
  AssignedTo?: {
    Title: string;
    Email: string;
  };
}

async function getListItemsAsync(listName: string): Promise<SharePointListItem[]> {
  return new Promise<SharePointListItem[]>((resolve, reject) => {
    spNTLM.listItems.list(listName, (err: any, items?: SharePointListItem[], nextUrl?: string) => {
      if (err) {
        reject(new Error(`Failed to fetch list items: ${err.message || err}`));
        return;
      }
      
      console.log(`Found ${items?.length || 0} items in list`);
      if (nextUrl) {
        console.log('Next page available at:', nextUrl);
      }
      
      resolve(items || []);
    });
  });
}

async function getAllListItemsAsync(listName: string): Promise<SharePointListItem[]> {
  return new Promise<SharePointListItem[]>((resolve, reject) => {
    spNTLM.listItems.listAll(listName, (err: any, allItems?: SharePointListItem[]) => {
      if (err) {
        reject(new Error(`Failed to fetch all list items: ${err.message || err}`));
        return;
      }
      
      console.log(`Retrieved all ${allItems?.length || 0} items from list`);
      resolve(allItems || []);
    });
  });
}

async function createListItemAsync<T extends SharePointListItem>(
  listName: string, 
  itemData: Partial<T>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    spNTLM.listItems.create(listName, itemData, (err: any, newItem?: SharePointListItem) => {
      if (err) {
        reject(new Error(`Failed to create list item: ${err.message || err}`));
        return;
      }
      
      if (!newItem) {
        reject(new Error('Item creation returned no result'));
        return;
      }
      
      console.log('Created new item:', newItem.Title);
      resolve(newItem as T);
    });
  });
}

async function readListItemAsync(listName: string, itemId: string): Promise<SharePointListItem> {
  return new Promise<SharePointListItem>((resolve, reject) => {
    spNTLM.listItems.read(listName, itemId, (err: any, item?: SharePointListItem) => {
      if (err) {
        reject(new Error(`Failed to read list item: ${err.message || err}`));
        return;
      }
      
      if (!item) {
        reject(new Error('Item read returned no result'));
        return;
      }
      
      console.log('Item details:', {
        title: item.Title,
        created: item.Created,
        author: item.Author?.Title || 'Unknown'
      });
      
      if (item.File) {
        console.log('Item has attached file:', item.File.Name);
      }
      
      resolve(item);
    });
  });
}

async function performListItemOperations(): Promise<void> {
  const listName = 'Tasks';
  
  try {
    // Get items from a list
    const items = await getListItemsAsync(listName);
    
    // Get all items (handles pagination)
    const allItems = await getAllListItemsAsync(listName);
    
    // Create a new task item with proper typing
    const newTaskItem: Partial<TaskItem> = {
      Title: 'New TypeScript Task',
      Status: 'Active',
      Priority: 'High',
      DueDate: new Date().toISOString()
    };
    
    const createdTask = await createListItemAsync<TaskItem>(listName, newTaskItem);
    
    // Read the created item
    const readTask = await readListItemAsync(listName, createdTask.Id.toString());
    
    // Type-safe access to properties
    if ('Status' in readTask) {
      console.log('Task status:', (readTask as TaskItem).Status);
    }
    
  } catch (error) {
    console.error('List item operations failed:', error);
  }
}

// ============================================================================
// ADVANCED FEATURES (Async/Await)
// ============================================================================

async function getCurrentUserAsync(listName: string): Promise<SharePointUser> {
  return new Promise<SharePointUser>((resolve, reject) => {
    spNTLM.listItems.currentuser(listName, (err: any, userInfo?: SharePointUser) => {
      if (err) {
        reject(new Error(`Failed to get current user: ${err.message || err}`));
        return;
      }
      
      if (!userInfo) {
        reject(new Error('Current user request returned no result'));
        return;
      }
      
      resolve(userInfo);
    });
  });
}

async function downloadFileAsync(folderName: string, fileName: string): Promise<NodeJS.ReadableStream> {
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    spNTLM.listItems.byteStream(folderName, fileName, (err: any, requestOptions?: any) => {
      if (err) {
        reject(new Error(`Failed to prepare file download: ${err.message || err}`));
        return;
      }
      
      const request = require('request');
      const stream = request.get(requestOptions);
      
      stream.on('response', (response: any) => {
        console.log('File download started, size:', response.headers['content-length']);
      });
      
      stream.on('error', (error: any) => {
        reject(new Error(`File download failed: ${error.message}`));
      });
      
      resolve(stream);
    });
  });
}

async function demonstrateAdvancedFeatures(): Promise<void> {
  try {
    // Get current user with proper typing
    const currentUser = await getCurrentUserAsync('Tasks');
    console.log('Current user:', {
      title: currentUser.Title,
      email: currentUser.Email,
      loginName: currentUser.LoginName,
      isAdmin: currentUser.IsSiteAdmin
    });
    
    // Download file with proper stream handling
    const fileStream = await downloadFileAsync('Documents', 'report.pdf');
    
    // Save file using streams
    const fs = require('fs');
    const writeStream = fs.createWriteStream('./downloaded-report.pdf');
    
    fileStream.pipe(writeStream);
    
    fileStream.on('end', () => {
      console.log('File downloaded successfully');
    });
    
  } catch (error) {
    console.error('Advanced features failed:', error);
  }
}

// ============================================================================
// ERROR HANDLING WITH CUSTOM ERROR TYPES
// ============================================================================

class SharePointError extends Error {
  public statusCode?: number;
  public code?: string;
  
  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'SharePointError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleSharePointError(err: any): SharePointError {
  if (err.code === 'ENOTFOUND') {
    return new SharePointError('SharePoint server not found. Check the URL.', undefined, 'ENOTFOUND');
  } else if (err.statusCode === 401) {
    return new SharePointError('Authentication failed. Check username/password.', 401, 'UNAUTHORIZED');
  } else if (err.statusCode === 403) {
    return new SharePointError('Access forbidden. Check user permissions.', 403, 'FORBIDDEN');
  } else if (err.statusCode === 404) {
    return new SharePointError('Resource not found.', 404, 'NOT_FOUND');
  } else {
    return new SharePointError(err.message || err.toString(), err.statusCode, err.code);
  }
}

async function demonstrateErrorHandling(): Promise<void> {
  try {
    await authenticateAsync();
    
    // This will likely fail - demonstrating error handling
    await readListAsync('NonExistentList');
    
  } catch (error) {
    const spError = handleSharePointError(error);
    
    console.error('SharePoint Error:', {
      message: spError.message,
      statusCode: spError.statusCode,
      code: spError.code
    });
    
    // Handle specific error types
    switch (spError.code) {
      case 'UNAUTHORIZED':
        console.log('Please check your credentials');
        break;
      case 'NOT_FOUND':
        console.log('The requested resource does not exist');
        break;
      case 'FORBIDDEN':
        console.log('You do not have permission to access this resource');
        break;
      default:
        console.log('An unexpected error occurred');
    }
  }
}

// ============================================================================
// TRADITIONAL CALLBACK OPERATIONS (Maintaining backward compatibility)
// ============================================================================

function performListOperationsTraditional(): void {
  // Get all lists in the SharePoint site
  spNTLM.lists.list((err: any, lists?: SharePointList[], nextUrl?: string) => {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    if (!lists) return;
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach((list: SharePointList) => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
    
    // Handle pagination if needed
    if (nextUrl) {
      console.log('More results available at:', nextUrl);
    }
  });
  
  // Create a new list with proper typing
  const listParams: { title: string; description?: string } = {
    title: 'My New TypeScript List',
    description: 'A list created via the TypeScript connector'
  };
  
  spNTLM.lists.create(listParams, (err: any, newList?: SharePointList) => {
    if (err) {
      console.error('Error creating list:', err);
      return;
    }
    
    if (newList) {
      console.log('Created new list:', newList.Title);
    }
  });
  
  // Read a list by title with proper typing
  spNTLM.lists.read({ title: 'My List Name' }, (err: any, listDetails?: SharePointListDetails) => {
    if (err) {
      console.error('Error reading list by title:', err);
      return;
    }
    
    if (!listDetails) return;
    
    console.log('Found list:', listDetails.Title);
    
    // Type-safe access to fields and items
    if (listDetails.Fields) {
      console.log('Fields:', listDetails.Fields.map((f: SharePointField) => f.Title));
    }
    
    if (listDetails.Items) {
      console.log('Items:', listDetails.Items.length);
    }
  });
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Export functions for use in other modules
export {
  SharePointConfig,
  SharePointClient,
  SharePointList,
  SharePointListDetails,
  SharePointListItem,
  SharePointField,
  SharePointUser,
  SharePointFile,
  TaskItem,
  SharePointError,
  authenticateAndStart,
  performListOperations,
  performListItemOperations,
  demonstrateAdvancedFeatures,
  demonstrateErrorHandling,
  performListOperationsTraditional
};

// Example usage
async function main(): Promise<void> {
  console.log('SharePoint Connector - TypeScript Usage Examples');
  console.log('=================================================');
  
  try {
    // Uncomment the functions you want to run:
    // await authenticateAndStart();
    // await performListItemOperations();
    // await demonstrateAdvancedFeatures();
    // await demonstrateErrorHandling();
    
    // Or use traditional callback approach:
    // authenticateTraditional();
    
  } catch (error) {
    console.error('Main execution failed:', error);
  }
}

// Uncomment to run examples
// main().catch(console.error);