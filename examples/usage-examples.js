/**
 * SharePoint Connector - JavaScript Usage Examples
 * 
 * This file demonstrates various ways to use the SharePoint Connector library
 * with different authentication methods and operations.
 */

const sharepoint = require('sharepointconnector');

// Example 1: Basic Authentication
async function basicAuthExample() {
  const client = sharepoint({
    username: 'your-username',
    password: 'your-password',
    type: 'basic',
    url: 'https://your-sharepoint-site.com'
  });

  return new Promise((resolve, reject) => {
    client.login((err) => {
      if (err) {
        console.error('Login failed:', err);
        return reject(err);
      }
      console.log('Successfully logged in with basic authentication');
      resolve(client);
    });
  });
}

// Example 2: NTLM Authentication
async function ntlmAuthExample() {
  const client = sharepoint({
    username: 'domain\\username',
    password: 'your-password',
    type: 'ntlm',
    url: 'https://your-sharepoint-site.com',
    domain: 'your-domain',
    workstation: 'your-workstation'
  });

  return new Promise((resolve, reject) => {
    client.login((err) => {
      if (err) {
        console.error('NTLM Login failed:', err);
        return reject(err);
      }
      console.log('Successfully logged in with NTLM authentication');
      resolve(client);
    });
  });
}

// Example 3: SharePoint Online (Office 365) Authentication
async function onlineAuthExample() {
  const client = sharepoint({
    username: 'user@company.onmicrosoft.com',
    password: 'your-password',
    type: 'online',
    url: 'https://company.sharepoint.com'
  });

  return new Promise((resolve, reject) => {
    client.login((err) => {
      if (err) {
        console.error('Online Login failed:', err);
        return reject(err);
      }
      console.log('Successfully logged in to SharePoint Online');
      resolve(client);
    });
  });
}

// Example 4: Working with Lists
async function listOperationsExample() {
  const client = await basicAuthExample();

  return new Promise((resolve, reject) => {
    // Get all lists
    client.lists.list((err, lists) => {
      if (err) {
        console.error('Failed to get lists:', err);
        return reject(err);
      }

      console.log(`Found ${lists.length} lists`);
      
      // Create a new list
      client.lists.create({
        title: 'Sample List',
        description: 'A sample list created via the API'
      }, (err, newList) => {
        if (err) {
          console.error('Failed to create list:', err);
          return reject(err);
        }

        console.log('Created new list:', newList.Title);

        // Read the list with items and fields
        client.lists.read(newList.Id, (err, listDetails) => {
          if (err) {
            console.error('Failed to read list:', err);
            return reject(err);
          }

          console.log('List details:', {
            title: listDetails.Title,
            itemCount: listDetails.Items ? listDetails.Items.length : 0,
            fieldCount: listDetails.Fields ? listDetails.Fields.length : 0
          });

          // Update the list
          client.lists.update(newList.Id, {
            Title: 'Updated Sample List',
            Description: 'Updated description'
          }, (err, updatedList) => {
            if (err) {
              console.error('Failed to update list:', err);
              return reject(err);
            }

            console.log('Updated list title:', updatedList.Title);
            resolve({ lists, newList, listDetails, updatedList });
          });
        });
      });
    });
  });
}

// Example 5: Working with List Items
async function listItemsExample() {
  const client = await basicAuthExample();

  return new Promise((resolve, reject) => {
    // Assume we have a list called 'Tasks'
    const listName = 'Tasks';

    // Get all items from the list
    client.listItems.list(listName, (err, items, nextUrl) => {
      if (err) {
        console.error('Failed to get list items:', err);
        return reject(err);
      }

      console.log(`Found ${items.length} items in ${listName}`);
      if (nextUrl) {
        console.log('More items available at:', nextUrl);
      }

      // Create a new item
      const newItem = {
        Title: 'Sample Task',
        Description: 'A sample task created via the API',
        Status: 'Not Started'
      };

      client.listItems.create(listName, newItem, (err, createdItem) => {
        if (err) {
          console.error('Failed to create item:', err);
          return reject(err);
        }

        console.log('Created new item:', createdItem.Title);

        // Read the specific item
        client.listItems.read(listName, createdItem.Id, (err, itemDetails) => {
          if (err) {
            console.error('Failed to read item:', err);
            return reject(err);
          }

          console.log('Item details:', {
            id: itemDetails.Id,
            title: itemDetails.Title,
            status: itemDetails.Status
          });

          resolve({ items, createdItem, itemDetails });
        });
      });
    });
  });
}

