/**
 * Batch processing optimizer for SharePoint Connector
 * Reduces CPU usage for large data processing operations
 * Maintains backward compatibility with existing API
 */

var async = require('async');
var _ = require('underscore');

/**
 * Optimized processLargeBatch function
 * Processes large arrays in chunks to prevent CPU blocking
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processingFunction - Function to apply to each item
 * @param {Object} options - Configuration options
 * @param {number} options.chunkSize - Items per chunk (default: 100)
 * @param {number} options.concurrency - Concurrent chunks (default: 2) 
 * @param {number} options.threshold - Min items for chunking (default: 1000)
 * @param {Function} callback - Callback (err, processedItems)
 */
function processLargeBatch(items, processingFunction, options, callback) {
  // Handle optional options parameter
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Default configuration optimized for CPU usage
  var config = {
    chunkSize: options.chunkSize || 100,
    concurrency: options.concurrency || 2,
    threshold: options.threshold || 1000
  };
  
  // Input validation
  if (!items || !Array.isArray(items)) {
    return process.nextTick(function() {
      callback(null, items || []);
    });
  }
  
  // For small arrays, use synchronous processing to avoid async overhead
  if (items.length <= config.threshold) {
    try {
      var result = items.map(processingFunction);
      return process.nextTick(function() {
        callback(null, result);
      });
    } catch (err) {
      return process.nextTick(function() {
        callback(err);
      });
    }
  }
  
  // Split large arrays into manageable chunks
  var chunks = [];
  for (var i = 0; i < items.length; i += config.chunkSize) {
    chunks.push(items.slice(i, i + config.chunkSize));
  }
  
  // Process chunks with controlled concurrency to prevent CPU overload
  async.mapLimit(chunks, config.concurrency, function(chunk, chunkCallback) {
    // Use setImmediate to yield control back to event loop
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
    
    // Efficiently flatten chunks using concat
    var result = [];
    for (var i = 0; i < processedChunks.length; i++) {
      result = result.concat(processedChunks[i]);
    }
    
    callback(null, result);
  });
}

/**
 * Synchronous version for backward compatibility
 * Includes optimization for very large arrays to prevent blocking
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processingFunction - Function to apply to each item
 * @param {Object} options - Configuration options
 * @returns {Array} - Processed items
 */
function processLargeBatchSync(items, processingFunction, options) {
  options = options || {};
  var threshold = options.threshold || 1000;
  var chunkSize = options.chunkSize || 100;
  
  if (!items || !Array.isArray(items)) {
    return items || [];
  }
  
  // For small arrays, use regular map
  if (items.length <= threshold) {
    return items.map(processingFunction);
  }
  
  // For large arrays, process in chunks with periodic yielding
  var result = [];
  for (var i = 0; i < items.length; i += chunkSize) {
    var chunk = items.slice(i, i + chunkSize);
    var processedChunk = chunk.map(processingFunction);
    result = result.concat(processedChunk);
    
    // Yield control periodically for very large datasets
    if (i > 0 && i % (chunkSize * 10) === 0) {
      // This allows other operations to run
      require('child_process').spawnSync('sleep', ['0']);
    }
  }
  
  return result;
}

/**
 * Enhanced verbosity filter that uses batch optimization
 * Drop-in replacement for the original verbosity filter
 */
function createOptimizedVerbosityFilter(originalFilter) {
  return function optimizedVerbosityFilter(itemOrItems, url, options, callback) {
    // If callback provided, use async processing
    if (typeof callback === 'function') {
      return processLargeBatch(itemOrItems, function(item) {
        return originalFilter(item, url);
      }, options, callback);
    }
    
    // Handle options parameter when no callback
    if (typeof options === 'function') {
      callback = options;
      options = {};
      return processLargeBatch(itemOrItems, function(item) {
        return originalFilter(item, url);
      }, options, callback);
    }
    
    // Synchronous mode with optimization
    if (Array.isArray(itemOrItems) && itemOrItems.length > 1000) {
      return processLargeBatchSync(itemOrItems, function(item) {
        return originalFilter(item, url);
      }, options);
    }
    
    // Use original filter for small datasets or non-arrays
    return originalFilter(itemOrItems, url);
  };
}

module.exports = {
  processLargeBatch: processLargeBatch,
  processLargeBatchSync: processLargeBatchSync,
  createOptimizedVerbosityFilter: createOptimizedVerbosityFilter
};