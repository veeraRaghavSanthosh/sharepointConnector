/**
 * Optimized batch processing utility for handling large SharePoint datasets
 * Reduces CPU usage through streaming, chunked processing, and memory management
 */

var async = require('async');
var _ = require('underscore');

module.exports = function(client) {
  var doRequest = require('./doRequest')(client);
  var verbosityFilter = require('./verbosityFilter')(client);
  
  /**
   * Process large batches with CPU optimization
   * @param {Object} options - Configuration options
   * @param {string} options.baseUrl - Base SharePoint API URL
   * @param {number} [options.chunkSize=100] - Items to process per chunk
   * @param {number} [options.concurrency=3] - Number of concurrent requests
   * @param {number} [options.batchSize=1000] - Items to accumulate before processing
   * @param {Function} [options.itemProcessor] - Custom item processing function
   * @param {Function} [options.progressCallback] - Progress update callback
   * @param {Function} callback - Final callback (err, results)
   */
  function processLargeBatch(options, callback) {
    // Validate required parameters
    if (!options || !options.baseUrl) {
      return callback(new Error('baseUrl is required'));
    }
    
    // Set default options with CPU optimization in mind
    var config = {
      chunkSize: options.chunkSize || 100,
      concurrency: options.concurrency || 3,
      batchSize: options.batchSize || 1000,
      baseUrl: options.baseUrl,
      itemProcessor: options.itemProcessor || defaultItemProcessor,
      progressCallback: options.progressCallback || function() {},
      useStreaming: options.useStreaming !== false, // Default to true
      maxMemoryItems: options.maxMemoryItems || 5000 // Prevent memory overflow
    };
    
    var processedCount = 0;
    var totalProcessed = 0;
    var allResults = [];
    var currentBatch = [];
    var hasMore = true;
    var nextUrl = config.baseUrl;
    
    // Create a queue for processing chunks to control concurrency
    var processingQueue = async.queue(function(chunk, queueCallback) {
      processChunk(chunk, config, function(err, processedChunk) {
        if (err) return queueCallback(err);
        
        // Add processed items to current batch
        currentBatch = currentBatch.concat(processedChunk);
        processedCount += processedChunk.length;
        
        // If batch is full or we're done, process it
        if (currentBatch.length >= config.batchSize || !hasMore) {
          flushBatch(currentBatch, config, function(err, batchResults) {
            if (err) return queueCallback(err);
            
            if (config.useStreaming) {
              // In streaming mode, don't accumulate all results
              config.progressCallback({
                processed: totalProcessed + currentBatch.length,
                batchResults: batchResults
              });
            } else {
              // Accumulate results for non-streaming mode
              allResults = allResults.concat(batchResults);
            }
            
            totalProcessed += currentBatch.length;
            currentBatch = [];
            queueCallback();
          });
        } else {
          queueCallback();
        }
      });
    }, config.concurrency);
    
    // Handle queue completion
    processingQueue.drain(function() {
      if (!hasMore && currentBatch.length === 0) {
        if (config.useStreaming) {
          callback(null, { totalProcessed: totalProcessed, streaming: true });
        } else {
          callback(null, allResults);
        }
      }
    });
    
    // Start fetching data with pagination
    fetchDataRecursively();
    
    function fetchDataRecursively() {
      if (!hasMore) return;
      
      var requestOptions = {
        url: nextUrl,
        type: 'pagination'
      };
      
      doRequest(requestOptions, function(err, response) {
        if (err) return callback(err);
        
        try {
          var items = response && response.d ? response.d.results : [];
          nextUrl = response && response.d ? response.d['__next'] : null;
          hasMore = !!nextUrl;
          
          if (nextUrl && nextUrl.indexOf('/sites/') !== 0) {
            nextUrl = nextUrl.substring(nextUrl.indexOf('/sites/'));
          }
          
          // Split items into chunks for processing
          var chunks = chunkArray(items, config.chunkSize);
          
          // Add chunks to processing queue
          chunks.forEach(function(chunk) {
            processingQueue.push(chunk);
          });
          
          // Continue fetching if there's more data and we haven't hit memory limits
          if (hasMore && totalProcessed < config.maxMemoryItems) {
            // Use setImmediate to prevent stack overflow and allow other operations
            setImmediate(fetchDataRecursively);
          } else if (hasMore) {
            // Memory limit reached, wait for processing to catch up
            processingQueue.drain(function() {
              if (totalProcessed < config.maxMemoryItems) {
                setImmediate(fetchDataRecursively);
              }
            });
          }
          
        } catch (parseError) {
          callback(parseError);
        }
      });
    }
  }
  
  /**
   * Process a chunk of items with CPU optimization
   */
  function processChunk(chunk, config, callback) {
    try {
      // Use setImmediate to break up synchronous processing
      setImmediate(function() {
        var processedChunk = chunk.map(config.itemProcessor);
        callback(null, processedChunk);
      });
    } catch (err) {
      callback(err);
    }
  }
  
  /**
   * Flush a batch of processed items
   */
  function flushBatch(batch, config, callback) {
    try {
      // Apply verbosity filtering in chunks to reduce CPU spikes
      setImmediate(function() {
        var filteredBatch = batch.map(function(item) {
          return verbosityFilter(item, config.baseUrl);
        });
        callback(null, filteredBatch);
      });
    } catch (err) {
      callback(err);
    }
  }
  
  /**
   * Default item processor - can be overridden
   */
  function defaultItemProcessor(item) {
    return item;
  }
  
  /**
   * Split array into chunks
   */
  function chunkArray(array, chunkSize) {
    var chunks = [];
    for (var i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Optimized version of listAll that uses processLargeBatch
   * Maintains backward compatibility with existing API
   */
  function optimizedListAll(listId, callback) {
    var baseUrl = client.BASE_LIST_URL + "/getByTitle('" + listId + "')/Items";
    var urlBuilder = require('./urlBuilderTools');
    
    baseUrl = urlBuilder.augmentURL(
      baseUrl, 
      false, 
      client.filterFields, 
      client.selectFields, 
      client.expandFields, 
      client.orOperator, 
      client.andOrOperator, 
      client.$top
    );
    
    processLargeBatch({
      baseUrl: baseUrl,
      useStreaming: false, // For backward compatibility, return all results
      chunkSize: 50, // Smaller chunks for better responsiveness
      concurrency: 2, // Conservative concurrency for SharePoint
      batchSize: 500 // Process in smaller batches
    }, function(err, results) {
      if (err) return callback(err);
      callback(null, results);
    });
  }
  
  return {
    processLargeBatch: processLargeBatch,
    optimizedListAll: optimizedListAll
  };
};