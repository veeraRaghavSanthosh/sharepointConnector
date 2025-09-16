/**
 * SharePoint Connector Parse Utilities
 * This module provides parsing utilities for SharePoint responses and data
 */

const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

/**
 * Parse XML response from SharePoint using callbacks
 * @param {string} xmlString - The XML string to parse
 * @param {Function} callback - Callback function (err, result)
 */
function parseXmlResponse(xmlString, callback) {
  if (!xmlString) {
    return callback(new Error('XML string is required'));
  }
  
  const parser = new xml2js.Parser({ 
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true
  });
  
  parser.parseString(xmlString, function(err, result) {
    if (err) {
      return callback(new Error('Failed to parse XML: ' + err.message));
    }
    callback(null, result);
  });
}

/**
 * Parse SharePoint list items response using callbacks
 * @param {string} responseBody - The response body from SharePoint
 * @param {Function} callback - Callback function (err, items)
 */
function parseListItems(responseBody, callback) {
  if (!responseBody) {
    return callback(new Error('Response body is required'));
  }
  
  try {
    const data = JSON.parse(responseBody);
    const items = data.d && data.d.results ? data.d.results : [];
    
    // Process items to normalize data
    const processedItems = items.map(item => {
      // Remove SharePoint metadata
      const cleanItem = {};
      for (const key in item) {
        if (!key.startsWith('__') && key !== 'odata.type' && key !== 'odata.id') {
          cleanItem[key] = item[key];
        }
      }
      return cleanItem;
    });
    
    callback(null, processedItems);
  } catch (err) {
    callback(new Error('Failed to parse list items: ' + err.message));
  }
}

/**
 * Parse SharePoint authentication response using callbacks
 * @param {string} authResponse - The authentication response
 * @param {Function} callback - Callback function (err, authData)
 */
function parseAuthResponse(authResponse, callback) {
  if (!authResponse) {
    return callback(new Error('Authentication response is required'));
  }
  
  parseXmlResponse(authResponse, function(err, result) {
    if (err) {
      return callback(err);
    }
    
    try {
      const authData = {
        token: null,
        expires: null,
        cookies: []
      };
      
      // Extract authentication token and expiration
      if (result && result.Token) {
        authData.token = result.Token;
      }
      
      if (result && result.Expires) {
        authData.expires = new Date(result.Expires);
      }
      
      callback(null, authData);
    } catch (parseErr) {
      callback(new Error('Failed to extract auth data: ' + parseErr.message));
    }
  });
}

/**
 * Parse file content from SharePoint using callbacks
 * @param {string} filePath - Path to the file to parse
 * @param {Object} options - Parsing options
 * @param {Function} callback - Callback function (err, content)
 */
function parseFile(filePath, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (!filePath) {
    return callback(new Error('File path is required'));
  }
  
  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      return callback(new Error('Failed to read file: ' + err.message));
    }
    
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.xml':
        parseXmlResponse(data, callback);
        break;
      case '.json':
        try {
          const jsonData = JSON.parse(data);
          callback(null, jsonData);
        } catch (jsonErr) {
          callback(new Error('Failed to parse JSON file: ' + jsonErr.message));
        }
        break;
      default:
        callback(null, data);
    }
  });
}

module.exports = {
  parseXmlResponse,
  parseListItems,
  parseAuthResponse,
  parseFile
};
