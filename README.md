[![Build Status](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector.svg)](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector)
[![bitHound Score](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector/badges/score.svg)](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector)

# SharePoint Connector

A comprehensive Node.js SharePoint Client library inherited from sharepointer (by cian clarke). This library provides robust connectivity to SharePoint Online and on-premises SharePoint instances with support for multiple authentication strategies, file operations, list management, and advanced querying capabilities.

## Features

- **Multiple Authentication Methods**: NTLM, Basic, Online (SharePoint 365), and SAML SSO
- **Complete CRUD Operations**: Create, Read, Update, Delete for SharePoint Lists and List Items
- **File Operations**: Upload, download, and stream files from SharePoint Document Libraries
- **Advanced Querying**: Support for $filter, $select, $expand, $top with AND/OR operators
- **Pagination Support**: Handle large datasets with built-in pagination
- **Concurrent User Support**: Multiple users can authenticate simultaneously
- **Proxy Support**: Works behind corporate proxies
- **Comprehensive Test Coverage**: Unit and integration tests included

## Prerequisites

- Node.js 8.x or higher
- npm or yarn package manager
- Access to SharePoint Online or SharePoint Server
- Valid SharePoint credentials

## Installation

### Method 1: Install from npm

```bash
npm install sharepointconnector
```

### Method 2: Install from source

```bash
# Clone the repository
git clone https://github.com/veeraRaghavSanthosh/sharepointConnector.git
cd sharepointConnector

# Install dependencies
npm install
```

## Quick Start

### Basic Usage

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'your-username@domain.com',
  password: 'your-password',
  // Authentication type - valid values: ntlm, basic, online, onlinesaml
  type: 'online', // Use 'online' for SharePoint 365
  url: 'https://yourtenant.sharepoint.com'
});

// Connect to SharePoint
sharepoint.login(function(err) {
  if (err) {
    return console.error('Login failed:', err);
  }
  console.log('Successfully connected to SharePoint!');
  
  // List all SharePoint lists
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      return console.error('Error listing lists:', err);
    }
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
    
    // Read a specific list with its items and fields
    if (lists.length > 0) {
      const firstList = lists[0];
      sharepoint.lists.read(firstList.Id, function(err, listDetails) {
        if (err) {
          return console.error('Error reading list:', err);
        }
        
        console.log(`List "${listDetails.Title}" contains ${listDetails.Items.length} items`);
        console.log(`Available fields: ${listDetails.Fields.map(f => f.Title).join(', ')}`);
      });
    }
  });
});
```

## Configuration Options

## Parameters
When initialising Sharepoint, there are a number of optional params which can be specified at init. Here are their defaults & descriptions

```javascript
var sharepoint = require('sharepointconnector')({
  username : 'someusername',
  password : 'somepassword',
  // Authentication type - current valid values: ntlm, basic, online, onlinesaml
  type : 'ntlm',
  url : 'https://SharepointHostname.com',
  // All of the following params are optional:
  context : 'myCustomerSite', // Set to create resources outside of the base site context, `web`
  verbose : false, // Set to true to stop filtering responses, instead returning everything
  proxy : undefined, // set to string hostname of proxy if running through one
  strictSSL : true, // set to false if connecting to SP instance with self-signed cert
  federatedAuthUrl : 'http://mysamlloginservice.com', // only set for auth type 'onlinesaml', the URL of the SAML service which issues assertions to forward to the SharePoint login URL
  rtFa: <token>,// an optional parameter to set rtFa token value,
  FedAuth:<token> // an optional parameter to set FedAuth token value,  
});
```

### Configuration Parameters

When initializing SharePoint Connector, you can specify the following configuration options:

```javascript
const sharepoint = require('sharepointconnector')({
  // Required parameters
  username: 'your-username@domain.com',    // SharePoint username
  password: 'your-password',               // SharePoint password
  type: 'online',                          // Authentication type
  url: 'https://yourtenant.sharepoint.com', // SharePoint site URL
  
  // Optional parameters
  context: 'sites/mysite',                 // Site context (default: 'web')
  verbose: false,                          // Return full API responses (default: false)
  proxy: undefined,                        // Proxy server hostname
  strictSSL: true,                         // SSL certificate validation (default: true)
  federatedAuthUrl: 'https://sso.company.com', // SAML SSO URL (for 'onlinesaml' type)
  rtFa: '<token>',                         // Optional rtFa token
  FedAuth: '<token>'                       // Optional FedAuth token
});
```

#### Authentication Types

- **`ntlm`**: For on-premises SharePoint with NTLM authentication
- **`basic`**: For basic HTTP authentication
- **`online`**: For SharePoint Online/365 (most common)
- **`onlinesaml`**: For SharePoint Online with SAML SSO federation

#### Environment Variables Setup

For security, consider using environment variables:

```javascript
// Install dotenv: npm install dotenv
require('dotenv').config();

