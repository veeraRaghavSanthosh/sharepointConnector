const { promisify } = require('util');

// Promisify helper function
function promisifyMethod(obj, methodName) {
  const originalMethod = obj[methodName];
  if (typeof originalMethod === 'function') {
    obj[methodName + 'Async'] = promisify(originalMethod.bind(obj));
  }
}

// Main server module that provides async/await interface
module.exports = function(params) {
  if (!params.username || !params.password || !params.url) {
    throw new Error('SharePoint client needs a username, password and instance URL');
  }

  // Use the original client as the base
  const originalClient = require('../lib/client')(params);
  
  // Create async versions of the main methods
  const asyncClient = {
    // Async login method
    login: promisify(originalClient.login),
    
    // Keep original for backward compatibility
    loginCallback: originalClient.login,
    
    // Async lists methods
    lists: {
      list: promisify(originalClient.lists.list),
      read: promisify(originalClient.lists.read),
      readOrList: promisify(originalClient.lists.readOrList),
      create: promisify(originalClient.lists.create),
      update: promisify(originalClient.lists.update),
      del: promisify(originalClient.lists.del),
      delete: promisify(originalClient.lists.delete),
      createItem: promisify(originalClient.lists.createItem),
      
      // Keep original callback versions for backward compatibility
      listCallback: originalClient.lists.list,
      readCallback: originalClient.lists.read,
      readOrListCallback: originalClient.lists.readOrList,
      createCallback: originalClient.lists.create,
      updateCallback: originalClient.lists.update,
      delCallback: originalClient.lists.del,
      deleteCallback: originalClient.lists.delete,
      createItemCallback: originalClient.lists.createItem
    },
    
    // Async listItems methods
    listItems: {
      list: promisify(originalClient.listItems.list),
      listAll: promisify(originalClient.listItems.listAll),
      read: promisify(originalClient.listItems.read),
      create: promisify(originalClient.listItems.create),
      update: promisify(originalClient.listItems.update),
      del: promisify(originalClient.listItems.del),
      delete: promisify(originalClient.listItems.delete),
      currentuser: promisify(originalClient.listItems.currentuser),
      byteStream: promisify(originalClient.listItems.byteStream),
      byteStreamByFilePath: promisify(originalClient.listItems.byteStreamByFilePath),
      moveTo: promisify(originalClient.listItems.moveTo),
      
      // Keep original callback versions for backward compatibility
      listCallback: originalClient.listItems.list,
      listAllCallback: originalClient.listItems.listAll,
      readCallback: originalClient.listItems.read,
      createCallback: originalClient.listItems.create,
      updateCallback: originalClient.listItems.update,
      delCallback: originalClient.listItems.del,
      deleteCallback: originalClient.listItems.delete,
      currentuserCallback: originalClient.listItems.currentuser,
      byteStreamCallback: originalClient.listItems.byteStream,
      byteStreamByFilePathCallback: originalClient.listItems.byteStreamByFilePath,
      moveToCallback: originalClient.listItems.moveTo
    }
  };
  
  return asyncClient;
};

// Export both the async version and the original callback version for full compatibility
module.exports.callback = require('../lib/client');
module.exports.original = require('../lib/client');
