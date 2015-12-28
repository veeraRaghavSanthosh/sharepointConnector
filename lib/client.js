module.exports = function(params){
  if (!params.username || !params.password || !params.url){
    throw new Error('SharePoint client needs a username, password and instance URL');
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
  clientObj.FedAuth=params.FedAuth||null;
  clientObj.rtFa=params.rtFa||null;

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