const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE || 'online',
  url: process.env.SP_URL
});
```

Example `.env` file:
```
SP_USERNAME=your-username@domain.com
SP_PASSWORD=your-password
SP_AUTH_TYPE=online
SP_URL=https://yourtenant.sharepoint.com
```

## Advanced Configuration

### Additional Parameters for listing and reading Lists and ListItems

```javascript
  fieldValuesAsText : true, //Return Lookup Field Values as Text for Items
  filterFields : [{field: 'field1', value: 'value1'}], //Filter Items in List based on field value(s) $filter=
  selectFields : ['field1', 'field2'], //Only return List or Item data for fields specified $select=
  expandFields : ['field1', 'field2'], //"JOIN" another list based on a lookup value and return data $expand=
  orOperator:false, // set to true to enable 'or' operation   
  andOrOperator:false,// set to true to enable 'andor' operation
  $top: "1000" // set the required '$top' value (to change the response cap) and by default it is set to 5000
```

# A Sharepoint Primer
Skip this if you already know enough about SharePoint.<br>Here's the basics I wanted to know about this product before I began integrating:
- Sharepoint is a number of products:
  - SharePoint 2013 - the on premise version of Sharepoint which I've seen most often.
  - Sharepoint 365 - the online SharePoint product.

- **Everything is a List** in SharePoint. Document Library? A list. The tasks app? Just a list. Discussion Board? You got it, it's a list. Site Pages? List. Turns out, Sharepoint reuses the base type `List` for a lot of things.

# Methods
## Lists
As mentioned above, SharePoint is driven by lists. The base SharePoint API allows you to `CRUDL` lists, but the read operation doesn't return Items[] or Fields[] - this is a separate API operation. With Sharepointer, list read operations also retrieve all Fields[] and Items[] on the list for convenience.  

### Lists List
Confusing, I know. Bear with me. Lists all objects of type `list` in sharepoints (and remember, almost everything in Sharepoint is a list!).


```javascript
sharepoint.lists.list(function(err, listRes,nextUrl){
  // listRes will be an array of lists [{ Id : '1a2b3c', ... }, { Id : '2b3c4d' }, { Id : '5d6e7f' }]
});
```

You can now use any of the following functions to operate upon lists. Note that each `lists` object in the array will also have a convenience function which operates on itself for read, update & delete. These are also documented below.

### Lists Create
Creating a result requires a title and a description.

```javascript
sharepoint.lists.create({ title : 'My new list', description : 'Some list description' }, function(err, createRes){
  // createRes will be the newly created list as an object { Id : 'list Name', title : 'My new list', ...}
});
```

### Lists Read
List Read can take a string as the first param (assumes list Id), or a params object specifying either a guid or title.<br>The list operation already tells us quite a bit about that list, but this read call also returns Fields[] and Items[]. This is different to how the SharePoint API behaves, and is offered as a convenience.

```javascript
// Get a list by ID - you can find this under the 'Id' property.
sharepoint.lists.read('list name', function(err, listReadResult){
  // listReadResult will be an object { Id : 'list name', Title : 'SomeListTitle', Items : [{}, {}], Fields : [{}, {}]  ... }
});

// Get a list by name
sharepoint.lists.read({title : 'some list name' }, function(err, listReadResult){
  // listReadResult will be an object { Id : 'list name', Title : 'some list name', ... }
});

// You can also call a read() operation from an object returned from the list operation for convenience like this
sharepoint.lists.list(function(err, listRes){
  var aList = listRes[0];
  aList.read(function(err, aListReadResult){

  });
});


```

## Lists Update
Updating requires an ID and a title. Optionally, you can just specify all this in one object.

```javascript
// Update specifying the Id separately
return sharepoint.lists.update('list name', { Title : 'MyNewTitle' }, function(err, updateResult){
  // updateResult will be the object you passed in, but not the full list. To get the fully updated object, a subsequent read is needed.
});

// Updating specifying the Id in one param
return sharepoint.lists.update({ Id : 'list name', Title : 'MyNewTitle' }, function(err, updateResult){
});

