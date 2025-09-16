/**
 * Input Sanitization Utility for SharePoint Connector
 * Provides validation and sanitization functions to prevent injection attacks
 * and ensure data integrity for all user inputs.
 */

var _ = require('underscore');

// Regular expressions for validation
var PATTERNS = {
  // SharePoint GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  GUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // SharePoint field names: alphanumeric, underscore, no spaces, max 32 chars
  FIELD_NAME: /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/,
  
  // Safe URL path segments: alphanumeric, hyphens, underscores, dots, parentheses, apostrophes for SharePoint
  URL_SEGMENT: /^[a-zA-Z0-9\-_.\/\(\)\'$=&]+$/,
  
  // SharePoint list titles: alphanumeric, spaces, hyphens, underscores, max 255 chars
  LIST_TITLE: /^[a-zA-Z0-9\s\-_]{1,255}$/,
  
  // OData operators
  ODATA_OPERATORS: /^(eq|ne|gt|ge|lt|le|and|or|not)$/i,
  
  // Numeric values (including decimals)
  NUMERIC: /^-?\d+(\.\d+)?$/,
  
  // Safe string values (no script tags, SQL injection patterns)
  SAFE_STRING: /^[^<>'";&|`\x00-\x1f\x7f]*$/,
  
  // Basic URL validation
  URL: /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/
};

// Maximum lengths for various input types
var MAX_LENGTHS = {
  FIELD_NAME: 32,
  LIST_TITLE: 255,
  DESCRIPTION: 1000,
  URL_SEGMENT: 260, // Windows path limit
  FILTER_VALUE: 500,
  TOP_VALUE: 10000
};

// Dangerous patterns that should be blocked
var DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /import\s*\(/gi,
  /@import/gi,
  /\bselect\b.*\bfrom\b/gi,
  /\binsert\b.*\binto\b/gi,
  /\bupdate\b.*\bset\b/gi,
  /\bdelete\b.*\bfrom\b/gi,
  /\bdrop\b.*\btable\b/gi,
  /\bunion\b.*\bselect\b/gi,
  /\bexec\b|\bexecute\b/gi,
  /\bxp_\w+/gi,
  /\bsp_\w+/gi
];

/**
 * Sanitizes a string by removing dangerous patterns and encoding special characters
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
function sanitizeString(input, maxLength) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  var sanitized = input.trim();
  
  // Check length
  if (maxLength && sanitized.length > maxLength) {
    throw new Error('Input exceeds maximum length of ' + maxLength + ' characters');
  }
  
  // Check for dangerous patterns
  for (var i = 0; i < DANGEROUS_PATTERNS.length; i++) {
    if (DANGEROUS_PATTERNS[i].test(sanitized)) {
      throw new Error('Input contains potentially dangerous content');
    }
  }
  
  // Basic HTML entity encoding for critical characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validates and sanitizes a SharePoint GUID
 * @param {string} guid - The GUID to validate
 * @returns {string} - Validated GUID
 */
function validateGuid(guid) {
  if (!guid || typeof guid !== 'string') {
    throw new Error('GUID must be a non-empty string');
  }
  
  var cleanGuid = guid.trim().toLowerCase();
  
  if (!PATTERNS.GUID.test(cleanGuid)) {
    throw new Error('Invalid GUID format');
  }
  
  return cleanGuid;
}

/**
 * Validates and sanitizes a SharePoint field name
 * @param {string} fieldName - The field name to validate
 * @returns {string} - Validated field name
 */
function validateFieldName(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') {
    throw new Error('Field name must be a non-empty string');
  }
  
  var cleanFieldName = fieldName.trim();
  
  if (!PATTERNS.FIELD_NAME.test(cleanFieldName)) {
    throw new Error('Invalid field name format. Must start with letter, contain only alphanumeric characters and underscores, max 32 characters');
  }
  
  return cleanFieldName;
}

/**
 * Validates and sanitizes a SharePoint list title
 * @param {string} title - The list title to validate
 * @returns {string} - Validated and sanitized title
 */
function validateListTitle(title) {
  if (!title || typeof title !== 'string') {
    throw new Error('List title must be a non-empty string');
  }
  
  var cleanTitle = sanitizeString(title, MAX_LENGTHS.LIST_TITLE);
  
  if (!PATTERNS.LIST_TITLE.test(title.trim())) {
    throw new Error('Invalid list title format. Must contain only alphanumeric characters, spaces, hyphens, and underscores');
  }
  
  return cleanTitle;
}

/**
 * Validates and sanitizes URL segments
 * @param {string} segment - The URL segment to validate
 * @returns {string} - Validated URL segment
 */
function validateUrlSegment(segment) {
  if (!segment || typeof segment !== 'string') {
    throw new Error('URL segment must be a non-empty string');
  }
  
  var cleanSegment = segment.trim();
  
  if (cleanSegment.length > MAX_LENGTHS.URL_SEGMENT) {
    throw new Error('URL segment exceeds maximum length');
  }
  
  if (!PATTERNS.URL_SEGMENT.test(cleanSegment)) {
    throw new Error('Invalid URL segment format');
  }
  
  return cleanSegment;
}

/**
 * Validates and sanitizes filter fields array
 * @param {Array} filterFields - Array of filter field objects
 * @returns {Array} - Validated and sanitized filter fields
 */
function validateFilterFields(filterFields) {
  if (!filterFields) {
    return null;
  }
  
  if (!_.isArray(filterFields)) {
    throw new Error('Filter fields must be an array');
  }
  
  return _.map(filterFields, function(filterField) {
    var parsed;
    
    if (typeof filterField === 'string') {
      try {
        parsed = JSON.parse(filterField);
      } catch (e) {
        throw new Error('Invalid JSON in filter field: ' + e.message);
      }
    } else if (typeof filterField === 'object') {
      parsed = filterField;
    } else {
      throw new Error('Filter field must be string or object');
    }
    
    if (!parsed.field || !parsed.value) {
      throw new Error('Filter field must have both "field" and "value" properties');
    }
    
    // Validate field name
    var validatedField = validateFieldName(parsed.field);
    
    // Sanitize filter value
    var validatedValue = sanitizeString(parsed.value.toString(), MAX_LENGTHS.FILTER_VALUE);
    
    return JSON.stringify({
      field: validatedField,
      value: validatedValue
    });
  });
}

/**
 * Validates and sanitizes select fields array
 * @param {Array} selectFields - Array of field names to select
 * @returns {Array} - Validated field names
 */
function validateSelectFields(selectFields) {
  if (!selectFields) {
    return null;
  }
  
  if (!_.isArray(selectFields)) {
    throw new Error('Select fields must be an array');
  }
  
  return _.map(selectFields, function(field) {
    return validateFieldName(field.toString());
  });
}

/**
 * Validates and sanitizes expand fields array
 * @param {Array} expandFields - Array of field names to expand
 * @returns {Array} - Validated field names
 */
function validateExpandFields(expandFields) {
  if (!expandFields) {
    return null;
  }
  
  if (!_.isArray(expandFields)) {
    throw new Error('Expand fields must be an array');
  }
  
  return _.map(expandFields, function(field) {
    return validateFieldName(field.toString());
  });
}

/**
 * Validates and sanitizes the $top parameter
 * @param {string|number} topValue - The $top value
 * @returns {string} - Validated $top value
 */
function validateTopValue(topValue) {
  if (!topValue) {
    return null;
  }
  
  var numValue = parseInt(topValue, 10);
  
  if (isNaN(numValue) || numValue < 1) {
    throw new Error('$top value must be a positive integer');
  }
  
  if (numValue > MAX_LENGTHS.TOP_VALUE) {
    throw new Error('$top value exceeds maximum allowed value of ' + MAX_LENGTHS.TOP_VALUE);
  }
  
  return numValue.toString();
}

/**
 * Validates and sanitizes client initialization parameters
 * @param {Object} params - Client initialization parameters
 * @returns {Object} - Sanitized parameters
 */
function validateClientParams(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }
  
  var sanitized = {};
  
  // Required fields
  if (!params.username || typeof params.username !== 'string') {
    throw new Error('Username is required and must be a string');
  }
  sanitized.username = sanitizeString(params.username, 255);
  
  if (!params.password || typeof params.password !== 'string') {
    throw new Error('Password is required and must be a string');
  }
  sanitized.password = params.password; // Don't log or sanitize passwords extensively
  
  if (!params.url || typeof params.url !== 'string') {
    throw new Error('URL is required and must be a string');
  }
  
  // Basic URL validation
  if (!PATTERNS.URL.test(params.url)) {
    throw new Error('Invalid URL format. Must be a valid HTTP or HTTPS URL');
  }
  sanitized.url = params.url;
  
  // Optional fields
  if (params.context) {
    sanitized.context = validateUrlSegment(params.context);
  }
  
  if (params.federatedAuthUrl && params.federatedAuthUrl !== null) {
    if (!PATTERNS.URL.test(params.federatedAuthUrl)) {
      throw new Error('Invalid federated auth URL format');
    }
    sanitized.federatedAuthUrl = params.federatedAuthUrl;
  }
  
  if (params.workstation) {
    sanitized.workstation = sanitizeString(params.workstation, 255);
  }
  
  if (params.domain) {
    sanitized.domain = sanitizeString(params.domain, 255);
  }
  
  if (params.type) {
    var allowedTypes = ['basic', 'ntlm', 'online', 'onlinesaml'];
    if (allowedTypes.indexOf(params.type) === -1) {
      throw new Error('Invalid authentication type. Must be one of: ' + allowedTypes.join(', '));
    }
    sanitized.type = params.type;
  }
  
  // Boolean fields
  sanitized.verbose = typeof params.verbose === 'boolean' ? params.verbose : false;
  sanitized.fieldValuesAsText = typeof params.fieldValuesAsText === 'boolean' ? params.fieldValuesAsText : false;
  sanitized.orOperator = typeof params.orOperator === 'boolean' ? params.orOperator : false;
  sanitized.andOrOperator = typeof params.andOrOperator === 'boolean' ? params.andOrOperator : false;
  sanitized.strictSSL = typeof params.strictSSL === 'boolean' ? params.strictSSL : true;
  
  // Array fields
  if (params.filterFields) {
    sanitized.filterFields = validateFilterFields(params.filterFields);
  }
  
  if (params.selectFields) {
    sanitized.selectFields = validateSelectFields(params.selectFields);
  }
  
  if (params.expandFields) {
    sanitized.expandFields = validateExpandFields(params.expandFields);
  }
  
  // Top value
  if (params.$top) {
    sanitized.$top = validateTopValue(params.$top);
  }
  
  // Proxy
  if (params.proxy) {
    sanitized.proxy = sanitizeString(params.proxy, 255);
  }
  
  // Auth tokens (don't sanitize extensively, just validate they exist)
  if (params.FedAuth) {
    sanitized.FedAuth = params.FedAuth;
  }
  
  if (params.rtFa) {
    sanitized.rtFa = params.rtFa;
  }
  
  return sanitized;
}

module.exports = {
  sanitizeString: sanitizeString,
  validateGuid: validateGuid,
  validateFieldName: validateFieldName,
  validateListTitle: validateListTitle,
  validateUrlSegment: validateUrlSegment,
  validateFilterFields: validateFilterFields,
  validateSelectFields: validateSelectFields,
  validateExpandFields: validateExpandFields,
  validateTopValue: validateTopValue,
  validateClientParams: validateClientParams,
  PATTERNS: PATTERNS,
  MAX_LENGTHS: MAX_LENGTHS
};