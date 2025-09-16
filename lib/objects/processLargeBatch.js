var async = require('async'),
  _ = require('underscore');

module.exports = function(client) {
  var doRequest = require('../util/doRequest')(client),
    urlBuilder = require('../util/urlBuilderTools'),
    conveniences = require('../util/conveniences');

  return {
    processLargeBatch: function(listId, options, cb) {
      // Handle optional parameters
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      
      if (!listId) {
        return cb('Error: listId is required for processLargeBatch');
      }
      
      // Default options for CPU optimization
      var opts = _.extend({
        batchSize: 100,           // Process items in smaller batches
        concurrency: 2,           // Limit concurrent requests to reduce CPU load
        throttleDelay: 50,        // Add small delay between batches to prevent CPU spikes
        streamResults: false,     // Option to stream results instead of accumulating
        onProgress: null,         // Progress callback for monitoring
        maxRetries: 3,            // Retry failed requests
        memoryThreshold: 10000    // Switch to streaming if more than this many items
      }, options);
      
      var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items";
      host = urlBuilder.augmentURL(host, false, client.filterFields, client.selectFields, 
                                 client.expandFields, client.orOperator, client.andOrOperator, opts.batchSize);
      
      var allResults = [];
      var processedCount = 0;
      var hasMoreData = true;
      var retryCount = 0;
      var isStreaming = opts.streamResults;
      
      // Auto-enable streaming for large datasets to prevent memory issues
      var autoStreamThreshold = opts.memoryThreshold;
      
      // Use async.queue for better concurrency control and CPU management
      var processingQueue = async.queue(function(requestData, queueCallback) {
        var requestOptions = {
          host: requestData.url,
          type: 'pagination'
        };
        
        doRequest(requestOptions, function(err, response) {
          if (err) {
            // Implement exponential backoff for retries
            if (retryCount < opts.maxRetries) {
              retryCount++;
              var backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              setTimeout(function() {
                processingQueue.push(requestData, queueCallback);
              }, backoffDelay);
              return;
            }
            return queueCallback(err);
          }
          
          retryCount = 0; // Reset retry count on success
          var batchResults = response.d.results || [];
          processedCount += batchResults.length;
          
          // Auto-enable streaming if we exceed memory threshold
          if (!isStreaming && processedCount > autoStreamThreshold) {
            isStreaming = true;
            if (opts.onProgress) {
              opts.onProgress(null, {
                message: 'Auto-enabled streaming mode due to large dataset',
                processed: processedCount,
                streamingEnabled: true
              });
            }
          }
          
          // Stream results if enabled, otherwise accumulate
          if (isStreaming && opts.onProgress) {
            opts.onProgress(null, {
              batch: batchResults,
              processed: processedCount,
              hasMore: !!response.d.__next,
              isStreaming: true
            });
          } else {
            // Use more memory-efficient concatenation for large arrays
            if (batchResults.length > 0) {
              // For very large arrays, use Array.prototype.push.apply in chunks
              // to prevent "Maximum call stack size exceeded" errors
              var chunkSize = 1000;
              for (var i = 0; i < batchResults.length; i += chunkSize) {
                var chunk = batchResults.slice(i, i + chunkSize);
                allResults.push.apply(allResults, chunk);
              }
            }
          }
          
          // Progress callback for non-streaming mode
          if (!isStreaming && opts.onProgress) {
            opts.onProgress(null, {
              processed: processedCount,
              queueLength: processingQueue.length(),
              hasMore: !!response.d.__next,
              isStreaming: false
            });
          }
          
          // Check for next page
          if (response.d.__next) {
            var nextUrl = response.d.__next;
            if (nextUrl.indexOf('/sites/') !== -1) {
              nextUrl = nextUrl.substring(nextUrl.indexOf('/sites/'));
            }
            
            // Add throttling delay to prevent CPU spikes
            setTimeout(function() {
              processingQueue.push({ url: nextUrl }, queueCallback);
            }, opts.throttleDelay);
          } else {
            hasMoreData = false;
            queueCallback();
          }
        });
      }, opts.concurrency);
      
      // Handle queue completion
      processingQueue.drain = function() {
        if (!hasMoreData) {
          if (isStreaming) {
            return cb(null, { 
              processed: processedCount, 
              completed: true,
              streamingMode: true
            });
          } else {
            // Apply conveniences to final results efficiently
            var finalResults;
            try {
              finalResults = conveniences('ListItems', { d: { results: allResults } }, listId);
            } catch (e) {
              // If conveniences fails due to memory issues, return raw results
              finalResults = { d: { results: allResults } };
            }
            return cb(null, finalResults);
          }
        }
      };
      
      // Handle queue errors
      processingQueue.error = function(err, task) {
        return cb(err);
      };
      
      // Memory monitoring to prevent out-of-memory issues
      var memoryCheckInterval;
      if (!isStreaming && process.memoryUsage) {
        memoryCheckInterval = setInterval(function() {
          var memUsage = process.memoryUsage();
          var memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
          
          // If memory usage is high, suggest streaming mode
          if (memoryUsageMB > 500 && opts.onProgress) {
            opts.onProgress(null, {
              warning: 'High memory usage detected',
              memoryUsageMB: Math.round(memoryUsageMB),
              suggestion: 'Consider using streamResults: true for large datasets'
            });
          }
        }, 5000);
      }
      
      // Clean up interval when processing completes
      var originalDrain = processingQueue.drain;
      processingQueue.drain = function() {
        if (memoryCheckInterval) {
          clearInterval(memoryCheckInterval);
        }
        originalDrain();
      };
      
      // Start processing
      processingQueue.push({ url: host });
    }
  };
};