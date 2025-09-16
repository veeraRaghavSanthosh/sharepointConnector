var async = require('async');

/**
 * Optimized batch processing function for large datasets
 * Reduces CPU usage by processing items in chunks and using async processing
 * to prevent blocking the event loop
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processingFunction - Function to apply to each item
 * @param {Object} options - Configuration options
 * @param {number} options.chunkSize - Number of items to process per chunk (default: 100)
 * @param {number} options.concurrency - Number of chunks to process concurrently (default: 2)
 * @param {Function} callback - Callback function (err, processedItems)
 */
function processLargeBatch(items, processingFunction, options, callback) {
  // Handle optional options parameter
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Default options
  var config = {
    chunkSize: options.chunkSize || 100,
    concurrency: options.concurrency || 2
  };
  
  // For small arrays, use synchronous processing to avoid overhead
  if (!items || items.length <= config.chunkSize) {
    try {
      var result = items ? items.map(processingFunction) : [];
      return process.nextTick(function() {
        callback(null, result);
      });
    } catch (err) {
      return process.nextTick(function() {
        callback(err);
      });
    }
  }
  
  // Split items into chunks
  var chunks = [];
  for (var i = 0; i < items.length; i += config.chunkSize) {
    chunks.push(items.slice(i, i + config.chunkSize));
  }
  
  // Process chunks with limited concurrency to prevent CPU overload
  async.mapLimit(chunks, config.concurrency, function(chunk, chunkCallback) {
    // Use setImmediate to yield control back to event loop between chunks
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
    
    // Flatten the chunks back into a single array
    var result = [];
    for (var i = 0; i < processedChunks.length; i++) {
      result = result.concat(processedChunks[i]);
    }
    
    callback(null, result);
  });
}

/**
 * Synchronous version for backward compatibility
 * This is the original behavior - processes all items synchronously
 * 
 * @param {Array} items - Array of items to process  
 * @param {Function} processingFunction - Function to apply to each item
 * @returns {Array} - Processed items
 */
function processLargeBatchSync(items, processingFunction) {
  if (!items) {
    return [];
  }
  return items.map(processingFunction);
}

module.exports = {
  processLargeBatch: processLargeBatch,
  processLargeBatchSync: processLargeBatchSync
};