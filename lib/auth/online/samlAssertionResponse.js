/*
 Plucks a SAML assertion off a response body from the federated auth service
 */

var _ = require('underscore'),
constants = require('../../constants');
module.exports = function(client, httpOpts, xmlResponse, waterfallCb){
  var assertion = xmlResponse.match(/<saml:Assertion(.|\n)+<\/saml:Assertion>/);
  if (!assertion || !assertion.length){
    return waterfallCb('No assertion found in response');
  }
  console.log("assertion data",assertion);
  assertion = _.first(assertion);
  return waterfallCb(null, client, httpOpts, constants.STS_LOGIN_URL, client.url, assertion);
};
