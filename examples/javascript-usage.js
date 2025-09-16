/**
 * SharePoint Connector - JavaScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * to interact with SharePoint lists and list items using JavaScript.
 */

const sharepoint = require('sharepointconnector');

// Configuration object with all available options
const config = {
  // Required parameters
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.com',
  
  // Authentication type - supported: 'ntlm', 'basic', 'online', 'onlinesaml'
  type: 'online', // Use 'online' for SharePoint 365/Online
  
  // Optional parameters
  context: 'web', // Site context, default is 'web'
  verbose: false, // Set to true for detailed responses
  strictSSL: true, // Set to false for self-signed certificates
  proxy: undefined, // Proxy hostname if needed
  
  // Query parameters for filtering and selecting data
  fieldValuesAsText: true, // Return lookup field values as text
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Category', value: 'Important' }
  ], // Filter items based on field values
  selectFields: ['Title', 'Status', 'Created', 'Modified'], // Only return specified fields
  expandFields: ['Author', 'Editor'], // Expand lookup fields
  orOperator: false, // Set to true for OR operations in filters
  andOrOperator: false, // Set to true for mixed AND/OR operations
  $top: '1000', // Maximum number of items to return (default: 5000)
  
  // For SharePoint Online with federated authentication
  federatedAuthUrl: 'https://your-saml-service.com', // Only for 'onlinesaml' auth
  
  // Optional pre-existing tokens (for advanced scenarios)
  rtFa: null, // rtFa token value
  FedAuth: null // FedAuth token value
};

// Initialize SharePoint client
const sp = sharepoint(config);

