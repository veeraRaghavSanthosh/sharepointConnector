/*
  Parses a SAML response, plucking off the binary security token
  This then gets passed to yet another SharePoint login function
 */

var dotty = require('dotty'),
xmlJs = require('xml2js'),
parser =  new xmlJs.Parser({"explicitArray":false}).parseString;

module.exports = function(client, httpOpts, samlResponseBody, waterfallCb){
  if (httpOpts.returnAssertion){
    return cb(null, samlResponseBody);
  }

  parser(samlResponseBody, function (err,ok){
    if (err) {
      waterfallCb('Error parsing XML: ' + err.toString());
      return;
    }
    var samlError = dotty.get(ok, "S:Envelope.S:Body.S:Fault"),
      token = dotty.get(ok, "S:Envelope.S:Body.wst:RequestSecurityTokenResponse.wst:RequestedSecurityToken.wsse:BinarySecurityToken._");
    if (samlError){
      console.error('Saml error detected on login');
      console.error(samlError);
      return waterfallCb('Error logging in - SAML fault detected');
    }
    if (!token){
      console.error('No token in response body:');
      console.error(ok);
      return waterfallCb('No token found in response body');
    }
    return waterfallCb(null, client, httpOpts, token);
  });


};
