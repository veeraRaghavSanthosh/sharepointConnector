// Example showing how to use the new async/await interface
const asyncSharePoint = require('./src/server.js');

// Example 1: Using async/await (new interface)
async function exampleAsyncUsage() {
  console.log('=== Async/Await Usage Example ===');
  
  const client = asyncSharePoint({
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online', // or 'basic', 'ntlm', etc.
    strictSSL: false
  });

  try {
    // Login using async/await
    console.log('Logging in...');
    await client.login();
    console.log('✓ Logged in successfully');

    // Get all lists using async/await
    console.log('Fetching lists...');
    const lists = await client.lists.list();
    console.log('✓ Found', lists.length, 'lists');

    // Get items from the first list using async/await
    if (lists.length > 0) {
      const listId = lists[0].Id;
      console.log('Fetching items from list:', lists[0].Title);
      const items = await client.listItems.list(listId);
      console.log('✓ Found', items.length, 'items');
    }

    // Create a new list using async/await
    console.log('Creating new list...');
    const newList = await client.lists.create({
      title: 'My Async Test List',
      description: 'Created using async/await interface'
    });
    console.log('✓ Created list:', newList.Title);

    // Create an item in the new list using async/await
    console.log('Creating new item...');
    const newItem = await client.listItems.create(newList.Id, {
      Title: 'My First Async Item'
    });
    console.log('✓ Created item:', newItem.Title);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 2: Using callbacks (backward compatibility)
function exampleCallbackUsage() {
  console.log('\n=== Callback Usage Example (Backward Compatibility) ===');
  
  const client = asyncSharePoint.callback({
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online',
    strictSSL: false
  });

  // Login using callbacks (original interface)
  client.login(function(err) {
    if (err) {
      console.error('❌ Login failed:', err);
      return;
    }
    console.log('✓ Logged in successfully (callback)');

    // Get all lists using callbacks
    client.lists.list(function(err, lists) {
      if (err) {
        console.error('❌ Failed to get lists:', err);
        return;
      }
      console.log('✓ Found', lists.length, 'lists (callback)');

      if (lists.length > 0) {
        const listId = lists[0].Id;
        // Get items using callbacks
        client.listItems.list(listId, function(err, items) {
          if (err) {
            console.error('❌ Failed to get items:', err);
            return;
          }
          console.log('✓ Found', items.length, 'items (callback)');
        });
      }
    });
  });
}

// Example 3: Using the hybrid approach (both async and callback methods available)
async function exampleHybridUsage() {
  console.log('\n=== Hybrid Usage Example ===');
  
  const client = asyncSharePoint({
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online',
    strictSSL: false
  });

  try {
    // Use async for login
    await client.login();
    console.log('✓ Logged in with async');

    // Use callback for lists (both methods available on the same client)
    client.lists.listCallback(function(err, lists) {
      if (err) {
        console.error('❌ Failed to get lists:', err);
        return;
      }
      console.log('✓ Got lists with callback:', lists.length);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run examples (commented out to prevent actual execution)
// Note: Uncomment and provide real credentials to test
/*
console.log('SharePoint Async/Await Connector Examples');
console.log('==========================================\n');

exampleAsyncUsage().then(() => {
  console.log('\n✓ Async example completed');
  exampleCallbackUsage();
  setTimeout(() => {
    exampleHybridUsage().then(() => {
      console.log('\n✓ All examples completed');
    });
  }, 2000);
});
*/

console.log('SharePoint Async/Await Connector Examples');
console.log('==========================================');
console.log('Examples are ready but commented out to prevent execution.');
console.log('Uncomment the code at the bottom and provide real credentials to test.');
console.log('\nFeatures:');
console.log('✓ Full async/await support');
console.log('✓ Complete backward compatibility');
console.log('✓ Hybrid usage (both async and callback methods available)');
console.log('✓ All original SharePoint connector functionality preserved');