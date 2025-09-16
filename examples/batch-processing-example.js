/**
 * Example: Using processLargeBatch with SharePoint Connector
 * This example demonstrates how to efficiently process large datasets
 * with reduced CPU usage and optimized performance.
 */

var sharepoint = require('../sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE || 'ntlm',
  url: process.env.SP_HOST
});

var processLargeBatch = require('../lib/util/processLargeBatch');

// Initialize the batch processor with the SharePoint client
var batchProcessor = processLargeBatch(sharepoint);

// Example 1: Process a large array of custom data
function processCustomData() {
  console.log('Processing custom data batch...');
  
  // Create sample data (in real scenario, this could be from a file, API, etc.)
  var largeDataset = [];
  for (var i = 1; i <= 5000; i++) {
    largeDataset.push({
      id: i,
      name: 'Item ' + i,
      category: i % 10 === 0 ? 'Category A' : 'Category B',
      value: Math.random() * 1000
    });
  }
  
  // Define the processing function
  function processChunk(chunk) {
    return chunk.map(function(item) {
      return {
        id: item.id,
        processedName: item.name.toUpperCase(),
        isHighValue: item.value > 500,
        categoryCode: item.category === 'Category A' ? 'A' : 'B'
      };
    });
  }
  
  // Configure options for optimal performance
  var options = {
    chunkSize: 100,        // Process 100 items at a time
    concurrency: 2,        // Max 2 concurrent operations
    throttleMs: 20,        // 20ms delay between chunks
    enableGC: true,        // Enable garbage collection hints
    progressCallback: function(processed, total) {
      if (processed % 1000 === 0 || processed === total) {
        console.log('Progress: ' + processed + '/' + total + ' items processed');
      }
    }
  };
  
  batchProcessor.processLargeBatch(largeDataset, processChunk, options, function(err, results) {
    if (err) {
      console.error('Error processing batch:', err);
      return;
    }
    
    console.log('Custom data processing completed!');
    console.log('Total items processed:', results.length);
    console.log('High-value items:', results.filter(function(item) { return item.isHighValue; }).length);
  });
}

// Example 2: Process SharePoint list items efficiently
function processSharePointItems() {
  console.log('Processing SharePoint list items...');
  
  // Define the processing function for SharePoint items
  function processSharePointChunk(chunk) {
    return chunk.map(function(item) {
      return {
        id: item.Id,
        title: item.Title ? item.Title.trim() : '',
        created: item.Created,
        hasAttachments: item.Attachments || false,
        processedAt: new Date().toISOString()
      };
    });
  }
  
  // Configure options optimized for SharePoint API limits
  var options = {
    batchSize: 1000,       // Fetch 1000 items per SharePoint request
    chunkSize: 50,         // Process 50 items at a time
    concurrency: 1,        // Conservative concurrency for SharePoint
    throttleMs: 100,       // Respect SharePoint throttling
    selectFields: ['Id', 'Title', 'Created', 'Attachments'], // Only fetch needed fields
    progressCallback: function(processed, total) {
      console.log('SharePoint items processed: ' + processed + '/' + total);
    }
  };
  
  batchProcessor.processLargeItemBatch('Documents', processSharePointChunk, options, function(err, results) {
    if (err) {
      console.error('Error processing SharePoint items:', err);
      return;
    }
    
    console.log('SharePoint processing completed!');
    console.log('Total items processed:', results.length);
    console.log('Items with attachments:', results.filter(function(item) { return item.hasAttachments; }).length);
  });
}

// Example 3: Async processing with promises
function processWithPromises() {
  console.log('Processing with promise-based processor...');
  
  var items = [];
  for (var i = 1; i <= 1000; i++) {
    items.push({ id: i, data: 'data-' + i });
  }
  
  // Promise-based processor
  function asyncProcessor(chunk) {
    return new Promise(function(resolve) {
      // Simulate async processing
      setTimeout(function() {
        var processed = chunk.map(function(item) {
          return {
            id: item.id,
            processed: true,
            timestamp: Date.now()
          };
        });
        resolve(processed);
      }, Math.random() * 50); // Random delay 0-50ms
    });
  }
  
  var options = {
    chunkSize: 25,
    concurrency: 3,
    throttleMs: 10
  };
  
  batchProcessor.processLargeBatch(items, asyncProcessor, options, function(err, results) {
    if (err) {
      console.error('Error in promise processing:', err);
      return;
    }
    
    console.log('Promise-based processing completed!');
    console.log('Total items processed:', results.length);
  });
}

// Example 4: Error handling and retry logic
function processWithErrorHandling() {
  console.log('Testing error handling and retry logic...');
  
  var items = [1, 2, 3, 4, 5];
  var attemptCount = 0;
  
  function flakyProcessor(chunk) {
    attemptCount++;
    console.log('Processing attempt:', attemptCount);
    
    // Fail first two attempts, succeed on third
    if (attemptCount < 3) {
      throw new Error('Simulated processing failure');
    }
    
    return chunk.map(function(item) { return item * 2; });
  }
  
  var options = {
    maxRetries: 3,
    retryDelayMs: 500,
    chunkSize: 5
  };
  
  batchProcessor.processLargeBatch(items, flakyProcessor, options, function(err, results) {
    if (err) {
      console.error('Processing failed after retries:', err.message);
      return;
    }
    
    console.log('Error handling test completed!');
    console.log('Results after retries:', results);
    console.log('Total attempts made:', attemptCount);
  });
}

// Run examples
if (require.main === module) {
  console.log('SharePoint Batch Processing Examples');
  console.log('====================================\n');
  
  // Run examples sequentially
  processCustomData();
  
  setTimeout(function() {
    processWithPromises();
  }, 2000);
  
  setTimeout(function() {
    processWithErrorHandling();
  }, 4000);
  
  // Uncomment the line below to test SharePoint integration
  // (requires valid SharePoint credentials in environment variables)
  // setTimeout(processSharePointItems, 6000);
}

module.exports = {
  processCustomData: processCustomData,
  processSharePointItems: processSharePointItems,
  processWithPromises: processWithPromises,
  processWithErrorHandling: processWithErrorHandling
};