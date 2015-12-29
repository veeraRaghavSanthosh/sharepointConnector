/*
 Performs Cookie-signed requests to the backend.
 Think of this as a HTTP client for the rest of the library.
 httpOpts get passed from the object model for lists, list items etc, and feed into request.
 */

var _ = require('underscore'),
request = require('request'),
underscoreDeepExtend = require('underscore-deep-extend'),
constants = require('../../constants.js');

_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

module.exports = function(client, httpOpts, waterfallCb){
  var requestOpts = _.deepExtend({}, httpOpts, client.baseHTTPOptions, constants.SP_ONLINE_SECURITY_OPTIONS, {
    headers: {
      'Cookie': 'FedAuth=' + client.FedAuth + '; rtFa=' + client.rtFa,
      'Accept' : 'application/json;odata=verbose',
      'Content-Type' : 'application/json;odata=verbose'
    },
    json : httpOpts.json || true,
    encoding:null,
    binaryStringResponseBody: true,
    timeout: constants.SP_ONLINE_TIMEOUT
  }, httpOpts);

  if(requestOpts.url.indexOf('GetFolderByServerRelativeUrl')<0){
//  console.log('requestOpts',requestOpts);
  return request(requestOpts, waterfallCb);
  }else{

return waterfallCb(null,requestOpts,null);

  //  request.get(requestOpts).on('response',function(metaResponse){
  //      var data;
  //         metaResponse.on('data',function(chunk){
  //          console.log("in the data event ");
  //          if(chunk){
  //                 data+=chunk;
  //          }
  //         });
  //         metaResponse.on('end', function(){
  //                 //data = Buffer.concat(data);
  //                 console.log("in the data end event ");
  //                 waterfallCb(null,metaResponse,data);
  //         });
  //  });
   }
  };
