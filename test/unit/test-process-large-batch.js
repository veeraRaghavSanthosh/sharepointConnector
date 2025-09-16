var expect = require('chai').expect;
var sinon = require('sinon');
var processLargeBatch = require('../../lib/util/processLargeBatch');

describe('processLargeBatch', function() {
  var mockClient;
  var batchProcessor;

  beforeEach(function() {
    mockClient = {
      listItems: {
        listAll: sinon.stub()
      },
      selectFields: null,
      filterFields: null,
      $top: "5000"
    };
    batchProcessor = processLargeBatch(mockClient);
  });

  describe('processLargeBatch function', function() {
    
    it('should handle empty arrays', function(done) {
      batchProcessor.processLargeBatch([], function(item) {
        return item;
      }, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.be.an('array').that.is.empty;
        done();
      });
    });

    it('should handle null input', function(done) {
      batchProcessor.processLargeBatch(null, function(item) {
        return item;
      }, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.be.an('array').that.is.empty;
        done();
      });
    });

    it('should validate processor function', function(done) {
      batchProcessor.processLargeBatch([1, 2, 3], "not a function", function(err, results) {
        expect(err).to.be.an('error');
        expect(err.message).to.equal('Processor must be a function');
        done();
      });
    });

    it('should process small batches synchronously', function(done) {
      var items = [1, 2, 3, 4, 5];
      var processor = function(chunk) {
        return chunk.map(function(item) { return item * 2; });
      };

      batchProcessor.processLargeBatch(items, processor, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.deep.equal([2, 4, 6, 8, 10]);
        done();
      });
    });

    it('should process large batches with chunking', function(done) {
      var items = [];
      for (var i = 1; i <= 1000; i++) {
        items.push(i);
      }

      var processor = function(chunk) {
        return chunk.map(function(item) { return item * 2; });
      };

      var options = {
        chunkSize: 100,
        concurrency: 2,
        throttleMs: 1
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.have.length(1000);
        expect(results[0]).to.equal(2);
        expect(results[999]).to.equal(2000);
        done();
      });
    });

    it('should handle async processors with callbacks', function(done) {
      var items = [1, 2, 3];
      var processor = function(chunk, callback) {
        setTimeout(function() {
          var result = chunk.map(function(item) { return item * 3; });
          callback(null, result);
        }, 10);
      };

      batchProcessor.processLargeBatch(items, processor, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.deep.equal([3, 6, 9]);
        done();
      });
    });

    it('should handle promise-based processors', function(done) {
      var items = [1, 2, 3];
      var processor = function(chunk) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(chunk.map(function(item) { return item * 4; }));
          }, 10);
        });
      };

      batchProcessor.processLargeBatch(items, processor, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.deep.equal([4, 8, 12]);
        done();
      });
    });

    it('should retry failed operations', function(done) {
      var items = [1, 2, 3];
      var attempts = 0;
      var processor = function(chunk) {
        attempts++;
        if (attempts < 3) {
          throw new Error('Simulated failure');
        }
        return chunk.map(function(item) { return item * 2; });
      };

      var options = {
        maxRetries: 3,
        retryDelayMs: 10
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.deep.equal([2, 4, 6]);
        expect(attempts).to.equal(3);
        done();
      });
    });

    it('should report progress when callback provided', function(done) {
      var items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      var progressCalls = [];
      
      var processor = function(chunk) {
        return chunk.map(function(item) { return item * 2; });
      };

      var options = {
        chunkSize: 3,
        progressCallback: function(processed, total) {
          progressCalls.push({ processed: processed, total: total });
        }
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.null;
        expect(progressCalls).to.have.length.greaterThan(0);
        expect(progressCalls[0]).to.deep.equal({ processed: 0, total: 10 });
        var lastCall = progressCalls[progressCalls.length - 1];
        expect(lastCall.processed).to.equal(10);
        done();
      });
    });

    it('should handle processor errors gracefully', function(done) {
      var items = [1, 2, 3];
      var processor = function(chunk) {
        throw new Error('Processing error');
      };

      var options = {
        maxRetries: 1,
        retryDelayMs: 1
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.an('error');
        expect(err.message).to.equal('Processing error');
        done();
      });
    });

    it('should respect concurrency limits', function(done) {
      var items = [];
      for (var i = 1; i <= 100; i++) {
        items.push(i);
      }

      var activeTasks = 0;
      var maxConcurrency = 0;
      
      var processor = function(chunk, callback) {
        activeTasks++;
        maxConcurrency = Math.max(maxConcurrency, activeTasks);
        
        setTimeout(function() {
          activeTasks--;
          callback(null, chunk);
        }, 10);
      };

      var options = {
        chunkSize: 10,
        concurrency: 2,
        throttleMs: 1
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.null;
        expect(maxConcurrency).to.be.at.most(2);
        done();
      });
    });
  });

  describe('processLargeItemBatch function', function() {
    
    it('should process SharePoint list items', function(done) {
      var mockItems = [
        { Id: 1, Title: 'Item 1' },
        { Id: 2, Title: 'Item 2' },
        { Id: 3, Title: 'Item 3' }
      ];

      mockClient.listItems.listAll.callsArgWith(1, null, mockItems);

      var processor = function(chunk) {
        return chunk.map(function(item) {
          return { id: item.Id, title: item.Title.toUpperCase() };
        });
      };

      batchProcessor.processLargeItemBatch('TestList', processor, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.deep.equal([
          { id: 1, title: 'ITEM 1' },
          { id: 2, title: 'ITEM 2' },
          { id: 3, title: 'ITEM 3' }
        ]);
        expect(mockClient.listItems.listAll.calledOnce).to.be.true;
        done();
      });
    });

    it('should handle SharePoint API errors', function(done) {
      mockClient.listItems.listAll.callsArgWith(1, new Error('SharePoint error'));

      var processor = function(chunk) {
        return chunk;
      };

      batchProcessor.processLargeItemBatch('TestList', processor, function(err, results) {
        expect(err).to.be.an('error');
        expect(err.message).to.equal('SharePoint error');
        done();
      });
    });

    it('should preserve and restore client options', function(done) {
      var mockItems = [{ Id: 1, Title: 'Item 1' }];
      mockClient.listItems.listAll.callsArgWith(1, null, mockItems);
      mockClient.selectFields = ['Title'];
      mockClient.filterFields = [{ field: 'Status', value: 'Active' }];
      mockClient.$top = '100';

      var processor = function(chunk) {
        return chunk;
      };

      var options = {
        selectFields: ['Id', 'Title'],
        filterFields: [{ field: 'Type', value: 'Document' }],
        batchSize: 500
      };

      batchProcessor.processLargeItemBatch('TestList', processor, options, function(err, results) {
        expect(err).to.be.null;
        // Check that original client options are restored
        expect(mockClient.selectFields).to.deep.equal(['Title']);
        expect(mockClient.filterFields).to.deep.equal([{ field: 'Status', value: 'Active' }]);
        expect(mockClient.$top).to.equal('100');
        done();
      });
    });

    it('should handle options parameter correctly', function(done) {
      var mockItems = [{ Id: 1, Title: 'Item 1' }];
      mockClient.listItems.listAll.callsArgWith(1, null, mockItems);

      var processor = function(chunk) {
        return chunk;
      };

      // Test without options parameter
      batchProcessor.processLargeItemBatch('TestList', processor, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.have.length(1);
        done();
      });
    });
  });

  describe('performance characteristics', function() {
    
    it('should process large datasets efficiently', function(done) {
      this.timeout(5000); // Allow more time for large dataset
      
      var items = [];
      for (var i = 1; i <= 10000; i++) {
        items.push({ id: i, value: 'item' + i });
      }

      var startTime = Date.now();
      var processor = function(chunk) {
        return chunk.map(function(item) {
          return { id: item.id, processed: true };
        });
      };

      var options = {
        chunkSize: 100,
        concurrency: 3,
        throttleMs: 1,
        enableGC: false // Disable GC for test consistency
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        var endTime = Date.now();
        var processingTime = endTime - startTime;
        
        expect(err).to.be.null;
        expect(results).to.have.length(10000);
        expect(processingTime).to.be.below(3000); // Should complete within 3 seconds
        done();
      });
    });

    it('should handle memory efficiently with large chunks', function(done) {
      var items = [];
      for (var i = 1; i <= 1000; i++) {
        items.push({ id: i, data: new Array(100).join('x') }); // Larger objects
      }

      var processor = function(chunk) {
        return chunk.map(function(item) {
          return { id: item.id, size: item.data.length };
        });
      };

      var options = {
        chunkSize: 50,
        concurrency: 2,
        throttleMs: 5
      };

      batchProcessor.processLargeBatch(items, processor, options, function(err, results) {
        expect(err).to.be.null;
        expect(results).to.have.length(1000);
        done();
      });
    });
  });
});