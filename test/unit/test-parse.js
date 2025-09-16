/*
 * Unit tests for src/utils/parse.js
 * Tests both async/await functions and legacy callback compatibility
 */

var assert = require('assert');
var parse = require('../../src/utils/parse');

describe('Parse Utilities', function() {
  
  describe('parseSamlResponse', function() {
    var mockClient = { url: 'https://test.sharepoint.com' };
    var mockHttpOpts = { method: 'POST' };
    
    it('should return assertion when returnAssertion is true', function(done) {
      var httpOpts = { returnAssertion: true };
      var samlBody = '<saml:Assertion>test</saml:Assertion>';
      
      parse.parseSamlResponse(mockClient, httpOpts, samlBody)
        .then(function(result) {
          assert.strictEqual(result.client, mockClient);
          assert.strictEqual(result.httpOpts, httpOpts);
          assert.strictEqual(result.assertion, samlBody);
          done();
        })
        ['catch'](done);
    });
    
    it('should parse valid SAML response and extract token', function(done) {
      var validSamlResponse = 
        '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">' +
          '<S:Body>' +
            '<wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust">' +
              '<wst:RequestedSecurityToken>' +
                '<wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">' +
                  'test-token-value' +
                '</wsse:BinarySecurityToken>' +
              '</wst:RequestedSecurityToken>' +
            '</wst:RequestSecurityTokenResponse>' +
          '</S:Body>' +
        '</S:Envelope>';
      
      parse.parseSamlResponse(mockClient, mockHttpOpts, validSamlResponse)
        .then(function(result) {
          assert.strictEqual(result.client, mockClient);
          assert.strictEqual(result.httpOpts, mockHttpOpts);
          assert.strictEqual(result.token, 'test-token-value');
          done();
        })
        ['catch'](done);
    });
    
    it('should throw error when SAML fault is detected', function(done) {
      var faultResponse = 
        '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">' +
          '<S:Body>' +
            '<S:Fault>' +
              '<faultcode>Client</faultcode>' +
              '<faultstring>Authentication failed</faultstring>' +
            '</S:Fault>' +
          '</S:Body>' +
        '</S:Envelope>';
      
      parse.parseSamlResponse(mockClient, mockHttpOpts, faultResponse)
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert.strictEqual(err.message, 'Error logging in - SAML fault detected');
          done();
        });
    });
    
    it('should throw error when no token is found', function(done) {
      var noTokenResponse = 
        '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">' +
          '<S:Body>' +
            '<wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust">' +
              '<wst:RequestedSecurityToken>' +
              '</wst:RequestedSecurityToken>' +
            '</wst:RequestSecurityTokenResponse>' +
          '</S:Body>' +
        '</S:Envelope>';
      
      parse.parseSamlResponse(mockClient, mockHttpOpts, noTokenResponse)
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert.strictEqual(err.message, 'No token found in response body');
          done();
        });
    });
    
    it('should throw error for invalid XML', function(done) {
      var invalidXml = '<invalid>xml<unclosed>';
      
      parse.parseSamlResponse(mockClient, mockHttpOpts, invalidXml)
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert(err.message.indexOf('Error parsing XML') !== -1);
          done();
        });
    });
  });
  
  describe('parseFilterField', function() {
    it('should parse valid JSON filter field', function(done) {
      var validJson = '{"field":"Title","value":"Test Item"}';
      
      parse.parseFilterField(validJson)
        .then(function(result) {
          assert.strictEqual(result.field, 'Title');
          assert.strictEqual(result.value, 'Test Item');
          done();
        })
        ['catch'](done);
    });
    
    it('should throw error for invalid JSON', function(done) {
      var invalidJson = '{"field":"Title","value":}';
      
      parse.parseFilterField(invalidJson)
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert(err.message.indexOf('Unable to parse filterFields') !== -1);
          done();
        });
    });
  });
  
  describe('parseFilterFields', function() {
    it('should parse array of valid JSON filter fields', function(done) {
      var filterFields = [
        '{"field":"Title","value":"Test Item"}',
        '{"field":"Status","value":"Active"}'
      ];
      
      parse.parseFilterFields(filterFields)
        .then(function(result) {
          assert.strictEqual(result.length, 2);
          assert.strictEqual(result[0].field, 'Title');
          assert.strictEqual(result[0].value, 'Test Item');
          assert.strictEqual(result[1].field, 'Status');
          assert.strictEqual(result[1].value, 'Active');
          done();
        })
        ['catch'](done);
    });
    
    it('should throw error if input is not an array', function(done) {
      parse.parseFilterFields('not an array')
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert.strictEqual(err.message, 'filterFields must be an array');
          done();
        });
    });
    
    it('should reject if any filter field is invalid JSON', function(done) {
      var filterFields = [
        '{"field":"Title","value":"Test Item"}',
        '{"field":"Status","value":}'  // Invalid JSON
      ];
      
      parse.parseFilterFields(filterFields)
        .then(function() {
          done(new Error('Should have thrown an error'));
        })
        ['catch'](function(err) {
          assert(err.message.indexOf('Unable to parse filterFields') !== -1);
          done();
        });
    });
  });
  
  describe('Legacy callback functions', function() {
    describe('parseSamlResponseCallback', function() {
      it('should work with callback pattern for successful parsing', function(done) {
        var mockClient = { url: 'https://test.sharepoint.com' };
        var mockHttpOpts = { method: 'POST' };
        var validSamlResponse = 
          '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<S:Body>' +
              '<wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust">' +
                '<wst:RequestedSecurityToken>' +
                  '<wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">' +
                    'test-token-value' +
                  '</wsse:BinarySecurityToken>' +
                '</wst:RequestedSecurityToken>' +
              '</wst:RequestSecurityTokenResponse>' +
            '</S:Body>' +
          '</S:Envelope>';
        
        parse.parseSamlResponseCallback(mockClient, mockHttpOpts, validSamlResponse, function(err, client, httpOpts, token) {
          assert.strictEqual(err, null);
          assert.strictEqual(client, mockClient);
          assert.strictEqual(httpOpts, mockHttpOpts);
          assert.strictEqual(token, 'test-token-value');
          done();
        });
      });
      
      it('should work with callback pattern for assertion return', function(done) {
        var mockClient = { url: 'https://test.sharepoint.com' };
        var mockHttpOpts = { returnAssertion: true };
        var samlBody = '<saml:Assertion>test</saml:Assertion>';
        
        parse.parseSamlResponseCallback(mockClient, mockHttpOpts, samlBody, function(err, assertion) {
          assert.strictEqual(err, null);
          assert.strictEqual(assertion, samlBody);
          done();
        });
      });
      
      it('should call callback with error for parsing failures', function(done) {
        var mockClient = { url: 'https://test.sharepoint.com' };
        var mockHttpOpts = { method: 'POST' };
        var invalidXml = '<invalid>xml<unclosed>';
        
        parse.parseSamlResponseCallback(mockClient, mockHttpOpts, invalidXml, function(err) {
          assert(typeof err === 'string');
          assert(err.indexOf('Error parsing XML') !== -1);
          done();
        });
      });
    });
  });
});