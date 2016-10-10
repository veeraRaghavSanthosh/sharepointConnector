/*
  Parses a SAML response, plucking off the binary security token
  This then gets passed to yet another SharePoint login function
 */

var dotty = require('dotty'),
parser = require('xml2json');

module.exports = function(client, httpOpts, samlResponseBody, waterfallCb){
  if (httpOpts.returnAssertion){
    return cb(null, samlResponseBody);
  }
  try{
    samlResponseBody = parser.toJson(samlResponseBody, { object : true });  
  }catch(err){
    return waterfallCb('Error parsing XML: ' + err.toString());
  }
  var samlError = dotty.get(samlResponseBody, "S:Envelope.S:Body.S:Fault"),
  token = dotty.get(samlResponseBody, "S:Envelope.S:Body.wst:RequestSecurityTokenResponse.wst:RequestedSecurityToken.wsse:BinarySecurityToken.$t");
  if (samlError){
    console.error("Saml error detected on login");
     console.error(JSON.stringify(samlError));
    return waterfallCb('Error logging in - SAML fault detected');
  }
  if (!token){
    console.error('No token in response body:');
    console.error(samlResponseBody);
    return waterfallCb('No token found in response body');
  }
  return waterfallCb(null, client, httpOpts, token);
};
