/**
 * SharePoint Connector - JavaScript Usage Example
 * 
 * This example demonstrates how to use the sharepointconnector library
 * with JavaScript, covering all major features and authentication methods.
 */

const sharepointconnector = require('sharepointconnector');

// Example 1: Basic Connection and Authentication
function basicExample() {
  const sharepoint = sharepointconnector({
    username: 'your-username@company.com',
    password: 'your-password',
    url: 'https://your-company.sharepoint.com',
    type: 'online', // or 'ntlm', 'basic', 'onlinesaml'
    verbose: false,
    strictSSL: true
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) {
        console.error('Login failed:', err.message);
        return reject(err);
      }
      
      console.log('Successfully connected to SharePoint!');
      resolve();
    });
  });
}

// Example 2: NTLM Authentication (On-premises SharePoint)
function ntlmExample() {
  const sharepoint = sharepointconnector({
    username: 'domain\\username',
    password: 'your-password',
    url: 'https://your-sharepoint-server.com',
    type: 'ntlm',
    domain: 'your-domain',
    workstation: 'your-workstation', // optional
    strictSSL: false // often needed for on-premises with self-signed certs
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) {
        console.error('NTLM Login failed:', err.message);
        return reject(err);
      }
      
      console.log('Successfully connected to SharePoint via NTLM!');
      resolve();
    });
  });
}

// Example 3: Working with Lists
function listsExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) return reject(err);

      // List all SharePoint lists
      sharepoint.lists.list((err, lists, nextUrl) => {
        if (err) {
          console.error('Error fetching lists:', err.message);
          return reject(err);
        }

        if (!lists || lists.length === 0) {
          console.log('No lists found');
          return resolve();
        }

        console.log(`Found ${lists.length} lists:`);
        lists.forEach((list, index) => {
          console.log(`${index + 1}. ${list.Title} (ID: ${list.Id})`);
        });

        // Show pagination info if available
        if (nextUrl) {
          console.log('More lists available (pagination)');
        }

        // Read details of the first list
        const firstList = lists[0];
        sharepoint.lists.read(firstList.Id, (err, listDetails) => {
          if (err) {
            console.error('Error reading list details:', err.message);
            return reject(err);
          }

          console.log(`\nList Details for "${listDetails.Title}":`);
          console.log(`- Items count: ${listDetails.Items ? listDetails.Items.length : 0}`);
          console.log(`- Fields count: ${listDetails.Fields ? listDetails.Fields.length : 0}`);
          
          if (listDetails.Fields && listDetails.Fields.length > 0) {
            console.log('- Field names:', listDetails.Fields.map(f => f.Title).join(', '));
          }

          resolve();
        });
      });
    });
  });
}

// Example 4: Advanced List Operations with Filtering
function advancedListExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online',
    // Advanced filtering options
    fieldValuesAsText: true,
    filterFields: [
      { field: 'Status', value: 'Active' },
      { field: 'Category', value: 'Important' }
    ],
    selectFields: ['Title', 'Status', 'Created', 'Author'],
    expandFields: ['Author'],
    orOperator: false, // use AND logic
    $top: '100' // limit results
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) return reject(err);

      // Create a new list
      sharepoint.lists.create(
        { 
          title: 'JavaScript Test List', 
          description: 'A test list created from JavaScript example' 
        },
        (err, newList) => {
          if (err) {
            console.error('Error creating list:', err.message);
            // Don't reject here, as list might already exist
          } else if (newList) {
            console.log(`Created new list: ${newList.Title} (ID: ${newList.Id})`);
          }

          // Read a list by title instead of ID
          sharepoint.lists.read({ title: 'Documents' }, (err, documentsList) => {
            if (err) {
              console.error('Error reading Documents list:', err.message);
              return reject(err);
            }

            if (documentsList) {
              console.log(`Found Documents list with ${documentsList.Items ? documentsList.Items.length : 0} items`);
            }

            resolve();
          });
        }
      );
    });
  });
}

// Example 5: Working with List Items
function listItemsExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) return reject(err);

      // First, get a list to work with
      sharepoint.lists.list((err, lists) => {
        if (err || !lists || lists.length === 0) {
          return reject(new Error('No lists available'));
        }

        const targetList = lists[0];
        console.log(`Working with list: ${targetList.Title}`);

        // Get items with pagination
        sharepoint.listItems.list(targetList.Id, (err, items, nextUrl) => {
          if (err) {
            console.error('Error fetching list items (paginated):', err.message);
            return reject(err);
          }

          console.log(`Found ${items ? items.length : 0} items (first page)`);
          if (nextUrl) {
            console.log('More items available via pagination');
          }

          // Get ALL items (handles pagination internally)
          sharepoint.listItems.listAll(targetList.Id, (err, allItems) => {
            if (err) {
              console.error('Error fetching all list items:', err.message);
              return reject(err);
            }

            console.log(`Total items in list: ${allItems ? allItems.length : 0}`);

            if (allItems && allItems.length > 0) {
              // Display first few items
              allItems.slice(0, 3).forEach((item, index) => {
                console.log(`Item ${index + 1}: ${item.Title || 'No Title'} (ID: ${item.Id})`);
              });

              // Create a new item
              const newItemData = {
                Title: `New Item Created at ${new Date().toISOString()}`,
                // Add other fields as needed based on your list schema
                // For example:
                // Description: 'This is a test item created via API',
                // Status: 'Active'
              };

              sharepoint.listItems.create(targetList.Id, newItemData, (err, newItem) => {
                if (err) {
                  console.error('Error creating new item:', err.message);
                  return reject(err);
                }

                if (newItem) {
                  console.log(`Created new item: ${newItem.Title} (ID: ${newItem.Id})`);

                  // Read the newly created item
                  sharepoint.listItems.read(targetList.Id, newItem.Id, (err, itemDetails) => {
                    if (err) {
                      console.error('Error reading item details:', err.message);
                    } else if (itemDetails) {
                      console.log('Item details:', JSON.stringify(itemDetails, null, 2));
                    }

                    resolve();
                  });
                } else {
                  resolve();
                }
              });
            } else {
              resolve();
            }
          });
        });
      });
    });
  });
}

