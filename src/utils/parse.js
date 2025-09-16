// Converting parse.js to async/await
/**
 * SharePoint Connector Parse Utilities
 * Supports both callback and async/await patterns for backward compatibility
 */

const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);

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

  if (callback && typeof callback === 'function') {
    try {
      const result = await parseXmlInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  return parseXmlInternal();
}

async function parseListItems(responseBody, callback) {
  const parseListItemsInternal = async () => {
    if (!responseBody) {
      throw new Error('Response body is required');
    }
    
    try {
      const data = JSON.parse(responseBody);
      const items = data.d && data.d.results ? data.d.results : [];
      
      const processedItems = items.map(item => {
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

  if (callback && typeof callback === 'function') {
    try {
      const result = await parseListItemsInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  return parseListItemsInternal();
}

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

  if (callback && typeof callback === 'function') {
    try {
      const result = await parseAuthInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  return parseAuthInternal();
}

async function parseFile(filePath, options, callback) {
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

  if (callback && typeof callback === 'function') {
    try {
      const result = await parseFileInternal();
      callback(null, result);
    } catch (err) {
      callback(err);
    }
    return;
  }
  
  return parseFileInternal();
}

module.exports = {
  parseXmlResponse,
  parseListItems,
  parseAuthResponse,
  parseFile
};
