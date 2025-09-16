/*
 Takes the binary saml token, and passes it to the login form API.
 Retrieves the two cookies needed to finally make auth'd requests.
 */

var request = require('request'),
{ promisify } = require('util'),
_ = require('underscore'),
constants = require('../../constants.js');

const requestPostAsync = promisify(request.post);

// Exchange the SAML token for a cookie we can auth future SP requests with
module.exports = async function(client, httpOpts, token, waterfallCb){
  try {
    var requestOptions = _.extend(constants.SP_ONLINE_SECURITY_OPTIONS, httpOpts, {
      method: 'post',
      headers : {
        'User-Agent': 'fixIISPlease'
      },
      body : token,
      url : client.url + '/_forms/default.aspx?wa=wsignin1.0',
      followRedirect: false,
      timeout: constants.SP_ONLINE_TIMEOUT
    });
    
    //console.log("saml exchange requestOptions",requestOptions);
    const response = await requestPostAsync(requestOptions);
    
    if (response.statusCode.toString()[0] !== '3'){
      throw new Error('Received unexpected status code from SP token exchange: ' + response.statusCode);
    }
    
    var cookies = response.headers && response.headers['set-cookie'];
    var parsedCookies = {};
    _.each(cookies, function(c){
      // split on first occurance of the = char
      c = c.split(/=(.+)?/);
      if (c.length < 2){
        return;
      }
      parsedCookies[c[0]] = c[1];
    });

    if (!cookies || !cookies.length || !parsedCookies.FedAuth || !parsedCookies.rtFa){
      throw new Error('Could not find auth cookies in sharepoint response');
    }

    client.FedAuth = parsedCookies.FedAuth;
    client.rtFa = parsedCookies.rtFa;
    
    const result = [client, httpOpts];
    
    // Call callback for backward compatibility
    if (waterfallCb) waterfallCb(null, client, httpOpts);
    return result;
    
  } catch (error) {
    console.error("err in the token call", error);
    
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(error);
    throw error;
  }
};