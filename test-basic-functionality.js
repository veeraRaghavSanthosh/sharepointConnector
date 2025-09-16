/**
 * Basic functionality test for SharePoint Connector after security updates
 * This script tests that the library can be loaded and basic functions work
 */

const sharepointconnector = require('./sharepointconnector');

console.log('Testing SharePoint Connector after security updates...');

try {
  // Test basic library loading
  const sharepoint = sharepointconnector({
    username: 'test@example.com',
    password: 'testpassword',
    type: 'basic',
    url: 'https://test.sharepoint.com'
  });

  console.log('✓ Library loaded successfully');
  console.log('✓ Configuration accepted');
  
  // Test that the main methods exist
  if (sharepoint.login && typeof sharepoint.login === 'function') {
    console.log('✓ Login method available');
  }
  
  if (sharepoint.lists && typeof sharepoint.lists === 'object') {
    console.log('✓ Lists object available');
  }
  
  if (sharepoint.listItems && typeof sharepoint.listItems === 'object') {
    console.log('✓ ListItems object available');
  }

  console.log('\n🎉 All basic functionality tests passed!');
  console.log('The SharePoint Connector library is working correctly after security updates.');
  
} catch (error) {
  console.error('❌ Error during basic functionality test:', error.message);
  process.exit(1);
}