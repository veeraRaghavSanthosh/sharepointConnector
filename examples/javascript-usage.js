/**
 * SharePoint Connector - JavaScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * with modern JavaScript, including async/await and Promise-based patterns.
 */

const sharepointconnector = require('sharepointconnector');

// Configuration examples for different authentication methods
const authConfigs = {
  // NTLM Authentication (most common for on-premises)
  ntlm: {
    username: 'domain\\username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'ntlm',
    context: 'sites/yoursite', // Optional: target specific site
    strictSSL: false, // For self-signed certificates
    verbose: true // Enable detailed logging
  },

  // Basic Authentication
  basic: {
    username: 'your-username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'basic'
  },

  // SharePoint Online (Office 365)
  online: {
    username: 'user@yourdomain.onmicrosoft.com',
    password: 'your-app-password', // Use app password for MFA-enabled accounts
    url: 'https://yourdomain.sharepoint.com',
    type: 'online'
  },

  // SAML Federation
  saml: {
    username: 'your-username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'onlinesaml',
    federatedAuthUrl: 'https://your-adfs-server.com/adfs/ls'
  }
};

// Utility function to convert callback-based API to Promise
function promisify(fn, context) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn.call(context, ...args, (err, result, nextUrl) => {
        if (err) {
          reject(err);
        } else {
          // Handle cases where there might be a nextUrl parameter
          resolve(nextUrl ? { result, nextUrl } : result);
        }
      });
    });
  };
}

// Basic usage example with traditional callbacks
function basicCallbackExample() {
  console.log('📋 Basic Callback Example');
  console.log('========================\n');

  const sharepoint = sharepointconnector(authConfigs.ntlm);

  sharepoint.login((err) => {
    if (err) {
      console.error('❌ Login failed:', err.message);
      return;
    }
    
    console.log('✅ Successfully logged in!');

    // List all SharePoint lists
    sharepoint.lists.list((err, lists, nextUrl) => {
      if (err) {
        console.error('❌ Failed to fetch lists:', err.message);
        return;
      }

      console.log(`📋 Found ${lists.length} lists:`);
      lists.forEach((list, index) => {
        console.log(`  ${index + 1}. ${list.Title} (${list.ItemCount} items)`);
      });

      if (nextUrl) {
        console.log(`📄 More results available at: ${nextUrl}`);
      }

      // Read the first list's details
      if (lists.length > 0) {
        const firstList = lists[0];
        console.log(`\n📖 Reading list: "${firstList.Title}"`);
        
        sharepoint.lists.read(firstList.Id, (err, listData) => {
          if (err) {
            console.error('❌ Failed to read list:', err.message);
            return;
          }

          console.log(`✅ List contains ${listData.Items.length} items and ${listData.Fields.length} fields`);
          
          // Show first few items
          if (listData.Items.length > 0) {
            console.log('\nFirst 3 items:');
            listData.Items.slice(0, 3).forEach((item, index) => {
              console.log(`  ${index + 1}. ${item.Title || 'No title'} (ID: ${item.Id})`);
            });
          }
        });
      }
    });
  });
}

