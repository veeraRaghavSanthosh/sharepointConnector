/**
 * SharePoint Connector - TypeScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * with TypeScript, including proper type definitions and modern async/await syntax.
 */

// Type definitions for the SharePoint Connector
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
  Description: string;
  ItemCount: number;
  Created: string;
  LastItemModifiedDate: string;
}

interface SharePointItem {
  Id: number;
  Title: string;
  Created: string;
  Modified: string;
  [key: string]: any;
}

interface SharePointClient {
  login(callback: (err?: Error) => void): void;
  lists: {
    list(callback: (err?: Error, lists?: SharePointList[], nextUrl?: string) => void): void;
    create(params: { title: string; description: string }, callback: (err?: Error, result?: SharePointList) => void): void;
    read(listId: string, callback: (err?: Error, result?: { Items: SharePointItem[]; Fields: any[] }) => void): void;
    update(listId: string, data: Partial<SharePointList>, callback: (err?: Error, result?: SharePointList) => void): void;
    delete(listId: string, callback: (err?: Error) => void): void;
  };
}

// Import the library
const sharepointconnector = require('sharepointconnector');

// Configuration for different authentication types
const configs: { [key: string]: SharePointConfig } = {
  // NTLM Authentication (On-premises SharePoint)
  ntlm: {
    username: 'domain\\username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'ntlm',
    context: 'sites/yoursite', // Optional: specific site context
    strictSSL: false, // Set to false for self-signed certificates
    verbose: true // Enable verbose logging for debugging
  },

  // Basic Authentication
  basic: {
    username: 'your-username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'basic',
    fieldValuesAsText: true, // Return lookup field values as text
    $top: '1000' // Limit results to 1000 items
  },

  // SharePoint Online (Office 365)
  online: {
    username: 'user@yourdomain.onmicrosoft.com',
    password: 'your-password',
    url: 'https://yourdomain.sharepoint.com',
    type: 'online'
  },

  // SAML Authentication
  onlinesaml: {
    username: 'your-username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'onlinesaml',
    federatedAuthUrl: 'https://your-saml-provider.com/adfs/ls'
  }
};

// Utility function to promisify the callback-based API
function promisify<T>(fn: Function): (...args: any[]) => Promise<T> {
  return (...args: any[]) => {
    return new Promise<T>((resolve, reject) => {
      fn(...args, (err: Error, result: T) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// Main usage example with async/await
async function demonstrateSharePointConnector(): Promise<void> {
  try {
    // Initialize the SharePoint client
    const sharepoint: SharePointClient = sharepointconnector(configs.ntlm);

    // Promisify the methods for cleaner async/await usage
    const login = promisify<void>(sharepoint.login.bind(sharepoint));
    const listLists = promisify<{ lists: SharePointList[]; nextUrl?: string }>(
      sharepoint.lists.list.bind(sharepoint.lists)
    );
    const readList = promisify<{ Items: SharePointItem[]; Fields: any[] }>(
      sharepoint.lists.read.bind(sharepoint.lists)
    );
    const createList = promisify<SharePointList>(
      sharepoint.lists.create.bind(sharepoint.lists)
    );

    console.log('🔐 Authenticating with SharePoint...');
    await login();
    console.log('✅ Successfully authenticated!');

    // List all SharePoint lists
    console.log('\n📋 Fetching all SharePoint lists...');
    const { lists } = await listLists();
    console.log(`Found ${lists.length} lists:`);
    
    lists.forEach((list: SharePointList, index: number) => {
      console.log(`  ${index + 1}. ${list.Title} (ID: ${list.Id})`);
      console.log(`     Items: ${list.ItemCount}, Created: ${list.Created}`);
    });

    // Read a specific list with items and fields
    if (lists.length > 0) {
      const firstList = lists[0];
      console.log(`\n📖 Reading list: "${firstList.Title}"...`);
      
      const listData = await readList(firstList.Id);
      console.log(`Found ${listData.Items.length} items and ${listData.Fields.length} fields`);
      
      // Display first few items
      console.log('\nFirst 3 items:');
      listData.Items.slice(0, 3).forEach((item: SharePointItem, index: number) => {
        console.log(`  ${index + 1}. ${item.Title || 'No title'} (ID: ${item.Id})`);
        console.log(`     Created: ${item.Created}, Modified: ${item.Modified}`);
      });
    }

    // Create a new list
    console.log('\n➕ Creating a new list...');
    const newList = await createList({
      title: 'Sample TypeScript List',
      description: 'A list created using the TypeScript example'
    });
    console.log(`✅ Created list: "${newList.Title}" with ID: ${newList.Id}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Advanced usage with filtering and field selection
async function advancedListOperations(): Promise<void> {
  try {
    // Configuration with advanced filtering options
    const advancedConfig: SharePointConfig = {
      username: 'your-username',
      password: 'your-password',
      url: 'https://your-sharepoint-server.com',
      type: 'ntlm',
      fieldValuesAsText: true,
      filterFields: [
        { field: 'Status', value: 'Active' },
        { field: 'Category', value: 'Important' }
      ],
      selectFields: ['Title', 'Status', 'Created', 'Modified'],
      expandFields: ['Author', 'Editor'],
      orOperator: false, // Use AND logic for multiple filters
      $top: '500' // Limit to 500 items
    };

    const sharepoint: SharePointClient = sharepointconnector(advancedConfig);
    const login = promisify<void>(sharepoint.login.bind(sharepoint));
    const listLists = promisify<{ lists: SharePointList[]; nextUrl?: string }>(
      sharepoint.lists.list.bind(sharepoint.lists)
    );

    await login();
    console.log('🔍 Fetching filtered lists with advanced options...');
    
    const { lists, nextUrl } = await listLists();
    console.log(`Found ${lists.length} lists matching criteria`);
    
    if (nextUrl) {
      console.log('📄 More results available at:', nextUrl);
    }

  } catch (error) {
    console.error('❌ Advanced operations error:', error instanceof Error ? error.message : error);
  }
}

// Export functions for use in other modules
export {
  SharePointConfig,
  SharePointList,
  SharePointItem,
  SharePointClient,
  demonstrateSharePointConnector,
  advancedListOperations
};

// Run the examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 SharePoint Connector TypeScript Examples\n');
  
  demonstrateSharePointConnector()
    .then(() => {
      console.log('\n🔧 Running advanced examples...\n');
      return advancedListOperations();
    })
    .then(() => {
      console.log('\n✅ All examples completed successfully!');
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error);
      process.exit(1);
    });
}