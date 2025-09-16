var inputSanitizer = require('./util/inputSanitizer');
var rateLimiter = require('./util/rateLimiter');

module.exports = function(params){
  if (!params.username || !params.password || !params.url){
    throw new Error('SharePoint client needs a username, password and instance URL');
  }

  // Input sanitization and validation
  try {
    var sanitizedUrl = inputSanitizer.sanitizeUrl(params.url, false);
    var sanitizedAuth = inputSanitizer.sanitizeAuth({
      username: params.username,
      password: params.password,
      workstation: params.workstation,
      domain: params.domain,
      type: params.type
    });
  } catch (error) {
    throw new Error('Input validation failed: ' + error.message);
  }

  var clientObj={};
  clientObj.url = sanitizedUrl;
  clientObj.federatedAuthUrl = params.federatedAuthUrl ? inputSanitizer.sanitizeUrl(params.federatedAuthUrl, false) : undefined;
  clientObj.auth = {};
  clientObj.siteContext = inputSanitizer.sanitizeString(params.context || 'web', 100);
  clientObj.auth.username = sanitizedAuth.username;
  clientObj.auth.password = sanitizedAuth.password;
  clientObj.auth.workstation = sanitizedAuth.workstation || '';
  clientObj.auth.domain = sanitizedAuth.domain || '';
  clientObj.auth.type = sanitizedAuth.type || 'basic';
  clientObj.auth.custom = params.authenticator;
  clientObj.verbose = (typeof params.verbose === 'boolean') ? params.verbose : false;
  clientObj.fieldValuesAsText = (typeof params.fieldValuesAsText === 'boolean') ? params.fieldValuesAsText : false;
  
  // Sanitize array parameters
  try {
    clientObj.filterFields = inputSanitizer.sanitizeFilterFields(params.filterFields);
    clientObj.selectFields = inputSanitizer.sanitizeFieldsArray(params.selectFields);
    clientObj.expandFields = inputSanitizer.sanitizeFieldsArray(params.expandFields);
  } catch (error) {
    throw new Error('Field validation failed: ' + error.message);
  }
  
  clientObj.orOperator = (typeof params.orOperator === 'boolean') ? params.orOperator : false;
  clientObj.andOrOperator = (typeof params.andOrOperator === 'boolean') ? params.andOrOperator : false;
  clientObj.FedAuth = params.FedAuth ? inputSanitizer.sanitizeString(params.FedAuth, 2000) : null;
  clientObj.rtFa = params.rtFa ? inputSanitizer.sanitizeString(params.rtFa, 2000) : null;
  
  // Sanitize and validate $top parameter
  try {
    var topValue = inputSanitizer.sanitizeNumber(params.$top || "5000", 1, 10000);
    clientObj.$top = topValue ? topValue.toString() : "5000";
  } catch (error) {
    throw new Error('$top parameter validation failed: ' + error.message);
  }

  // Initialize rate limiter for this client instance
  clientObj.rateLimiter = rateLimiter.defaultRateLimiter;
  if (params.rateLimit) {
    clientObj.rateLimiter = new rateLimiter.RateLimiter(params.rateLimit);
  }

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
