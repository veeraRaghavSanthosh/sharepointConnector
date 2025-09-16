# SharePoint Connector Usage Examples

This repository contains comprehensive usage examples for the `sharepointconnector` library in both JavaScript and TypeScript, demonstrating various authentication methods, list operations, and advanced features while maintaining full backward compatibility.

## Files

- **`usage-examples.js`** - Complete JavaScript examples with detailed comments
- **`usage-examples.ts`** - TypeScript examples with full type definitions and interfaces
- **`USAGE_EXAMPLES.md`** - This documentation file

## Quick Start

### JavaScript Usage

```javascript
const sharepoint = require('sharepointconnector');

// Basic NTLM Authentication
const sp = sharepoint({
  username: 'domain\\username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com'
});

// Login and perform operations
sp.login(function(err) {
  if (err) {
    console.error('Authentication failed:', err);
    return;
  }
  
  // Get all lists
  sp.lists.list(function(err, lists) {
    if (err) return console.error(err);
    console.log(`Found ${lists.length} lists`);
  });
  
  // Create a new list item
  sp.listItems.create('My List', {
    Title: 'New Item',
    Description: 'Created via connector'
  }, function(err, item) {
    if (err) return console.error(err);
    console.log('Created item:', item.Title);
  });
});
```

### TypeScript Usage

```typescript
import { SharePointConfig, SharePointClient } from './usage-examples';

const config: SharePointConfig = {
  username: 'domain\\username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com'
};

const sp: SharePointClient = sharepoint(config);

// Async/await pattern
async function example() {
  try {
    await authenticateAsync();
    const lists = await getListsAsync();
    console.log(`Found ${lists.length} lists`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Authentication Methods

The library supports multiple authentication methods:

### 1. Basic Authentication
```javascript
const sp = sharepoint({
  username: 'domain\\username',
  password: 'password',
  type: 'basic',
  url: 'https://sharepoint-site.com',
  strictSSL: false // For self-signed certificates
});
```

### 2. NTLM Authentication (Most Common)
```javascript
const sp = sharepoint({
  username: 'domain\\username',
  password: 'password',
  type: 'ntlm',
  url: 'https://sharepoint-site.com',
  domain: 'your-domain',
  workstation: 'your-workstation'
});
```

### 3. SharePoint Online (Office 365)
```javascript
const sp = sharepoint({
  username: 'user@domain.onmicrosoft.com',
  password: 'password',
  type: 'online',
  url: 'https://domain.sharepoint.com'
});
```

### 4. SharePoint Online with SAML SSO
```javascript
const sp = sharepoint({
  username: 'user@domain.com',
  password: 'password',
  type: 'onlinesaml',
  url: 'https://domain.sharepoint.com',
  federatedAuthUrl: 'https://saml-provider.com/adfs/ls'
});
```

## Core Operations

### Lists Management

```javascript
// Get all lists
sp.lists.list(function(err, lists, nextUrl) {
  // lists: array of list objects
  // nextUrl: for pagination
});

// Create a list
sp.lists.create({
  title: 'My New List',
  description: 'List description'
}, function(err, newList) {
  // newList: created list object
});

// Read a list (includes Fields and Items)
sp.lists.read('list-id-or-title', function(err, listDetails) {
  // listDetails.Fields: array of field definitions
  // listDetails.Items: array of list items
});

// Update a list
sp.lists.update('list-id', {
  Title: 'Updated Title',
  Description: 'Updated description'
}, function(err, result) {
  // List updated
});

// Delete a list
sp.lists.del('list-id', function(err) {
  // List deleted
});
```

### List Items Management

```javascript
// Get items from a list
sp.listItems.list('list-name', function(err, items, nextUrl) {
  // items: array of list items
  // nextUrl: for pagination
});

// Get ALL items (handles pagination automatically)
sp.listItems.listAll('list-name', function(err, allItems) {
  // allItems: complete array of all items
});

// Create a list item
sp.listItems.create('list-name', {
  Title: 'New Item',
  Description: 'Item description',
  Status: 'Active'
}, function(err, newItem) {
  // newItem: created item object
});

// Read a specific item
sp.listItems.read('list-name', 'item-id', function(err, item) {
  // item: item object with File property if applicable
});

// Update an item
sp.listItems.update('list-name', 'item-id', {
  Title: 'Updated Title',
  Status: 'Completed'
}, function(err, result) {
  // Item updated
});

// Delete an item
sp.listItems.del('list-name', 'item-id', function(err) {
  // Item deleted
});
```

## Advanced Features

### Filtering and Querying

```javascript
const spFiltered = sharepoint({
  // ... basic config
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Priority', value: 'High' }
  ],
  selectFields: ['Title', 'Description', 'Status'],
  expandFields: ['Author', 'AssignedTo'],
  orOperator: true, // Use OR between conditions
  $top: '100' // Limit results
});
```

### File Operations

```javascript
// Download files as streams
sp.listItems.byteStream('Documents', 'filename.pdf', function(err, requestOptions) {
  const request = require('request');
  request.get(requestOptions)
    .pipe(require('fs').createWriteStream('./file.pdf'));
});

