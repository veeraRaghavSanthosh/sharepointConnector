/**
 * Consolidated authentication module with async/await support
 * Converts the original callback-based authentication strategies to modern async/await
 */

const request = require('request');
const _ = require('underscore');
const underscoreDeepExtend = require('underscore-deep-extend');
const ntlm = require('httpntlm').ntlm;
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const { promisify } = require('util');
const constants = require('./constants');

// Extend underscore with deep extend functionality
_.mixin({
  deepExtend: underscoreDeepExtend(_)
});

// Promisify request for async/await usage
const requestAsync = promisify(request);

// Import SAML-related modules
const getSamlBody = require('./auth/online/samlBody');
const samlLogin = require('./auth/online/samlLogin');
const samlResponse = require('./auth/online/samlResponse');
const samlAssertionResponse = require('./auth/online/samlAssertionResponse');
const samlTokenToCookie = require('./auth/online/samlTokenToCookie');
const authenticatedRequestClient = require('./auth/online/authenticatedRequestClient');

/**
 * Basic authentication using username/password
 */
async function basicAuth(client, httpOpts) {
  const options = _.extend({}, httpOpts, client.baseHTTPOptions, {
    auth: {
      username: client.auth.username,
      password: client.auth.password,
      sendImmediately: true
    },
    json: httpOpts.json || true
  });
  
  return await requestAsync(options);
}

/**
 * NTLM authentication using three-way handshake
 */
async function ntlmAuth(client, httpOpts) {
  const keepaliveAgent = new HttpsAgent();
  
  try {
    // Step 1: Send Type 1 message
    const type1msg = ntlm.createType1Message(client.auth);
    const type1options = _.deepExtend({}, client.baseHTTPOptions, httpOpts, {
      headers: {
        'Connection': 'keep-alive',
        'Authorization': type1msg
      },
      agent: keepaliveAgent,
      method: 'get'
    });

    const [type1Response, type1Body] = await requestAsync(type1options);

    // Step 2: Process Type 2 message and send Type 3 message
    if (!type1Response.headers['www-authenticate']) {
      throw new Error('www-authenticate not found on response of second request');
    }
    
    const type2msg = ntlm.parseType2Message(type1Response.headers['www-authenticate']);
    const type3msg = ntlm.createType3Message(type2msg, client.auth);
    const type3opts = _.deepExtend({}, httpOpts, client.baseHTTPOptions, {
      headers: {
        'Connection': 'Close',
        'Authorization': type3msg
      },
      allowRedirects: false,
      agent: keepaliveAgent,
      json: httpOpts.json || true
    });

    return await requestAsync(type3opts);
  } catch (error) {
    throw error;
  }
}

/**
 * Promisify SAML-related functions to work with async/await
 */
function promisifySamlFunction(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const callback = (err, ...results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      };
      fn(...args, callback);
    });
  };
}

// Promisify SAML functions
const getSamlBodyAsync = promisifySamlFunction(getSamlBody);
const samlLoginAsync = promisifySamlFunction(samlLogin);
const samlResponseAsync = promisifySamlFunction(samlResponse);
const samlAssertionResponseAsync = promisifySamlFunction(samlAssertionResponse);
const samlTokenToCookieAsync = promisifySamlFunction(samlTokenToCookie);
const authenticatedRequestClientAsync = promisifySamlFunction(authenticatedRequestClient);

/**
 * Online authentication using SAML
 */
async function onlineAuth(client, httpOpts) {
  try {
    // If we're already authenticated, use existing tokens
    if (client.FedAuth && client.rtFa) {
      return await authenticatedRequestClientAsync(client, httpOpts);
    }

    // Otherwise, go through the full SAML authentication flow
    let [authClient, authHttpOpts, authUrl, samlBody] = await getSamlBodyAsync(
      client, httpOpts, constants.STS_LOGIN_URL, client.url, null
    );
    
    [authClient, authHttpOpts, samlResponseBody] = await samlLoginAsync(
      authClient, authHttpOpts, authUrl, samlBody
    );
    
    [authClient, authHttpOpts, token] = await samlResponseAsync(
      authClient, authHttpOpts, samlResponseBody
    );
    
    [authClient, authHttpOpts, cookieHeader] = await samlTokenToCookieAsync(
      authClient, authHttpOpts, token
    );
    
    return await authenticatedRequestClientAsync(authClient, authHttpOpts);
  } catch (error) {
    throw error;
  }
}

/**
 * Online SAML authentication with assertion
 */
async function onlineSamlAuth(client, httpOpts) {
  try {
    // If we're already authenticated, use existing tokens
    if (client.FedAuth && client.rtFa) {
      return await authenticatedRequestClientAsync(client, httpOpts);
    }

    // Go through the full SAML authentication flow with assertion
    let [authClient, authHttpOpts, authUrl, samlBody] = await getSamlBodyAsync(
      client, httpOpts, client.federatedAuthUrl, 'urn:federation:MicrosoftOnline', null
    );
    
    [authClient, authHttpOpts, samlResponseBody] = await samlLoginAsync(
      authClient, authHttpOpts, authUrl, samlBody
    );
    
    [authClient, authHttpOpts, assertion] = await samlAssertionResponseAsync(
      authClient, authHttpOpts, samlResponseBody
    );
    
    [authClient, authHttpOpts, authUrl2, samlBody2] = await getSamlBodyAsync(
      authClient, authHttpOpts, authUrl, 'urn:federation:MicrosoftOnline', assertion
    );
    
    [authClient, authHttpOpts, samlResponseBody2] = await samlLoginAsync(
      authClient, authHttpOpts, authUrl2, samlBody2
    );
    
    [authClient, authHttpOpts, token] = await samlResponseAsync(
      authClient, authHttpOpts, samlResponseBody2
    );
    
    [authClient, authHttpOpts, cookieHeader] = await samlTokenToCookieAsync(
      authClient, authHttpOpts, token
    );
    
    return await authenticatedRequestClientAsync(authClient, authHttpOpts);
  } catch (error) {
    throw error;
  }
}

/**
 * Main authentication function that delegates to the appropriate strategy
 */
async function authenticate(client, httpOpts) {
  const authType = client.auth.type;
  
  switch (authType) {
    case 'basic':
      return await basicAuth(client, httpOpts);
    case 'ntlm':
      return await ntlmAuth(client, httpOpts);
    case 'online':
      return await onlineAuth(client, httpOpts);
    case 'onlinesaml':
      return await onlineSamlAuth(client, httpOpts);
    default:
      if (client.auth.custom) {
        // For custom authenticators, we'll assume they follow the callback pattern
        // and promisify them
        const customAuthAsync = promisify(client.auth.custom);
        return await customAuthAsync(client, httpOpts);
      }
      throw new Error(`Unsupported auth type: ${authType}`);
  }
}

/**
 * Backward compatibility wrapper that maintains the callback interface
 * while using async/await internally
 */
function authCallback(client, httpOpts, cb) {
  authenticate(client, httpOpts)
    .then(result => cb(null, ...result))
    .catch(err => cb(err));
}

module.exports = {
  authenticate,
  authCallback,
  basicAuth,
  ntlmAuth,
  onlineAuth,
  onlineSamlAuth
};