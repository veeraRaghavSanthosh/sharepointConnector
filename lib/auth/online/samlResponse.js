/*
  Parses a SAML response, plucking off the binary security token
  This then gets passed to yet another SharePoint login function
 */

var dotty = require('dotty'),
xmlJs = require('xml2js'),
{ promisify } = require('util'),
parser =  new xmlJs.Parser({"explicitArray":false});

const parseStringAsync = promisify(parser.parseString.bind(parser));

module.exports = async function(client, httpOpts, samlResponseBody, waterfallCb){
  try {
    if (httpOpts.returnAssertion){
      if (waterfallCb) waterfallCb(null, samlResponseBody);
      return [samlResponseBody];
    }
    
    const ok = await parseStringAsync(samlResponseBody);
    
    var samlError = dotty.get(ok, "S:Envelope.S:Body.S:Fault"),
      token = dotty.get(ok, "S:Envelope.S:Body.wst:RequestSecurityTokenResponse.wst:RequestedSecurityToken.wsse:BinarySecurityToken._");
      
    if (samlError){
      console.error('Saml error detected on login');
      console.error(samlError);
      throw new Error('Error logging in - SAML fault detected');
    }
    if (!token){
      console.error('No token in response body:');
      console.error(ok);
      throw new Error('No token found in response body');
    }
    
    const result = [client, httpOpts, token];
    
    // Call callback for backward compatibility
    if (waterfallCb) waterfallCb(null, client, httpOpts, token);
    return result;
    
  } catch (error) {
    let errorMsg = error.message || ('Error parsing XML: ' + error.toString());
    
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(errorMsg);
    throw new Error(errorMsg);
  }
};