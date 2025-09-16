# processLargeBatch Utility

An optimized batch processing utility for the SharePoint Connector that reduces CPU usage and improves performance when handling large datasets.

## Features

- **CPU Optimization**: Intelligent chunking and throttling to prevent CPU spikes
- **Configurable Concurrency**: Control the number of concurrent operations
- **Memory Management**: Built-in garbage collection hints and efficient memory usage
- **Retry Logic**: Automatic retry with exponential backoff for failed operations
- **Progress Reporting**: Optional progress callbacks for monitoring large operations
- **Flexible Processing**: Support for synchronous, callback-based, and promise-based processors
- **SharePoint Integration**: Specialized function for SharePoint list operations

## Installation

The utility is included with the SharePoint Connector. No additional installation required.

## Usage

### Basic Usage

```javascript
var sharepoint = require('sharepointconnector')(config);
var processLargeBatch = require('./lib/util/processLargeBatch');
var batchProcessor = processLargeBatch(sharepoint);

var items = [1, 2, 3, 4, 5, ...]; // Your large dataset

batchProcessor.processLargeBatch(items, function(chunk) {
  // Process each chunk of items
  return chunk.map(item => item * 2);
}, function(err, results) {
  if (err) {
    console.error('Processing failed:', err);
    return;
  }
  console.log('Processing completed:', results);
});
```

### Advanced Configuration

```javascript
var options = {
  chunkSize: 50,           // Items per chunk (default: 100)
  concurrency: 3,          // Max concurrent operations (default: 2)
  throttleMs: 20,          // Delay between chunks in ms (default: 10)
  enableGC: true,          // Enable garbage collection hints (default: true)
  maxRetries: 5,           // Max retry attempts (default: 3)
  retryDelayMs: 2000,      // Initial retry delay in ms (default: 1000)
  progressCallback: function(processed, total) {
    console.log(`Progress: ${processed}/${total}`);
  }
};

batchProcessor.processLargeBatch(items, processor, options, callback);
```

### SharePoint List Processing

```javascript
// Optimized for SharePoint list operations
var options = {
  batchSize: 1000,         // Items per SharePoint request
  chunkSize: 50,           // Items per processing chunk
  concurrency: 1,          // Conservative for SharePoint API limits
  throttleMs: 100,         // Respect SharePoint throttling
  selectFields: ['Id', 'Title', 'Created'], // Only fetch needed fields
  filterFields: [{field: 'Status', value: 'Active'}] // Filter data
};

batchProcessor.processLargeItemBatch('MyList', function(chunk) {
  return chunk.map(item => ({
    id: item.Id,
    title: item.Title,
    processed: true
  }));
}, options, function(err, results) {
  console.log('SharePoint processing completed:', results.length);
});
```

## API Reference

### processLargeBatch(items, processor, [options], callback)

Process a large array of items in optimized chunks.

**Parameters:**
- `items` (Array): Array of items to process
- `processor` (Function): Function to process each chunk
- `options` (Object, optional): Configuration options
- `callback` (Function): Completion callback `(err, results)`

**Processor Function Signatures:**
```javascript
// Synchronous
function processor(chunk) {
  return processedChunk;
}

// Callback-based
function processor(chunk, callback) {
  // Process chunk
  callback(null, processedChunk);
}

// Promise-based
function processor(chunk) {
  return new Promise((resolve) => {
    // Process chunk
    resolve(processedChunk);
  });
}
```

### processLargeItemBatch(listName, processor, [options], callback)

Process SharePoint list items with optimized batching.

**Parameters:**
- `listName` (String): Name of the SharePoint list
- `processor` (Function): Function to process each chunk
- `options` (Object, optional): Configuration options including SharePoint-specific settings
- `callback` (Function): Completion callback `(err, results)`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chunkSize` | Number | 100 | Number of items to process per chunk |
| `concurrency` | Number | 2 | Maximum number of concurrent operations |
| `throttleMs` | Number | 10 | Delay between chunks in milliseconds |
| `enableGC` | Boolean | true | Enable garbage collection hints |
| `maxRetries` | Number | 3 | Maximum retry attempts for failed operations |
| `retryDelayMs` | Number | 1000 | Initial delay before retry (increases exponentially) |
| `progressCallback` | Function | null | Progress reporting callback |

### SharePoint-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `batchSize` | Number | 1000 | Items per SharePoint API request |
| `selectFields` | Array | null | Fields to select from SharePoint |
| `filterFields` | Array | null | Filter criteria for SharePoint query |

## Performance Guidelines

### Recommended Settings by Dataset Size

| Dataset Size | chunkSize | concurrency | throttleMs |
|-------------|-----------|-------------|------------|
| < 1,000 items | 50 | 2 | 5 |
| 1,000 - 10,000 items | 100 | 2 | 10 |
| 10,000 - 100,000 items | 200 | 3 | 20 |
| > 100,000 items | 500 | 2 | 50 |

### CPU Optimization Tips

1. **Chunk Size**: Smaller chunks reduce memory usage but increase overhead
2. **Concurrency**: Higher concurrency can improve throughput but increases CPU load
3. **Throttling**: Increase throttle delay for CPU-intensive processing
4. **Memory**: Enable garbage collection for very large datasets
5. **SharePoint**: Use `selectFields` to reduce data transfer and processing time

## Error Handling

The utility includes robust error handling with automatic retry logic:

```javascript
var options = {
  maxRetries: 3,
  retryDelayMs: 1000 // Exponential backoff: 1s, 2s, 3s
};

batchProcessor.processLargeBatch(items, function(chunk) {
  // This might fail occasionally
  if (Math.random() < 0.1) {
    throw new Error('Random failure');
  }
  return chunk;
}, options, function(err, results) {
  // Will retry up to 3 times before failing
});
```

## Examples

See `examples/batch-processing-example.js` for comprehensive usage examples including:
- Custom data processing
- SharePoint list processing  
- Promise-based processing
- Error handling and retry logic

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes:
- Unit tests for all functionality
- Performance benchmarks
- Error handling scenarios
- Memory usage tests
- SharePoint integration tests

## License

Same as the main SharePoint Connector package (MIT).