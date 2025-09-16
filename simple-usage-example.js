/**
 * SharePoint Connector - Simple Usage Example
 * 
 * Basic usage examples that can be copied and used immediately.
 * Install the library first: npm install sharepointconnector
 */

// Import the SharePoint connector
const sharepointconnector = require('sharepointconnector');

// Basic connection example
function connectToSharePoint() {
  const sharepoint = sharepointconnector({
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online' // or 'ntlm', 'basic', 'onlinesaml'
  });

  sharepoint.login((err) => {
    if (err) {
      return console.error('Login failed:', err.message);
    }
    
    console.log('Successfully connected to SharePoint!');
    
    // List all SharePoint lists
    sharepoint.lists.list((err, lists) => {
      if (err) {
        return console.error('Error fetching lists:', err.message);
      }
      
      console.log(`Found ${lists.length} lists:`);
      lists.forEach((list, index) => {
        console.log(`${index + 1}. ${list.Title} (ID: ${list.Id})`);
      });
    });
  });
}

// Working with list items
function workWithListItems() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'your-username',
    password: process.env.SP_PASSWORD || 'your-password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  });

  sharepoint.login((err) => {
    if (err) return console.error(err);

    // Get first available list
    sharepoint.lists.list((err, lists) => {
      if (err || !lists.length) return console.error('No lists found');

      const listId = lists[0].Id;
      
      // Create a new item
      const newItem = {
        Title: 'New Item from API',
        // Add other fields based on your list schema
      };
      
      sharepoint.listItems.create(listId, newItem, (err, createdItem) => {
        if (err) {
          return console.error('Error creating item:', err.message);
        }
        
        console.log(`Created item: ${createdItem.Title} (ID: ${createdItem.Id})`);
        
        // Read the created item
        sharepoint.listItems.read(listId, createdItem.Id, (err, item) => {
          if (err) return console.error(err);
          
          console.log('Item details:', item);
        });
      });
    });
  });
}

// File download example
function downloadFile() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME,
    password: process.env.SP_PASSWORD,
    url: process.env.SP_URL,
    type: 'online'
  });

  sharepoint.login((err) => {
    if (err) return console.error(err);

    const filePath = '/Shared Documents/example.pdf';
    
    sharepoint.listItems.byteStreamByFilePath(filePath, (err, serviceReqObj) => {
      if (err) {
        return console.error('Error getting file:', err.message);
      }
      
      // Use with request library to download
      const request = require('request');
      const fs = require('fs');
      
      request.get(serviceReqObj).on('response', (response) => {
        response.pipe(fs.createWriteStream('downloaded-file.pdf'));
        console.log('File download started...');
      });
    });
  });
}

// Export functions
module.exports = {
  connectToSharePoint,
  workWithListItems,
  downloadFile
};

// Run example if file is executed directly
if (require.main === module) {
  console.log('SharePoint Connector Simple Examples');
  console.log('Set environment variables SP_USERNAME, SP_PASSWORD, SP_URL');
  console.log('Then uncomment the function you want to test:');
  console.log('');
  
  // Uncomment to run:
  // connectToSharePoint();
  // workWithListItems();
  // downloadFile();
}