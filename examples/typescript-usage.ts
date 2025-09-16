/**
 * SharePoint Connector - TypeScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * with TypeScript, including proper type definitions and interfaces.
 */

// Type definitions for the sharepointconnector library
interface SharePointConfig {
  // Required parameters
  username: string;
  password: string;
  url: string;
  
  // Authentication type
  type?: 'ntlm' | 'basic' | 'online' | 'onlinesaml';
  
  // Optional parameters
  context?: string;
  verbose?: boolean;
  strictSSL?: boolean;
  proxy?: string;
  workstation?: string;
  domain?: string;
  
  // Query parameters
  fieldValuesAsText?: boolean;
  filterFields?: Array<{ field: string; value: string }>;
  selectFields?: string[];
  expandFields?: string[];
  orOperator?: boolean;
  andOrOperator?: boolean;
  $top?: string;
  
  // Advanced authentication
  federatedAuthUrl?: string;
  rtFa?: string;
  FedAuth?: string;
  authenticator?: any;
}

interface SharePointList {
  Id: string;
  Title: string;
  Description?: string;
  Created?: string;
  Modified?: string;
  ItemCount?: number;
  Items?: SharePointListItem[];
  Fields?: SharePointField[];
  
  // Convenience methods
  read?: (callback: (err: any, result?: SharePointList) => void) => void;
  update?: (data: Partial<SharePointList>, callback: (err: any, result?: SharePointList) => void) => void;
  delete?: (callback: (err: any) => void) => void;
}

interface SharePointListItem {
  Id: number;
  Title: string;
  Created?: string;
  Modified?: string;
  Author?: any;
  Editor?: any;
  File?: SharePointFile;
  [key: string]: any; // Allow additional custom fields
  
  // Convenience methods
  read?: (callback: (err: any, result?: SharePointListItem) => void) => void;
  update?: (data: Partial<SharePointListItem>, callback: (err: any, result?: any) => void) => void;
  delete?: (callback: (err: any) => void) => void;
}

interface SharePointField {
  Id: string;
  Title: string;
  InternalName: string;
  TypeAsString: string;
  Required: boolean;
  ReadOnlyField: boolean;
}

interface SharePointFile {
  Name: string;
  ServerRelativeUrl: string;
  Length: number;
  TimeCreated: string;
  TimeLastModified: string;
}

interface SharePointUser {
  Id: number;
  Title: string;
  LoginName: string;
  Email: string;
}

interface PaginationResult<T> {
  items: T[];
  nextUrl?: string;
}

interface SharePointClient {
  login: (callback: (err: any) => void) => void;
  lists: {
    list: (callback: (err: any, lists?: SharePointList[], nextUrl?: string) => void) => void;
    read: (
      params: string | { id?: string; guid?: string; title?: string; name?: string },
      callback: (err: any, list?: SharePointList) => void
    ) => void;
    create: (
      params: { title: string; description?: string },
      callback: (err: any, list?: SharePointList) => void
    ) => void;
    update: (
      id: string,
      data: Partial<SharePointList>,
      callback: (err: any, result?: SharePointList) => void
    ) => void;
    del: (id: string, callback: (err: any) => void) => void;
    delete: (id: string, callback: (err: any) => void) => void;
  };
  listItems: {
    list: (
      listId: string,
      callback: (err: any, items?: SharePointListItem[], nextUrl?: string) => void
    ) => void;
    listAll: (
      listId: string,
      callback: (err: any, items?: SharePointListItem[]) => void
    ) => void;
    read: (
      listId: string,
      itemId: number,
      callback: (err: any, item?: SharePointListItem) => void
    ) => void;
    create: (
      listId: string,
      item: Partial<SharePointListItem>,
      callback: (err: any, item?: SharePointListItem) => void
    ) => void;
    update: (
      listId: string,
      item: Partial<SharePointListItem> & { itemId: number },
      callback: (err: any, result?: any) => void
    ) => void;
    del: (
      listId: string,
      itemId: number,
      callback: (err: any) => void
    ) => void;
    delete: (
      listId: string,
      itemId: number,
      callback: (err: any) => void
    ) => void;
    currentuser: (
      filter: string,
      callback: (err: any, user?: SharePointUser) => void
    ) => void;
    byteStream: (
      folderName: string,
      fileName: string,
      callback: (err: any, stream?: any) => void
    ) => void;
    byteStreamByFilePath: (
      filePath: string,
      callback: (err: any, stream?: any) => void
    ) => void;
    moveTo: (
      oldPath: string,
      newPath: string,
      callback: (err: any, result?: any) => void
    ) => void;
  };
}