async function demonstrateBasicUsage() {
  try {
    console.log('🔐 Authenticating with SharePoint...');
    
    // Login to SharePoint
    await new Promise((resolve, reject) => {
      sp.login((err) => {
        if (err) {
          console.error('❌ Authentication failed:', err);
          reject(err);
        } else {
          console.log('✅ Successfully authenticated');
          resolve();
        }
      });
    });

    // Example 1: List all SharePoint lists
    console.log('\n📋 Fetching all lists...');
    const lists = await new Promise((resolve, reject) => {
      sp.lists.list((err, listRes, nextUrl) => {
        if (err) reject(err);
        else resolve({ lists: listRes, nextUrl });
      });
    });
    
    console.log(`Found ${lists.lists.length} lists`);
    lists.lists.forEach((list, index) => {
      console.log(`  ${index + 1}. ${list.Title} (ID: ${list.Id})`);
    });

    // Example 2: Read a specific list with items and fields
    if (lists.lists.length > 0) {
      const firstList = lists.lists[0];
      console.log(`\n📖 Reading list: ${firstList.Title}`);
      
      const listDetails = await new Promise((resolve, reject) => {
        sp.lists.read(firstList.Id, (err, listRead) => {
          if (err) reject(err);
          else resolve(listRead);
        });
      });
      
      console.log(`  Items count: ${listDetails.Items ? listDetails.Items.length : 0}`);
      console.log(`  Fields count: ${listDetails.Fields ? listDetails.Fields.length : 0}`);
    }

    // Example 3: Create a new list
    console.log('\n➕ Creating a new list...');
    const newList = await new Promise((resolve, reject) => {
      sp.lists.create({
        title: 'Demo List - ' + new Date().toISOString().split('T')[0],
        description: 'A demo list created by sharepointconnector'
      }, (err, createResult) => {
        if (err) reject(err);
        else resolve(createResult);
      });
    });
    
    console.log(`✅ Created list: ${newList.Title} (ID: ${newList.Id})`);

    // Example 4: Work with list items
    console.log('\n📝 Working with list items...');
    
    // Create a new list item
    const newItem = await new Promise((resolve, reject) => {
      sp.listItems.create(newList.Title, {
        Title: 'Sample Item',
        Description: 'This is a sample item created via API'
      }, (err, createResult) => {
        if (err) reject(err);
        else resolve(createResult);
      });
    });
    
    console.log(`✅ Created item: ${newItem.Title} (ID: ${newItem.Id})`);

    // List items in the new list
    const items = await new Promise((resolve, reject) => {
      sp.listItems.list(newList.Id, (err, itemsResult, nextUrl) => {
        if (err) reject(err);
        else resolve({ items: itemsResult, nextUrl });
      });
    });
    
    console.log(`📋 Found ${items.items.length} items in the list`);

    // Read a specific item
    if (items.items.length > 0) {
      const itemDetails = await new Promise((resolve, reject) => {
        sp.listItems.read(newList.Title, items.items[0].Id, (err, itemRead) => {
          if (err) reject(err);
          else resolve(itemRead);
        });
      });
      
      console.log(`📖 Item details: ${itemDetails.Title}`);
    }

    // Example 5: Update a list item
    if (items.items.length > 0) {
      console.log('\n✏️ Updating list item...');
      const updateResult = await new Promise((resolve, reject) => {
        sp.listItems.update(newList.Title, {
          itemId: items.items[0].Id,
          Title: 'Updated Sample Item',
          Description: 'This item has been updated'
        }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      console.log('✅ Item updated successfully');
    }

    // Example 6: Clean up - Delete the demo list
    console.log('\n🗑️ Cleaning up - deleting demo list...');
    await new Promise((resolve, reject) => {
      sp.lists.del(newList.Id, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Demo list deleted successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function demonstrateAdvancedFeatures() {
  try {
    console.log('\n🚀 Demonstrating advanced features...');
    
    // Login first
    await new Promise((resolve, reject) => {
      sp.login((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Example 1: Using filtering and pagination
    console.log('\n🔍 Demonstrating filtering and pagination...');
    
    // Create a client with specific filters
    const filteredSp = sharepoint({
      ...config,
      filterFields: [{ field: 'ContentType', value: 'Item' }],
      selectFields: ['Title', 'Created', 'Modified'],
      $top: '10' // Limit to 10 items
    });
    
    await new Promise((resolve, reject) => {
      filteredSp.login((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get lists with the first available list
    const lists = await new Promise((resolve, reject) => {
      filteredSp.lists.list((err, listRes) => {
        if (err) reject(err);
        else resolve(listRes);
      });
    });

    if (lists.length > 0) {
      // List items with pagination support
      const paginatedItems = await new Promise((resolve, reject) => {
        filteredSp.listItems.list(lists[0].Id, (err, items, nextUrl) => {
          if (err) reject(err);
          else resolve({ items, nextUrl });
        });
      });
      
      console.log(`📄 Retrieved ${paginatedItems.items.length} filtered items`);
      if (paginatedItems.nextUrl) {
        console.log('📄 More items available via pagination');
      }

      // Example 2: Get all items (handles pagination internally)
      console.log('\n📚 Getting all items from list...');
      const allItems = await new Promise((resolve, reject) => {
        filteredSp.listItems.listAll(lists[0].Title, (err, items) => {
          if (err) reject(err);
          else resolve(items);
        });
      });
      
      console.log(`📚 Retrieved all ${allItems.length} items from the list`);
    }

    // Example 3: Get current user information
    console.log('\n👤 Getting current user information...');
    const currentUser = await new Promise((resolve, reject) => {
      sp.listItems.currentuser('Title eq \'Current User\'', (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    console.log(`👤 Current user: ${currentUser.Title || 'User info retrieved'}`);

    // Example 4: File operations (if applicable)
    console.log('\n📁 File operations example...');
    
    // Note: These examples assume you have document libraries with files
    // Uncomment and modify as needed for your SharePoint environment
    
    /*
    // Get binary stream for a file
    const fileStream = await new Promise((resolve, reject) => {
      sp.listItems.byteStream('Documents', 'sample.pdf', (err, streamObj) => {
        if (err) reject(err);
        else resolve(streamObj);
      });
    });
    
    // Get file by server relative path
    const fileByPath = await new Promise((resolve, reject) => {
      sp.listItems.byteStreamByFilePath('/sites/yoursite/Documents/sample.pdf', (err, streamObj) => {
        if (err) reject(err);
        else resolve(streamObj);
      });
    });
    
    // Move a file
    const moveResult = await new Promise((resolve, reject) => {
      sp.listItems.moveTo(
        '/sites/yoursite/Documents/oldfile.pdf',
        '/sites/yoursite/Archive/newfile.pdf',
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    */

  } catch (error) {
    console.error('❌ Advanced features error:', error);
  }
}

// Error handling wrapper
function handleErrors(fn) {
  return async function(...args) {
    try {
      await fn.apply(this, args);
    } catch (error) {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    }
  };
}

// Export functions for use in other modules
module.exports = {
  demonstrateBasicUsage: handleErrors(demonstrateBasicUsage),
  demonstrateAdvancedFeatures: handleErrors(demonstrateAdvancedFeatures),
  sharepoint,
  config
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 SharePoint Connector JavaScript Usage Examples');
  console.log('================================================\n');
  
  // Run basic usage examples
  handleErrors(demonstrateBasicUsage)()
    .then(() => {
      // Run advanced features examples
      return handleErrors(demonstrateAdvancedFeatures)();
    })
    .then(() => {
      console.log('\n✅ All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Examples failed:', error);
      process.exit(1);
    });
}