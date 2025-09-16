var url = require('url');

/**
 * Input sanitization utilities for SharePoint connector
 * Prevents various injection attacks and validates input parameters
 */

/**
 * Sanitizes and validates URL inputs
 * @param {string} inputUrl - URL to sanitize
 * @param {boolean} allowRelative - Whether to allow relative URLs
 * @returns {string} - Sanitized URL
 * @throws {Error} - If URL is invalid or contains suspicious content
 */
function sanitizeUrl(inputUrl, allowRelative) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  // Remove leading/trailing whitespace
  inputUrl = inputUrl.trim();

  // Check for suspicious protocols
  var suspiciousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  var lowerUrl = inputUrl.toLowerCase();
  
  for (var i = 0; i < suspiciousProtocols.length; i++) {
    if (lowerUrl.indexOf(suspiciousProtocols[i]) === 0) {
      throw new Error('Suspicious protocol detected in URL: ' + suspiciousProtocols[i]);
    }
  }

  // For absolute URLs, validate with url.parse
  if (inputUrl.match(/^https?:\/\//)) {
    try {
      var parsed = url.parse(inputUrl);
      if (!parsed.hostname) {
        throw new Error('Invalid URL format');
      }
      // Reconstruct URL to prevent malformed URLs
      return url.format(parsed);
    } catch (e) {
      throw new Error('Invalid URL format: ' + e.message);
    }
  }

  // For relative URLs
  if (allowRelative) {
    // Basic validation for relative URLs
    if (inputUrl.match(/\.\./g) && inputUrl.match(/\.\./g).length > 5) {
      throw new Error('Too many parent directory references in URL');
    }
    return inputUrl;
  } else if (!inputUrl.match(/^https?:\/\//)) {
    throw new Error('Absolute URL required');
  }

  return inputUrl;
}

/**
 * Sanitizes string inputs to prevent injection attacks
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized string
 * @throws {Error} - If input is invalid
 */
function sanitizeString(input, maxLength) {
  maxLength = maxLength || 1000;
  
  if (input === null || input === undefined) {
    return '';
  }
  
  if (typeof input !== 'string') {
    input = String(input);
  }

  // Check length
  if (input.length > maxLength) {
    throw new Error('Input string exceeds maximum length of ' + maxLength + ' characters');
  }

  // Remove null bytes and control characters (except newlines and tabs)
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Basic XSS prevention - remove script tags and javascript: protocol
  input = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  input = input.replace(/javascript:/gi, '');
  input = input.replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return input;
}

/**
 * Validates and sanitizes authentication credentials
 * @param {object} auth - Authentication object
 * @returns {object} - Sanitized auth object
 * @throws {Error} - If credentials are invalid
 */
function sanitizeAuth(auth) {
  if (!auth || typeof auth !== 'object') {
    throw new Error('Authentication object is required');
  }

  var sanitized = {};
  
  // Username validation
  if (!auth.username || typeof auth.username !== 'string') {
    throw new Error('Username is required and must be a string');
  }
  sanitized.username = sanitizeString(auth.username, 255);
  if (sanitized.username.length === 0) {
    throw new Error('Username cannot be empty after sanitization');
  }

  // Password validation
  if (!auth.password || typeof auth.password !== 'string') {
    throw new Error('Password is required and must be a string');
  }
  if (auth.password.length > 1000) {
    throw new Error('Password exceeds maximum length');
  }
  sanitized.password = auth.password; // Don't sanitize password content, just validate length

  // Optional fields
  if (auth.domain) {
    sanitized.domain = sanitizeString(auth.domain, 255);
  }
  if (auth.workstation) {
    sanitized.workstation = sanitizeString(auth.workstation, 255);
  }
  if (auth.type) {
    var validTypes = ['basic', 'ntlm', 'online', 'onlinesaml'];
    if (validTypes.indexOf(auth.type) === -1) {
      throw new Error('Invalid authentication type: ' + auth.type);
    }
    sanitized.type = auth.type;
  }

  return sanitized;
}

/**
 * Validates numeric parameters
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Validated number
 * @throws {Error} - If value is invalid
 */
function sanitizeNumber(value, min, max) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  var num = Number(value);
  if (isNaN(num)) {
    throw new Error('Value must be a valid number');
  }

  if (min !== undefined && num < min) {
    throw new Error('Value must be at least ' + min);
  }

  if (max !== undefined && num > max) {
    throw new Error('Value must be at most ' + max);
  }

  return num;
}

/**
 * Sanitizes filter fields array
 * @param {Array} filterFields - Array of filter objects
 * @returns {Array} - Sanitized filter fields
 * @throws {Error} - If filter fields are invalid
 */
function sanitizeFilterFields(filterFields) {
  if (!filterFields) {
    return null;
  }

  if (!Array.isArray(filterFields)) {
    throw new Error('Filter fields must be an array');
  }

  if (filterFields.length > 50) {
    throw new Error('Too many filter fields (maximum 50)');
  }

  return filterFields.map(function(field) {
    if (!field || typeof field !== 'object') {
      throw new Error('Filter field must be an object');
    }
    if (!field.field || !field.value) {
      throw new Error('Filter field must have both "field" and "value" properties');
    }
    return {
      field: sanitizeString(field.field, 100),
      value: sanitizeString(field.value, 500)
    };
  });
}

/**
 * Sanitizes select/expand fields array
 * @param {Array} fields - Array of field names
 * @returns {Array} - Sanitized field names
 * @throws {Error} - If fields are invalid
 */
function sanitizeFieldsArray(fields) {
  if (!fields) {
    return null;
  }

  if (!Array.isArray(fields)) {
    throw new Error('Fields must be an array');
  }

  if (fields.length > 100) {
    throw new Error('Too many fields specified (maximum 100)');
  }

  return fields.map(function(field) {
    return sanitizeString(field, 100);
  });
}

module.exports = {
  sanitizeUrl: sanitizeUrl,
  sanitizeString: sanitizeString,
  sanitizeAuth: sanitizeAuth,
  sanitizeNumber: sanitizeNumber,
  sanitizeFilterFields: sanitizeFilterFields,
  sanitizeFieldsArray: sanitizeFieldsArray
};