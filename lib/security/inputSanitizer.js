/**
 * Input Sanitization Module for SharePoint Connector
 * Provides comprehensive input validation and sanitization to prevent injection attacks
 * and ensure data integrity while maintaining backward compatibility.
 */

var _ = require('underscore');

/**
 * Configuration for input validation rules
 */
var VALIDATION_RULES = {
  // SharePoint GUID format validation
  guid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // SharePoint list/field names (alphanumeric, spaces, underscores, hyphens)
  listName: /^[a-zA-Z0-9_\-\s]{1,255}$/,
  
  // URL path components (no dangerous characters)
  urlPath: /^[a-zA-Z0-9_\-\/\.\s%]+$/,
  
  // OData operators
  odataOperator: /^(eq|ne|lt|le|gt|ge|and|or|not|contains|startswith|endswith)$/i,
  
  // Field names for select/expand operations
  fieldName: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  
  // Basic text content (removes potentially dangerous characters)
  textContent: /^[^<>\"';&|`${}()[\]\\]*$/,
  
  // Numeric values
  numeric: /^[0-9]+$/,
  
  // Boolean values
  boolean: /^(true|false)$/i
};

/**
 * HTML entity encoding map for additional security
 */
var HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Sanitizes a string by encoding HTML entities
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function encodeHtmlEntities(input) {
  if (typeof input !== 'string') {
    return input;
  }
  return input.replace(/[&<>"'`=\/]/g, function(match) {
    return HTML_ENTITIES[match];
  });
}

/**
 * Validates input against a specific rule
 * @param {*} input - Input to validate
 * @param {string} rule - Validation rule name
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInput(input, rule) {
  if (!input && input !== 0 && input !== false) {
    return false;
  }
  
  var regex = VALIDATION_RULES[rule];
  if (!regex) {
    return false;
  }
  
  return regex.test(String(input));
}

/**
 * Sanitizes SharePoint GUID
 * @param {string} guid - GUID to sanitize
 * @returns {string|null} - Sanitized GUID or null if invalid
 */
function sanitizeGuid(guid) {
  if (!guid || typeof guid !== 'string') {
    return null;
  }
  
  // Remove any extra characters and normalize
  var cleanGuid = guid.trim().toLowerCase();
  
  if (validateInput(cleanGuid, 'guid')) {
    return cleanGuid;
  }
  
  return null;
}

/**
 * Sanitizes list/field names
 * @param {string} name - Name to sanitize
 * @returns {string|null} - Sanitized name or null if invalid
 */
function sanitizeListName(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }
  
  // Remove leading/trailing whitespace and normalize
  var cleanName = name.trim();
  
  if (validateInput(cleanName, 'listName')) {
    return encodeHtmlEntities(cleanName);
  }
  
  return null;
}

/**
 * Sanitizes URL path components
 * @param {string} path - URL path to sanitize
 * @returns {string|null} - Sanitized path or null if invalid
 */
function sanitizeUrlPath(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }
  
  var cleanPath = path.trim();
  
  if (validateInput(cleanPath, 'urlPath')) {
    return encodeURIComponent(cleanPath);
  }
  
  return null;
}

/**
 * Sanitizes OData filter fields
 * @param {Array} filterFields - Array of filter field objects
 * @returns {Array|null} - Sanitized filter fields or null if invalid
 */
function sanitizeFilterFields(filterFields) {
  if (!filterFields || !Array.isArray(filterFields)) {
    return null;
  }
  
  var sanitizedFields = [];
  
  for (var i = 0; i < filterFields.length; i++) {
    var field = filterFields[i];
    
    if (!field || typeof field !== 'object') {
      continue;
    }
    
    var sanitizedField = {};
    
    // Sanitize field name
    if (field.field && validateInput(field.field, 'fieldName')) {
      sanitizedField.field = encodeHtmlEntities(field.field);
    } else {
      continue; // Skip invalid field
    }
    
    // Sanitize field value
    if (field.value !== undefined && field.value !== null) {
      if (typeof field.value === 'string') {
        sanitizedField.value = encodeHtmlEntities(field.value);
      } else if (typeof field.value === 'number' || typeof field.value === 'boolean') {
        sanitizedField.value = field.value;
      } else {
        sanitizedField.value = encodeHtmlEntities(String(field.value));
      }
    }
    
    // Sanitize operator if present
    if (field.operator) {
      if (validateInput(field.operator, 'odataOperator')) {
        sanitizedField.operator = field.operator.toLowerCase();
      }
    }
    
    sanitizedFields.push(sanitizedField);
  }
  
  return sanitizedFields.length > 0 ? sanitizedFields : null;
}

