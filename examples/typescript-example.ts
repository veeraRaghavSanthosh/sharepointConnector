import * as SharePointConnector from 'sharepointconnector';

// TypeScript interfaces for type safety
interface SharePointConfig {
  username: string;
  password: string;
  url: string;
}

interface ListItem {
  Title: string;
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

async function main() {
  try {
    // Login to SharePoint
    await new Promise<void>((resolve, reject) => {
      sharepoint.login((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Successfully logged in to SharePoint');

    // Example 1: List all SharePoint lists
    const lists = await new Promise<List[]>((resolve, reject) => {
      sharepoint.lists.list((err: any, listRes: List[]) => {
        if (err) reject(err);
        else resolve(listRes);
      });
    });
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });

    // Example 2: Create a new list
    const newList = await new Promise<List>((resolve, reject) => {
      sharepoint.lists.create({
        title: 'TypeScript Sample List',
        description: 'A list created from TypeScript example'
      }, (err: any, createRes: List) => {
        if (err) reject(err);
        else resolve(createRes);
      });
    });
    
    console.log(`Created new list: ${newList.Title} (ID: ${newList.Id})`);

    // Example 3: Read a specific list with items and fields
    const listDetails = await new Promise<List>((resolve, reject) => {
      sharepoint.lists.read(newList.Id, (err: any, listRead: List) => {
        if (err) reject(err);
        else resolve(listRead);
      });
    });
    
    console.log(`List details: ${listDetails.Title}`);
    console.log(`Fields: ${listDetails.Fields?.length || 0}`);
    console.log(`Items: ${listDetails.Items?.length || 0}`);

    // Example 4: Create a list item
    const newItem = await new Promise<ListItem>((resolve, reject) => {
      sharepoint.listItems.create(newList.Id, {
        Title: 'Sample Item from TypeScript',
        Description: 'This item was created using the TypeScript example'
      }, (err: any, itemRes: ListItem) => {
        if (err) reject(err);
        else resolve(itemRes);
      });
    });
    
    console.log(`Created new item: ${newItem.Title}`);

    // Example 5: List items in the list
    const items = await new Promise<ListItem[]>((resolve, reject) => {
      sharepoint.listItems.list(newList.Id, (err: any, itemsRes: ListItem[]) => {
        if (err) reject(err);
        else resolve(itemsRes);
      });
    });
    
    console.log(`Found ${items.length} items in the list`);

    // Example 6: Update the list
    const updatedList = await new Promise<List>((resolve, reject) => {
      sharepoint.lists.update(newList.Id, {
        Title: 'Updated TypeScript Sample List',
        Description: 'Updated description from TypeScript'
      }, (err: any, updateRes: List) => {
        if (err) reject(err);
        else resolve(updateRes);
      });
    });
    
    console.log(`Updated list title to: ${updatedList.Title}`);

    // Example 7: Delete the created item
    await new Promise<void>((resolve, reject) => {
      sharepoint.listItems.del(newList.Id, newItem.Id, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Deleted the sample item');

    // Example 8: Delete the created list (cleanup)
    await new Promise<void>((resolve, reject) => {
      sharepoint.lists.del(newList.Id, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Deleted the sample list');

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Alternative promise-based wrapper for easier async/await usage
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

  getListItems(listId: string): Promise<ListItem[]> {
    return new Promise((resolve, reject) => {
      this.sp.listItems.list(listId, (err: any, items: ListItem[]) => {
        if (err) reject(err);
        else resolve(items);
      });
    });
  }
}

// Example using the async wrapper
async function asyncExample() {
  const sp = new SharePointConnectorAsync(config);
  
  try {
    await sp.login();
    const lists = await sp.getLists();
    console.log(`Found ${lists.length} lists using async wrapper`);
  } catch (error) {
    console.error('Async example error:', error);
  }
}

// Run the examples
if (require.main === module) {
  main().then(() => {
    console.log('TypeScript example completed');
  }).catch((error) => {
    console.error('Example failed:', error);
  });
}

export {
  SharePointConnectorAsync,
  SharePointConfig,
  ListItem,
  List
};