// Modern async/await example
async function modernAsyncExample() {
  console.log('\n🚀 Modern Async/Await Example');
  console.log('=============================\n');

  try {
    const sharepoint = sharepointconnector(authConfigs.ntlm);

    // Convert callback methods to promises
    const login = promisify(sharepoint.login, sharepoint);
    const listLists = promisify(sharepoint.lists.list, sharepoint.lists);
    const readList = promisify(sharepoint.lists.read, sharepoint.lists);
    const createList = promisify(sharepoint.lists.create, sharepoint.lists);

    // Login
    console.log('🔐 Authenticating...');
    await login();
    console.log('✅ Authentication successful!');

    // Get all lists
    console.log('\n📋 Fetching SharePoint lists...');
    const listsResponse = await listLists();
    const lists = listsResponse.result || listsResponse;
    
    console.log(`Found ${lists.length} lists:`);
    lists.forEach((list, index) => {
      console.log(`  ${index + 1}. ${list.Title}`);
      console.log(`     Description: ${list.Description || 'No description'}`);
      console.log(`     Items: ${list.ItemCount}, Created: ${new Date(list.Created).toLocaleDateString()}`);
      console.log('');
    });

    // Read detailed information from the first list
    if (lists.length > 0) {
      const targetList = lists[0];
      console.log(`📖 Reading detailed data from "${targetList.Title}"...`);
      
      const listData = await readList(targetList.Id);
      console.log(`✅ Retrieved ${listData.Items.length} items and ${listData.Fields.length} fields`);

      // Display field information
      console.log('\nAvailable fields:');
      listData.Fields.slice(0, 5).forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.Title} (${field.TypeAsString})`);
      });

      // Display recent items
      if (listData.Items.length > 0) {
        console.log('\nRecent items:');
        listData.Items
          .sort((a, b) => new Date(b.Modified) - new Date(a.Modified))
          .slice(0, 3)
          .forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.Title || `Item ${item.Id}`}`);
            console.log(`     Modified: ${new Date(item.Modified).toLocaleDateString()}`);
            console.log(`     Created by: ${item.Author ? item.Author.Title : 'Unknown'}`);
          });
      }
    }

    // Create a new list
    console.log('\n➕ Creating a new sample list...');
    const newList = await createList({
      title: 'JavaScript Sample List',
      description: 'A list created using the JavaScript example with modern async/await syntax'
    });
    console.log(`✅ Successfully created list: "${newList.Title}" with ID: ${newList.Id}`);

  } catch (error) {
    console.error('❌ Error in async example:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Advanced configuration example with filtering and field selection
async function advancedConfigurationExample() {
  console.log('\n🔧 Advanced Configuration Example');
  console.log('=================================\n');

  // Advanced configuration with filtering and field selection
  const advancedConfig = {
    username: 'your-username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'ntlm',
    
    // Advanced options
    fieldValuesAsText: true, // Return lookup values as text instead of IDs
    filterFields: [
      { field: 'Status', value: 'Active' },
      { field: 'Priority', value: 'High' }
    ],
    selectFields: ['Title', 'Status', 'Priority', 'Created', 'Modified'], // Only return these fields
    expandFields: ['Author', 'Editor'], // Include related entity data
    orOperator: false, // Use AND logic for multiple filters (default)
    andOrOperator: false, // Advanced operator logic
    $top: '100', // Limit results to 100 items
    verbose: true // Enable verbose logging
  };

  try {
    const sharepoint = sharepointconnector(advancedConfig);
    
    const login = promisify(sharepoint.login, sharepoint);
    const listLists = promisify(sharepoint.lists.list, sharepoint.lists);

    await login();
    console.log('✅ Authenticated with advanced configuration');

    const listsResponse = await listLists();
    const lists = listsResponse.result || listsResponse;
    
    console.log(`📋 Retrieved ${lists.length} lists with filtering applied`);
    console.log('Configuration used:');
    console.log(`  - Field values as text: ${advancedConfig.fieldValuesAsText}`);
    console.log(`  - Filters: ${JSON.stringify(advancedConfig.filterFields)}`);
    console.log(`  - Selected fields: ${advancedConfig.selectFields.join(', ')}`);
    console.log(`  - Expanded fields: ${advancedConfig.expandFields.join(', ')}`);
    console.log(`  - Result limit: ${advancedConfig.$top}`);

  } catch (error) {
    console.error('❌ Advanced configuration error:', error.message);
  }
}

// Error handling and retry logic example
async function errorHandlingExample() {
  console.log('\n🛡️  Error Handling Example');
  console.log('=========================\n');

  const maxRetries = 3;
  let retryCount = 0;

  const attemptConnection = async () => {
    try {
      const sharepoint = sharepointconnector({
        username: 'test-user',
        password: 'wrong-password', // Intentionally wrong for demo
        url: 'https://invalid-sharepoint-server.com',
        type: 'ntlm'
      });

      const login = promisify(sharepoint.login, sharepoint);
      await login();
      
      console.log('✅ Connection successful');
      return true;

    } catch (error) {
      retryCount++;
      console.error(`❌ Attempt ${retryCount} failed:`, error.message);

      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return attemptConnection();
      } else {
        console.error('💥 Max retries exceeded. Connection failed permanently.');
        
        // Provide helpful error messages based on error type
        if (error.message.includes('ENOTFOUND')) {
          console.log('💡 Tip: Check if the SharePoint URL is correct and accessible');
        } else if (error.message.includes('401')) {
          console.log('💡 Tip: Verify your username and password are correct');
        } else if (error.message.includes('NTLM')) {
          console.log('💡 Tip: Ensure NTLM authentication is properly configured');
        }
        
        return false;
      }
    }
  };

  const success = await attemptConnection();
  console.log(`Final result: ${success ? 'Success' : 'Failed'}`);
}

// Export functions for use as a module
module.exports = {
  authConfigs,
  promisify,
  basicCallbackExample,
  modernAsyncExample,
  advancedConfigurationExample,
  errorHandlingExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 SharePoint Connector JavaScript Examples');
  console.log('============================================\n');

  // Run all examples in sequence
  (async () => {
    try {
      // Uncomment the examples you want to run:
      
      // basicCallbackExample();
      
      // await modernAsyncExample();
      
      // await advancedConfigurationExample();
      
      await errorHandlingExample();
      
      console.log('\n✅ All examples completed!');
    } catch (error) {
      console.error('\n💥 Example execution failed:', error.message);
    }
  })();
}