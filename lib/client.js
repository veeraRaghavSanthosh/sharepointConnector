var inputSanitizer = require('./util/inputSanitizer');

module.exports = function(params){
  // Validate and sanitize input parameters
  try {
    params = inputSanitizer.validateClientParams(params);
  } catch (error) {
    throw new Error('Invalid client parameters: ' + error.message);
  }
  
  var clientObj={};
  clientObj.url = params.url;
  clientObj.federatedAuthUrl = params.federatedAuthUrl;
  clientObj.auth = {};
  clientObj.siteContext = params.context || 'web';
  clientObj.auth.username = params.username;
  clientObj.auth.password = params.password;
  clientObj.auth.workstation = params.workstation || '';
  clientObj.auth.domain = params.domain || '';
  clientObj.auth.type = params.type || 'basic';
  clientObj.auth.custom = params.authenticator;
  clientObj.verbose = (typeof params.verbose === 'boolean') ? params.verbose : false;
  clientObj.fieldValuesAsText = (typeof params.fieldValuesAsText === 'boolean') ? params.fieldValuesAsText : false;
  clientObj.filterFields = params.filterFields || null; // an array of objects [{"field": one, "value": 1}, {"field": two, "value": 2}]
  clientObj.selectFields = params.selectFields || null;  //array ["one", "two"]
  clientObj.expandFields = params.expandFields || null; //array ["one", "two"]
  clientObj.orOperator = (typeof params.orOperator === 'boolean') ? params.orOperator : false;
  clientObj.andOrOperator = (typeof params.andOrOperator === 'boolean') ? params.andOrOperator : false;
  clientObj.FedAuth=params.FedAuth||null;
  clientObj.rtFa=params.rtFa||null;
  clientObj.$top=params.$top||"5000";
  
  // Rate limiting configuration
  clientObj.rateLimitOptions = params.rateLimitOptions || {
    enabled: true,
    limits: {
      LOGIN: { requests: 10, window: 60000 },
      READ: { requests: 100, window: 60000 },
      WRITE: { requests: 50, window: 60000 },
      DELETE: { requests: 20, window: 60000 },
      GLOBAL: { requests: 200, window: 60000 }
    }
  };

  // We later set up http requests with clientObj options object, either basic auth (goes in 'auth'),
  // or NTLM (goes in an Authorization header)
  clientObj.baseHTTPOptions = {
    headers : {
      'Accept' : 'application/json; odata=verbose',
      'Content-Type' : 'application/json; odata=verbose'
    },
    strictSSL: (typeof params.strictSSL === 'boolean') ? params.strictSSL : true,
    proxy : params.proxy || undefined
  };
  clientObj.BASE_LIST_URL = '/_api/web/lists';
  if (clientObj.siteContext && clientObj.siteContext !== 'web'){
    clientObj.BASE_LIST_URL = '/sites/' + clientObj.siteContext + clientObj.BASE_LIST_URL;
  }

  return {
    login : require('./login')(clientObj),
    lists : require('./objects/lists')(clientObj),
    listItems : require('./objects/listItems')(clientObj)
  };
};
