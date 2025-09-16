var auth = require('./auth'),
makeSharepointResponsesLessAwful = require('./util/odata');

module.exports = function(client) {
  var type = client.auth.type;
  var supportedTypes = ['basic', 'ntlm', 'online', 'onlinesaml'];
  
  if (!type || (!client.auth.custom && supportedTypes.indexOf(type) === -1)) {
    throw new Error('Unsupported auth type: ' + type);
  } 
  
  // Use the new consolidated auth module
  client.httpClient = auth.authCallback;

  return function (cb) {
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
