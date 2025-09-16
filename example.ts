import * as SharePointConnector from 'sharepointconnector';

// TypeScript interfaces for type safety
interface SharePointConfig {
  username: string;
  password: string;
  url: string;
}

interface ListItem {
  Title: string;
  Description?: string;
  [key: string]: any;
}

interface List {
  Id: string;
  Title: string;
  Description?: string;
  Items?: ListItem[];
  Fields?: any[];
}

// Configuration
const config: SharePointConfig = {
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.sharepoint.com'
};

// Initialize SharePoint connector
const sharepoint = SharePointConnector(config);

// Promise wrapper for async/await usage
class SharePointConnectorAsync {
  private sp: any;

  constructor(config: SharePointConfig) {
    this.sp = SharePointConnector(config);
  }

  login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sp.login((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getLists(): Promise<List[]> {
    return new Promise((resolve, reject) => {
      this.sp.lists.list((err: any, lists: List[]) => {
        if (err) reject(err);
        else resolve(lists);
      });
    });
  }

  createList(listData: { title: string; description?: string }): Promise<List> {
    return new Promise((resolve, reject) => {
      this.sp.lists.create(listData, (err: any, list: List) => {
        if (err) reject(err);
        else resolve(list);
      });
    });
  }

  getList(listId: string): Promise<List> {
    return new Promise((resolve, reject) => {
      this.sp.lists.read(listId, (err: any, list: List) => {
        if (err) reject(err);
        else resolve(list);
      });
    });
  }

  createListItem(listId: string, itemData: ListItem): Promise<ListItem> {
    return new Promise((resolve, reject) => {
      this.sp.listItems.create(listId, itemData, (err: any, item: ListItem) => {
        if (err) reject(err);
        else resolve(item);
      });
    });
  }

  deleteList(listId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sp.lists.del(listId, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Main example function
async function main() {
  const sp = new SharePointConnectorAsync(config);
  
  try {
    console.log('Logging in to SharePoint...');
    await sp.login();
    console.log('✓ Successfully logged in');

    console.log('Retrieving lists...');
    const lists = await sp.getLists();
    console.log(`✓ Found ${lists.length} lists`);

    console.log('Creating a new list...');
    const newList = await sp.createList({
      title: 'TypeScript Sample List',
      description: 'A list created from TypeScript example'
    });
    console.log(`✓ Created list: ${newList.Title} (ID: ${newList.Id})`);

    console.log('Reading list details...');
    const listDetails = await sp.getList(newList.Id);
    console.log(`✓ List has ${listDetails.Fields?.length || 0} fields and ${listDetails.Items?.length || 0} items`);

    console.log('Creating a list item...');
    const newItem = await sp.createListItem(newList.Id, {
      Title: 'Sample Item from TypeScript',
      Description: 'This item was created using the TypeScript example'
    });
    console.log(`✓ Created item: ${newItem.Title}`);

    console.log('Cleaning up...');
    await sp.deleteList(newList.Id);
    console.log('✓ Deleted the sample list');

    console.log('TypeScript example completed successfully!');

  } catch (error) {
    console.error('❌ Error occurred:', error);
  }
}

// Export for use in other modules
export {
  SharePointConnectorAsync,
  SharePointConfig,
  ListItem,
  List,
  main
};

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}