// Import the sharepointconnector library
const sharepoint = require('sharepointconnector') as (config: SharePointConfig) => SharePointClient;

// Configuration with proper typing
const config: SharePointConfig = {
  // Required parameters
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.com',
  
  // Authentication type with type safety
  type: 'online', // TypeScript will enforce valid values
  
  // Optional parameters with proper types
  context: 'web',
  verbose: false,
  strictSSL: true,
  proxy: undefined,
  
  // Query parameters with type safety
  fieldValuesAsText: true,
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Category', value: 'Important' }
  ],
  selectFields: ['Title', 'Status', 'Created', 'Modified'],
  expandFields: ['Author', 'Editor'],
  orOperator: false,
  andOrOperator: false,
  $top: '1000',
  
  // Advanced authentication
  federatedAuthUrl: undefined,
  rtFa: undefined,
  FedAuth: undefined
};

// Initialize SharePoint client with proper typing
const sp: SharePointClient = sharepoint(config);

// Utility function to promisify callback-based functions
function promisify<T>(
  fn: (callback: (err: any, result?: T, ...args: any[]) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err: any, result?: T, ...args: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(result as T);
      }
    });
  });
}

// Utility function for paginated results
function promisifyPaginated<T>(
  fn: (callback: (err: any, result?: T[], nextUrl?: string) => void) => void
): Promise<PaginationResult<T>> {
  return new Promise((resolve, reject) => {
    fn((err: any, result?: T[], nextUrl?: string) => {
      if (err) {
        reject(err);
      } else {
        resolve({ items: result || [], nextUrl });
      }
    });
  });
}

class SharePointService {
  private client: SharePointClient;
  private isAuthenticated: boolean = false;

  constructor(client: SharePointClient) {
    this.client = client;
  }

  // Authentication with proper error handling
  async authenticate(): Promise<void> {
    if (this.isAuthenticated) {
      return;
    }

    try {
      await promisify<void>((cb) => this.client.login(cb));
      this.isAuthenticated = true;
      console.log('✅ Successfully authenticated with SharePoint');
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error(`SharePoint authentication failed: ${error}`);
    }
  }

  // Get all lists with type safety
  async getLists(): Promise<PaginationResult<SharePointList>> {
    await this.authenticate();
    return promisifyPaginated<SharePointList>((cb) => this.client.lists.list(cb));
  }

  // Get a specific list by ID or title
  async getList(identifier: string | { id?: string; title?: string }): Promise<SharePointList> {
    await this.authenticate();
    return promisify<SharePointList>((cb) => this.client.lists.read(identifier, cb));
  }

  // Create a new list
  async createList(params: { title: string; description?: string }): Promise<SharePointList> {
    await this.authenticate();
    return promisify<SharePointList>((cb) => this.client.lists.create(params, cb));
  }

  // Update a list
  async updateList(id: string, data: Partial<SharePointList>): Promise<SharePointList> {
    await this.authenticate();
    return promisify<SharePointList>((cb) => this.client.lists.update(id, data, cb));
  }

  // Delete a list
  async deleteList(id: string): Promise<void> {
    await this.authenticate();
    return promisify<void>((cb) => this.client.lists.del(id, cb));
  }

  // Get list items with pagination support
  async getListItems(listId: string): Promise<PaginationResult<SharePointListItem>> {
    await this.authenticate();
    return promisifyPaginated<SharePointListItem>((cb) => this.client.listItems.list(listId, cb));
  }

  // Get all list items (handles pagination internally)
  async getAllListItems(listId: string): Promise<SharePointListItem[]> {
    await this.authenticate();
    return promisify<SharePointListItem[]>((cb) => this.client.listItems.listAll(listId, cb));
  }

  // Get a specific list item
  async getListItem(listId: string, itemId: number): Promise<SharePointListItem> {
    await this.authenticate();
    return promisify<SharePointListItem>((cb) => this.client.listItems.read(listId, itemId, cb));
  }

  // Create a new list item
  async createListItem(listId: string, item: Partial<SharePointListItem>): Promise<SharePointListItem> {
    await this.authenticate();
    return promisify<SharePointListItem>((cb) => this.client.listItems.create(listId, item, cb));
  }

