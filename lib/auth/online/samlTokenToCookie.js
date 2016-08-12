/*
 Takes the binary saml token, and passes it to the login form API.
 Retrieves the two cookies needed to finally make auth'd requests.
 */

var request = require('request'),
_ = require('underscore'),
constants = require('../../constants.js');

// Exchange the SAML token for a cookie we can auth future SP requests with
module.exports = function(client, httpOpts, token, waterfallCb){
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
  console.log("smal exchange requestOptions",requestOptions);
  request.post(requestOptions, function(err, response){
    if (err){
console.log("err in the token call", err);
      return waterfallCb(err);
    }
    if (response.statusCode.toString()[0] !== '3'){
      return waterfallCb('Received unexpected status code from SP token exchange: ' + response.statusCode);
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
      return waterfallCb('Could not find auth cookies in sharepoint response');
    }

    client.FedAuth = parsedCookies.FedAuth;
    client.rtFa = parsedCookies.rtFa;
    return waterfallCb(null, client, httpOpts);
  });
};
