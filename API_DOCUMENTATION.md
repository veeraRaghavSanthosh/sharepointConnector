# SharePoint Connector - Public API Documentation

## Overview

The SharePoint Connector is a Node.js library that provides a comprehensive interface for interacting with SharePoint instances. It supports multiple authentication strategies and provides APIs for managing lists and list items.

## Table of Contents

1. [Authentication](#authentication)
2. [Lists API](#lists-api) 
3. [List Items API](#list-items-api)
4. [Response Schemas](#response-schemas)
5. [Error Handling](#error-handling)

## Authentication

### Initialize Connection

Creates a new SharePoint connection instance with authentication parameters.

**Method**: Constructor

**Request Example:**
```javascript
var sharepoint = require('sharepointconnector')({
  username: 'someusername',
  password: 'somepassword',
  type: 'ntlm', // ntlm, basic, online, onlinesaml
  url: 'https://sharepointHostname.com',
  context: 'myCustomerSite', // optional
  verbose: false, // optional
  strictSSL: true // optional
});
```

**Parameters Schema:**
```json
{
  "username": {"type": "string", "required": true},
  "password": {"type": "string", "required": true},
  "type": {"type": "string", "enum": ["ntlm", "basic", "online", "onlinesaml"]},
  "url": {"type": "string", "format": "uri", "required": true}
}
```

### Login

Authenticates with SharePoint using the configured credentials.

**Method**: `sharepoint.login(callback)`

**Request Example:**
```javascript
sharepoint.login(function(err) {
  if (err) {
    return console.error(err);
  }
  console.log('Successfully logged in');
});
```

**Response Schema:**
```json
{
  "error": {"type": "object", "nullable": true}
}
```

## Lists API

### List All Lists

Retrieves all lists from the SharePoint instance.

**Method**: `sharepoint.lists.list(callback)`

**Request Example:**
```javascript
sharepoint.lists.list(function(err, listRes, nextUrl) {
  if (err) {
    return console.error(err);
  }
  console.log('Found', listRes.length, 'lists');
  console.log('Next page URL:', nextUrl);
});
```

**Response Example:**
```json
[
  {
    "Id": "1a2b3c4d-5e6f-7890-abcd-ef1234567890",
    "Title": "Documents", 
    "Description": "Document library",
    "Created": "2023-01-15T10:30:00Z",
    "Modified": "2023-12-01T14:22:00Z"
  }
]
```

### Create List

Creates a new list in SharePoint.

**Method**: `sharepoint.lists.create(params, callback)`

**Request Example:**
```javascript
sharepoint.lists.create({
  title: 'My New List',
  description: 'A custom list for tracking items'
}, function(err, createRes) {
  if (err) {
    return console.error(err);
  }
  console.log('Created list with ID:', createRes.Id);
});
```

**Request Schema:**
```json
{
  "title": {"type": "string", "required": true},
  "description": {"type": "string", "required": true}
}
```

### Read List

Retrieves detailed information about a specific list, including fields and items.

**Method**: `sharepoint.lists.read(listIdOrParams, callback)`

**Request Examples:**
```javascript
// Read by list ID
sharepoint.lists.read('list-id-here', function(err, listReadResult) {
  console.log('List has', listReadResult.Items.length, 'items');
});

// Read by list title  
sharepoint.lists.read({title: 'Documents'}, function(err, listReadResult) {
  console.log('Found list:', listReadResult.Title);
});

// With filtering options
sharepoint.lists.read('list-id', {
  fieldValuesAsText: true,
  filterFields: [{field: 'Status', value: 'Active'}],
  selectFields: ['Title', 'Created', 'Status'],
  expandFields: ['Author'],
  $top: "100"
}, function(err, listReadResult) {
  // Handle response
});
```

**Response Schema:**
```json
{
  "Id": {"type": "string"},
  "Title": {"type": "string"},
  "Description": {"type": "string"},
  "Items": {
    "type": "array",
    "items": {"type": "object"}
  },
  "Fields": {
    "type": "array", 
    "items": {
      "type": "object",
      "properties": {
        "InternalName": {"type": "string"},
        "Title": {"type": "string"},
        "Required": {"type": "boolean"}
      }
    }
  }
}
```

### Update List

Updates an existing list's properties.

**Method**: `sharepoint.lists.update(listIdOrParams, updateData, callback)`

**Request Example:**
```javascript
sharepoint.lists.update('list-id', {
  Title: 'Updated List Title',
  Description: 'Updated description'
}, function(err, updateResult) {
  console.log('List updated successfully');
});
```

### Delete List

Deletes a list from SharePoint.

**Method**: `sharepoint.lists.del(listId, callback)`

**Request Example:**
```javascript
sharepoint.lists.del('list-id-to-delete', function(err) {
  if (err) {
    return console.error('Failed to delete list:', err);
  }
  console.log('List deleted successfully');
});
```

## List Items API

### List All Items

Retrieves all items from a specific list with pagination support.

**Method**: `sharepoint.listItems.list(listId, callback)`

**Request Example:**
```javascript
sharepoint.listItems.list('list-id', function(err, itemsUnderThisList, nextUrl) {
  console.log('Found', itemsUnderThisList.length, 'items');
  if (nextUrl) {
    console.log('More items available at:', nextUrl);
  }
});
```

**Response Schema:**
```json
{
  "items": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "Id": {"type": "integer"},
        "Title": {"type": "string"},
        "Created": {"type": "string", "format": "date-time"},
        "Modified": {"type": "string", "format": "date-time"}
      }
    }
  },
  "nextUrl": {"type": "string", "nullable": true}
}
```

### List All Items (Complete Dataset)

Retrieves all items from a list, handling pagination internally.

**Method**: `sharepoint.listItems.listAll(listId, callback)`

**Request Example:**
```javascript
sharepoint.listItems.listAll('list-id', function(err, allItems) {
  console.log('Retrieved complete dataset:', allItems.length, 'items');
});
```

### Create List Item

Creates a new item in the specified list.

**Method**: `sharepoint.listItems.create(listId, itemData, callback)`

**Request Example:**
```javascript
sharepoint.listItems.create('list-id', {
  Title: 'My New Item',
  Description: 'Item description',
  Status: 'Active',
  DueDate: '2024-12-31T23:59:59Z'
}, function(err, createResult) {
  console.log('Created item with ID:', createResult.Id);
});
```

**Request Schema:**
```json
{
  "listId": {"type": "string", "required": true},
  "itemData": {
    "type": "object",
    "properties": {
      "Title": {"type": "string"}
    },
    "additionalProperties": true
  }
}
```

### Read List Item

Retrieves a specific item from a list, including file attachments if present.

**Method**: `sharepoint.listItems.read(listId, itemId, callback)`

**Request Example:**
```javascript
sharepoint.listItems.read('list-id', 'item-id', function(err, singleListItem) {
  console.log('Item title:', singleListItem.Title);
  if (singleListItem.File) {
    console.log('Has attached file:', singleListItem.File.Name);
  }
});
```

**Response Schema:**
```json
{
  "Id": {"type": "integer"},
  "Title": {"type": "string"},
  "File": {
    "type": "object",
    "nullable": true,
    "properties": {
      "Name": {"type": "string"},
      "ServerRelativeUrl": {"type": "string"},
      "Length": {"type": "integer"}
    }
  }
}
```

### Delete List Item

Deletes a specific item from a list.

**Method**: `sharepoint.listItems.del(listId, itemId, callback)`

**Request Example:**
```javascript
sharepoint.listItems.del('list-id', 'item-id', function(err) {
  if (err) {
    return console.error('Failed to delete item:', err);
  }
  console.log('Item deleted successfully');
});
```

## Additional Methods

### Get Current User

Retrieves information about the currently logged-in user.

**Method**: `sharepoint.listItems.currentuser(listName, callback)`

**Request Example:**
```javascript
sharepoint.listItems.currentuser("Documents", function(err, userInfo) {
  console.log('Current user:', userInfo.Title);
});
```

**Response Schema:**
```json
{
  "Id": {"type": "integer"},
  "Title": {"type": "string"},
  "LoginName": {"type": "string"},
  "Email": {"type": "string", "format": "email"}
}
```

### Get Binary Stream

Retrieves binary content as a stream for a specific file.

**Method**: `sharepoint.listItems.byteStream(folderName, filename, callback)`

**Request Example:**
```javascript
sharepoint.listItems.byteStream("Documents", "report.pdf", function(err, serviceReqObj) {
  require('request').get(serviceReqObj).on('response', function(response) {
    response.pipe(res); // Stream to HTTP response
  });
});
```

### Get Binary Stream by File Path

Retrieves binary content using the complete file path.

**Method**: `sharepoint.listItems.byteStreamByFilePath(filePath, callback)`

**Request Example:**
```javascript
sharepoint.listItems.byteStreamByFilePath("/Documents/report.pdf", function(err, serviceReqObj) {
  require('request').get(serviceReqObj).on('response', function(response) {
    response.pipe(res);
  });
});
```

## Error Handling

All API methods follow Node.js callback conventions:

```javascript
function(err, result) {
  if (err) {
    console.error('Operation failed:', err.message);
    return;
  }
  // Process successful result
}
```

### Common Error Types

1. **Authentication Errors**: Invalid credentials, expired tokens
2. **Network Errors**: Connection timeout, DNS failure
3. **SharePoint API Errors**: Invalid list ID, permission denied
4. **Validation Errors**: Missing required fields, invalid data types

## Advanced Options

### Filtering and Selection Options

```javascript
{
  fieldValuesAsText: true,        // Return lookup values as text
  filterFields: [                 // Filter items by field values
    {field: 'Status', value: 'Active'}
  ],
  selectFields: ['Title', 'Created'], // Only return specified fields
  expandFields: ['Author'],           // JOIN lookup fields
  orOperator: false,                  // Enable OR operation
  andOrOperator: false,               // Enable AND/OR operation
  $top: "1000"                        // Limit results (default: 5000)
}
```

## Authentication Types

- **NTLM**: On-premise SharePoint instances
- **Basic**: Basic HTTP authentication
- **Online**: SharePoint 365/Online
- **Online SAML**: Federated SAML SSO with SharePoint 365

## Version Compatibility

- SharePoint 2013 (on-premise)
- SharePoint 365 (online)
- Office 365

---

*This documentation covers all public APIs available in the SharePoint Connector library. For integration examples and testing, refer to the test directory and README.md.*
