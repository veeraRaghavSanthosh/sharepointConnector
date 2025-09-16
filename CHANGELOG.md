# Changelog

## [1.1.7] - 2025-09-16

### Added
- **processLargeBatch**: New optimized batch processing utility for handling large datasets
  - Reduces CPU usage through intelligent chunking and throttling
  - Configurable concurrency limits to prevent resource exhaustion
  - Built-in retry logic for resilient processing
  - Progress reporting callbacks for monitoring large operations
  - Memory management with optional garbage collection hints
  - Support for synchronous, callback-based, and promise-based processors
  - Specialized `processLargeItemBatch` for SharePoint list operations

### Performance Improvements
- Batch processing now uses controlled concurrency (default: 2 concurrent operations)
- Configurable chunk sizes (default: 100 items) to optimize memory usage
- Throttling between chunks (default: 10ms) to prevent CPU spikes
- Automatic retry with exponential backoff for failed operations

### Technical Details
- New module: `lib/util/processLargeBatch.js`
- Comprehensive test suite with performance benchmarks
- Preserves existing SharePoint connector API compatibility
- Optimized for large-scale data processing scenarios

### Usage Example
```javascript
var sharepoint = require('sharepointconnector')(config);
var batchProcessor = require('./lib/util/processLargeBatch')(sharepoint);

// Process large batch of items with optimization
batchProcessor.processLargeBatch(items, function(chunk) {
  return chunk.map(item => processItem(item));
}, {
  chunkSize: 50,
  concurrency: 2,
  throttleMs: 20,
  progressCallback: (processed, total) => {
    console.log(`Processed ${processed}/${total} items`);
  }
}, function(err, results) {
  console.log('Batch processing complete:', results.length);
});

// Process SharePoint list items efficiently
batchProcessor.processLargeItemBatch('MyList', function(chunk) {
  return chunk.map(item => ({ id: item.Id, title: item.Title }));
}, function(err, results) {
  console.log('SharePoint items processed:', results.length);
});
```