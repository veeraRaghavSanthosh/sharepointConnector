/*
 Plucks a SAML assertion off a response body from the federated auth service
 */

var _ = require('underscore'),
constants = require('../../constants');

module.exports = async function(client, httpOpts, xmlResponse, waterfallCb){
  try {
    var assertion = xmlResponse.match(/<saml:Assertion(.|\n)+<\/saml:Assertion>/);
    if (!assertion || !assertion.length){
      throw new Error('No assertion found in response');
    }
    //console.log("assertion data",assertion);
    assertion = _.first(assertion);
    
    const result = [client, httpOpts, constants.STS_LOGIN_URL, client.url, assertion];
    
    // Call callback for backward compatibility
    if (waterfallCb) waterfallCb(null, client, httpOpts, constants.STS_LOGIN_URL, client.url, assertion);
    return result;
    
  } catch (error) {
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(error);
    throw error;
  }
};