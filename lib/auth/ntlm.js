var request = require('request'),
_ = require('underscore'),
underscoreDeepExtend = require('underscore-deep-extend'),
ntlm = require('httpntlm').ntlm,
async = require('async'),
HttpsAgent = require('agentkeepalive').HttpsAgent;

_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

module.exports = function(client, httpOpts, cb) {
  var keepaliveAgent = new HttpsAgent();
  return async.waterfall([
    function(waterfallCb) {
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
      return request(type1options, waterfallCb);
    },

    function(res, body, waterfallCb) {
      if (!res.headers['www-authenticate']) {
        return callback(new Error('www-authenticate not found on response of second request'));
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
      return request(type3opts, waterfallCb);
    }
  ], cb);
};
