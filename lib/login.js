var auths = {
  'basic': require('./auth/basic'),
  'ntlm': require('./auth/ntlm'),
  'online': require('./auth/online'),
  'onlinesaml' : require('./auth/onlinesaml')
},
makeSharepointResponsesLessAwful = require('./util/odata'),
logger;

module.exports = function(client) {
  logger = require('./util/logger').createLogger(client, 'login');
  var type = client.auth.type;
  
  logger.trace('login() called', {
    authType: type,
    username: client.auth.username ? client.auth.username.substring(0, 3) + '***' : 'not provided',
    url: client.url,
    siteContext: client.siteContext
  });
  
  if (!type || (!client.auth.custom && !auths.hasOwnProperty(type))) {
    logger.error('Unsupported authentication type', { authType: type, supportedTypes: Object.keys(auths) });
    return cb('Unsupported auth type: ' + type);
  } 
  
  logger.debug('Authentication type validated', { authType: type });
  
  // Either use a built-in authenticator or a supplied custom function 
  // which exposes the expected functionality
  client.httpClient = auths[type] || client.auth.custom;
  
  logger.debug('HTTP client configured for authentication', { 
    authType: type,
    isCustomAuth: !!client.auth.custom
  });

  return function (cb) {
    var context = (!client.siteContext || client.siteContext === 'web') ? '' : '/' + client.siteContext,
    contextUrl = client.url + context + '/_api/contextinfo';
    
    logger.debug('Preparing context info request', {
      contextUrl: contextUrl,
      siteContext: client.siteContext,
      authType: client.auth.type
    });
    
    var httpOpts = {
      url: contextUrl,
      method: 'post'
    };

    logger.trace('Making context info request to SharePoint');
    
    // Call the implementing HTTP client, then handle the response generically
    return client.httpClient(client, httpOpts, function (err, response, body) {
      if (err) {
        logger.error('Authentication failed during context info request', {
          error: err,
          contextUrl: contextUrl,
          authType: client.auth.type
        });
        return cb(err);
      }
      
      logger.debug('Received context info response', {
        statusCode: response.statusCode,
        hasBody: !!body
      });
      
      if (response.statusCode.toString()[0] !== '2') {
        logger.error('Authentication failed with unexpected status code', {
          statusCode: response.statusCode,
          authType: client.auth.type,
          contextUrl: contextUrl
        });
        return cb('Unexpected status code ' + response.statusCode);
      }
      
      body = makeSharepointResponsesLessAwful(body);

      if (!body.GetContextWebInformation || !body.GetContextWebInformation.FormDigestValue) {
        logger.error('Invalid context response - missing FormDigestValue', {
          hasContextInfo: !!body.GetContextWebInformation,
          hasDigestValue: !!(body.GetContextWebInformation && body.GetContextWebInformation.FormDigestValue),
          authType: client.auth.type
        });
        return cb({
          message: 'Failed to load default context from response body',
          body: body
        });
      }
      
      client.baseContext = body.GetContextWebInformation.FormDigestValue;
      
      logger.info('Authentication successful', {
        authType: client.auth.type,
        username: client.auth.username ? client.auth.username.substring(0, 3) + '***' : 'not provided',
        contextLength: client.baseContext ? client.baseContext.length : 0
      });
      
      logger.trace('Login completed successfully with context', {
        baseContextPreview: client.baseContext ? client.baseContext.substring(0, 20) + '...' : 'none'
      });
      
      return cb(null, response, body);
    });
  };
};
