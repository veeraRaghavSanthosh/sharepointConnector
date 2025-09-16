[![Build Status](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector.svg)](https://travis-ci.org/veeraRaghavSanthosh/sharepointConnector)
[![bitHound Score](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector/badges/score.svg)](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector)


# SharePoint Connector

A Node.js SharePoint Client inherited from sharepointer (by cian clarke) that supports multiple authentication strategies, file streaming, fetching details by list title, pagination, extendable record fetch limit, and query operators with concurrent user login support.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Example](#usage-example)
- [Parameters](#parameters)
- [Additional Parameters for listing and reading Lists and ListItems](#additional-parameters-for-listing-and-reading-lists-and-listitems)
- [A SharePoint Primer](#a-sharepoint-primer)
- [Methods](#methods)
  - [Lists](#lists)
  - [List Items](#list-items)
- [Why another SharePoint Client?](#why-another-sharepoint-client)
- [Development & Testing](#development--testing)
  - [Development Setup](#development-setup)
  - [Running the Project](#running-the-project)
  - [Testing](#testing)

## Prerequisites

- **Node.js**: Version 4.x or higher (recommended: 8.x or higher)
- **npm**: Comes with Node.js installation
- **SharePoint Environment**: 
  - SharePoint 2013 (on-premise)
  - SharePoint Online/Office 365
  - SharePoint with SAML SSO

## Installation

### Using npm (Recommended)

```bash
npm install sharepointconnector
```

### Using yarn

```bash
yarn add sharepointconnector
```

### From Source

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
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm', // or 'basic', 'online', 'onlinesaml'
  url: 'https://your-sharepoint-site.com'
});

// Login and start using
sharepoint.login((err) => {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Successfully connected to SharePoint!');
  
  // Your SharePoint operations here
  sharepoint.lists.list((err, lists) => {
    if (!err) {
      console.log('Available lists:', lists.length);
    }
  });
});
```

### Environment Variables Setup

For security, it's recommended to use environment variables:

```bash
# Create a .env file or export these variables
export SP_USERNAME="your-username"
export SP_PASSWORD="your-password" 
export SP_HOST="https://your-sharepoint-site.com"
export SP_AUTH_TYPE="ntlm"  # or basic, online, onlinesaml
export SP_CONTEXT="web"     # optional, defaults to 'web'
```

Then use in your code:

```javascript
const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE,
  url: process.env.SP_HOST,
  context: process.env.SP_CONTEXT || 'web'
});
```

# Usage Example

```javascript
var sharepoint = require('sharepointconnector')({
  username : 'someusername',
  password : 'somepassword',
  // Authentication type - current valid values: ntlm, basic, online,onlinesaml
  type : 'ntlm',
  url : 'https://sharepointHostname.com'
});
sharepoint.login(function(err){
  if (err){
    return console.error(err);
  }
  // Once logged in, we can list the "lists" within sharepoint
  sharepoint.lists.list(function(err, listRes){
      var aList = listRes[0];
    // We can pick a particular list, and read it. This also gives us the list's Items[] and Fields[]
    sharepoint.lists.read(aList.Id, function(err, listRead){
      console.log(singleResult);
    });
  });
});
```

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

## Additional Parameters for listing and reading Lists and ListItems

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

# Development & Testing

## Development Setup

If you want to contribute or run the project in development mode:

```bash
# Clone the repository
git clone https://github.com/veeraRaghavSanthosh/sharepointConnector.git
cd sharepointConnector

# Install dependencies
npm install

# Install development dependencies (if not already installed)
npm install --only=dev

# Install grunt CLI globally (required for running tests)
npm install -g grunt-cli
```

## Running the Project

### As a Library

Once installed, you can use it in your Node.js projects:

```javascript
// In your Node.js application
const sharepoint = require('sharepointconnector');

// Initialize with your SharePoint configuration
const spClient = sharepoint({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE,
  url: process.env.SP_HOST
});

// Use the client
spClient.login((err) => {
  if (!err) {
    console.log('Connected to SharePoint successfully!');
    // Your SharePoint operations here
  }
});
```

### Example Applications

Create a simple test file to verify your setup:

```javascript
// test-connection.js
const sharepoint = require('sharepointconnector')({
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm', // Change based on your setup
  url: 'https://your-sharepoint-site.com'
});

sharepoint.login((err) => {
  if (err) {
    console.error('Connection failed:', err);
    return;
  }
  
  console.log('✅ Successfully connected to SharePoint!');
  
  // List all available lists
  sharepoint.lists.list((err, lists) => {
    if (!err) {
      console.log(`📋 Found ${lists.length} lists:`);
      lists.forEach((list, index) => {
        console.log(`  ${index + 1}. ${list.Title} (${list.ItemCount} items)`);
      });
    }
  });
});
```

Run it with:
```bash
node test-connection.js
```

## Testing

### Test Overview

Tests are written in Mocha and organized into two categories:
- **Unit Tests**: Use `nock` to mock SharePoint API responses, allowing fast testing without a real SharePoint instance
- **Integration Tests**: Test against a real SharePoint environment (requires valid credentials)

### Prerequisites for Testing

```bash
# Install development dependencies
npm install --only=dev

# Install grunt CLI globally (if not already installed)
npm install -g grunt-cli
```

### Running Unit Tests

Unit tests include JSHint linting and the Mocha test suite with mocked API calls:

```bash
# Run linting and unit tests
npm test

# Or using grunt directly
grunt test

# Run only linting
grunt jshint
```

### Running Integration Tests

Integration tests require a real SharePoint environment and valid credentials.

#### Setup Environment Variables

```bash
# Required environment variables
export SP_USERNAME="your-sharepoint-username"
export SP_PASSWORD="your-sharepoint-password"
export SP_HOST="https://your-sharepoint-site.com"
export SP_AUTH_TYPE="ntlm"  # Options: ntlm, basic, online, onlinesaml

# Optional environment variables
export SP_CONTEXT="web"  # Default context, usually 'web'
```

#### Alternative: Create a .env file

```bash
# Create .env file (not tracked in git)
cat > .env << EOF
SP_USERNAME=your-sharepoint-username
SP_PASSWORD=your-sharepoint-password
SP_HOST=https://your-sharepoint-site.com
SP_AUTH_TYPE=ntlm
SP_CONTEXT=web
EOF

# Load environment variables (in bash)
source .env
```

#### Run Integration Tests

```bash
# Run integration tests (currently disabled in Gruntfile)
# Note: Integration test task needs to be uncommented in Gruntfile.js
grunt integration

# Or run directly with mocha
./node_modules/.bin/mocha test/integration/*.js --timeout 25000
```

### Test Structure

```
test/
├── fixtures/           # Mock data and API fixtures
│   ├── apis.js
│   ├── context.js
│   └── ...
├── integration/        # Tests against real SharePoint
│   ├── test-list-create-delete.js
│   ├── test-list-get.js
│   └── test-list-items.js
└── unit/              # Unit tests with mocked APIs
    ├── test-list-create-delete.js
    ├── test-list-get.js
    └── test-list-items.js
```

### Authentication Types for Testing

Choose the appropriate `SP_AUTH_TYPE` based on your SharePoint setup:

- **`ntlm`**: For on-premise SharePoint with Windows authentication
- **`basic`**: For basic HTTP authentication
- **`online`**: For SharePoint Online/Office 365
- **`onlinesaml`**: For SharePoint Online with SAML SSO

### Troubleshooting Tests

1. **Authentication Errors**: Verify your credentials and authentication type
2. **Connection Timeouts**: Increase timeout values or check network connectivity
3. **SSL Errors**: Add `strictSSL: false` to your SharePoint configuration for self-signed certificates
4. **Proxy Issues**: Configure proxy settings if running behind a corporate firewall
