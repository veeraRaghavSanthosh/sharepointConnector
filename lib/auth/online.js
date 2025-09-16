var getSamlBody = require('./online/samlBody'),
samlLogin = require('./online/samlLogin'),
samlResponse = require('./online/samlResponse'),
samlTokenToCookie = require('./online/samlTokenToCookie'),
authenticatedRequestClient = require('./online/authenticatedRequestClient'),
constants = require('../constants');

module.exports = async function(client, httpOpts, cb) {
  try {
    // If we're already auth'd, continue as normal with our valid tokens
    if (!client.FedAuth || !client.rtFa){
      // Step 1: Generate SAML body
      const [client1, httpOpts1, toUrl1, samlBody] = await getSamlBody(client, httpOpts, constants.STS_LOGIN_URL, client.url, null);
      
      // Step 2: Perform SAML login
      const [client2, httpOpts2, samlResponseBody] = await samlLogin(client1, httpOpts1, toUrl1, samlBody);
      
      // Step 3: Parse SAML response
      const [client3, httpOpts3, token] = await samlResponse(client2, httpOpts2, samlResponseBody);
      
      // Step 4: Exchange token for cookies
      const [client4, httpOpts4] = await samlTokenToCookie(client3, httpOpts3, token);
      
      // Step 5: Make authenticated request
      const result = await authenticatedRequestClient(client4, httpOpts4);
      
      // Call callback for backward compatibility
      if (cb) cb(null, result[0], result[1]);
      return result;
    } else {
      // Already authenticated, make request directly
      const result = await authenticatedRequestClient(client, httpOpts);
      
      // Call callback for backward compatibility
      if (cb) cb(null, result[0], result[1]);
      return result;
    }
  } catch (error) {
    // Call callback with error for backward compatibility
    if (cb) cb(error);
    throw error;
  }
};