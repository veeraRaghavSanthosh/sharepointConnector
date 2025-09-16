# SharePoint Connector Usage Examples

## Installation

```bash
npm install sharepointconnector
```

## TypeScript Usage

### Basic Setup and Authentication

```typescript
import * as SharePointConnector from 'sharepointconnector';

// Type definitions for SharePoint Connector
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

interface SharePointClient {
  login(callback: (err?: Error) => void): void;
  lists: {
    list(callback: (err: Error | null, lists: any[]) => void): void;
    read(listId: string, callback: (err: Error | null, listData: any) => void): void;
    create(listData: any, callback: (err: Error | null, result: any) => void): void;
    delete(listId: string, callback: (err: Error | null, result: any) => void): void;
  };
  listItems: {
    read(listId: string, callback: (err: Error | null, items: any[]) => void): void;
    create(listId: string, itemData: any, callback: (err: Error | null, result: any) => void): void;
    update(listId: string, itemId: string, itemData: any, callback: (err: Error | null, result: any) => void): void;
    delete(listId: string, itemId: string, callback: (err: Error | null, result: any) => void): void;
  };
}

// Basic NTLM Authentication
const config: SharePointConfig = {
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com'
};

const sharepoint: SharePointClient = SharePointConnector(config);

// Login and perform operations
sharepoint.login((err?: Error) => {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Successfully logged in to SharePoint');
  
  // List all SharePoint lists
  sharepoint.lists.list((err: Error | null, lists: any[]) => {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    console.log('Available lists:', lists.map(list => ({
      id: list.Id,
      title: list.Title,
      description: list.Description
    })));
  });
});
```

### Advanced Configuration with Filtering and Field Selection

```typescript
// Advanced configuration with filtering and field selection
const advancedConfig: SharePointConfig = {
  username: 'your-username',
  password: 'your-password',
  type: 'online',
  url: 'https://yourtenant.sharepoint.com',
  context: 'sites/yoursite',
  verbose: false,
  strictSSL: true,
  fieldValuesAsText: true,
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Category', value: 'Important' }
  ],
  selectFields: ['Title', 'Description', 'Created', 'Modified'],
  expandFields: ['Author', 'Editor'],
  orOperator: false,
  andOrOperator: false,
  $top: '1000'
};

const advancedSharepoint: SharePointClient = SharePointConnector(advancedConfig);

// Working with List Items
advancedSharepoint.login((err?: Error) => {
  if (err) {
    console.error('Login failed:', err);
    return;
  }

  // Read items from a specific list
  const listId = 'your-list-id';
  
  advancedSharepoint.listItems.read(listId, (err: Error | null, items: any[]) => {
    if (err) {
      console.error('Error reading list items:', err);
      return;
    }
    
    console.log('List items:', items);
    
    // Create a new list item
    const newItem = {
      Title: 'New Item',
      Description: 'Created via SharePoint Connector',
      Status: 'Active'
    };
    
    advancedSharepoint.listItems.create(listId, newItem, (err: Error | null, result: any) => {
      if (err) {
        console.error('Error creating item:', err);
        return;
      }
      
      console.log('Item created successfully:', result);
    });
  });
});
```

### SAML Authentication Example

```typescript
// SAML Authentication for Office 365
const samlConfig: SharePointConfig = {
  username: 'user@yourdomain.com',
  password: 'your-password',
  type: 'onlinesaml',
  url: 'https://yourtenant.sharepoint.com',
  federatedAuthUrl: 'https://your-saml-provider.com/auth'
};

const samlSharepoint: SharePointClient = SharePointConnector(samlConfig);

samlSharepoint.login((err?: Error) => {
  if (err) {
    console.error('SAML login failed:', err);
    return;
  }
  
  console.log('SAML authentication successful');
});
```

## JavaScript Usage

### Basic Setup (ES6/Node.js)

