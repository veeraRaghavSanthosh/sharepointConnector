var auths = {
  'basic': require('./auth/basic'),
  'ntlm': require('./auth/ntlm'),
  'online': require('./auth/online'),
  'onlinesaml' : require('./auth/onlinesaml')
},
makeSharepointResponsesLessAwful = require('./util/odata');

// Async version of the login function
async function loginAsync(client) {
  var type = client.auth.type;
  if (!type || (!client.auth.custom && !auths.hasOwnProperty(type))) {
    throw new Error('Unsupported auth type: ' + type);
  } 
  
  // Either use a built-in authenticator or a supplied custom function 
  // which exposes the expected functionality
  client.httpClient = auths[type] || client.auth.custom;

  var context = (!client.siteContext || client.siteContext === 'web') ? '' : '/' + client.siteContext,
  contextUrl = client.url + context + '/_api/contextinfo';
  var httpOpts = {
    url: contextUrl,
    method: 'post'
  };

  return new Promise((resolve, reject) => {
    client.httpClient(client, httpOpts, function (err, response, body) {
      if (err) {
        return reject(err);
      }
      if (response.statusCode.toString()[0] !== '2') {
        return reject(new Error('Unexpected status code ' + response.statusCode));
      }
      body = makeSharepointResponsesLessAwful(body);

      if (!body.GetContextWebInformation || !body.GetContextWebInformation.FormDigestValue) {
        return reject({
          message: 'Failed to load default context from response body',
          body: body
        });
      }
      client.baseContext = body.GetContextWebInformation.FormDigestValue;
      resolve({ response, body });
    });
  });
}

module.exports = function(client) {
  var type = client.auth.type;
  if (!type || (!client.auth.custom && !auths.hasOwnProperty(type))) {
    return function(cb) {
      if (typeof cb === 'function') {
        return cb('Unsupported auth type: ' + type);
      }
      return Promise.reject(new Error('Unsupported auth type: ' + type));
    };
  } 
  
  // Either use a built-in authenticator or a supplied custom function 
  // which exposes the expected functionality
  client.httpClient = auths[type] || client.auth.custom;

  // Return a function that supports both callback and promise patterns
  return function (cb) {
    // If no callback provided, return a promise
    if (typeof cb !== 'function') {
      return loginAsync(client);
    }

    // Backward compatibility: support callback pattern
    var context = (!client.siteContext || client.siteContext === 'web') ? '' : '/' + client.siteContext,
    contextUrl = client.url + context + '/_api/contextinfo';
    var httpOpts = {
      url: contextUrl,
      method: 'post'
    };

    // Call the implementing HTTP client, then handle the response generically
    return client.httpClient(client, httpOpts, function (err, response, body) {
      if (err) {
        return cb(err);
      }
      if (response.statusCode.toString()[0] !== '2') {
        return cb('Unexpected status code ' + response.statusCode);
      }
      body = makeSharepointResponsesLessAwful(body);

      if (!body.GetContextWebInformation || !body.GetContextWebInformation.FormDigestValue) {
        return cb({
          message: 'Failed to load default context from response body',
          body: body
        });
      }
      client.baseContext = body.GetContextWebInformation.FormDigestValue;
      return cb(null, response, body);
    });
  };
};

// Export async version for direct use
module.exports.async = loginAsync;