// Example 6: File Operations and Document Libraries
function fileOperationsExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) return reject(err);

      // Get current user information
      sharepoint.listItems.currentuser('Documents', (err, user) => {
        if (err) {
          console.error('Error getting current user:', err.message);
        } else if (user) {
          console.log('Current user:', user.Title || user.LoginName);
          console.log('User email:', user.Email);
        }

        // Download a file by folder and filename
        sharepoint.listItems.byteStream('Shared Documents', 'example.pdf', (err, serviceReqObj) => {
          if (err) {
            console.error('Error getting file stream by folder/filename:', err.message);
          } else if (serviceReqObj) {
            console.log('File stream object ready for download (by folder/filename)');
            // In a real application, you would use this with the request library:
            // const request = require('request');
            // request.get(serviceReqObj).on('response', function(response) {
            //   response.pipe(fs.createWriteStream('downloaded-file.pdf'));
            // });
          }

          // Download a file by full path
          const filePath = '/Shared Documents/example.pdf';
          sharepoint.listItems.byteStreamByFilePath(filePath, (err, serviceReqObj) => {
            if (err) {
              console.error('Error getting file stream by path:', err.message);
            } else if (serviceReqObj) {
              console.log('File stream object ready for download (by path)');
              // Same usage as above with request library
            }

            resolve();
          });
        });
      });
    });
  });
}

// Example 7: Using Convenience Methods on Objects
function convenienceMethodsExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online'
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) return reject(err);

      sharepoint.lists.list((err, lists) => {
        if (err || !lists || lists.length === 0) {
          return reject(new Error('No lists available'));
        }

        const aList = lists[0];
        console.log(`Using convenience methods on list: ${aList.Title}`);

        // Use the convenience read method directly on the list object
        aList.read((err, listReadResult) => {
          if (err) {
            console.error('Error using convenience read method:', err.message);
            return reject(err);
          }

          console.log(`Read list via convenience method: ${listReadResult.Title}`);
          
          if (listReadResult.Items && listReadResult.Items.length > 0) {
            const anItem = listReadResult.Items[0];
            
            // Use convenience method on the item
            anItem.read((err, itemDetails) => {
              if (err) {
                console.error('Error reading item via convenience method:', err.message);
              } else {
                console.log(`Read item via convenience method: ${itemDetails.Title}`);
              }

              // Update the list using convenience method
              aList.update({ Title: aList.Title + ' (Updated)' }, (err, updateResult) => {
                if (err) {
                  console.error('Error updating list via convenience method:', err.message);
                } else {
                  console.log('List updated via convenience method');
                }

                resolve();
              });
            });
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Example 8: Error Handling and Best Practices
function errorHandlingExample() {
  const sharepoint = sharepointconnector({
    username: process.env.SP_USERNAME || 'username',
    password: process.env.SP_PASSWORD || 'password',
    url: process.env.SP_URL || 'https://your-company.sharepoint.com',
    type: 'online',
    verbose: true // Enable verbose logging for debugging
  });

  return new Promise((resolve, reject) => {
    sharepoint.login((err) => {
      if (err) {
        // Handle different types of authentication errors
        if (err.message.includes('401')) {
          console.error('Authentication failed - check credentials');
        } else if (err.message.includes('timeout')) {
          console.error('Connection timeout - check network/URL');
        } else {
          console.error('Login error:', err.message);
        }
        return reject(err);
      }

      // Try to access a non-existent list to demonstrate error handling
      sharepoint.lists.read('NonExistentList', (err, result) => {
        if (err) {
          console.log('Expected error for non-existent list:', err.message);
        }

        // Try to create an item with invalid data
        sharepoint.lists.list((err, lists) => {
          if (err || !lists || lists.length === 0) {
            return resolve(); // No lists to work with
          }

          const firstList = lists[0];
          
          // This might fail if required fields are missing
          sharepoint.listItems.create(firstList.Id, {}, (err, newItem) => {
            if (err) {
              console.log('Expected error for invalid item data:', err.message);
            }

            resolve();
          });
        });
      });
    });
  });
}

// Main execution function
async function main() {
  try {
    console.log('=== SharePoint Connector JavaScript Examples ===\n');

    console.log('1. Basic Connection Example:');
    await basicExample();

    console.log('\n2. NTLM Authentication Example:');
    // await ntlmExample(); // Uncomment if you have NTLM environment

    console.log('\n3. Lists Example:');
    await listsExample();

    console.log('\n4. Advanced List Example:');
    await advancedListExample();

    console.log('\n5. List Items Example:');
    await listItemsExample();

    console.log('\n6. File Operations Example:');
    await fileOperationsExample();

    console.log('\n7. Convenience Methods Example:');
    await convenienceMethodsExample();

    console.log('\n8. Error Handling Example:');
    await errorHandlingExample();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Example failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  basicExample,
  ntlmExample,
  listsExample,
  advancedListExample,
  listItemsExample,
  fileOperationsExample,
  convenienceMethodsExample,
  errorHandlingExample,
  main
};

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}