```javascript
const SharePointConnector = require('sharepointconnector');

/**
 * Basic SharePoint client configuration
 * @typedef {Object} SharePointConfig
 * @property {string} username - SharePoint username
 * @property {string} password - SharePoint password
 * @property {'ntlm'|'basic'|'online'|'onlinesaml'} type - Authentication type
 * @property {string} url - SharePoint site URL
 * @property {string} [context='web'] - Site context
 * @property {boolean} [verbose=false] - Enable verbose logging
 * @property {string} [proxy] - Proxy server URL
 * @property {boolean} [strictSSL=true] - Enable strict SSL
 * @property {string} [federatedAuthUrl] - SAML authentication URL
 * @property {string} [rtFa] - rtFa token value
 * @property {string} [FedAuth] - FedAuth token value
 * @property {boolean} [fieldValuesAsText=false] - Return lookup field values as text
 * @property {Array<{field: string, value: string}>} [filterFields] - Filter criteria
 * @property {string[]} [selectFields] - Fields to select
 * @property {string[]} [expandFields] - Fields to expand
 * @property {boolean} [orOperator=false] - Enable OR operation
 * @property {boolean} [andOrOperator=false] - Enable AND/OR operation
 * @property {string} [$top='5000'] - Maximum number of items to return
 */

// Basic configuration
const config = {
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com'
};

const sharepoint = SharePointConnector(config);

// Login and list SharePoint lists
sharepoint.login((err) => {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Successfully connected to SharePoint');
  
  // Get all lists
  sharepoint.lists.list((err, lists) => {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    console.log('Available SharePoint lists:');
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
    
    // Read details of the first list
    if (lists.length > 0) {
      const firstList = lists[0];
      sharepoint.lists.read(firstList.Id, (err, listDetails) => {
        if (err) {
          console.error('Error reading list details:', err);
          return;
        }
        
        console.log('List details:', {
          title: listDetails.Title,
          description: listDetails.Description,
          itemCount: listDetails.ItemCount,
          fields: listDetails.Fields?.length || 0,
          items: listDetails.Items?.length || 0
        });
      });
    }
  });
});
```

### Advanced List Operations

```javascript
// Advanced configuration with filtering
const advancedConfig = {
  username: 'your-username',
  password: 'your-password',
  type: 'online',
  url: 'https://yourtenant.sharepoint.com',
  context: 'sites/yoursite',
  fieldValuesAsText: true,
  filterFields: [
    { field: 'Status', value: 'Published' },
    { field: 'Category', value: 'News' }
  ],
  selectFields: ['Title', 'Description', 'Created', 'Author'],
  expandFields: ['Author'],
  $top: '500'
};

const advancedSharepoint = SharePointConnector(advancedConfig);

advancedSharepoint.login((err) => {
  if (err) {
    console.error('Advanced login failed:', err);
    return;
  }

  const listId = 'your-list-guid';
  
  // CRUD Operations on List Items
  
  // CREATE: Add new item
  const newItem = {
    Title: 'Sample News Article',
    Description: 'This is a sample news article created via API',
    Status: 'Published',
    Category: 'News'
  };
  
  advancedSharepoint.listItems.create(listId, newItem, (err, createdItem) => {
    if (err) {
      console.error('Error creating item:', err);
      return;
    }
    
    console.log('Item created successfully:', createdItem);
    const itemId = createdItem.Id;
    
    // READ: Get all items
    advancedSharepoint.listItems.read(listId, (err, items) => {
      if (err) {
        console.error('Error reading items:', err);
        return;
      }
      
      console.log(`Found ${items.length} items in the list`);
      
      // UPDATE: Modify the created item
      const updateData = {
        Description: 'Updated description via SharePoint Connector'
      };
      
      advancedSharepoint.listItems.update(listId, itemId, updateData, (err, updatedItem) => {
        if (err) {
          console.error('Error updating item:', err);
          return;
        }
        
        console.log('Item updated successfully:', updatedItem);
        
        // DELETE: Remove the item
        advancedSharepoint.listItems.delete(listId, itemId, (err, result) => {
          if (err) {
            console.error('Error deleting item:', err);
            return;
          }
          
          console.log('Item deleted successfully');
        });
      });
    });
  });
});
```

### Different Authentication Methods