// Download by file path
sp.listItems.byteStreamByFilePath('/sites/mysite/Documents/file.pdf', function(err, requestOptions) {
  const request = require('request');
  request.get(requestOptions)
    .on('response', function(response) {
      response.pipe(httpResponse); // In web applications
    });
});
```

### User Information

```javascript
// Get current logged-in user details
sp.listItems.currentuser('any-list-name', function(err, userInfo) {
  console.log('User:', {
    title: userInfo.Title,
    email: userInfo.Email,
    loginName: userInfo.LoginName,
    isAdmin: userInfo.IsSiteAdmin
  });
});
```

### Convenience Methods

Objects returned from operations include convenience methods:

```javascript
// List convenience methods
sp.lists.list(function(err, lists) {
  const firstList = lists[0];
  
  // Call methods directly on the list object
  firstList.read(function(err, details) { /* ... */ });
  firstList.update({Title: 'New Title'}, function(err) { /* ... */ });
  firstList.delete(function(err) { /* ... */ });
});

// Item convenience methods
sp.lists.read('My List', function(err, listDetails) {
  const firstItem = listDetails.Items[0];
  
  // Call methods directly on the item object
  firstItem.read(function(err, details) { /* ... */ });
  firstItem.update({Status: 'Done'}, function(err) { /* ... */ });
  firstItem.delete(function(err) { /* ... */ });
  
  // Create items via the list
  listDetails.Items.create({Title: 'New'}, function(err, item) { /* ... */ });
});
```

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `username` | string | SharePoint username | Required |
| `password` | string | SharePoint password | Required |
| `type` | string | Auth type: 'basic', 'ntlm', 'online', 'onlinesaml' | Required |
| `url` | string | SharePoint site URL | Required |
| `context` | string | Site context (e.g., 'sites/mysite') | 'web' |
| `verbose` | boolean | Return unfiltered responses | false |
| `fieldValuesAsText` | boolean | Return lookup fields as text | false |
| `filterFields` | array | Filter conditions | null |
| `selectFields` | array | Fields to return | null |
| `expandFields` | array | Fields to expand (JOIN) | null |
| `orOperator` | boolean | Use OR in filter conditions | false |
| `andOrOperator` | boolean | Enable mixed AND/OR operations | false |
| `$top` | string | Limit number of results | '5000' |
| `proxy` | string | Proxy server URL | undefined |
| `strictSSL` | boolean | Validate SSL certificates | true |
| `federatedAuthUrl` | string | SAML provider URL (for onlinesaml) | undefined |
| `FedAuth` | string | Pre-authenticated FedAuth token | null |
| `rtFa` | string | Pre-authenticated rtFa token | null |

## Error Handling

The library provides comprehensive error handling:

```javascript
sp.login(function(err) {
  if (err) {
    if (err.code === 'ENOTFOUND') {
      console.error('SharePoint server not found. Check URL.');
    } else if (err.statusCode === 401) {
      console.error('Authentication failed. Check credentials.');
    } else if (err.statusCode === 403) {
      console.error('Access forbidden. Check permissions.');
    } else if (err.statusCode === 404) {
      console.error('Resource not found.');
    } else {
      console.error('Error:', err.message || err);
    }
    return;
  }
  
  // Proceed with operations
});
```

## TypeScript Support

The TypeScript examples include:

- Complete interface definitions for all SharePoint objects
- Type-safe configuration options
- Generic support for custom list item types
- Async/await patterns alongside traditional callbacks
- Custom error types with proper typing
- Full IntelliSense support

```typescript
interface TaskItem extends SharePointListItem {
  Status: string;
  Priority: 'Low' | 'Medium' | 'High';
  DueDate?: string;
  AssignedTo?: {
    Title: string;
    Email: string;
  };
}

const newTask: Partial<TaskItem> = {
  Title: 'My Task',
  Status: 'Active',
  Priority: 'High'
};

const createdTask = await createListItemAsync<TaskItem>('Tasks', newTask);
```

## Backward Compatibility

All examples maintain full backward compatibility with existing code:

- Original callback-based API is preserved
- All existing configuration options work unchanged
- Convenience methods remain available
- Error handling patterns are consistent
- No breaking changes to existing functionality

## Running the Examples

1. Install the package:
   ```bash
   npm install sharepointconnector
   ```

2. For JavaScript:
   ```bash
   node usage-examples.js
   ```

3. For TypeScript:
   ```bash
   # Install TypeScript if needed
   npm install -g typescript
   
   # Compile and run
   tsc usage-examples.ts
   node usage-examples.js
   ```

## Additional Resources

- [Original Library Documentation](https://github.com/veeraRaghavSanthosh/sharepointConnector)
- [SharePoint REST API Reference](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/working-with-lists-and-list-items-with-rest)
- [SharePoint Authentication Methods](https://docs.microsoft.com/en-us/sharepoint/dev/solution-guidance/security-apponly-azureacs)

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/veeraRaghavSanthosh/sharepointConnector/issues)
- Review the comprehensive examples in this repository
- Refer to the original library documentation

---

These examples demonstrate the full capabilities of the SharePoint Connector library while maintaining complete backward compatibility with existing implementations.