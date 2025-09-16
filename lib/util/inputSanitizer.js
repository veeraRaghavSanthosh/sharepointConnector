/**
 * Input Sanitization Module
 * Provides validation and sanitization for SharePoint connector inputs
 * to prevent injection attacks and ensure data integrity
 */

var validator = require('validator');

/**
 * Sanitizes and validates a GUID
 * @param {string} guid - The GUID to validate
 * @returns {string|null} - Sanitized GUID or null if invalid
 */
function sanitizeGuid(guid) {
  if (!guid || typeof guid !== 'string') {
    return null;
  }
  
  // Remove any whitespace
  guid = guid.trim();
  
  // GUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  var guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!guidRegex.test(guid)) {
    return null;
  }
  
  return guid.toLowerCase();
}

/**
 * Sanitizes a SharePoint list/item title
 * @param {string} title - The title to sanitize
 * @returns {string|null} - Sanitized title or null if invalid
 */
function sanitizeTitle(title) {
  if (!title || typeof title !== 'string') {
    return null;
  }
  
  // Remove leading/trailing whitespace
  title = title.trim();
  
  // Check length (SharePoint limit is 255 characters)
  if (title.length === 0 || title.length > 255) {
    return null;
  }
  
  // Remove or escape potentially dangerous characters
  // SharePoint doesn't allow certain characters in titles
  var invalidChars = /[<>"#%{}|\\\^~\[\]`]/g;
  if (invalidChars.test(title)) {
    return null;
  }
  
  return title;
}

/**
 * Sanitizes a URL path component
 * @param {string} path - The path to sanitize
 * @returns {string|null} - Sanitized path or null if invalid
 */
function sanitizePath(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }
  
  path = path.trim();
  
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('//') || path.includes('\\')) {
    return null;
  }
  
  // Basic length check
  if (path.length > 2048) {
    return null;
  }
  
  return path;
}

/**
 * Sanitizes a SharePoint URL
 * @param {string} url - The URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  url = url.trim();
  
  // Basic URL validation
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true
  })) {
    return null;
  }
  
  // Check for suspicious patterns
  var suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /ftp:/i
  ];
  
  for (var i = 0; i < suspiciousPatterns.length; i++) {
    if (suspiciousPatterns[i].test(url)) {
      return null;
    }
  }
  
  return url;
}

/**
 * Sanitizes a numeric ID
 * @param {string|number} id - The ID to sanitize
 * @returns {number|null} - Sanitized numeric ID or null if invalid
 */
function sanitizeNumericId(id) {
  if (id === null || id === undefined) {
    return null;
  }
  
  var numId = parseInt(id, 10);
  
  if (isNaN(numId) || numId < 0 || numId > 2147483647) { // SQL Server int max
    return null;
  }
  
  return numId;
}

/**
 * Sanitizes OData filter expressions
 * @param {string} filter - The filter expression to sanitize
 * @returns {string|null} - Sanitized filter or null if invalid
 */
function sanitizeODataFilter(filter) {
  if (!filter || typeof filter !== 'string') {
    return null;
  }
  
  filter = filter.trim();
  
  // Basic length check
  if (filter.length > 1000) {
    return null;
  }
  
  // Check for SQL injection patterns
  var sqlInjectionPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(--|\|\|)/,
    /['"]\s*;\s*['"]/,
    /\bor\s+\d+\s*=\s*\d+/i,
    /\band\s+\d+\s*=\s*\d+/i
  ];
  
  for (var i = 0; i < sqlInjectionPatterns.length; i++) {
    if (sqlInjectionPatterns[i].test(filter)) {
      return null;
    }
  }
  
  return filter;
}

/**
 * Sanitizes request options object
 * @param {object} opts - The options object to sanitize
 * @returns {object|null} - Sanitized options or null if invalid
 */
function sanitizeRequestOptions(opts) {
  if (!opts || typeof opts !== 'object') {
    return null;
  }
  
  var sanitized = {};
  
  // Sanitize URL if present
  if (opts.url) {
    var urlPart = opts.url;
    
    // For relative URLs (SharePoint API calls), validate the path
    if (urlPart.startsWith('/')) {
      sanitized.url = sanitizePath(urlPart);
    } else {
      sanitized.url = sanitizeUrl(urlPart);
    }
    
    if (!sanitized.url) {
      return null;
    }
  }
  
  // Sanitize method
  if (opts.method) {
    var allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'MERGE'];
    var method = opts.method.toUpperCase();
    if (allowedMethods.indexOf(method) === -1) {
      return null;
    }
    sanitized.method = method;
  }
  
  // Copy other safe properties
  var safeProps = ['json', 'headers', 'type'];
  for (var i = 0; i < safeProps.length; i++) {
    var prop = safeProps[i];
    if (opts.hasOwnProperty(prop)) {
      sanitized[prop] = opts[prop];
    }
  }
  
  return sanitized;
}

module.exports = {
  sanitizeGuid: sanitizeGuid,
  sanitizeTitle: sanitizeTitle,
  sanitizePath: sanitizePath,
  sanitizeUrl: sanitizeUrl,
  sanitizeNumericId: sanitizeNumericId,
  sanitizeODataFilter: sanitizeODataFilter,
  sanitizeRequestOptions: sanitizeRequestOptions
};