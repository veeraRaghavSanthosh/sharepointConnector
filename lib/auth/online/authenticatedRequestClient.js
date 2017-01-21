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

module.exports = function(client, httpOpts, waterfallCb) {
    var requestOpts = _.deepExtend({}, httpOpts, client.baseHTTPOptions, constants.SP_ONLINE_SECURITY_OPTIONS, {
        headers: {
            'Cookie': 'FedAuth=' + client.FedAuth + '; rtFa=' + client.rtFa,
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
        },
        json: httpOpts.json || true,
        encoding: null,
        // binaryStringResponseBody: true,
        timeout: constants.SP_ONLINE_TIMEOUT
    }, httpOpts);
    console.log("requestOpts ==>", requestOpts);
    if ((requestOpts.url.indexOf('GetFolderByServerRelativeUrl') >= 0) || (requestOpts.url.indexOf('getfilebyserverrelativeurl') >= 0)&&httpOpts.type!=="fileSchemer") {
        return waterfallCb(null, requestOpts, null);
    } else {
        return request(requestOpts, waterfallCb);
    }
};
