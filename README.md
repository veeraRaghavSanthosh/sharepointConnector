[![Build Status](https://travis-ci.org/cianclarke/sharepointer.svg)](https://travis-ci.org/cianclarke/sharepointer)
[![bitHound Score](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector/badges/score.svg)](https://www.bithound.io/github/veeraRaghavSanthosh/sharepointConnector)


A Node.js SharePoint Client inherited from sharepointer (by cian clarke) .

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

# Tests
Tests are written in Mocha. Unit tests simply require the integration tests, and `nock` the API they integrate with - thus reducing the amount of test code we need to write.

## Running Unit tests
This includes jshint, and the mocha unit test suite.

```
# install grunt globally
npm install grunt-cli -g
#run the tests
grunt test
```

## Running Integration Tests

```
#Setup environment variables with your SP creds:
export SP_USERNAME=YOUR_USERNAME
export SP_PASSWORD=YOUR_PASSWORD
export SP_HOST=https://your_sp_hostname.com
export SP_AUTH_TYPE=(ntlm|basic|online|onlinesaml)
#Then run the tests:
grunt integration
```
