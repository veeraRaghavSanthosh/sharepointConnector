/**
 * SharePoint Connector - processLargeBatch Integration Guide
 * 
 * This file shows how to integrate the CPU-optimized processLargeBatch function
 * into the existing SharePoint connector while preserving backward compatibility.
 */

// Import the optimized batch processor
var batchProcessor = require('./processLargeBatch');

/**
 * INTEGRATION EXAMPLE 1: Optimized Verbosity Filter
 * 
 * Replace the CPU-intensive _.map operations in verbosityFilter.js
 * with chunked processing for large datasets.
 */
function integrateWithVerbosityFilter() {
  // In lib/util/verbosityFilter.js, replace this code:
  /*
  if (_.isArray(itemOrItems)) {
    var typeOverride = _.last(url.split('/'));
    return _.map(itemOrItems, function(item) {
      return processSingleItem(item, typeOverride);
    });
  }
  */
  
  // With this optimized version:
  /*
  if (_.isArray(itemOrItems)) {
    var typeOverride = _.last(url.split('/'));
    
    // Use batch processing for large arrays to reduce CPU usage
    if (itemOrItems.length > 1000) {
      return batchProcessor.processLargeBatchSync(itemOrItems, function(item) {
        return processSingleItem(item, typeOverride);
      });
    } else {
      // Keep original _.map for small arrays to maintain performance
      return _.map(itemOrItems, function(item) {
        return processSingleItem(item, typeOverride);
      });
    }
  }
  */
}

/**
 * INTEGRATION EXAMPLE 2: Optimized List Processing
 * 
 * Enhance the listAll function in lib/objects/listItems.js
 * to handle large result sets more efficiently.
 */
function integrateWithListItems() {
  // Add this function to lib/objects/listItems.js:
  /*
  listAllOptimized: function(listId, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    
    // Use the original listAll function
    return crudl.listAll(listId, function(err, result) {
      if (err) {
        return cb(err);
      }
      
      // Apply batch processing for large result sets
      if (Array.isArray(result) && result.length > 500) {
        console.log('Processing large list with', result.length, 'items');
        
        if (options.processor) {
          return batchProcessor.processLargeBatch(result, options.processor, options, cb);
        }
      }
      
      cb(null, result);
    });
  }
  */
}

/**
 * INTEGRATION EXAMPLE 3: Enhanced doRequest
 * 
 * Modify lib/util/doRequest.js to use optimized processing
 * for large response bodies.
 */
function integrateWithDoRequest() {
  // In the doRequest function, after body = verbosityFilter(body, opts.url);
  // Add this optimization:
  /*
  // For large datasets, use async processing to prevent blocking
  if (Array.isArray(body) && body.length > 1000) {
    return verbosityFilter.processLargeBatch(body, opts.url, function(err, filteredBody) {
      if (err) {
        return cb(err);
      }
      
      if (__next) {
        return cb(null, filteredBody, __next);
      } else {
        return cb(null, filteredBody);
      }
    });
  }
  */
}

/**
 * USAGE EXAMPLES
 */

// Example 1: Direct usage for processing SharePoint list items
function exampleDirectUsage() {
  var largeItemList = []; // Assume this contains 5000+ SharePoint items
  
  batchProcessor.processLargeBatch(largeItemList, function(item) {
    // Process each SharePoint item
    return {
      id: item.Id,
      title: item.Title,
      modified: new Date(item.Modified),
      processed: true
    };
  }, {
    chunkSize: 50,    // Process 50 items at a time
    concurrency: 2,   // Process 2 chunks concurrently
    threshold: 500    // Use chunking for 500+ items
  }, function(err, processedItems) {
    if (err) {
      console.error('Error processing items:', err);
      return;
    }
    
    console.log('Successfully processed', processedItems.length, 'SharePoint items');
  });
}

// Example 2: Synchronous processing with optimization
function exampleSyncUsage() {
  var largeItemList = []; // Large SharePoint dataset
  
  var processedItems = batchProcessor.processLargeBatchSync(largeItemList, function(item) {
    return {
      id: item.Id,
      summary: item.Title + ' - ' + item.Description
    };
  }, {
    chunkSize: 100,
    threshold: 1000
  });
  
  console.log('Processed', processedItems.length, 'items synchronously');
}

// Example 3: Integration with existing SharePoint connector
function exampleIntegration() {
  // Assuming you have a SharePoint connector instance
  /*
  var sp = require('./sharepointconnector');
  
  sp.listItems.listAll('MyLargeList', function(err, items) {
    if (err) {
      console.error('Error fetching list:', err);
      return;
    }
    
    // Process the large result set efficiently
    batchProcessor.processLargeBatch(items, function(item) {
      // Apply business logic to each item
      return processSharePointItem(item);
    }, function(err, processedItems) {
      if (err) {
        console.error('Error processing items:', err);
        return;
      }
      
      console.log('Successfully processed', processedItems.length, 'SharePoint items');
      // Continue with your application logic
    });
  });
  */
}

/**
 * PERFORMANCE TUNING GUIDE
 */
function performanceTuningGuide() {
  /*
  Recommended settings based on data size:
  
  Small datasets (< 500 items):
  - Use original synchronous processing
  - No chunking needed
  
  Medium datasets (500-2000 items):
  - chunkSize: 100
  - concurrency: 2
  - threshold: 500
  
  Large datasets (2000-10000 items):
  - chunkSize: 50
  - concurrency: 2
  - threshold: 1000
  
  Very large datasets (10000+ items):
  - chunkSize: 25
  - concurrency: 1
  - threshold: 1000
  - Consider using processVeryLargeBatch if available
  
  Memory-constrained environments:
  - Reduce chunkSize to 25-50
  - Set concurrency to 1
  - Monitor memory usage
  
  CPU-intensive processing:
  - Reduce concurrency to 1
  - Increase chunkSize to 200-500
  - Use longer yield intervals
  */
}

module.exports = {
  integrateWithVerbosityFilter: integrateWithVerbosityFilter,
  integrateWithListItems: integrateWithListItems,
  integrateWithDoRequest: integrateWithDoRequest,
  exampleDirectUsage: exampleDirectUsage,
  exampleSyncUsage: exampleSyncUsage,
  exampleIntegration: exampleIntegration,
  performanceTuningGuide: performanceTuningGuide
};