/**
 * Sanitizes select/expand field arrays
 * @param {Array} fields - Array of field names
 * @returns {Array|null} - Sanitized field names or null if invalid
 */
function sanitizeFieldArray(fields) {
  if (!fields || !Array.isArray(fields)) {
    return null;
  }
  
  var sanitizedFields = [];
  
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    
    if (typeof field === 'string' && validateInput(field, 'fieldName')) {
      sanitizedFields.push(encodeHtmlEntities(field));
    }
  }
  
  return sanitizedFields.length > 0 ? sanitizedFields : null;
}

/**
 * Sanitizes numeric values (like $top parameter)
 * @param {*} value - Value to sanitize
 * @returns {number|null} - Sanitized number or null if invalid
 */
function sanitizeNumeric(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  var numValue = parseInt(value, 10);
  
  if (isNaN(numValue) || numValue < 0 || numValue > 50000) {
    return null;
  }
  
  return numValue;
}

/**
 * Sanitizes boolean values
 * @param {*} value - Value to sanitize
 * @returns {boolean|null} - Sanitized boolean or null if invalid
 */
function sanitizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string' && validateInput(value, 'boolean')) {
    return value.toLowerCase() === 'true';
  }
  
  return null;
}

/**
 * Comprehensive client parameters sanitization
 * @param {Object} params - Client parameters to sanitize
 * @returns {Object} - Sanitized parameters
 */
function sanitizeClientParams(params) {
  if (!params || typeof params !== 'object') {
    return {};
  }
  
  var sanitized = {};
  
  // Copy non-user-input parameters directly (these are typically safe)
  var safeParams = ['username', 'password', 'url', 'federatedAuthUrl', 'workstation', 
                   'domain', 'type', 'authenticator', 'strictSSL', 'proxy', 'FedAuth', 'rtFa'];
  
  safeParams.forEach(function(param) {
    if (params[param] !== undefined) {
      sanitized[param] = params[param];
    }
  });
  
  // Sanitize user-controllable parameters
  if (params.context) {
    var sanitizedContext = sanitizeListName(params.context);
    if (sanitizedContext) {
      sanitized.context = sanitizedContext;
    }
  }
  
  // Sanitize boolean parameters
  ['verbose', 'fieldValuesAsText', 'orOperator', 'andOrOperator'].forEach(function(param) {
    if (params[param] !== undefined) {
      var sanitizedBool = sanitizeBoolean(params[param]);
      if (sanitizedBool !== null) {
        sanitized[param] = sanitizedBool;
      }
    }
  });
  
  // Sanitize filter fields
  if (params.filterFields) {
    var sanitizedFilters = sanitizeFilterFields(params.filterFields);
    if (sanitizedFilters) {
      sanitized.filterFields = sanitizedFilters;
    }
  }
  
  // Sanitize select and expand fields
  if (params.selectFields) {
    var sanitizedSelect = sanitizeFieldArray(params.selectFields);
    if (sanitizedSelect) {
      sanitized.selectFields = sanitizedSelect;
    }
  }
  
  if (params.expandFields) {
    var sanitizedExpand = sanitizeFieldArray(params.expandFields);
    if (sanitizedExpand) {
      sanitized.expandFields = sanitizedExpand;
    }
  }
  
  // Sanitize $top parameter
  if (params.$top) {
    var sanitizedTop = sanitizeNumeric(params.$top);
    if (sanitizedTop) {
      sanitized.$top = sanitizedTop.toString();
    } else {
      sanitized.$top = "5000"; // Default safe value
    }
  }
  
  return sanitized;
}

/**
 * Main export object with all sanitization functions
 */
module.exports = {
  // Individual sanitization functions
  sanitizeGuid: sanitizeGuid,
  sanitizeListName: sanitizeListName,
  sanitizeUrlPath: sanitizeUrlPath,
  sanitizeFilterFields: sanitizeFilterFields,
  sanitizeFieldArray: sanitizeFieldArray,
  sanitizeNumeric: sanitizeNumeric,
  sanitizeBoolean: sanitizeBoolean,
  sanitizeClientParams: sanitizeClientParams,
  
  // Utility functions
  encodeHtmlEntities: encodeHtmlEntities,
  validateInput: validateInput,
  
  // Configuration
  VALIDATION_RULES: VALIDATION_RULES,
  
  // Backward compatibility flag
  ENABLE_SANITIZATION: true
};