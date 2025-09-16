/*
 Performs a SAML login request with a SOAP body passed by samlBody.js
 */
var constants = require('../../constants.js'),
  request = require('request'),
  { promisify } = require('util'),
  _ = require('underscore'),
  underscoreDeepExtend = require('underscore-deep-extend');
_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

const requestAsync = promisify(request);

module.exports = async function (client, httpOpts, authUrl, samlRequestBody, waterfallCb) {
  try {
    var requestOpts = _.deepExtend({}, httpOpts, client.baseHTTPOptions, {
      method: 'post',
      body: samlRequestBody,
      headers: {
        'content-type': 'application/soap+xml; charset=utf-8'
      },
      secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
      url: authUrl,
      timeout: constants.SP_ONLINE_TIMEOUT
    });

    const [response, samlResponseBody] = await requestAsync(requestOpts);
    
    if (response.statusCode !== 200) {
      throw new Error('Unexpected status code from SamlLogin at ' + authUrl + ' : ' + response.statusCode);
    }
    if (!samlResponseBody) {
      throw new Error('No response body from SAML request');
    }
    
    console.log("saml login response", samlResponseBody);
    const result = [client, httpOpts, samlResponseBody];
    
    // Call callback for backward compatibility
    if (waterfallCb) waterfallCb(null, client, httpOpts, samlResponseBody);
    return result;
    
  } catch (error) {
    console.log("err in saml login", error);
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(error);
    throw error;
  }
};