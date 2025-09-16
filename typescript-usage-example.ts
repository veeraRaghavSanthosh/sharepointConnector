/**
 * SharePoint Connector - TypeScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * with TypeScript, including proper type definitions and error handling.
 */

// Type definitions for the SharePoint connector
interface SharePointConfig {
  username: string;
  password: string;
  url: string;
  type: 'ntlm' | 'basic' | 'online' | 'onlinesaml';
  context?: string;
  verbose?: boolean;
  proxy?: string;
  strictSSL?: boolean;
  federatedAuthUrl?: string;
  rtFa?: string;
  FedAuth?: string;
  fieldValuesAsText?: boolean;
  filterFields?: Array<{ field: string; value: any }>;
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
  Items?: SharePointListItem[];
  Fields?: SharePointField[];
  read(callback: (err: Error | null, result?: any) => void): void;
  update(data: any, callback: (err: Error | null, result?: any) => void): void;
  delete(callback: (err: Error | null) => void): void;
}

interface SharePointListItem {
  Id: string;
  Title: string;
  [key: string]: any;
  read(callback: (err: Error | null, result?: any) => void): void;
  delete(callback: (err: Error | null) => void): void;
}

interface SharePointField {
  InternalName: string;
  Title: string;
  TypeAsString: string;
  Required: boolean;
}

interface SharePointClient {
  login(callback: (err: Error | null) => void): void;
  lists: {
    list(callback: (err: Error | null, lists?: SharePointList[], nextUrl?: string) => void): void;
    create(data: { title: string; description: string }, callback: (err: Error | null, result?: SharePointList) => void): void;
    read(listId: string | { title: string }, callback: (err: Error | null, result?: SharePointList) => void): void;
    update(listId: string | any, data?: any, callback?: (err: Error | null, result?: any) => void): void;
    del(listId: string, callback: (err: Error | null) => void): void;
  };
  listItems: {
    list(listId: string, callback: (err: Error | null, items?: SharePointListItem[], nextUrl?: string) => void): void;
    listAll(listId: string, callback: (err: Error | null, items?: SharePointListItem[]) => void): void;
    create(listId: string, data: any, callback: (err: Error | null, result?: SharePointListItem) => void): void;
    read(listId: string, itemId: string, callback: (err: Error | null, result?: SharePointListItem) => void): void;
    del(listId: string, itemId: string, callback: (err: Error | null) => void): void;
    currentuser(listId: string, callback: (err: Error | null, user?: any) => void): void;
    byteStream(folderName: string, fileName: string, callback: (err: Error | null, serviceReqObj?: any) => void): void;
    byteStreamByFilePath(filePath: string, callback: (err: Error | null, serviceReqObj?: any) => void): void;
  };
}

// Import the SharePoint connector
const sharepointconnector = require('sharepointconnector');

// Example 1: Basic Connection and Authentication
async function basicExample(): Promise<void> {
  const config: SharePointConfig = {
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online', // or 'ntlm', 'basic', 'onlinesaml'
    verbose: false,
    strictSSL: true
  };

  const sharepoint: SharePointClient = sharepointconnector(config);

  return new Promise((resolve, reject) => {
    sharepoint.login((err: Error | null) => {
      if (err) {
        console.error('Login failed:', err.message);
        return reject(err);
      }
      
      console.log('Successfully connected to SharePoint!');
      resolve();
    });
  });
}

// Example 2: Working with Lists
async function listsExample(): Promise<void> {
  const config: SharePointConfig = {
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  };

  const sharepoint: SharePointClient = sharepointconnector(config);

  return new Promise((resolve, reject) => {
    sharepoint.login((err: Error | null) => {
      if (err) return reject(err);

      // List all SharePoint lists
      sharepoint.lists.list((err: Error | null, lists?: SharePointList[]) => {
        if (err) {
          console.error('Error fetching lists:', err.message);
          return reject(err);
        }

        if (!lists || lists.length === 0) {
          console.log('No lists found');
          return resolve();
        }

        console.log(`Found ${lists.length} lists:`);
        lists.forEach((list: SharePointList, index: number) => {
          console.log(`${index + 1}. ${list.Title} (ID: ${list.Id})`);
        });

        // Read details of the first list
        const firstList = lists[0];
        sharepoint.lists.read(firstList.Id, (err: Error | null, listDetails?: SharePointList) => {
          if (err) {
            console.error('Error reading list details:', err.message);
            return reject(err);
          }

          if (listDetails) {
            console.log(`\nList Details for "${listDetails.Title}":`);
            console.log(`- Items count: ${listDetails.Items?.length || 0}`);
            console.log(`- Fields count: ${listDetails.Fields?.length || 0}`);
            
            if (listDetails.Fields && listDetails.Fields.length > 0) {
              console.log('- Field names:', listDetails.Fields.map(f => f.Title).join(', '));
            }
          }

          resolve();
        });
      });
    });
  });
}

