/**
 * SharePoint Connector - JavaScript Usage Examples
 * 
 * This file demonstrates comprehensive usage of the sharepointconnector library
 * with various authentication methods, list operations, and advanced features.
 */

const sharepoint = require('sharepointconnector');

// ============================================================================
// BASIC CONFIGURATION & AUTHENTICATION
// ============================================================================

// Example 1: Basic Authentication (On-premise SharePoint)
const spBasic = sharepoint({
  username: 'domain\\username',
  password: 'your-password',
  type: 'basic',
  url: 'https://your-sharepoint-site.com',
  context: 'sites/your-site', // Optional: specify site context
  strictSSL: false // Set to false for self-signed certificates
});

// Example 2: NTLM Authentication (Most common for on-premise)
const spNTLM = sharepoint({
  username: 'domain\\username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com',
  domain: 'your-domain',
  workstation: 'your-workstation' // Optional
});

// Example 3: SharePoint Online (Office 365)
const spOnline = sharepoint({
  username: 'user@yourdomain.onmicrosoft.com',
  password: 'your-password',
  type: 'online',
  url: 'https://yourdomain.sharepoint.com'
});

// Example 4: SharePoint Online with SAML SSO
const spSAML = sharepoint({
  username: 'user@yourdomain.com',
  password: 'your-password',
  type: 'onlinesaml',
  url: 'https://yourdomain.sharepoint.com',
  federatedAuthUrl: 'https://your-saml-provider.com/adfs/ls'
});

// Example 5: Advanced Configuration with all options
const spAdvanced = sharepoint({
  username: 'user@domain.com',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com',
  
  // Site context (optional)
  context: 'sites/your-site',
  
  // Response options
  verbose: false, // Set true to get unfiltered responses
  fieldValuesAsText: true, // Return lookup fields as text
  
  // Query options
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Category', value: 'Important' }
  ],
  selectFields: ['Title', 'Description', 'Created', 'Author'],
  expandFields: ['Author', 'Category'],
  orOperator: false, // Set true for OR operations in filters
  andOrOperator: false, // Set true for mixed AND/OR operations
  $top: '1000', // Limit number of results (default: 5000)
  
  // Network options
  proxy: 'http://proxy-server:8080', // Optional proxy
  strictSSL: true, // SSL certificate validation
  
  // Pre-authenticated tokens (optional)
  FedAuth: 'your-fedauth-token',
  rtFa: 'your-rtfa-token'
});

// ============================================================================
// AUTHENTICATION & LOGIN
// ============================================================================

function authenticateAndStart() {
  spNTLM.login(function(err) {
    if (err) {
      console.error('Authentication failed:', err);
      return;
    }
    
    console.log('Successfully authenticated with SharePoint');
    
    // Now you can perform operations
    performListOperations();
  });
}

// ============================================================================
// LISTS OPERATIONS
// ============================================================================

function performListOperations() {
  
  // Get all lists in the SharePoint site
  spNTLM.lists.list(function(err, lists, nextUrl) {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
    
    // Handle pagination if needed
    if (nextUrl) {
      console.log('More results available at:', nextUrl);
    }
  });
  
  // Create a new list
  spNTLM.lists.create({
    title: 'My New List',
    description: 'A list created via the connector'
  }, function(err, newList) {
    if (err) {
      console.error('Error creating list:', err);
      return;
    }
    
    console.log('Created new list:', newList.Title);
  });
  
  // Read a specific list by ID
  spNTLM.lists.read('list-guid-here', function(err, listDetails) {
    if (err) {
      console.error('Error reading list:', err);
      return;
    }
    
    console.log('List details:', {
      title: listDetails.Title,
      itemCount: listDetails.ItemCount,
      fieldsCount: listDetails.Fields.length,
      itemsCount: listDetails.Items.length
    });
  });
  
  // Read a list by title
  spNTLM.lists.read({ title: 'My List Name' }, function(err, listDetails) {
    if (err) {
      console.error('Error reading list by title:', err);
      return;
    }
    
    console.log('Found list:', listDetails.Title);
    
    // Access fields and items
    console.log('Fields:', listDetails.Fields.map(f => f.Title));
    console.log('Items:', listDetails.Items.length);
  });
  
  // Update a list
  spNTLM.lists.update('list-guid-here', {
    Title: 'Updated List Name',
    Description: 'Updated description'
  }, function(err, updateResult) {
    if (err) {
      console.error('Error updating list:', err);
      return;
    }
    
    console.log('List updated successfully');
  });
  
  // Delete a list
  spNTLM.lists.del('list-guid-here', function(err) {
    if (err) {
      console.error('Error deleting list:', err);
      return;
    }
    
    console.log('List deleted successfully');
  });
}

// ============================================================================
// LIST ITEMS OPERATIONS
// ============================================================================

