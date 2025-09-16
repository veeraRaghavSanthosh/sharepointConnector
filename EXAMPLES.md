# SharePoint Connector Examples

This document provides comprehensive examples of how to use the SharePoint Connector library in both JavaScript and TypeScript.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [JavaScript Examples](#javascript-examples)
- [TypeScript Examples](#typescript-examples)
- [Promise-Based Usage](#promise-based-usage)
- [Error Handling](#error-handling)
- [Advanced Features](#advanced-features)
- [Testing](#testing)

## Installation

```bash
npm install sharepointconnector
```

For TypeScript projects, also install type definitions:

```bash
npm install --save-dev @types/node
```

## Basic Setup

### JavaScript
```javascript
const SharePointConnector = require('sharepointconnector');

const config = {
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.sharepoint.com'
};

const sharepoint = SharePointConnector(config);
```

### TypeScript
```typescript
import * as SharePointConnector from 'sharepointconnector';

interface SharePointConfig {
  username: string;
  password: string;
  url: string;
}

const config: SharePointConfig = {
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.sharepoint.com'
};

const sharepoint = SharePointConnector(config);
```

## JavaScript Examples

### Basic List Operations

```javascript
// Login and list all SharePoint lists
sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Failed to get lists:', err);
      return;
    }
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
  });
});
```

### Creating and Managing Lists

```javascript
// Create a new list
sharepoint.lists.create({
  title: 'My New List',
  description: 'A sample list created via API'
}, function(err, newList) {
  if (err) {
    console.error('Failed to create list:', err);
    return;
  }
  
  console.log(`Created list: ${newList.Title}`);
  
  // Read the list details
  sharepoint.lists.read(newList.Id, function(err, listDetails) {
    if (err) {
      console.error('Failed to read list:', err);
      return;
    }
    
    console.log(`List has ${listDetails.Fields.length} fields`);
    console.log(`List has ${listDetails.Items.length} items`);
  });
});
```

### Working with List Items

```javascript
// Create a list item
sharepoint.listItems.create('MyListName', {
  Title: 'New Item',
  Description: 'Item created via API'
}, function(err, newItem) {
  if (err) {
    console.error('Failed to create item:', err);
    return;
  }
  
  console.log(`Created item: ${newItem.Title}`);
  
  // List all items
  sharepoint.listItems.list('MyListName', function(err, items) {
    if (err) {
      console.error('Failed to list items:', err);
      return;
    }
    
    console.log(`Found ${items.length} items`);
  });
});
```

## TypeScript Examples

### Type-Safe Configuration

```typescript
import * as SharePointConnector from 'sharepointconnector';

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

const config: SharePointConfig = {
  username: 'user@domain.com',
  password: 'password',
  url: 'https://site.sharepoint.com'
};

const sharepoint = SharePointConnector(config);
```

### Promise Wrapper for TypeScript

```typescript
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

  getLists(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.sp.lists.list((err: any, lists: any[]) => {
        if (err) reject(err);
        else resolve(lists);
      });
    });
  }

  createList(listData: { title: string; description?: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sp.lists.create(listData, (err: any, list: any) => {
        if (err) reject(err);
        else resolve(list);
      });
    });
  }
}

// Usage
async function example() {
  const sp = new SharePointConnectorAsync(config);
  
  try {
    await sp.login();
    const lists = await sp.getLists();
    console.log(`Found ${lists.length} lists`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Promise-Based Usage

### Generic Promise Wrapper

```javascript
function promisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// Create promise-based versions
const sp = {
  login: promisify(sharepoint.login.bind(sharepoint)),
  lists: {
    list: promisify(sharepoint.lists.list.bind(sharepoint.lists)),
    create: promisify(sharepoint.lists.create.bind(sharepoint.lists)),
    read: promisify(sharepoint.lists.read.bind(sharepoint.lists)),
    update: promisify(sharepoint.lists.update.bind(sharepoint.lists)),
    del: promisify(sharepoint.lists.del.bind(sharepoint.lists))
  },
  listItems: {
    list: promisify(sharepoint.listItems.list.bind(sharepoint.listItems)),
    create: promisify(sharepoint.listItems.create.bind(sharepoint.listItems)),
    read: promisify(sharepoint.listItems.read.bind(sharepoint.listItems)),
    del: promisify(sharepoint.listItems.del.bind(sharepoint.listItems))
  }
};

// Usage with async/await
async function asyncExample() {
  try {
    await sp.login();
    const lists = await sp.lists.list();
    
    const newList = await sp.lists.create({
      title: 'Async List',
      description: 'Created with async/await'
    });
    
    const item = await sp.listItems.create(newList.Id, {
      Title: 'Async Item'
    });
    
    console.log(`Created item: ${item.Title}`);
    
  } catch (error) {
    console.error('Async error:', error);
  }
}
```

## Error Handling

### Comprehensive Error Handling

```javascript
sharepoint.login(function(err) {
  if (err) {
    // Handle different types of login errors
    if (err.message.includes('Authentication failed')) {
      console.error('Invalid credentials provided');
    } else if (err.message.includes('Network')) {
      console.error('Network connection error');
    } else {
      console.error('Unknown login error:', err);
    }
    return;
  }
  
  // Proceed with operations
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('API Error:', err.message);
      console.error('Status Code:', err.statusCode);
      return;
    }
    
    // Success handling
    console.log(`Successfully retrieved ${lists.length} lists`);
  });
});
```

### Promise-Based Error Handling

```javascript
async function robustExample() {
  try {
    await sp.login();
  } catch (error) {
    if (error.message.includes('401')) {
      throw new Error('Authentication failed - check credentials');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out - check network connection');
    }
    throw error;
  }
  
  try {
    const lists = await sp.lists.list();
    return lists;
  } catch (error) {
    console.error('Failed to retrieve lists:', error.message);
    return [];
  }
}
```

## Advanced Features

### File Operations

```javascript
// Download a file as byte stream
sharepoint.listItems.byteStream('Documents', 'myfile.pdf', function(err, streamObj) {
  if (err) {
    console.error('Failed to get file stream:', err);
    return;
  }
  
  // Process the stream
  console.log('File stream retrieved successfully');
});

// Download by file path
sharepoint.listItems.byteStreamByFilePath('/sites/mysite/Documents/myfile.pdf', function(err, streamObj) {
  if (err) {
    console.error('Failed to get file by path:', err);
    return;
  }
  
  console.log('File retrieved by path');
});
```

### User Information

```javascript
// Get current user information
sharepoint.listItems.currentuser('MyList', function(err, userInfo) {
  if (err) {
    console.error('Failed to get user info:', err);
    return;
  }
  
  console.log(`Current user: ${userInfo.Title}`);
  console.log(`Email: ${userInfo.Email}`);
});
```

### Pagination

```javascript
// Handle paginated results
function getAllLists(callback, allLists = [], nextUrl = null) {
  sharepoint.lists.list(function(err, lists, nextUrl) {
    if (err) {
      return callback(err);
    }
    
    allLists = allLists.concat(lists);
    
    if (nextUrl) {
      // Continue with next page
      getAllLists(callback, allLists, nextUrl);
    } else {
      // All pages retrieved
      callback(null, allLists);
    }
  });
}

getAllLists(function(err, allLists) {
  if (err) {
    console.error('Failed to get all lists:', err);
    return;
  }
  
  console.log(`Retrieved all ${allLists.length} lists`);
});
```

## Testing

### Unit Tests

Run the included unit tests:

```bash
npm test
```

### Integration Tests

For integration testing, set environment variables:

```bash
export SP_USERNAME="your-username@domain.com"
export SP_PASSWORD="your-password"
export SP_URL="https://your-site.sharepoint.com"

npm run test:integration
```

### Custom Test Setup

```javascript
const assert = require('assert');
const SharePointConnector = require('sharepointconnector');

describe('Custom SharePoint Tests', function() {
  let sharepoint;
  
  before(function() {
    sharepoint = SharePointConnector({
      username: process.env.SP_USERNAME,
      password: process.env.SP_PASSWORD,
      url: process.env.SP_URL
    });
  });
  
  it('should login successfully', function(done) {
    sharepoint.login(function(err) {
      assert.ok(!err, 'Login should succeed');
      done();
    });
  });
  
  it('should retrieve lists', function(done) {
    sharepoint.lists.list(function(err, lists) {
      assert.ok(!err, 'Should retrieve lists without error');
      assert.ok(Array.isArray(lists), 'Should return array of lists');
      done();
    });
  });
});
```

## Best Practices

1. **Always handle errors** - SharePoint operations can fail for various reasons
2. **Use environment variables** for credentials - Never hardcode passwords
3. **Implement retry logic** for network operations
4. **Clean up resources** - Delete test lists and items after use
5. **Use TypeScript** for better type safety and IDE support
6. **Implement proper logging** for debugging and monitoring
7. **Handle pagination** when dealing with large datasets
8. **Cache authentication tokens** when possible to reduce login calls

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify credentials are correct
   - Check if account has necessary permissions
   - Ensure URL format is correct

2. **Network Timeouts**
   - Implement retry logic
   - Check firewall settings
   - Verify SharePoint site is accessible

3. **API Limitations**
   - Respect SharePoint throttling limits
   - Use batch operations for multiple items
   - Implement proper error handling for rate limits

For more examples, see the `examples/` directory in this repository.