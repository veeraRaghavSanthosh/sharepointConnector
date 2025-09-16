/*
  Flexible middleware to generate SAML bodies from some placeholders in file `saml.xml`
 */

var fs = require('fs'),
_ = require('underscore'),
path = require('path'),
saml = fs.readFileSync(path.join(__dirname, 'saml.xml')).toString(),
auth = fs.readFileSync(path.join(__dirname, 'auth.xml')).toString();

module.exports = async function(client, httpOpts, toUrl, url, assertion, waterfallCb){
  try {
    var samlBody = _.clone(saml),
    authBody = _.clone(auth);
    
    authBody = authBody.replace('{username}', client.auth.username);
    authBody = authBody.replace('{password}', client.auth.password);
    // If an assertion was passed in, put it in the {auth} placeholder. Otherwise, username and password.
    samlBody = samlBody.replace('{auth}', assertion || authBody);
    samlBody = samlBody.replace('{url}', url);
    samlBody = samlBody.replace('{toUrl}', toUrl);
    
    const result = [client, httpOpts, toUrl, samlBody];
    
    // Call callback for backward compatibility
    if (waterfallCb) waterfallCb(null, client, httpOpts, toUrl, samlBody);
    return result;
  } catch (error) {
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(error);
    throw error;
  }
};