```javascript
// 1. Basic Authentication
const basicAuth = SharePointConnector({
  username: 'domain\\username',
  password: 'password',
  type: 'basic',
  url: 'https://sharepoint.company.com'
});

// 2. NTLM Authentication (Windows)
const ntlmAuth = SharePointConnector({
  username: 'username',
  password: 'password',
  domain: 'DOMAIN',
  workstation: 'WORKSTATION',
  type: 'ntlm',
  url: 'https://sharepoint.company.com'
});

// 3. Office 365 Online
const onlineAuth = SharePointConnector({
  username: 'user@tenant.onmicrosoft.com',
  password: 'password',
  type: 'online',
  url: 'https://tenant.sharepoint.com'
});

// 4. SAML Authentication
const samlAuth = SharePointConnector({
  username: 'user@company.com',
  password: 'password',
  type: 'onlinesaml',
  url: 'https://tenant.sharepoint.com',
  federatedAuthUrl: 'https://adfs.company.com/adfs/ls'
});

// 5. Using existing tokens
const tokenAuth = SharePointConnector({
  username: 'user@tenant.onmicrosoft.com',
  password: 'password',
  type: 'online',
  url: 'https://tenant.sharepoint.com',
  FedAuth: 'your-fedauth-token',
  rtFa: 'your-rtfa-token'
});
```

### Error Handling and Best Practices

```javascript
const sharepoint = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: 'online',
  url: process.env.SP_URL,
  strictSSL: true,
  verbose: false
});

// Promisify for modern async/await usage
const { promisify } = require('util');

const login = promisify(sharepoint.login.bind(sharepoint));
const listLists = promisify(sharepoint.lists.list.bind(sharepoint.lists));
const readList = promisify(sharepoint.lists.read.bind(sharepoint.lists));

async function manageSharePointLists() {
  try {
    // Login
    await login();
    console.log('✅ Successfully logged in to SharePoint');
    
    // Get all lists
    const lists = await listLists();
    console.log(`📋 Found ${lists.length} lists`);
    
    // Process each list
    for (const list of lists.slice(0, 3)) { // Limit to first 3 lists
      try {
        const listDetails = await readList(list.Id);
        console.log(`📝 List: ${listDetails.Title}`);
        console.log(`   Items: ${listDetails.ItemCount || 0}`);
        console.log(`   Fields: ${listDetails.Fields?.length || 0}`);
      } catch (listError) {
        console.error(`❌ Error reading list ${list.Title}:`, listError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ SharePoint operation failed:', error.message);
    
    // Handle specific error types
    if (error.message.includes('authentication')) {
      console.error('🔐 Authentication failed. Please check credentials.');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error. Please check connectivity.');
    }
  }
}

// Run the example
manageSharePointLists();
```

### List Management Operations

```javascript
// Create a new SharePoint list
function createNewList(sharepoint, listConfig, callback) {
  const listData = {
    Title: listConfig.title,
    Description: listConfig.description,
    BaseTemplate: 100, // Generic list
    ...listConfig
  };
  
  sharepoint.lists.create(listData, (err, result) => {
    if (err) {
      return callback(err);
    }
    
    console.log(`✅ List "${listData.Title}" created successfully`);
    callback(null, result);
  });
}

// Delete a SharePoint list
function deleteList(sharepoint, listId, callback) {
  sharepoint.lists.delete(listId, (err, result) => {
    if (err) {
      return callback(err);
    }
    
    console.log(`🗑️ List deleted successfully`);
    callback(null, result);
  });
}

// Usage example
sharepoint.login((err) => {
  if (err) return console.error(err);
  
  // Create a new list
  createNewList(sharepoint, {
    title: 'My Custom List',
    description: 'A list created via SharePoint Connector'
  }, (err, newList) => {
    if (err) return console.error('List creation failed:', err);
    
    console.log('New list ID:', newList.Id);
    
    // Optionally delete it after creation (for testing)
    // deleteList(sharepoint, newList.Id, (err) => {
    //   if (err) return console.error('List deletion failed:', err);
    //   console.log('Test completed successfully');
    // });
  });
});
```

## Environment Variables Setup

Create a `.env` file for secure credential management:

```bash
# .env file
SP_USERNAME=your-username
SP_PASSWORD=your-password
SP_URL=https://your-sharepoint-site.com
SP_TYPE=ntlm
SP_CONTEXT=web
```

Then use in your application:

```javascript
require('dotenv').config();

const sharepoint = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_TYPE || 'ntlm',
  url: process.env.SP_URL,
  context: process.env.SP_CONTEXT || 'web'
});
```

## Backward Compatibility Notes

This library maintains backward compatibility with:
- Node.js versions 6.x and above
- All authentication methods (basic, ntlm, online, onlinesaml)
- Legacy SharePoint 2013/2016 on-premises installations
- Office 365 SharePoint Online

All examples above work with both legacy callback patterns and can be easily adapted for modern Promise/async-await patterns using utilities like `util.promisify()`.