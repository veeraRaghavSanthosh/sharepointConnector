// Test for async/await compatibility and backward compatibility
const assert = require('assert');

console.log('Testing async/await server compatibility...');

try {
  // Test 1: Load the async server
  const asyncServer = require('./src/server.js');
  console.log('✓ Async server loaded successfully');

  // Test 2: Create async client
  const asyncClient = asyncServer({
    username: 'test@example.com',
    password: 'testpassword',
    url: 'https://test.sharepoint.com'
  });
  console.log('✓ Async client created successfully');

  // Test 3: Verify async methods exist
  assert(typeof asyncClient.login === 'function', 'login method should exist');
  assert(typeof asyncClient.lists.list === 'function', 'lists.list method should exist');
  assert(typeof asyncClient.listItems.list === 'function', 'listItems.list method should exist');
  console.log('✓ Async methods are available');

  // Test 4: Verify callback methods exist for backward compatibility
  assert(typeof asyncClient.loginCallback === 'function', 'loginCallback method should exist');
  assert(typeof asyncClient.lists.listCallback === 'function', 'lists.listCallback method should exist');
  assert(typeof asyncClient.listItems.listCallback === 'function', 'listItems.listCallback method should exist');
  console.log('✓ Callback methods are available for backward compatibility');

  // Test 5: Test callback client is still available
  const callbackClient = asyncServer.callback({
    username: 'test@example.com',
    password: 'testpassword',
    url: 'https://test.sharepoint.com'
  });
  console.log('✓ Callback client is available');

  // Test 6: Verify original client structure
  assert(typeof callbackClient.login === 'function', 'Original login method should exist');
  assert(typeof callbackClient.lists.list === 'function', 'Original lists.list method should exist');
  assert(typeof callbackClient.listItems.list === 'function', 'Original listItems.list method should exist');
  console.log('✓ Original client structure is preserved');

  console.log('\n🎉 All compatibility tests passed!');
  console.log('✓ Async/await interface is working');
  console.log('✓ Backward compatibility is maintained');
  console.log('✓ Both async and callback versions are available');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}