/*
 * Parse utilities converted from callbacks to async/await
 * This module provides parsing functionality for SharePoint connector
 */

const { promisify } = require('util');
const xmlJs = require('xml2js');
const dotty = require('dotty');

// Create promisified version of XML parser
const parser = new xmlJs.Parser({ "explicitArray": false });
const parseStringAsync = promisify(parser.parseString.bind(parser));

/**
 * Parse SAML response and extract binary security token
 * @param {Object} client - SharePoint client instance
 * @param {Object} httpOpts - HTTP options
 * @param {string} samlResponseBody - SAML response body to parse
 * @returns {Promise<{client: Object, httpOpts: Object, token: string}>}
 */
async function parseSamlResponse(client, httpOpts, samlResponseBody) {
  if (httpOpts.returnAssertion) {
    return { client, httpOpts, assertion: samlResponseBody };
  }

  try {
    const parsed = await parseStringAsync(samlResponseBody);
    
    const samlError = dotty.get(parsed, "S:Envelope.S:Body.S:Fault");
    const token = dotty.get(parsed, "S:Envelope.S:Body.wst:RequestSecurityTokenResponse.wst:RequestedSecurityToken.wsse:BinarySecurityToken._");
    const trimmedToken = token ? token.trim() : token;
    
    if (samlError) {
      console.error('Saml error detected on login');
      console.error(samlError);
      throw new Error('Error logging in - SAML fault detected');
    }
    
    if (!trimmedToken) {
      console.error('No token in response body:');
      console.error(parsed);
      throw new Error('No token found in response body');
    }
    
    return { client, httpOpts, token: trimmedToken };
  } catch (err) {
    if (err.message.includes('Error logging in') || err.message.includes('No token found')) {
      throw err;
    }
    throw new Error(`Error parsing XML: ${err.toString()}`);
  }
}

/**
 * Parse SAML assertion from response body
 * @param {Object} client - SharePoint client instance
 * @param {Object} httpOpts - HTTP options
 * @param {string} xmlResponse - XML response containing SAML assertion
 * @returns {Promise<{client: Object, httpOpts: Object, stsUrl: string, clientUrl: string, assertion: string}>}
 */
async function parseSamlAssertion(client, httpOpts, xmlResponse) {
  return new Promise((resolve, reject) => {
    const assertion = xmlResponse.match(/<saml:Assertion(.|\n)+<\/saml:Assertion>/);
    
    if (!assertion || !assertion.length) {
      return reject(new Error('No assertion found in response'));
    }
    
    const assertionData = assertion[0];
    const constants = require('../../lib/constants');
    
    resolve({
      client,
      httpOpts,
      stsUrl: constants.STS_LOGIN_URL,
      clientUrl: client.url,
      assertion: assertionData
    });
  });
}

/**
 * Parse JSON filter fields with error handling
 * @param {string} filterFieldStr - JSON string to parse
 * @returns {Promise<Object>} Parsed filter field object
 */
async function parseFilterField(filterFieldStr) {
  return new Promise((resolve, reject) => {
    try {
      const filterField = JSON.parse(filterFieldStr);
      resolve(filterField);
    } catch (e) {
      reject(new Error(`Unable to parse filterFields, expecting {"field":"Field", "value":"Value"}. Error: ${e.message}`));
    }
  });
}

/**
 * Parse multiple filter fields
 * @param {Array<string>} filterFields - Array of JSON strings to parse
 * @returns {Promise<Array<Object>>} Array of parsed filter field objects
 */
async function parseFilterFields(filterFields) {
  if (!Array.isArray(filterFields)) {
    throw new Error('filterFields must be an array');
  }
  
  const parsePromises = filterFields.map(field => parseFilterField(field));
  return Promise.all(parsePromises);
}

/**
 * Legacy callback wrapper for parseSamlResponse (for backward compatibility)
 * @param {Object} client - SharePoint client instance
 * @param {Object} httpOpts - HTTP options  
 * @param {string} samlResponseBody - SAML response body to parse
 * @param {Function} waterfallCb - Callback function
 */
function parseSamlResponseCallback(client, httpOpts, samlResponseBody, waterfallCb) {
  parseSamlResponse(client, httpOpts, samlResponseBody)
    .then(result => {
      if (result.assertion) {
        waterfallCb(null, result.assertion);
      } else {
        waterfallCb(null, result.client, result.httpOpts, result.token);
      }
    })
    .catch(err => {
      waterfallCb(err.message);
    });
}

/**
 * Legacy callback wrapper for parseSamlAssertion (for backward compatibility)
 * @param {Object} client - SharePoint client instance
 * @param {Object} httpOpts - HTTP options
 * @param {string} xmlResponse - XML response containing SAML assertion
 * @param {Function} waterfallCb - Callback function
 */
function parseSamlAssertionCallback(client, httpOpts, xmlResponse, waterfallCb) {
  parseSamlAssertion(client, httpOpts, xmlResponse)
    .then(result => {
      waterfallCb(null, result.client, result.httpOpts, result.stsUrl, result.clientUrl, result.assertion);
    })
    .catch(err => {
      waterfallCb(err.message);
    });
}

module.exports = {
  // Async/await functions
  parseSamlResponse,
  parseSamlAssertion,
  parseFilterField,
  parseFilterFields,
  
  // Legacy callback functions for backward compatibility
  parseSamlResponseCallback,
  parseSamlAssertionCallback
};