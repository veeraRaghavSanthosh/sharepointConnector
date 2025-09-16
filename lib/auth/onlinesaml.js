var _ = require('underscore'),
underscoreDeepExtend = require('underscore-deep-extend'),
getSamlBody = require('./online/samlBody'),
samlLogin = require('./online/samlLogin'),
samlResponse = require('./online/samlResponse'),
samlAssertionResponse = require('./online/samlAssertionResponse'),
samlTokenToCookie = require('./online/samlTokenToCookie'),
authenticatedRequestClient = require('./online/authenticatedRequestClient');

_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

module.exports = async function(client, httpOpts, cb) {
  try {
    //console.log("client",JSON.stringify(client));

    if (!client.FedAuth || !client.rtFa){
      // Step 1: Generate initial SAML body
      const [client1, httpOpts1, toUrl1, samlBody1] = await getSamlBody(client, httpOpts, client.federatedAuthUrl, 'urn:federation:MicrosoftOnline', null);
      
      // Step 2: Perform initial SAML login
      const [client2, httpOpts2, samlResponseBody1] = await samlLogin(client1, httpOpts1, toUrl1, samlBody1);
      
      // Step 3: Extract SAML assertion
      const [client3, httpOpts3, stsUrl, clientUrl, assertion] = await samlAssertionResponse(client2, httpOpts2, samlResponseBody1);
      
      // Step 4: Generate second SAML body with assertion
      const [client4, httpOpts4, toUrl4, samlBody2] = await getSamlBody(client3, httpOpts3, stsUrl, clientUrl, assertion);
      
      // Step 5: Perform second SAML login
      const [client5, httpOpts5, samlResponseBody2] = await samlLogin(client4, httpOpts4, toUrl4, samlBody2);
      
      // Step 6: Parse SAML response to get token
      const [client6, httpOpts6, token] = await samlResponse(client5, httpOpts5, samlResponseBody2);
      
      // Step 7: Exchange token for cookies
      const [client7, httpOpts7] = await samlTokenToCookie(client6, httpOpts6, token);
      
      // Step 8: Make authenticated request
      const result = await authenticatedRequestClient(client7, httpOpts7);
      
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