// You can also call a update() operation from an object returned from the list operation for convenience like this
sharepoint.lists.list(function(err, listRes){
  var aList = listRes[0];
  aList.update({Title : '' }, function(err){

  });
});
```

### Lists Delete
Delete requires a list Id. Deletion by title is not possible.

```javascript
sharepoint.lists.del('someListId', function(err){
  // Err will indicate if somethign went wrong - there's no second param
});

// You can also call a delete() operation from an object returned from the list operation for convenience like this
sharepoint.lists.list(function(err, listRes){
  var aList = listRes[0];
  aList.update({Title : '' }, function(err){

  });
});
```

## List Items
Lists in sharepoint have a collection of items. These are usually another API call away, but as discussed earlier, sharepointer retrieves these upon performing a read() call.

### ListItems List
To retrieve the items contained within a list,

```javascript
sharepoint.listItems.list('list Name', function(err, itemsUnderThisList,nextUrl){
  //nextUrl -- will provide the next page url and will be used to represent paginated data     

});
// below method can be used to read complete sharepoint list, irrespective of the pagination SP value it provides the complete data set  (this method will takecare of the pagination internally and provides complete data set).
sharepoint.listItems.listAll('list Name',function(err, listRes){

  });

// will provide the current logged in user details
sharepoint.listItems.currentuser("list name",function(err,response){

});
// will provide the binary stream content
sharepoint.listItems.byteStream("floder Name", "filename",function(err,serviceReqObj){
// for easy binary handling, invoked the service and piped it to response
    require('request').get(serviceReqObj).on('response', function(response) {
          response.pipe(res);
        });
});

// below method can be used to read binary content based on the file path
sharepoint.listItems.byteStreamByFilePath("file Path",function(err,serviceReqObj){
// for ease of binary handling, invoked the service and piped it to response
    require('request').get(serviceReqObj).on('response', function(response) {
          response.pipe(res);
        });
});

```

Of course, we can also just perform a list read:

```javascript
sharepoint.listItems.read('list Name', function(err, listReadResult){
  // we now have the items under listReadResult.Items
});
```

### ListItem Create
We can create new ListItems within a list using the create function. The responsibility is on the user to ensure all required fields are included prior to creating a listItem, and no extraneous fields are included. SharePoint throws meaningful & useful errors (..for once) if you include incorrect fields here, so it's easy to debug.

```javascript
sharepoint.listItems.create('list Name', { Title : 'My new list item', Remember: 'To include all fields' }, function(err, listCreateResult){

});
```

We can also just call .create() on the `Items` property of a list which we've read.

```javascript
sharepoint.lists.read('list Name', function(err, listReadResult){
  // Now that we've read a list, we can create an item under it by running:
  listReadResult.Items.create({ Title : 'My new item' }, function(){

  });
  // We could also use listReadResult.createItem() to the same effect
});
```

### ListItem Read
As part of reading a ListItem, we also retrieve it's File property, if any exists. This is helpful, because many lists include a file attachment (e.g. Document Libraries). If no file exists, this will simply be `undefined`.

```javascript
sharepoint.listItems.read('list Name', 'someListItemId', function(err, singleListItem){

});
```

Of course, we can also just call .read() on a listItem, after we read it's containing list.

```javascript
sharepoint.lists.read('list Name', function(err, listReadResult){
  var anItemInThisList = listReadResult.Items[0];
  anItemInThisList.read(function(err, listItem){

  });
});
```

### ListItem Delete
To delete a ListItem, we can use the del() function.

```javascript
sharepoint.listItems.del('list Name', 'someListItemId', function(err){

});
```
Of course, we can also just call .del() on a listItem, after we read it's containing list.

```javascript
sharepoint.lists.read('list Name', function(err, listReadResult){
  var anItemInThisList = listReadResult.Items[0];
  anItemInThisList.delete(function(err){

  });
});
```

# Why another Sharepoint Client?
Yet another SharePoint Client. This one:
- Has test coverage
- Isn't written in CofeeScript
- Supports multiple authentication schemas - currently:
  - NTLM
  - Basic
  - Online (Sharepoint 365/Online login flow)
  - Online with SAML SSO (Sharepoint 365 to Federated SAML SSO flow)

- Accepts pull requests :-)

# Development and Testing

## Project Structure

```
sharepointConnector/
├── lib/                          # Core library files
│   ├── auth/                     # Authentication modules
│   │   ├── basic.js             # Basic authentication
│   │   ├── ntlm.js              # NTLM authentication
│   │   ├── online.js            # SharePoint Online authentication
│   │   └── onlinesaml.js        # SAML SSO authentication
│   ├── objects/                  # SharePoint object handlers
│   │   ├── lists.js             # List operations
│   │   └── listItems.js         # List item operations
│   ├── util/                     # Utility functions
│   └── client.js                # Main client
├── test/                         # Test suites
│   ├── fixtures/                # Test data and mocks
│   ├── integration/             # Integration tests
│   └── unit/                    # Unit tests
├── package.json                 # Project configuration
├── Gruntfile.js                 # Build configuration
└── sharepointconnector.js       # Main entry point
```

## Running the Application

### Development Mode

```bash
# Clone and install dependencies (if installing from source)
git clone https://github.com/veeraRaghavSanthosh/sharepointConnector.git
cd sharepointConnector
npm install

