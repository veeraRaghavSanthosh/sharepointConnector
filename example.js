const SharePointConnector = require('sharepointconnector');

// Configuration object
const config = {
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.sharepoint.com'
};

// Initialize SharePoint connector
const sharepoint = SharePointConnector(config);

// Basic example
function basicExample() {
  console.log('Starting SharePoint example...');
  
  sharepoint.login(function(err) {
    if (err) {
      console.error('Login failed:', err);
      return;
    }
    
    console.log('Successfully logged in to SharePoint');

    // List all SharePoint lists
    sharepoint.lists.list(function(err, listRes) {
      if (err) {
        console.error('Failed to get lists:', err);
        return;
      }
      
      console.log(`Found ${listRes.length} lists:`);
      listRes.forEach(function(list) {
        console.log(`- ${list.Title} (ID: ${list.Id})`);
      });

      // Create a new list
      sharepoint.lists.create({
        title: 'Sample List',
        description: 'A sample list created from JavaScript'
      }, function(err, createRes) {
        if (err) {
          console.error('Failed to create list:', err);
          return;
        }
        
        console.log(`Created new list: ${createRes.Title}`);
        
        // Create a list item
        sharepoint.listItems.create(createRes.Id, {
          Title: 'Sample Item',
          Description: 'This is a sample item'
        }, function(err, itemRes) {
          if (err) {
            console.error('Failed to create item:', err);
            return;
          }
          
          console.log(`Created new item: ${itemRes.Title}`);

          // Clean up
          sharepoint.lists.del(createRes.Id, function(err) {
            if (err) {
              console.error('Failed to delete list:', err);
              return;
            }
            console.log('Example completed successfully!');
          });
        });
      });
    });
  });
}

// Promise wrapper for modern JavaScript
function promisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

async function promiseExample() {
  const sp = {
    login: promisify(sharepoint.login.bind(sharepoint)),
    lists: {
      list: promisify(sharepoint.lists.list.bind(sharepoint.lists)),
      create: promisify(sharepoint.lists.create.bind(sharepoint.lists)),
      del: promisify(sharepoint.lists.del.bind(sharepoint.lists))
    },
    listItems: {
      create: promisify(sharepoint.listItems.create.bind(sharepoint.listItems))
    }
  };
  
  try {
    await sp.login();
    console.log('Logged in successfully');
    
    const lists = await sp.lists.list();
    console.log(`Found ${lists.length} lists`);
    
    const newList = await sp.lists.create({
      title: 'Promise Sample List',
      description: 'Created with promises'
    });
    console.log(`Created list: ${newList.Title}`);
    
    await sp.lists.del(newList.Id);
    console.log('Promise example completed');
    
  } catch (error) {
    console.error('Promise example error:', error);
  }
}

module.exports = { basicExample, promiseExample };

if (require.main === module) {
  basicExample();
}