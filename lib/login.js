var auths = {
  'basic': require('./auth/basic'),
  'ntlm': require('./auth/ntlm'),
  'online': require('./auth/online'),
  'onlinesaml' : require('./auth/onlinesaml')
},
makeSharepointResponsesLessAwful = require('./util/odata');

module.exports = function(client) {
  var type = client.auth.type;
  if (!type || (!client.auth.custom && !auths.hasOwnProperty(type))) {
    return cb('Unsupported auth type: ' + type);
  } 
  
  // Either use a built-in authenticator or a supplied custom function 
  // which exposes the expected functionality
  client.httpClient = auths[type] || client.auth.custom;

  return async function (cb) {
    try {
      var context = (!client.siteContext || client.siteContext === 'web') ? '' : '/' + client.siteContext,
      contextUrl = client.url + context + '/_api/contextinfo';
      var httpOpts = {
        url: contextUrl,
        method: 'post'
      };

      // Call the implementing HTTP client, then handle the response generically
      const result = await client.httpClient(client, httpOpts);
      const response = Array.isArray(result) ? result[0] : result;
      const body = Array.isArray(result) ? result[1] : result;
      
      if (response.statusCode.toString()[0] !== '2') {
        throw new Error('Unexpected status code ' + response.statusCode);
      }
      
      const processedBody = makeSharepointResponsesLessAwful(body);

      if (!processedBody.GetContextWebInformation || !processedBody.GetContextWebInformation.FormDigestValue) {
        throw new Error('Failed to load default context from response body: ' + JSON.stringify({
          message: 'Failed to load default context from response body',
          body: processedBody
        }));
      }
      
      client.baseContext = processedBody.GetContextWebInformation.FormDigestValue;
      
      // Call callback for backward compatibility
      if (cb) cb(null, response, processedBody);
      return [response, processedBody];
      
    } catch (error) {
      // Call callback with error for backward compatibility
      if (cb) cb(error);
      throw error;
    }
  };
};