# Create a test script (example: test-connection.js)
node test-connection.js
```

Example test script (`test-connection.js`):

```javascript
const sharepoint = require('./sharepointconnector')({
  username: process.env.SP_USERNAME || 'your-username@domain.com',
  password: process.env.SP_PASSWORD || 'your-password',
  type: process.env.SP_AUTH_TYPE || 'online',
  url: process.env.SP_URL || 'https://yourtenant.sharepoint.com'
});

sharepoint.login(function(err) {
  if (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to SharePoint!');
  
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Error listing lists:', err);
      return;
    }
    
    console.log(`📋 Found ${lists.length} lists in SharePoint`);
    process.exit(0);
  });
});
```

## Testing

The project includes comprehensive test coverage with both unit and integration tests using Mocha and Nock for API mocking.

### Prerequisites for Testing

```bash
# Install Grunt CLI globally (if not already installed)
npm install -g grunt-cli

# Install project dependencies
npm install
```

### Running Unit Tests

Unit tests use mocked SharePoint API responses and don't require actual SharePoint credentials:

```bash
# Run unit tests with linting
grunt test

# Alternative: Run tests directly with npm
npm test

# Run only linting (JSHint)
grunt jshint
```

### Running Integration Tests

Integration tests require actual SharePoint credentials and will make real API calls:

```bash
# Set up environment variables with your SharePoint credentials
export SP_USERNAME=your-username@domain.com
export SP_PASSWORD=your-password
export SP_HOST=https://yourtenant.sharepoint.com
export SP_AUTH_TYPE=online

# Run integration tests
grunt integration
```

#### Windows Users (PowerShell)

```powershell
# Set environment variables
$env:SP_USERNAME="your-username@domain.com"
$env:SP_PASSWORD="your-password"
$env:SP_HOST="https://yourtenant.sharepoint.com"
$env:SP_AUTH_TYPE="online"

# Run integration tests
grunt integration
```

#### Windows Users (Command Prompt)

```cmd
set SP_USERNAME=your-username@domain.com
set SP_PASSWORD=your-password
set SP_HOST=https://yourtenant.sharepoint.com
set SP_AUTH_TYPE=online

grunt integration
```

### Test Structure

- **Unit Tests** (`test/unit/`): Fast tests with mocked API responses
  - `test-list-create-delete.js`: Tests list creation and deletion
  - `test-list-get.js`: Tests list retrieval operations
  - `test-list-items.js`: Tests list item operations

- **Integration Tests** (`test/integration/`): Real API tests requiring credentials
  - `test-list-create-delete.js`: End-to-end list management
  - `test-list-get.js`: Real SharePoint list retrieval
  - `test-list-items.js`: Real list item operations

- **Fixtures** (`test/fixtures/`): Mock data and API responses
  - Contains sample SharePoint API responses for unit testing

### Available Grunt Tasks

```bash
# Run all unit tests with linting
grunt test

# Run only integration tests
grunt integration

# Run only linting
grunt jshint

# Get list of all available tasks
grunt --help
```

### Continuous Integration

The project uses Travis CI for automated testing. The `.travis.yml` configuration runs unit tests on multiple Node.js versions.

## Troubleshooting Tests

### Common Issues

1. **Integration test failures**:
   - Verify SharePoint credentials are correct
   - Ensure network connectivity to SharePoint
   - Check if your account has proper permissions

2. **Authentication errors**:
   - For SharePoint Online, ensure you're using the correct authentication type (`online`)
   - For SAML SSO, verify the `federatedAuthUrl` is correct
   - Check if multi-factor authentication is enabled (may require app-specific passwords)

3. **Network/Proxy issues**:
   - Configure proxy settings in the SharePoint connector initialization
   - Set `strictSSL: false` for self-signed certificates (development only)

4. **Permission errors**:
   - Ensure your SharePoint account has sufficient permissions
   - For list operations, you need at least "Contribute" permissions
   - For site-level operations, you may need "Site Collection Administrator" rights
