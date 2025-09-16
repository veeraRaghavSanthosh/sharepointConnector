/**
 * SharePoint Connector Parse Utilities (Async/Await Version)
 * This module provides parsing utilities for SharePoint responses and data
 * Supports both callback and async/await patterns for backward compatibility
 */

const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Promisify fs.readFile for internal use
const readFileAsync = util.promisify(fs.readFile);

/**
 * Parse XML response from SharePoint using async/await with backward compatibility
 * @param {string} xmlString - The XML string to parse
 * @param {Function} [callback] - Optional callback function (err, result)
 * @returns {Promise|undefined} - Returns Promise if no callback provided
 */
async function parseXmlResponse(xmlString, callback) {
  const parseXmlInternal = async () => {
    if (!xmlString) {
      throw new Error('XML string is required');
    }
    
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    const parseStringAsync = util.promisify(parser.parseString.bind(parser));
    
    try {
      const result = await parseStringAsync(xmlString);
      return result;
    } catch (err) {
      throw new Error('Failed to parse XML: ' + err.message);
    }
  };

  // Backward compatibility: if callback provided, use it
  if (callback && typeof callback === 'function') {
    try {
      const result = await parseXmlInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  // Otherwise return Promise
  return parseXmlInternal();
}

/**
 * Parse SharePoint list items response using async/await with backward compatibility
 * @param {string} responseBody - The response body from SharePoint
 * @param {Function} [callback] - Optional callback function (err, items)
 * @returns {Promise|undefined} - Returns Promise if no callback provided
 */
async function parseListItems(responseBody, callback) {
  const parseListItemsInternal = async () => {
    if (!responseBody) {
      throw new Error('Response body is required');
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
      
      return processedItems;
    } catch (err) {
      throw new Error('Failed to parse list items: ' + err.message);
    }
  };

  // Backward compatibility: if callback provided, use it
  if (callback && typeof callback === 'function') {
    try {
      const result = await parseListItemsInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  // Otherwise return Promise
  return parseListItemsInternal();
}

/**
 * Parse SharePoint authentication response using async/await with backward compatibility
 * @param {string} authResponse - The authentication response
 * @param {Function} [callback] - Optional callback function (err, authData)
 * @returns {Promise|undefined} - Returns Promise if no callback provided
 */
async function parseAuthResponse(authResponse, callback) {
  const parseAuthInternal = async () => {
    if (!authResponse) {
      throw new Error('Authentication response is required');
    }
    
    try {
      const result = await parseXmlResponse(authResponse);
      
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
      
      return authData;
    } catch (parseErr) {
      throw new Error('Failed to extract auth data: ' + parseErr.message);
    }
  };

  // Backward compatibility: if callback provided, use it
  if (callback && typeof callback === 'function') {
    try {
      const result = await parseAuthInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  // Otherwise return Promise
  return parseAuthInternal();
}

/**
 * Parse file content from SharePoint using async/await with backward compatibility
 * @param {string} filePath - Path to the file to parse
 * @param {Object} [options] - Parsing options
 * @param {Function} [callback] - Optional callback function (err, content)
 * @returns {Promise|undefined} - Returns Promise if no callback provided
 */
async function parseFile(filePath, options, callback) {
  // Handle optional options parameter
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  const parseFileInternal = async () => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    try {
      const data = await readFileAsync(filePath, 'utf8');
      const extension = path.extname(filePath).toLowerCase();
      
      switch (extension) {
        case '.xml':
          return await parseXmlResponse(data);
        case '.json':
          try {
            return JSON.parse(data);
          } catch (jsonErr) {
            throw new Error('Failed to parse JSON file: ' + jsonErr.message);
          }
        default:
          return data;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('File not found: ' + filePath);
      }
      throw new Error('Failed to read file: ' + err.message);
    }
  };

  // Backward compatibility: if callback provided, use it
  if (callback && typeof callback === 'function') {
    try {
      const result = await parseFileInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  // Otherwise return Promise
  return parseFileInternal();
}

module.exports = {
  parseXmlResponse,
  parseListItems,
  parseAuthResponse,
  parseFile
};
