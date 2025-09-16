/*
 Performs Cookie-signed requests to the backend.
 Think of this as a HTTP client for the rest of the library.
 httpOpts get passed from the object model for lists, list items etc, and feed into request.
 */

var _ = require('underscore'),
request = require('request'),
{ promisify } = require('util'),
underscoreDeepExtend = require('underscore-deep-extend'),
constants = require('../../constants.js');

_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

const requestAsync = promisify(request);

module.exports = async function(client, httpOpts, waterfallCb){
  try {
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

    if ((requestOpts.url.indexOf('GetFolderByServerRelativeUrl') >= 0) || (requestOpts.url.indexOf('GetFileByServerRelativeUrl') >= 0)&&httpOpts.type!=="fileSchemer") {
      const result = [requestOpts, null];
      // Call callback for backward compatibility
      if (waterfallCb) waterfallCb(null, requestOpts, null);
      return result;
    } else {
      const result = await requestAsync(requestOpts);
      // Call callback for backward compatibility
      if (waterfallCb) waterfallCb(null, result[0], result[1]);
      return result;
    }
  } catch (error) {
    // Call callback with error for backward compatibility
    if (waterfallCb) waterfallCb(error);
    throw error;
  }
};