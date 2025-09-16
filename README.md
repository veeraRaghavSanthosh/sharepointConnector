# SharePoint Connector

[![Build Status](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector.svg)](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector)
[![bitHound Score](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector/badges/score.svg)](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector)

A Node.js SharePoint Client inherited from sharepointer (by cian clarke).

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Usage Examples](#usage-examples)
- [API Documentation](#api-documentation)
- [Authentication Types](#authentication-types)
- [Contributing](#contributing)

## Installation

### Prerequisites

- **Node.js**: Version 8.0 or higher
- **npm**: Version 5.0 or higher (usually comes with Node.js)

### Install from npm

```bash
npm install sharepointconnector
```

### Install from Source

1. Clone the repository:
```bash
git clone https://github.com/veeraRaghavSanthosh/sharepointConnector.git
cd sharepointConnector
```

2. Install dependencies:
```bash
npm install
```

3. Install development dependencies (for testing and development):
```bash
npm install --dev
```

4. Install Grunt CLI globally (required for running tests):
```bash
npm install -g grunt-cli
```

## Quick Start

Here's a simple example to get you started:

```javascript
var sharepoint = require('sharepointconnector')({
  username : 'someusername',
  password : 'somepassword',
  // Authentication type - current valid values: ntlm, basic, online, onlinesaml
  type : 'ntlm',
  url : 'https://sharepointHostname.com'
});

sharepoint.login(function(err){
  if (err){
    return console.error(err);
  }
  
  // Once logged in, we can list the "lists" within sharepoint
  sharepoint.lists.list(function(err, listRes){
    if (err) {
      return console.error(err);
    }
    
    var aList = listRes[0];
    console.log('Found list:', aList.Title);
    
    // Read a particular list with its Items[] and Fields[]
    sharepoint.lists.read(aList.Id, function(err, listRead){
      if (err) {
        return console.error(err);
      }
      
      console.log('List details:', listRead);
    });
  });
});
```

## Running the Project

### Development Mode

For development, you can run the project with various configurations:

1. **Basic Development Setup**:
```bash
# Navigate to project directory
cd sharepointConnector

# Install dependencies if not already done
npm install

# Run linting checks
grunt test
```

2. **Using the Library in Your Project**:
```javascript
// In your Node.js application
const sharepoint = require('sharepointconnector');

// Configure your SharePoint connection
const sp = sharepoint({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE || 'ntlm',
  url: process.env.SP_HOST
});

// Use the connector
sp.login((err) => {
  if (err) throw err;
  console.log('Connected to SharePoint!');
});
```

### Environment Variables

For security, it's recommended to use environment variables for sensitive information:

```bash
# Create a .env file or export these variables
export SP_USERNAME=your_sharepoint_username
export SP_PASSWORD=your_sharepoint_password
export SP_HOST=https://your-sharepoint-site.com
export SP_AUTH_TYPE=ntlm  # or basic, online, onlinesaml
```

### Production Deployment

1. **Install production dependencies only**:
```bash
npm install --production
```

2. **Use PM2 for process management** (optional):
```bash
npm install -g pm2
pm2 start your-app.js
```

## Testing

This project includes comprehensive unit and integration tests using Mocha.

### Running Unit Tests

Unit tests use mocked API responses and don't require actual SharePoint credentials:

```bash
# Run linting and unit tests
grunt test

# Run only JSHint linting
grunt jshint
```

### Running Integration Tests

Integration tests require actual SharePoint credentials and will make real API calls:

1. **Set up environment variables** with your SharePoint credentials:
```bash
export SP_USERNAME=YOUR_USERNAME
export SP_PASSWORD=YOUR_PASSWORD
export SP_HOST=https://your_sp_hostname.com
export SP_AUTH_TYPE=ntlm  # Options: ntlm, basic, online, onlinesaml
```

2. **Run integration tests**:
```bash
grunt integration
```

### Test Structure

- **Unit Tests** (`test/unit/`): Mock-based tests that don't require SharePoint connection
  - `test-list-create-delete.js` - Tests for list creation and deletion
  - `test-list-get.js` - Tests for list retrieval operations
  - `test-list-items.js` - Tests for list item operations

- **Integration Tests** (`test/integration/`): Real API tests requiring SharePoint credentials
  - `test-list-create-delete.js` - Integration tests for list CRUD operations
  - `test-list-get.js` - Integration tests for list retrieval
  - `test-list-items.js` - Integration tests for list item operations

### Test Fixtures

Test fixtures are located in `test/fixtures/` and provide mock data for unit tests:
- `apis.js` - Mock API responses
- `context.js` - Test context setup
- `list.js` - Mock list data
- `listfields.js` - Mock list field definitions
- `listitem.js` - Mock list item data
- `listitemfile.js` - Mock file attachment data
- `listitems.js` - Mock list items collection

### Running Specific Tests

```bash
# Run a specific test file
./node_modules/mocha/bin/mocha test/unit/test-list-get.js

# Run tests with verbose output
./node_modules/mocha/bin/mocha --reporter spec test/unit/

# Run tests with timeout (useful for integration tests)
./node_modules/mocha/bin/mocha -t 25000 test/integration/
```

## Usage Examples

### Authentication Types

The connector supports multiple authentication methods:

```javascript
// NTLM Authentication (most common for on-premise SharePoint)
var sharepoint = require('sharepointconnector')({
  username: 'domain\\username',
  password: 'password',
  type: 'ntlm',
  url: 'https://sharepoint.company.com'
});

// Basic Authentication
var sharepoint = require('sharepointconnector')({
  username: 'username',
  password: 'password',
  type: 'basic',
  url: 'https://sharepoint.company.com'
});

// SharePoint Online (Office 365)
var sharepoint = require('sharepointconnector')({
  username: 'user@company.onmicrosoft.com',
  password: 'password',
  type: 'online',
  url: 'https://company.sharepoint.com'
});

// SharePoint Online with SAML SSO
var sharepoint = require('sharepointconnector')({
  username: 'user@company.com',
  password: 'password',
  type: 'onlinesaml',
  url: 'https://company.sharepoint.com',
  federatedAuthUrl: 'https://adfs.company.com/adfs/ls/'
});
```

### Configuration Parameters

```javascript
var sharepoint = require('sharepointconnector')({
  username: 'someusername',
  password: 'somepassword',
  type: 'ntlm', // Authentication type: ntlm, basic, online, onlinesaml
  url: 'https://SharepointHostname.com',
  
  // Optional parameters:
  context: 'myCustomerSite', // Set to create resources outside of the base site context
  verbose: false, // Set to true to stop filtering responses, return everything
  proxy: undefined, // Set to string hostname of proxy if running through one
  strictSSL: true, // Set to false if connecting to SP instance with self-signed cert
  federatedAuthUrl: 'http://mysamlloginservice.com', // Only for 'onlinesaml' auth type
  rtFa: '<token>', // Optional parameter to set rtFa token value
  FedAuth: '<token>' // Optional parameter to set FedAuth token value
});
```

### Working with Lists

```javascript
// List all SharePoint lists
sharepoint.lists.list(function(err, lists, nextUrl) {
  if (err) throw err;
  
  console.log('Found', lists.length, 'lists');
  lists.forEach(list => {
    console.log('- ' + list.Title + ' (ID: ' + list.Id + ')');
  });
});

// Create a new list
sharepoint.lists.create({
  title: 'My New List',
  description: 'A list created via the API'
}, function(err, newList) {
  if (err) throw err;
  console.log('Created list:', newList.Title);
});

// Read a specific list with its items and fields
sharepoint.lists.read('MyListName', function(err, list) {
  if (err) throw err;
  
  console.log('List:', list.Title);
  console.log('Items count:', list.Items.length);
  console.log('Fields count:', list.Fields.length);
});

// Update a list
sharepoint.lists.update('ListId', { Title: 'Updated List Name' }, function(err, result) {
  if (err) throw err;
  console.log('List updated successfully');
});

// Delete a list
sharepoint.lists.del('ListId', function(err) {
  if (err) throw err;
  console.log('List deleted successfully');
});
```

### Working with List Items

```javascript
// Get all items from a list
sharepoint.listItems.list('MyListName', function(err, items, nextUrl) {
  if (err) throw err;
  
  console.log('Found', items.length, 'items');
  items.forEach(item => {
    console.log('- ' + item.Title);
  });
});

// Get ALL items (handles pagination automatically)
sharepoint.listItems.listAll('MyListName', function(err, allItems) {
  if (err) throw err;
  console.log('Total items:', allItems.length);
});

// Create a new list item
sharepoint.listItems.create('MyListName', {
  Title: 'New Item',
  Description: 'Created via API'
}, function(err, newItem) {
  if (err) throw err;
  console.log('Created item:', newItem.Title);
});

// Read a specific list item
sharepoint.listItems.read('MyListName', 'itemId', function(err, item) {
  if (err) throw err;
  console.log('Item:', item.Title);
});

// Delete a list item
sharepoint.listItems.del('MyListName', 'itemId', function(err) {
  if (err) throw err;
  console.log('Item deleted successfully');
});
```

### Advanced Filtering and Selection

```javascript
// Filter items based on field values
sharepoint.listItems.list('MyListName', {
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Category', value: 'Important' }
  ],
  orOperator: false // Use AND logic (default)
}, function(err, filteredItems) {
  if (err) throw err;
  console.log('Filtered items:', filteredItems.length);
});

// Select specific fields only
sharepoint.listItems.list('MyListName', {
  selectFields: ['Title', 'Created', 'Author'],
  fieldValuesAsText: true
}, function(err, items) {
  if (err) throw err;
  console.log('Items with selected fields:', items);
});

// Expand lookup fields
sharepoint.listItems.list('MyListName', {
  expandFields: ['Author', 'Category'],
  selectFields: ['Title', 'Author/Title', 'Category/Name']
}, function(err, items) {
  if (err) throw err;
  console.log('Items with expanded fields:', items);
});

// Limit results
sharepoint.listItems.list('MyListName', {
  $top: "100" // Limit to 100 items
}, function(err, items) {
  if (err) throw err;
  console.log('Limited items:', items.length);
});
```

### Working with Files

```javascript
// Get binary stream for a file
sharepoint.listItems.byteStream('Documents', 'myfile.pdf', function(err, serviceReqObj) {
  if (err) throw err;
  
  // Pipe the file content to response (in Express.js)
  require('request').get(serviceReqObj).on('response', function(response) {
    response.pipe(res);
  });
});

// Get binary stream by file path
sharepoint.listItems.byteStreamByFilePath('/sites/mysite/Documents/myfile.pdf', function(err, serviceReqObj) {
  if (err) throw err;
  
  require('request').get(serviceReqObj).on('response', function(response) {
    response.pipe(res);
  });
});
```

### User Information

```javascript
// Get current logged-in user details
sharepoint.listItems.currentuser("MyListName", function(err, userInfo) {
  if (err) throw err;
  
  console.log('Current user:', userInfo.Title);
  console.log('Email:', userInfo.Email);
});
```

## API Documentation

### Lists

#### `sharepoint.lists.list(callback)`
- **Description**: Retrieves all lists in the SharePoint site
- **Parameters**: `callback(err, lists, nextUrl)`
- **Returns**: Array of list objects

#### `sharepoint.lists.create(listData, callback)`
- **Description**: Creates a new list
- **Parameters**: 
  - `listData`: Object with `title` and `description`
  - `callback(err, newList)`

#### `sharepoint.lists.read(listId, callback)`
- **Description**: Reads a specific list with its items and fields
- **Parameters**:
  - `listId`: List ID or name
  - `callback(err, listData)`

#### `sharepoint.lists.update(listId, updateData, callback)`
- **Description**: Updates a list
- **Parameters**:
  - `listId`: List ID
  - `updateData`: Object with fields to update
  - `callback(err, result)`

#### `sharepoint.lists.del(listId, callback)`
- **Description**: Deletes a list
- **Parameters**:
  - `listId`: List ID
  - `callback(err)`

### List Items

#### `sharepoint.listItems.list(listName, [options], callback)`
- **Description**: Retrieves items from a list
- **Parameters**:
  - `listName`: Name of the list
  - `options`: Optional filtering/selection options
  - `callback(err, items, nextUrl)`

#### `sharepoint.listItems.listAll(listName, [options], callback)`
- **Description**: Retrieves ALL items from a list (handles pagination)
- **Parameters**:
  - `listName`: Name of the list
  - `options`: Optional filtering/selection options
  - `callback(err, allItems)`

#### `sharepoint.listItems.create(listName, itemData, callback)`
- **Description**: Creates a new list item
- **Parameters**:
  - `listName`: Name of the list
  - `itemData`: Object with item field values
  - `callback(err, newItem)`

#### `sharepoint.listItems.read(listName, itemId, callback)`
- **Description**: Reads a specific list item
- **Parameters**:
  - `listName`: Name of the list
  - `itemId`: Item ID
  - `callback(err, item)`

#### `sharepoint.listItems.del(listName, itemId, callback)`
- **Description**: Deletes a list item
- **Parameters**:
  - `listName`: Name of the list
  - `itemId`: Item ID
  - `callback(err)`

## Authentication Types

### NTLM (Windows Authentication)
Best for on-premise SharePoint installations with Windows domain authentication.

```javascript
{
  type: 'ntlm',
  username: 'domain\\username', // or 'username@domain.com'
  password: 'password'
}
```

### Basic Authentication
Simple username/password authentication.

```javascript
{
  type: 'basic',
  username: 'username',
  password: 'password'
}
```

### SharePoint Online (Office 365)
For SharePoint Online/Office 365 sites.

```javascript
{
  type: 'online',
  username: 'user@tenant.onmicrosoft.com',
  password: 'password'
}
```

### SharePoint Online with SAML SSO
For SharePoint Online with federated SAML authentication.

```javascript
{
  type: 'onlinesaml',
  username: 'user@company.com',
  password: 'password',
  federatedAuthUrl: 'https://adfs.company.com/adfs/ls/'
}
```

## Why Another SharePoint Client?

This SharePoint client offers several advantages:

- ✅ **Comprehensive test coverage** with both unit and integration tests
- ✅ **Written in JavaScript** (not CoffeeScript)
- ✅ **Multiple authentication schemas** support:
  - NTLM (Windows Authentication)
  - Basic Authentication
  - SharePoint Online (Office 365)
  - SAML SSO for federated authentication
- ✅ **Active maintenance** and accepts pull requests
- ✅ **Convenient API** that combines related operations
- ✅ **Pagination support** for large datasets
- ✅ **File handling** capabilities
- ✅ **Flexible filtering and field selection**

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `grunt test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Install Grunt CLI: `npm install -g grunt-cli`
4. Run tests: `grunt test`
5. Set up integration test environment variables for testing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify credentials are correct
   - Check if the authentication type matches your SharePoint setup
   - For NTLM, try both `domain\\username` and `username@domain.com` formats

2. **SSL Certificate Issues**
   - Set `strictSSL: false` for self-signed certificates
   - Consider using a proper SSL certificate in production

3. **Timeout Issues**
   - Increase timeout values in your HTTP client
   - Check network connectivity to SharePoint server

4. **Permission Errors**
   - Verify the user account has necessary permissions
   - Check SharePoint site permissions and list-level permissions

### Getting Help

- Check the [Issues](https://github.com/veeraRaghavSanthosh/sharepointConnector/issues) page
- Review the test files for usage examples
- Ensure your SharePoint version is supported

## A SharePoint Primer

Skip this if you already know enough about SharePoint. Here are the basics:

- **SharePoint Products**:
  - SharePoint 2013/2016/2019 - On-premise versions
  - SharePoint Online (Office 365) - Cloud-hosted version

- **Everything is a List** in SharePoint:
  - Document Library? A list
  - Tasks app? A list  
  - Discussion Board? A list
  - Site Pages? A list
  
SharePoint reuses the base type `List` for most content types, which is why this connector focuses heavily on list operations.