  // Update a list item
  async updateListItem(
    listId: string,
    item: Partial<SharePointListItem> & { itemId: number }
  ): Promise<any> {
    await this.authenticate();
    return promisify<any>((cb) => this.client.listItems.update(listId, item, cb));
  }

  // Delete a list item
  async deleteListItem(listId: string, itemId: number): Promise<void> {
    await this.authenticate();
    return promisify<void>((cb) => this.client.listItems.del(listId, itemId, cb));
  }

  // Get current user information
  async getCurrentUser(filter: string = "Title ne ''"): Promise<SharePointUser> {
    await this.authenticate();
    return promisify<SharePointUser>((cb) => this.client.listItems.currentuser(filter, cb));
  }

  // File operations
  async getFileStream(folderName: string, fileName: string): Promise<any> {
    await this.authenticate();
    return promisify<any>((cb) => this.client.listItems.byteStream(folderName, fileName, cb));
  }

  async getFileStreamByPath(filePath: string): Promise<any> {
    await this.authenticate();
    return promisify<any>((cb) => this.client.listItems.byteStreamByFilePath(filePath, cb));
  }

  async moveFile(oldPath: string, newPath: string): Promise<any> {
    await this.authenticate();
    return promisify<any>((cb) => this.client.listItems.moveTo(oldPath, newPath, cb));
  }
}

// Usage examples with proper TypeScript typing
async function demonstrateBasicUsage(): Promise<void> {
  const spService = new SharePointService(sp);

  try {
    console.log('🔐 Authenticating with SharePoint...');
    await spService.authenticate();

    // Example 1: Get all lists with type safety
    console.log('\n📋 Fetching all lists...');
    const listsResult: PaginationResult<SharePointList> = await spService.getLists();
    const lists: SharePointList[] = listsResult.items;
    
    console.log(`Found ${lists.length} lists`);
    lists.forEach((list: SharePointList, index: number) => {
      console.log(`  ${index + 1}. ${list.Title} (ID: ${list.Id})`);
    });

    if (lists.length === 0) {
      console.log('⚠️ No lists found. Creating a demo list for examples...');
      
      // Create a demo list if none exist
      const demoList = await spService.createList({
        title: 'TypeScript Demo List',
        description: 'A demo list created from TypeScript'
      });
      
      lists.push(demoList);
      console.log(`✅ Created demo list: ${demoList.Title}`);
    }

    // Example 2: Read a specific list with full details
    const firstList: SharePointList = lists[0];
    console.log(`\n📖 Reading list details: ${firstList.Title}`);
    
    const listDetails: SharePointList = await spService.getList(firstList.Id);
    console.log(`  Items count: ${listDetails.Items?.length || 0}`);
    console.log(`  Fields count: ${listDetails.Fields?.length || 0}`);

    // Example 3: Work with list items
    console.log('\n📝 Working with list items...');
    
    // Create a new list item with proper typing
    const newItemData: Partial<SharePointListItem> = {
      Title: 'TypeScript Sample Item',
      // Add other fields as needed based on your list schema
    };
    
    const newItem: SharePointListItem = await spService.createListItem(firstList.Title, newItemData);
    console.log(`✅ Created item: ${newItem.Title} (ID: ${newItem.Id})`);

    // Get list items with pagination
    const itemsResult: PaginationResult<SharePointListItem> = await spService.getListItems(firstList.Id);
    const items: SharePointListItem[] = itemsResult.items;
    
    console.log(`📋 Found ${items.length} items in the list`);
    if (itemsResult.nextUrl) {
      console.log('📄 More items available via pagination');
    }

    // Read a specific item with type safety
    if (items.length > 0) {
      const itemDetails: SharePointListItem = await spService.getListItem(firstList.Title, items[0].Id);
      console.log(`📖 Item details: ${itemDetails.Title}`);
      
      // Display item properties with type safety
      console.log(`  Created: ${itemDetails.Created || 'N/A'}`);
      console.log(`  Modified: ${itemDetails.Modified || 'N/A'}`);
      
      if (itemDetails.File) {
        console.log(`  File: ${itemDetails.File.Name} (${itemDetails.File.Length} bytes)`);
      }
    }

    // Example 4: Update an item with proper typing
    if (items.length > 0) {
      console.log('\n✏️ Updating list item...');
      
      const updateData: Partial<SharePointListItem> & { itemId: number } = {
        itemId: items[0].Id,
        Title: 'Updated TypeScript Item',
        // Add other fields as needed
      };
      
      const updateResult = await spService.updateListItem(firstList.Title, updateData);
      console.log('✅ Item updated successfully');
    }

    // Example 5: Get current user with type safety
    console.log('\n👤 Getting current user information...');
    try {
      const currentUser: SharePointUser = await spService.getCurrentUser();
      console.log(`👤 Current user: ${currentUser.Title} (${currentUser.Email || 'No email'})`);
    } catch (error) {
      console.log('⚠️ Could not retrieve current user information');
    }

  } catch (error) {
    console.error('❌ Error in basic usage demonstration:', error);
    throw error;
  }
}

