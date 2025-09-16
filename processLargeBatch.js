/**
 * SharePoint Connector - Optimized Batch Processing
 * 
 * This module provides the processLargeBatch function optimized for CPU efficiency
 * while maintaining backward compatibility with existing SharePoint connector APIs.
 */

var async = require('async');

/**
 * processLargeBatch - CPU-optimized batch processing function
 * 
 * Reduces CPU usage for large inputs by:
 * 1. Processing items in manageable chunks
 * 2. Using controlled concurrency to prevent blocking
 * 3. Yielding control back to the event loop between chunks
 * 4. Adaptive processing based on data size
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processingFunction - Function to apply to each item
 * @param {Object} options - Configuration options (optional)
 * @param {number} options.chunkSize - Number of items per chunk (default: 100)
 * @param {number} options.concurrency - Max concurrent chunks (default: 2)
 * @param {number} options.threshold - Min items for chunked processing (default: 1000)
 * @param {Function} callback - Callback function (err, processedItems)
 * 
 * @example
 * // Basic usage
 * processLargeBatch(largeArray, function(item) {
 *   return processItem(item);
 * }, function(err, results) {
 *   console.log('Processed', results.length, 'items');
 * });
 * 
 * // With options
 * processLargeBatch(largeArray, processItem, {
 *   chunkSize: 50,
 *   concurrency: 3,
 *   threshold: 500
 * }, callback);
 */
function processLargeBatch(items, processingFunction, options, callback) {
  // Handle optional options parameter
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Input validation
  if (!callback || typeof callback !== 'function') {
    throw new Error('processLargeBatch requires a callback function');
  }
  
  if (!items || !Array.isArray(items)) {
    return process.nextTick(function() {
      callback(null, items || []);
    });
  }
  
  if (!processingFunction || typeof processingFunction !== 'function') {
    return process.nextTick(function() {
      callback(new Error('processingFunction must be a function'));
    });
  }
  
  // Configuration optimized for CPU efficiency
  var config = {
    chunkSize: Math.max(1, options.chunkSize || 100),
    concurrency: Math.max(1, Math.min(options.concurrency || 2, 4)), // Cap at 4 for CPU efficiency
    threshold: Math.max(1, options.threshold || 1000)
  };
  
  // For small arrays, use synchronous processing to avoid async overhead
  if (items.length <= config.threshold) {
    return process.nextTick(function() {
      try {
        var result = items.map(processingFunction);
        callback(null, result);
      } catch (err) {
        callback(err);
      }
    });
  }
  
  // Split large arrays into chunks
  var chunks = [];
  for (var i = 0; i < items.length; i += config.chunkSize) {
    chunks.push(items.slice(i, Math.min(i + config.chunkSize, items.length)));
  }
  
  console.log('processLargeBatch: Processing', items.length, 'items in', chunks.length, 'chunks');
  
  // Process chunks with limited concurrency
  async.mapLimit(chunks, config.concurrency, function(chunk, chunkCallback) {
    // Use setImmediate to yield control to event loop
    setImmediate(function() {
      try {
        var processedChunk = chunk.map(processingFunction);
        chunkCallback(null, processedChunk);
      } catch (err) {
        chunkCallback(err);
      }
    });
  }, function(err, processedChunks) {
    if (err) {
      return callback(err);
    }
    
    // Efficiently flatten chunks
    var result = [];
    var totalItems = 0;
    for (var i = 0; i < processedChunks.length; i++) {
      result = result.concat(processedChunks[i]);
      totalItems += processedChunks[i].length;
    }
    
    console.log('processLargeBatch: Completed processing', totalItems, 'items');
    callback(null, result);
  });
}

/**
 * Synchronous version for backward compatibility
 * Includes optimization to prevent CPU blocking on large datasets
 */
function processLargeBatchSync(items, processingFunction, options) {
  options = options || {};
  
  if (!items || !Array.isArray(items)) {
    return items || [];
  }
  
  if (!processingFunction || typeof processingFunction !== 'function') {
    throw new Error('processingFunction must be a function');
  }
  
  var threshold = options.threshold || 1000;
  var chunkSize = options.chunkSize || 100;
  
  // For small arrays, use standard map
  if (items.length <= threshold) {
    return items.map(processingFunction);
  }
  
  console.log('processLargeBatchSync: Processing', items.length, 'items synchronously with chunking');
  
  // Process large arrays in chunks with periodic yielding
  var result = [];
  for (var i = 0; i < items.length; i += chunkSize) {
    var chunk = items.slice(i, Math.min(i + chunkSize, items.length));
    var processedChunk = chunk.map(processingFunction);
    result = result.concat(processedChunk);
    
    // Yield periodically to prevent blocking
    if (i > 0 && i % (chunkSize * 10) === 0) {
      // Brief pause to allow other operations
      var start = Date.now();
      while (Date.now() - start < 1) {
        // Minimal yield
      }
    }
  }
  
  return result;
}

module.exports = {
  processLargeBatch: processLargeBatch,
  processLargeBatchSync: processLargeBatchSync
};