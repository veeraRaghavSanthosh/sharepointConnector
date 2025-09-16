/**
 * Unit tests for the request wrapper
 * Tests the migration from request library to axios
 */

const assert = require('assert');
const nock = require('nock');
const request = require('../../lib/util/requestWrapper');

describe('Request Wrapper', function() {
  
  beforeEach(function() {
    nock.cleanAll();
  });

  after(function() {
    nock.cleanAll();
  });

  describe('Basic HTTP requests', function() {
    
    it('should make a GET request successfully', function(done) {
      const scope = nock('https://example.com')
        .get('/test')
        .reply(200, { message: 'success' });

      request('https://example.com/test', function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.deepEqual(body, { message: 'success' });
        scope.done();
        done();
      });
    });

    it('should make a POST request with JSON data', function(done) {
      const testData = { name: 'test', value: 123 };
      
      const scope = nock('https://example.com')
        .post('/api/data', testData)
        .reply(201, { id: 1, ...testData });

      request({
        url: 'https://example.com/api/data',
        method: 'POST',
        json: testData
      }, function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 201);
        assert.equal(body.id, 1);
        assert.equal(body.name, 'test');
        scope.done();
        done();
      });
    });

    it('should handle authentication', function(done) {
      const scope = nock('https://example.com')
        .get('/secure')
        .basicAuth({ user: 'testuser', pass: 'testpass' })
        .reply(200, { authenticated: true });

      request({
        url: 'https://example.com/secure',
        auth: {
          username: 'testuser',
          password: 'testpass'
        }
      }, function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.deepEqual(body, { authenticated: true });
        scope.done();
        done();
      });
    });

    it('should handle HTTP errors gracefully', function(done) {
      const scope = nock('https://example.com')
        .get('/notfound')
        .reply(404, { error: 'Not Found' });

      request('https://example.com/notfound', function(err, response, body) {
        assert.ifError(err); // Should not have an error, just a 404 response
        assert.equal(response.statusCode, 404);
        assert.deepEqual(body, { error: 'Not Found' });
        scope.done();
        done();
      });
    });

    it('should handle network errors', function(done) {
      const scope = nock('https://example.com')
        .get('/error')
        .replyWithError('Network Error');

      request('https://example.com/error', function(err, response, body) {
        assert(err);
        assert.equal(err.message, 'Network Error');
        scope.done();
        done();
      });
    });

  });

  describe('Request.get method', function() {
    
    it('should work with string URL', function(done) {
      const scope = nock('https://example.com')
        .get('/get-test')
        .reply(200, 'GET success');

      request.get('https://example.com/get-test', function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.equal(body, 'GET success');
        scope.done();
        done();
      });
    });

    it('should work with options object', function(done) {
      const scope = nock('https://example.com')
        .get('/get-options')
        .reply(200, { method: 'GET' });

      request.get({
        url: 'https://example.com/get-options',
        json: true
      }, function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.deepEqual(body, { method: 'GET' });
        scope.done();
        done();
      });
    });

  });

  describe('Request.post method', function() {
    
    it('should work with options object', function(done) {
      const postData = { test: 'data' };
      
      const scope = nock('https://example.com')
        .post('/post-test', postData)
        .reply(200, { received: postData });

      request.post({
        url: 'https://example.com/post-test',
        json: postData
      }, function(err, response, body) {
        assert.ifError(err);
        assert.equal(response.statusCode, 200);
        assert.deepEqual(body.received, postData);
        scope.done();
        done();
      });
    });

  });

});