async function demonstrateAdvancedFeatures(): Promise<void> {
  console.log('\n🚀 Demonstrating advanced TypeScript features...');
  
  // Example 1: Type-safe configuration with filtering
  const advancedConfig: SharePointConfig = {
    ...config,
    filterFields: [
      { field: 'ContentType', value: 'Item' },
      { field: 'Status', value: 'Active' }
    ],
    selectFields: ['Title', 'Created', 'Modified', 'Author'],
    expandFields: ['Author', 'Editor'],
    $top: '50'
  };

  const advancedSp: SharePointClient = sharepoint(advancedConfig);
  const advancedService = new SharePointService(advancedSp);

  try {
    await advancedService.authenticate();

    // Example 2: Generic function for batch operations
    async function batchProcessLists<T>(
      lists: SharePointList[],
      processor: (list: SharePointList) => Promise<T>
    ): Promise<T[]> {
      const results: T[] = [];
      
      for (const list of lists) {
        try {
          const result = await processor(list);
          results.push(result);
        } catch (error) {
          console.warn(`⚠️ Failed to process list ${list.Title}:`, error);
        }
      }
      
      return results;
    }

    // Get lists and process them in batch
    const listsResult = await advancedService.getLists();
    const itemCounts = await batchProcessLists(
      listsResult.items.slice(0, 5), // Limit to first 5 lists
      async (list: SharePointList): Promise<{ listTitle: string; itemCount: number }> => {
        const items = await advancedService.getListItems(list.Id);
        return {
          listTitle: list.Title,
          itemCount: items.items.length
        };
      }
    );

    console.log('\n📊 List item counts:');
    itemCounts.forEach(({ listTitle, itemCount }) => {
      console.log(`  ${listTitle}: ${itemCount} items`);
    });

    // Example 3: Type-safe error handling
    interface SharePointError extends Error {
      statusCode?: number;
      body?: any;
    }

    function isSharePointError(error: any): error is SharePointError {
      return error && typeof error === 'object' && 'message' in error;
    }

    try {
      // Attempt to read a non-existent list
      await advancedService.getList('non-existent-list-id');
    } catch (error) {
      if (isSharePointError(error)) {
        console.log(`⚠️ SharePoint error: ${error.message}`);
        if (error.statusCode) {
          console.log(`   Status code: ${error.statusCode}`);
        }
      } else {
        console.log('⚠️ Unknown error type');
      }
    }

    // Example 4: Custom interface for specific list types
    interface TaskListItem extends SharePointListItem {
      Status: 'Not Started' | 'In Progress' | 'Completed';
      Priority: 'Low' | 'Medium' | 'High';
      DueDate?: string;
      AssignedTo?: SharePointUser;
    }

    // Type-safe function for working with task lists
    async function createTask(
      listId: string,
      task: Omit<TaskListItem, 'Id' | 'Created' | 'Modified'>
    ): Promise<TaskListItem> {
      const taskItem = await advancedService.createListItem(listId, task);
      return taskItem as TaskListItem;
    }

    console.log('\n✅ Advanced TypeScript features demonstrated');

  } catch (error) {
    console.error('❌ Error in advanced features demonstration:', error);
  }
}

// Export classes and interfaces for use in other modules
export {
  SharePointService,
  SharePointConfig,
  SharePointList,
  SharePointListItem,
  SharePointField,
  SharePointFile,
  SharePointUser,
  PaginationResult,
  SharePointClient
};

// Export the main functions
export {
  demonstrateBasicUsage,
  demonstrateAdvancedFeatures,
  sharepoint,
  config
};

// Main execution function
async function main(): Promise<void> {
  console.log('🚀 SharePoint Connector TypeScript Usage Examples');
  console.log('=================================================\n');

  try {
    await demonstrateBasicUsage();
    await demonstrateAdvancedFeatures();
    console.log('\n✅ All TypeScript examples completed successfully!');
  } catch (error) {
    console.error('❌ Examples failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}