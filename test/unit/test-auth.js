var assert = require('assert'),
    nock = require('nock'),
    sharepointconnector = require('../../sharepointconnector.js');

// Test fixtures
var contextFixture = require('../fixtures/context');

describe('Authentication Tests', function() {
  var mockHost = 'https://test.sharepoint.com';
  var validCredentials = {
    username: 'testuser',
    password: 'testpass',
    url: mockHost,
    type: 'basic',
    strictSSL: false
  };

  beforeEach(function() {
    // Clean up any previous nock interceptors
    nock.cleanAll();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  describe('Client Initialization', function() {
    it('should throw error when username is missing', function() {
      assert.throws(function() {
        sharepointconnector({
          password: 'testpass',
          url: mockHost
        });
      }, /SharePoint client needs a username, password and instance URL/);
    });

    it('should throw error when password is missing', function() {
      assert.throws(function() {
        sharepointconnector({
          username: 'testuser',
          url: mockHost
        });
      }, /SharePoint client needs a username, password and instance URL/);
    });

    it('should throw error when URL is missing', function() {
      assert.throws(function() {
        sharepointconnector({
          username: 'testuser',
          password: 'testpass'
        });
      }, /SharePoint client needs a username, password and instance URL/);
    });

    it('should initialize successfully with valid credentials', function() {
      var client = sharepointconnector(validCredentials);
      assert.ok(client);
      assert.ok(client.login);
      assert.ok(client.lists);
      assert.ok(client.listItems);
    });

    it('should default to basic auth when type is not specified', function() {
      var client = sharepointconnector({
        username: 'testuser',
        password: 'testpass',
        url: mockHost
      });
      assert.ok(client);
    });
  });

  describe('Basic Authentication', function() {
    it('should successfully authenticate with valid credentials', function(done) {
      // Mock the contextinfo endpoint
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        assert.equal(response.statusCode, 200, 'Should return 200 status');
        done();
      });
    });

    it('should handle authentication failure with 401 status', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(401, 'Unauthorized');

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.equal(err, 'Unexpected status code 401');
        done();
      });
    });

    it('should handle authentication failure with 403 status', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(403, 'Forbidden');

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.equal(err, 'Unexpected status code 403');
        done();
      });
    });

    it('should handle network errors', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .replyWithError('Network error');

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.message.includes('Network error'));
        done();
      });
    });

    it('should handle malformed response body', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(200, { invalid: 'response' });

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.message.includes('Failed to load default context'));
        done();
      });
    });

    it('should handle empty response body', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(200, '');

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });
  });

  describe('NTLM Authentication', function() {
    var ntlmCredentials = {
      username: 'testuser',
      password: 'testpass',
      url: mockHost,
      type: 'ntlm',
      domain: 'TESTDOMAIN',
      workstation: 'TESTWORKSTATION',
      strictSSL: false
    };

    it('should successfully authenticate with valid NTLM credentials', function(done) {
      // Mock NTLM Type 1 request
      nock(mockHost)
        .get('/_api/contextinfo')
        .reply(401, '', {
          'www-authenticate': 'NTLM TlRMTVNTUAACAAAAAAAAAAAoAAABggAAASNFZ4mrze8AAAAAAAAAAGIAYgAoAAAABgOAJQAAAA9TAEUAUgBWAEUAUgACABAAUwBFAFIAVgBFAFIAAQAQAFMARQBSAFYARQBSAAQAEABzAGUAcgB2AGUAcgADABAAcwBlAHIAdgBlAHIABwAIAE2gSNWCF6cBAAAAAAA='
        });

      // Mock NTLM Type 3 request
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(ntlmCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        done();
      });
    });

    it('should handle missing www-authenticate header', function(done) {
      nock(mockHost)
        .get('/_api/contextinfo')
        .reply(401, '', {});

      var client = sharepointconnector(ntlmCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });

    it('should handle NTLM authentication failure', function(done) {
      nock(mockHost)
        .get('/_api/contextinfo')
        .reply(401, '', {
          'www-authenticate': 'NTLM TlRMTVNTUAACAAAAAAAAAAAoAAABggAAASNFZ4mrze8AAAAAAAAAAGIAYgAoAAAABgOAJQAAAA9TAEUAUgBWAEUAUgACABAAUwBFAFIAVgBFAFIAAQAQAFMARQBSAFYARQBSAAQAEABzAGUAcgB2AGUAcgADABAAcwBlAHIAdgBlAHIABwAIAE2gSNWCF6cBAAAAAAA='
        });

      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(401, 'Authentication failed');

      var client = sharepointconnector(ntlmCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.equal(err, 'Unexpected status code 401');
        done();
      });
    });
  });

  describe('Online Authentication', function() {
    var onlineCredentials = {
      username: 'testuser@tenant.onmicrosoft.com',
      password: 'testpass',
      url: 'https://tenant.sharepoint.com',
      type: 'online',
      strictSSL: false
    };

    it('should successfully authenticate with valid online credentials', function(done) {
      // Mock STS login
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .reply(200, '<?xml version="1.0" encoding="utf-8"?><S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope"><S:Body><wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust"><wst:RequestedSecurityToken><wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">dGVzdCB0b2tlbg==</wsse:BinarySecurityToken></wst:RequestedSecurityToken></wst:RequestSecurityTokenResponse></S:Body></S:Envelope>');

      // Mock token to cookie conversion
      nock('https://tenant.sharepoint.com')
        .post('/_forms/default.aspx?wa=wsignin1.0')
        .reply(302, '', {
          'set-cookie': ['FedAuth=testfedauth; path=/; secure; HttpOnly', 'rtFa=testrtfa; path=/; secure; HttpOnly']
        });

      // Mock context info request
      nock('https://tenant.sharepoint.com')
        .post('/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(onlineCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        done();
      });
    });

    it('should handle STS login failure', function(done) {
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .reply(401, 'Authentication failed');

      var client = sharepointconnector(onlineCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });

    it('should handle SAML fault in response', function(done) {
      var samlFaultResponse = '<?xml version="1.0" encoding="utf-8"?><S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope"><S:Body><S:Fault><S:Code><S:Value>S:Sender</S:Value></S:Code><S:Reason><S:Text>Authentication Failure</S:Text></S:Reason></S:Fault></S:Body></S:Envelope>';
      
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .reply(200, samlFaultResponse);

      var client = sharepointconnector(onlineCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.includes('SAML fault detected'));
        done();
      });
    });

    it('should handle missing token in SAML response', function(done) {
      var invalidSamlResponse = '<?xml version="1.0" encoding="utf-8"?><S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope"><S:Body><wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust"><wst:RequestedSecurityToken></wst:RequestedSecurityToken></wst:RequestSecurityTokenResponse></S:Body></S:Envelope>';
      
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .reply(200, invalidSamlResponse);

      var client = sharepointconnector(onlineCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.includes('No token found'));
        done();
      });
    });

    it('should handle timeout during STS login', function(done) {
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .delayConnection(6000) // Delay longer than SP_ONLINE_TIMEOUT (5000ms)
        .reply(200, 'response');

      var client = sharepointconnector(onlineCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });
  });

  describe('Online SAML Authentication', function() {
    var onlineSamlCredentials = {
      username: 'testuser@company.com',
      password: 'testpass',
      url: 'https://company.sharepoint.com',
      type: 'onlinesaml',
      federatedAuthUrl: 'https://sts.company.com/adfs/services/trust/2005/usernamemixed',
      strictSSL: false
    };

    it('should successfully authenticate with valid federated credentials', function(done) {
      // Mock federated STS login
      nock('https://sts.company.com')
        .post('/adfs/services/trust/2005/usernamemixed')
        .reply(200, '<?xml version="1.0" encoding="utf-8"?><S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope"><S:Body><wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust"><wst:RequestedSecurityToken><Assertion xmlns="urn:oasis:names:tc:SAML:1.0:assertion">test assertion</Assertion></wst:RequestedSecurityToken></wst:RequestSecurityTokenResponse></S:Body></S:Envelope>');

      // Mock Microsoft STS login
      nock('https://login.microsoftonline.com')
        .post('/extSTS.srf')
        .reply(200, '<?xml version="1.0" encoding="utf-8"?><S:Envelope xmlns:S="http://www.w3.org/2003/05/soap-envelope"><S:Body><wst:RequestSecurityTokenResponse xmlns:wst="http://schemas.xmlsoap.org/ws/2005/02/trust"><wst:RequestedSecurityToken><wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">dGVzdCB0b2tlbg==</wsse:BinarySecurityToken></wst:RequestedSecurityToken></wst:RequestSecurityTokenResponse></S:Body></S:Envelope>');

      // Mock token to cookie conversion
      nock('https://company.sharepoint.com')
        .post('/_forms/default.aspx?wa=wsignin1.0')
        .reply(302, '', {
          'set-cookie': ['FedAuth=testfedauth; path=/; secure; HttpOnly', 'rtFa=testrtfa; path=/; secure; HttpOnly']
        });

      // Mock context info request
      nock('https://company.sharepoint.com')
        .post('/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(onlineSamlCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        done();
      });
    });

    it('should handle federated STS authentication failure', function(done) {
      nock('https://sts.company.com')
        .post('/adfs/services/trust/2005/usernamemixed')
        .reply(401, 'Authentication failed');

      var client = sharepointconnector(onlineSamlCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });

    it('should handle missing federatedAuthUrl', function(done) {
      var invalidCredentials = {
        username: 'testuser@company.com',
        password: 'testpass',
        url: 'https://company.sharepoint.com',
        type: 'onlinesaml',
        strictSSL: false
      };

      var client = sharepointconnector(invalidCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        done();
      });
    });
  });

  describe('Unsupported Authentication Type', function() {
    it('should handle unsupported authentication type', function(done) {
      var invalidCredentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        type: 'unsupported',
        strictSSL: false
      };

      var client = sharepointconnector(invalidCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.includes('Unsupported auth type'));
        done();
      });
    });
  });

  describe('Custom Authentication', function() {
    it('should support custom authenticator function', function(done) {
      var customAuthenticator = function(client, httpOpts, cb) {
        // Mock custom authenticator
        setTimeout(function() {
          cb(null, { statusCode: 200 }, contextFixture);
        }, 10);
      };

      var customCredentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        authenticator: customAuthenticator,
        strictSSL: false
      };

      var client = sharepointconnector(customCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        done();
      });
    });

    it('should handle custom authenticator error', function(done) {
      var customAuthenticator = function(client, httpOpts, cb) {
        cb(new Error('Custom auth failed'));
      };

      var customCredentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        authenticator: customAuthenticator,
        strictSSL: false
      };

      var client = sharepointconnector(customCredentials);
      
      client.login(function(err) {
        assert.ok(err, 'Should have error');
        assert.ok(err.message.includes('Custom auth failed'));
        done();
      });
    });
  });

  describe('Context Handling', function() {
    it('should handle different site contexts', function(done) {
      var contextCredentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        context: 'mysite',
        type: 'basic',
        strictSSL: false
      };

      nock(mockHost)
        .post('/mysite/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(contextCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        assert.ok(response, 'Should have response');
        assert.ok(body, 'Should have body');
        done();
      });
    });

    it('should default to web context when not specified', function(done) {
      nock(mockHost)
        .post('/_api/contextinfo')
        .reply(200, contextFixture);

      var client = sharepointconnector(validCredentials);
      
      client.login(function(err, response, body) {
        assert.ok(!err, 'Should not have error: ' + JSON.stringify(err));
        done();
      });
    });
  });

  describe('Boundary Cases', function() {
    it('should handle very long usernames', function() {
      var longUsername = 'a'.repeat(1000) + '@test.com';
      var credentials = {
        username: longUsername,
        password: 'testpass',
        url: mockHost,
        type: 'basic'
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });

    it('should handle very long passwords', function() {
      var longPassword = 'a'.repeat(1000);
      var credentials = {
        username: 'testuser',
        password: longPassword,
        url: mockHost,
        type: 'basic'
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });

    it('should handle special characters in credentials', function() {
      var credentials = {
        username: 'test@user!#$%^&*()_+-=[]{}|;:,.<>?',
        password: 'test!@#$%^&*()_+-=[]{}|;:,.<>?pass',
        url: mockHost,
        type: 'basic'
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });

    it('should handle empty string values for optional parameters', function() {
      var credentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        type: 'basic',
        domain: '',
        workstation: '',
        context: ''
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });

    it('should handle null values for optional parameters', function() {
      var credentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        type: 'basic',
        domain: null,
        workstation: null,
        context: null
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });

    it('should handle undefined values for optional parameters', function() {
      var credentials = {
        username: 'testuser',
        password: 'testpass',
        url: mockHost,
        type: 'basic',
        domain: undefined,
        workstation: undefined,
        context: undefined
      };

      var client = sharepointconnector(credentials);
      assert.ok(client);
    });
  });
});