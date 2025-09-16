var request = require('request'),
_ = require('underscore'),
underscoreDeepExtend = require('underscore-deep-extend'),
ntlm = require('httpntlm').ntlm,
{ promisify } = require('util'),
HttpsAgent = require('agentkeepalive').HttpsAgent;

_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

const requestAsync = promisify(request);

module.exports = async function(client, httpOpts, cb) {
  var keepaliveAgent = new HttpsAgent();
  
  try {
    // Step 1: Create and send Type 1 message
    var type1msg = ntlm.createType1Message(client.auth);
    var type1options = _.deepExtend({}, client.baseHTTPOptions, httpOpts, {
      headers: {
        'Connection': 'keep-alive',
        'Authorization': type1msg
      },
      agent: keepaliveAgent,
      method: 'get'
    });

    //console.log("type1options",JSON.stringify(type1options));
    const [res, body] = await requestAsync(type1options);

    // Step 2: Process Type 2 response and send Type 3 message
    if (!res.headers['www-authenticate']) {
      throw new Error('www-authenticate not found on response of second request');
    }
    
    var type2msg = ntlm.parseType2Message(res.headers['www-authenticate']);
    var type3msg = ntlm.createType3Message(type2msg, client.auth);
    var type3opts = _.deepExtend({}, httpOpts, client.baseHTTPOptions, {
      headers: {
        'Connection': 'Close',
        'Authorization': type3msg
      },
      allowRedirects: false,
      agent: keepaliveAgent,
      json: httpOpts.json || true
    });
    
    //console.log("type3opts",JSON.stringify(type3opts));
    const result = await requestAsync(type3opts);
    
    // Call callback with successful result for backward compatibility
    if (cb) cb(null, result[0], result[1]);
    return result;
    
  } catch (error) {
    // Call callback with error for backward compatibility
    if (cb) cb(error);
    throw error;
  }
};