// Example 3: Advanced List Operations with Filtering
async function advancedListExample(): Promise<void> {
  const config: SharePointConfig = {
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online',
    fieldValuesAsText: true,
    filterFields: [
      { field: 'Status', value: 'Active' }
    ],
    selectFields: ['Title', 'Status', 'Created'],
    $top: '100'
  };

  const sharepoint: SharePointClient = sharepointconnector(config);

  return new Promise((resolve, reject) => {
    sharepoint.login((err: Error | null) => {
      if (err) return reject(err);

      // Create a new list
      sharepoint.lists.create(
        { 
          title: 'TypeScript Test List', 
          description: 'A test list created from TypeScript example' 
        },
        (err: Error | null, newList?: SharePointList) => {
          if (err) {
            console.error('Error creating list:', err.message);
            return reject(err);
          }

          if (newList) {
            console.log(`Created new list: ${newList.Title} (ID: ${newList.Id})`);
          }

          resolve();
        }
      );
    });
  });
}

// Example 4: Working with List Items
async function listItemsExample(): Promise<void> {
  const config: SharePointConfig = {
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  };

  const sharepoint: SharePointClient = sharepointconnector(config);

  return new Promise((resolve, reject) => {
    sharepoint.login((err: Error | null) => {
      if (err) return reject(err);

      // First, get a list to work with
      sharepoint.lists.list((err: Error | null, lists?: SharePointList[]) => {
        if (err || !lists || lists.length === 0) {
          return reject(new Error('No lists available'));
        }

        const targetList = lists[0];
        console.log(`Working with list: ${targetList.Title}`);

        // Get all items from the list
        sharepoint.listItems.listAll(targetList.Id, (err: Error | null, items?: SharePointListItem[]) => {
          if (err) {
            console.error('Error fetching list items:', err.message);
            return reject(err);
          }

          console.log(`Found ${items?.length || 0} items in the list`);

          if (items && items.length > 0) {
            // Display first few items
            items.slice(0, 3).forEach((item: SharePointListItem, index: number) => {
              console.log(`Item ${index + 1}: ${item.Title || 'No Title'}`);
            });

            // Create a new item
            const newItemData = {
              Title: `New Item Created at ${new Date().toISOString()}`,
              // Add other fields as needed based on your list schema
            };

            sharepoint.listItems.create(targetList.Id, newItemData, (err: Error | null, newItem?: SharePointListItem) => {
              if (err) {
                console.error('Error creating new item:', err.message);
                return reject(err);
              }

              if (newItem) {
                console.log(`Created new item: ${newItem.Title} (ID: ${newItem.Id})`);
              }

              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Example 5: File Operations
async function fileOperationsExample(): Promise<void> {
  const config: SharePointConfig = {
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  };

  const sharepoint: SharePointClient = sharepointconnector(config);

  return new Promise((resolve, reject) => {
    sharepoint.login((err: Error | null) => {
      if (err) return reject(err);

      // Get current user information
      sharepoint.listItems.currentuser('Documents', (err: Error | null, user?: any) => {
        if (err) {
          console.error('Error getting current user:', err.message);
        } else if (user) {
          console.log('Current user:', user.Title || user.LoginName);
        }

        // Download a file by path (example)
        const filePath = '/Shared Documents/example.pdf';
        sharepoint.listItems.byteStreamByFilePath(filePath, (err: Error | null, serviceReqObj?: any) => {
          if (err) {
            console.error('Error getting file stream:', err.message);
            return reject(err);
          }

          if (serviceReqObj) {
            console.log('File stream object ready for download');
            // In a real application, you would pipe this to a response or file
            // const request = require('request');
            // request.get(serviceReqObj).pipe(fs.createWriteStream('downloaded-file.pdf'));
          }

          resolve();
        });
      });
    });
  });
}

// Main execution function
async function main(): Promise<void> {
  try {
    console.log('=== SharePoint Connector TypeScript Examples ===\n');

    console.log('1. Basic Connection Example:');
    await basicExample();

    console.log('\n2. Lists Example:');
    await listsExample();

    console.log('\n3. Advanced List Example:');
    await advancedListExample();

    console.log('\n4. List Items Example:');
    await listItemsExample();

    console.log('\n5. File Operations Example:');
    await fileOperationsExample();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
export {
  SharePointConfig,
  SharePointClient,
  SharePointList,
  SharePointListItem,
  SharePointField,
  basicExample,
  listsExample,
  advancedListExample,
  listItemsExample,
  fileOperationsExample
};