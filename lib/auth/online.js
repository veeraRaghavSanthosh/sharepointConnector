var async = require('async'),
getSamlBody = require('./online/samlBody'),
samlLogin = require('./online/samlLogin'),
samlResponse = require('./online/samlResponse'),
samlTokenToCookie = require('./online/samlTokenToCookie'),
authenticatedRequestClient = require('./online/authenticatedRequestClient'),
constants = require('../constants');
module.exports = function(client, httpOpts, cb) {
  
  waterfall = [];
  
  // If we're already auth'd, continue as normal with our valid tokens
  if (!client.FedAuth || !client.rtFa){
    waterfall.push(async.apply(getSamlBody, client, httpOpts, constants.STS_LOGIN_URL, client.url, null));
    waterfall.push(samlLogin);
    waterfall.push(samlResponse);
    waterfall.push(samlTokenToCookie);
    waterfall.push(authenticatedRequestClient);
  }else{
    waterfall.push(async.apply(authenticatedRequestClient, client, httpOpts));
  }
  
  return async.waterfall(waterfall, cb);
};