function performListItemOperations() {
  const listName = 'My List Name';
  
  // Get items from a list (with pagination)
  spNTLM.listItems.list(listName, function(err, items, nextUrl) {
    if (err) {
      console.error('Error fetching list items:', err);
      return;
    }
    
    console.log(`Found ${items.length} items in list`);
    items.forEach(item => {
      console.log(`- ${item.Title} (ID: ${item.Id})`);
    });
    
    if (nextUrl) {
      console.log('Next page available at:', nextUrl);
    }
  });
  
  // Get ALL items from a list (handles pagination automatically)
  spNTLM.listItems.listAll(listName, function(err, allItems) {
    if (err) {
      console.error('Error fetching all list items:', err);
      return;
    }
    
    console.log(`Retrieved all ${allItems.length} items from list`);
  });
  
  // Create a new list item
  spNTLM.listItems.create(listName, {
    Title: 'New Item Title',
    Description: 'Item description',
    Status: 'Active',
    DueDate: new Date().toISOString()
  }, function(err, newItem) {
    if (err) {
      console.error('Error creating list item:', err);
      return;
    }
    
    console.log('Created new item:', newItem.Title);
  });
  
  // Read a specific list item
  spNTLM.listItems.read(listName, 'item-id-here', function(err, item) {
    if (err) {
      console.error('Error reading list item:', err);
      return;
    }
    
    console.log('Item details:', {
      title: item.Title,
      created: item.Created,
      author: item.Author ? item.Author.Title : 'Unknown'
    });
    
    // Check if item has an attached file
    if (item.File) {
      console.log('Item has attached file:', item.File.Name);
    }
  });
  
  // Delete a list item
  spNTLM.listItems.del(listName, 'item-id-here', function(err) {
    if (err) {
      console.error('Error deleting list item:', err);
      return;
    }
    
    console.log('Item deleted successfully');
  });
}

// ============================================================================
// ADVANCED FEATURES
// ============================================================================

function demonstrateAdvancedFeatures() {
  
  // Get current user information
  spNTLM.listItems.currentuser('any-list-name', function(err, userInfo) {
    if (err) {
      console.error('Error getting current user:', err);
      return;
    }
    
    console.log('Current user:', {
      title: userInfo.Title,
      email: userInfo.Email,
      loginName: userInfo.LoginName
    });
  });
  
  // Download file as byte stream
  spNTLM.listItems.byteStream('Documents', 'filename.pdf', function(err, requestOptions) {
    if (err) {
      console.error('Error preparing file download:', err);
      return;
    }
    
    // Use with request library to download file
    const request = require('request');
    const fs = require('fs');
    
    request.get(requestOptions)
      .on('response', function(response) {
        console.log('File download started, size:', response.headers['content-length']);
      })
      .pipe(fs.createWriteStream('./downloaded-file.pdf'))
      .on('close', function() {
        console.log('File downloaded successfully');
      });
  });
  
  // Download file by file path
  spNTLM.listItems.byteStreamByFilePath('/sites/mysite/Documents/file.pdf', function(err, requestOptions) {
    if (err) {
      console.error('Error preparing file download by path:', err);
      return;
    }
    
    const request = require('request');
    request.get(requestOptions)
      .on('response', function(response) {
        // Pipe to HTTP response in web application
        response.pipe(httpResponse);
      });
  });
}

// ============================================================================
// CONVENIENCE METHODS (Using objects returned from operations)
// ============================================================================

function demonstrateConvenienceMethods() {
  
  // Using convenience methods on list objects
  spNTLM.lists.list(function(err, lists) {
    if (err || !lists.length) return;
    
    const firstList = lists[0];
    
    // Call read() directly on the list object
    firstList.read(function(err, listDetails) {
      if (err) return;
      
      console.log('Read list using convenience method:', listDetails.Title);
      
      // Update using convenience method
      firstList.update({ Description: 'Updated via convenience method' }, function(err) {
        if (err) return;
        console.log('List updated via convenience method');
      });
      
      // Create item using convenience method
      listDetails.Items.create({
        Title: 'Item created via convenience method'
      }, function(err, newItem) {
        if (err) return;
        console.log('Item created via convenience method:', newItem.Title);
      });
    });
  });
  
  // Using convenience methods on list item objects
  spNTLM.lists.read('My List', function(err, listDetails) {
    if (err || !listDetails.Items.length) return;
    
    const firstItem = listDetails.Items[0];
    
    // Read item details using convenience method
    firstItem.read(function(err, itemDetails) {
      if (err) return;
      console.log('Item read via convenience method:', itemDetails.Title);
    });
    
    // Delete item using convenience method
    firstItem.delete(function(err) {
      if (err) return;
      console.log('Item deleted via convenience method');
    });
  });
}

// ============================================================================
// ERROR HANDLING PATTERNS
// ============================================================================

function demonstrateErrorHandling() {
  
  // Comprehensive error handling
  spNTLM.login(function(err) {
    if (err) {
      // Handle authentication errors
      if (err.code === 'ENOTFOUND') {
        console.error('SharePoint server not found. Check the URL.');
      } else if (err.statusCode === 401) {
        console.error('Authentication failed. Check username/password.');
      } else if (err.statusCode === 403) {
        console.error('Access forbidden. Check user permissions.');
      } else {
        console.error('Login error:', err.message || err);
      }
      return;
    }
    
    // Perform operations with error handling
    spNTLM.lists.read('NonExistentList', function(err, list) {
      if (err) {
        if (err.statusCode === 404) {
          console.error('List not found');
        } else {
          console.error('Error reading list:', err.message || err);
        }
        return;
      }
      
      console.log('List found:', list.Title);
    });
  });
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Start the examples
console.log('SharePoint Connector - JavaScript Usage Examples');
console.log('================================================');

// Uncomment the functions you want to run:
// authenticateAndStart();
// performListOperations();
// performListItemOperations();
// demonstrateAdvancedFeatures();
// demonstrateConvenienceMethods();
// demonstrateErrorHandling();

module.exports = {
  authenticateAndStart,
  performListOperations,
  performListItemOperations,
  demonstrateAdvancedFeatures,
  demonstrateConvenienceMethods,
  demonstrateErrorHandling
};