// Example 6: Advanced Filtering and Querying
async function advancedQueryExample() {
  const client = sharepoint({
    username: 'your-username',
    password: 'your-password',
    type: 'basic',
    url: 'https://your-sharepoint-site.com',
    // Advanced query options
    fieldValuesAsText: true,
    filterFields: [
      { field: 'Status', value: 'Active' },
      { field: 'Priority', value: 'High' }
    ],
    selectFields: ['Title', 'Status', 'Priority', 'Created'],
    expandFields: ['Author', 'AssignedTo'],
    orOperator: false,
    $top: '100'
  });

  return new Promise((resolve, reject) => {
    client.login((err) => {
      if (err) {
        console.error('Login failed:', err);
        return reject(err);
      }

      // Get filtered list items
      client.listItems.list('Tasks', (err, filteredItems) => {
        if (err) {
          console.error('Failed to get filtered items:', err);
          return reject(err);
        }

        console.log(`Found ${filteredItems.length} filtered items`);
        filteredItems.forEach(item => {
          console.log(`Task: ${item.Title}, Status: ${item.Status}, Priority: ${item.Priority}`);
        });

        resolve(filteredItems);
      });
    });
  });
}

// Example 7: Get all items (handling pagination automatically)
async function getAllItemsExample() {
  const client = await basicAuthExample();

  return new Promise((resolve, reject) => {
    const listName = 'LargeList';

    // Use listAll to get all items regardless of pagination
    client.listItems.listAll(listName, (err, allItems) => {
      if (err) {
        console.error('Failed to get all items:', err);
        return reject(err);
      }

      console.log(`Retrieved all ${allItems.length} items from ${listName}`);
      resolve(allItems);
    });
  });
}

// Example 8: File operations (for Document Libraries)
async function fileOperationsExample() {
  const client = await basicAuthExample();

  return new Promise((resolve, reject) => {
    const libraryName = 'Documents';
    const fileName = 'sample-document.txt';

    // Get binary stream for a file
    client.listItems.byteStream(libraryName, fileName, (err, serviceReqObj) => {
      if (err) {
        console.error('Failed to get byte stream:', err);
        return reject(err);
      }

      console.log('Got file stream service object');
      
      // In a real application, you might pipe this to a response or save to disk
      // require('request').get(serviceReqObj).on('response', function(response) {
      //   response.pipe(fs.createWriteStream('downloaded-file.txt'));
      // });

      resolve(serviceReqObj);
    });
  });
}

// Example 9: Error handling and best practices
async function errorHandlingExample() {
  try {
    const client = sharepoint({
      username: 'invalid-username',
      password: 'invalid-password',
      type: 'basic',
      url: 'https://invalid-sharepoint-site.com',
      strictSSL: false, // For development environments with self-signed certs
      verbose: true // Get detailed responses for debugging
    });

    await new Promise((resolve, reject) => {
      client.login((err) => {
        if (err) {
          console.error('Expected login failure:', err);
          // Handle authentication errors gracefully
          reject(new Error('Authentication failed - check credentials'));
          return;
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('Handled error appropriately:', error.message);
    return { error: error.message };
  }
}

// Example 10: Using with promises/async-await wrapper
function promisifySharePointMethod(method) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const callback = (err, result, nextUrl) => {
        if (err) {
          reject(err);
        } else {
          resolve(nextUrl ? { result, nextUrl } : result);
        }
      };
      method.call(this, ...args, callback);
    });
  };
}

async function modernAsyncExample() {
  const client = sharepoint({
    username: 'your-username',
    password: 'your-password',
    type: 'basic',
    url: 'https://your-sharepoint-site.com'
  });

  // Promisify the login method
  const login = promisifySharePointMethod(client.login);
  const listLists = promisifySharePointMethod(client.lists.list);
  const readList = promisifySharePointMethod(client.lists.read);

  try {
    await login();
    console.log('Logged in successfully');

    const lists = await listLists();
    console.log(`Found ${lists.length} lists`);

    if (lists.length > 0) {
      const listDetails = await readList(lists[0].Id);
      console.log(`List "${listDetails.Title}" has ${listDetails.Items?.length || 0} items`);
    }

    return { success: true, listCount: lists.length };
  } catch (error) {
    console.error('Error in modern async example:', error);
    throw error;
  }
}

// Export all examples for use in other modules
module.exports = {
  basicAuthExample,
  ntlmAuthExample,
  onlineAuthExample,
  listOperationsExample,
  listItemsExample,
  advancedQueryExample,
  getAllItemsExample,
  fileOperationsExample,
  errorHandlingExample,
  modernAsyncExample,
  promisifySharePointMethod
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running SharePoint Connector Examples...');
  
  // Uncomment and modify the examples you want to run
  // basicAuthExample().catch(console.error);
  // listOperationsExample().catch(console.error);
  // modernAsyncExample().catch(console.error);
}