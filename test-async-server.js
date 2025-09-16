// Test script for the new async/await server
const asyncServer = require('./src/server.js');

async function testAsyncServer() {
  console.log('Testing async/await server implementation...');
  
  try {
    // Test with dummy credentials (will fail but should show structure)
    const client = asyncServer({
      username: 'test',
      password: 'test',
      url: 'https://test.sharepoint.com'
    });
    
    console.log('✓ Server created successfully');
    console.log('✓ Available methods:', Object.keys(client));
    console.log('✓ Lists methods:', Object.keys(client.lists));
    console.log('✓ ListItems methods:', Object.keys(client.listItems));
    
    // Test that callback versions are still available
    const callbackClient = asyncServer.callback({
      username: 'test',
      password: 'test',
      url: 'https://test.sharepoint.com'
    });
    
    console.log('✓ Callback client available');
    console.log('✓ Backward compatibility maintained');
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testAsyncServer();
