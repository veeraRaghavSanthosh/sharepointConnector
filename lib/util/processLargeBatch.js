/**
 * processLargeBatch - Optimized batch processing for large SharePoint operations
 * Reduces CPU usage through chunking, throttling, and memory management
 */

var async = require('async');
var _ = require('underscore');

module.exports = function(client) {
  
  /**
   * Process large batches of operations with CPU optimization
   * @param {Array} items - Array of items to process
   * @param {Function} processor - Function to process each item/chunk
   * @param {Object} options - Configuration options
   * @param {Function} callback - Completion callback
   */
  function processLargeBatch(items, processor, options, callback) {
    // Handle optional options parameter
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Default configuration optimized for CPU efficiency
    var config = _.defaults(options || {}, {
      chunkSize: 100,           // Process in smaller chunks to reduce memory pressure
      concurrency: 2,           // Limit concurrent operations to reduce CPU load
      throttleMs: 10,           // Small delay between chunks to prevent CPU spikes
      enableGC: true,           // Enable garbage collection hints
      maxRetries: 3,            // Retry failed operations
      retryDelayMs: 1000,       // Delay before retry
      progressCallback: null    // Optional progress reporting
    });
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return callback(null, []);
    }
    
    if (typeof processor !== 'function') {
      return callback(new Error('Processor must be a function'));
    }
    
    var results = [];
    var processedCount = 0;
    var totalItems = items.length;
    var chunks = chunkArray(items, config.chunkSize);
    
    // Report initial progress
    if (config.progressCallback) {
      config.progressCallback(0, totalItems);
    }
    
    // Process chunks with controlled concurrency
    async.eachLimit(chunks, config.concurrency, function(chunk, chunkCallback) {
      
      // Add small delay to prevent CPU spikes
      setTimeout(function() {
        processChunkWithRetry(chunk, processor, config, function(err, chunkResults) {
          if (err) {
            return chunkCallback(err);
          }
          
          // Accumulate results efficiently
          if (chunkResults && chunkResults.length > 0) {
            results = results.concat(chunkResults);
          }
          
          processedCount += chunk.length;
          
          // Report progress
          if (config.progressCallback) {
            config.progressCallback(processedCount, totalItems);
          }
          
          // Suggest garbage collection for large batches
          if (config.enableGC && processedCount % (config.chunkSize * 10) === 0) {
            if (global.gc) {
              global.gc();
            }
          }
          
          chunkCallback();
        });
      }, config.throttleMs);
      
    }, function(err) {
      if (err) {
        return callback(err);
      }
      
      // Final cleanup
      if (config.enableGC && global.gc) {
        global.gc();
      }
      
      callback(null, results);
    });
  }
  
  /**
   * Process a chunk with retry logic
   */
  function processChunkWithRetry(chunk, processor, config, callback) {
    var attempts = 0;
    
    function attemptProcess() {
      attempts++;
      
      try {
        // Handle both sync and async processors
        var result = processor(chunk);
        
        // If processor returns a promise or uses callback
        if (result && typeof result.then === 'function') {
          result.then(function(data) {
            callback(null, data);
          }).catch(function(err) {
            handleRetry(err);
          });
        } else if (processor.length > 1) {
          // Processor expects a callback
          processor(chunk, function(err, data) {
            if (err) {
              handleRetry(err);
            } else {
              callback(null, data);
            }
          });
        } else {
          // Synchronous processor
          callback(null, result);
        }
      } catch (err) {
        handleRetry(err);
      }
    }
    
    function handleRetry(err) {
      if (attempts < config.maxRetries) {
        setTimeout(attemptProcess, config.retryDelayMs * attempts);
      } else {
        callback(err);
      }
    }
    
    attemptProcess();
  }
  
  /**
   * Efficiently chunk array without creating unnecessary copies
   */
  function chunkArray(array, chunkSize) {
    var chunks = [];
    for (var i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Process large batch of SharePoint list items
   * Specialized version for SharePoint operations
   */
  function processLargeItemBatch(listName, processor, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    var config = _.defaults(options || {}, {
      batchSize: 1000,          // Items per SharePoint request
      chunkSize: 50,            // Items per processing chunk
      concurrency: 1,           // Conservative for SharePoint API limits
      throttleMs: 100,          // Respect SharePoint throttling
      selectFields: null,       // Optimize by selecting only needed fields
      filterFields: null        // Filter to reduce data transfer
    });
    
    // First, get all items efficiently
    var clientOptions = {
      selectFields: config.selectFields,
      filterFields: config.filterFields,
      $top: config.batchSize.toString()
    };
    
    // Temporarily set client options
    var originalSelectFields = client.selectFields;
    var originalFilterFields = client.filterFields;
    var originalTop = client.$top;
    
    if (config.selectFields) client.selectFields = config.selectFields;
    if (config.filterFields) client.filterFields = config.filterFields;
    client.$top = config.batchSize.toString();
    
    client.listItems.listAll(listName, function(err, items) {
      // Restore original client options
      client.selectFields = originalSelectFields;
      client.filterFields = originalFilterFields;
      client.$top = originalTop;
      
      if (err) {
        return callback(err);
      }
      
      // Process items in optimized batches
      processLargeBatch(items, processor, config, callback);
    });
  }
  
  return {
    processLargeBatch: processLargeBatch,
    processLargeItemBatch: processLargeItemBatch
  };
};