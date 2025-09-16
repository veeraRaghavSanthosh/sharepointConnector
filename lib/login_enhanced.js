var auths = {
  'basic': require('./auth/basic'),
  'ntlm': require('./auth/ntlm'),
  'online': require('./auth/online'),
  'onlinesaml' : require('./auth/onlinesaml')
},
makeSharepointResponsesLessAwful = require('./util/odata'),
logger = require('./util/logger'); // New: Import logger module

module.exports = function(client) {
  var log = logger(client); // New: Initialize logger with client config
  var type = client.auth.type;
  
  if (!type || (!client.auth.custom && !auths.hasOwnProperty(type))) {
    var errorMsg = 'Unsupported auth type: ' + type;
    // New: Log authentication type error
    log.error('notification', 'Unsupported authentication type', { 
      authType: type, 
      supportedTypes: Object.keys(auths) 
    });
    return cb(errorMsg);
  } 
  
  // New: Log authentication method selection
  log.info('notification', 'Authentication method selected', { 
    authType: type,
    isCustom: !!client.auth.custom 
  });
  
  // Either use a built-in authenticator or a supplied custom function 
  // which exposes the expected functionality
  client.httpClient = auths[type] || client.auth.custom;

  return function (cb) {
    var context = (!client.siteContext || client.siteContext === 'web') ? '' : '/' + client.siteContext,
    contextUrl = client.url + context + '/_api/contextinfo';
    var httpOpts = {
      url: contextUrl,
      method: 'post'
    };

    // New: Log login attempt
    log.info('notification', 'Initiating SharePoint login', { 
      contextUrl: contextUrl,
      siteContext: client.siteContext,
      authType: type 
    });

    // Call the implementing HTTP client, then handle the response generically
    return client.httpClient(client, httpOpts, function (err, response, body) {
      if (err) {
        // New: Log login error
        log.error('notification', 'SharePoint login failed', { 
          contextUrl: contextUrl,
          error: err 
        });
        return cb(err);
      }
      if (response.statusCode.toString()[0] !== '2') {
        var statusError = 'Unexpected status code ' + response.statusCode;
        // New: Log status code error during login
        log.error('notification', 'SharePoint login returned non-success status', { 
          contextUrl: contextUrl,
          statusCode: response.statusCode,
          error: statusError 
        });
        return cb(statusError);
      }
      
      // New: Log successful authentication response
      log.debug('notification', 'SharePoint authentication response received', { 
        contextUrl: contextUrl,
        statusCode: response.statusCode,
        hasBody: !!body 
      });
      
      body = makeSharepointResponsesLessAwful(body);

      if (!body.GetContextWebInformation || !body.GetContextWebInformation.FormDigestValue) {
        var contextError = {
          message: 'Failed to load default context from response body',
          body: body
        };
        // New: Log context loading error
        log.error('notification', 'Failed to extract context information', { 
          contextUrl: contextUrl,
          responseBody: body,
          error: contextError.message 
        });
        return cb(contextError);
      }
      
      client.baseContext = body.GetContextWebInformation.FormDigestValue;
      
      // New: Log successful login completion
      log.info('notification', 'SharePoint login completed successfully', { 
        contextUrl: contextUrl,
        hasFormDigest: !!client.baseContext 
      });
      
      return cb(null, response, body);
    });
  };
};