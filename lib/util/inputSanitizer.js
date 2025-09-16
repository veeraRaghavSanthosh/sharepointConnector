// Simple validator functions to avoid external dependencies

/**
 * Input sanitization module for SharePoint Connector
 * Provides validation and sanitization for user inputs to prevent injection attacks
 */
module.exports = {
  
  /**
   * Sanitize string inputs by escaping HTML and removing potentially dangerous characters
   * @param {string} input - The input string to sanitize
   * @param {object} options - Sanitization options
   * @returns {string} - Sanitized string
   */
  sanitizeString: function(input, options) {
    options = options || {};
    
    if (typeof input !== 'string') {
      return input;
    }
    
    var sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Escape HTML entities if not explicitly disabled
    if (options.escapeHtml !== false) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    // Remove script tags and javascript: protocols
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Limit length if specified
    if (options.maxLength && typeof options.maxLength === 'number') {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
  },
  
  /**
   * Validate and sanitize SharePoint list ID (GUID)
   * @param {string} listId - The list ID to validate
   * @returns {string|null} - Valid list ID or null if invalid
   */
  sanitizeListId: function(listId) {
    if (!listId || typeof listId !== 'string') {
      return null;
    }
    
    // Remove any non-alphanumeric characters except hyphens
    var cleaned = listId.replace(/[^a-zA-Z0-9-]/g, '');
    
    // Validate GUID format (with or without braces) - more lenient for SharePoint
    var guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (guidRegex.test(cleaned)) {
      return cleaned;
    }
    
    return null;
  },
  
  /**
   * Validate and sanitize item ID (integer)
   * @param {string|number} itemId - The item ID to validate
   * @returns {number|null} - Valid item ID or null if invalid
   */
  sanitizeItemId: function(itemId) {
    if (itemId === null || itemId === undefined) {
      return null;
    }
    
    var parsed = parseInt(itemId, 10);
    
    if (isNaN(parsed) || parsed < 1 || parsed > 2147483647) {
      return null;
    }
    
    return parsed;
  },
  
  /**
   * Validate and sanitize URL paths
   * @param {string} path - The URL path to validate
   * @returns {string|null} - Valid path or null if invalid
   */
  sanitizePath: function(path) {
    if (!path || typeof path !== 'string') {
      return null;
    }
    
    // Remove dangerous path traversal patterns
    var sanitized = path.replace(/\.\./g, '');
    sanitized = sanitized.replace(/\/+/g, '/');
    
    // Validate allowed characters for SharePoint paths
    if (!/^[a-zA-Z0-9\/\-_\.\s%]+$/.test(sanitized)) {
      return null;
    }
    
    // Limit path length
    if (sanitized.length > 260) {
      return null;
    }
    
    return sanitized;
  },
  
  /**
   * Sanitize filter field objects
   * @param {array} filterFields - Array of filter field objects
   * @returns {array} - Sanitized filter fields
   */
  sanitizeFilterFields: function(filterFields) {
    if (!Array.isArray(filterFields)) {
      return null;
    }
    
    var sanitized = [];
    var maxFields = 50; // Limit number of filter fields
    
    for (var i = 0; i < filterFields.length && i < maxFields; i++) {
      var field = filterFields[i];
      
      if (field && typeof field === 'object' && field.field && field.value !== undefined) {
        sanitized.push({
          field: this.sanitizeString(field.field, { maxLength: 100 }),
          value: this.sanitizeString(String(field.value), { maxLength: 500 })
        });
      }
    }
    
    return sanitized;
  },
  
  /**
   * Sanitize select fields array
   * @param {array} selectFields - Array of field names to select
   * @returns {array} - Sanitized select fields
   */
  sanitizeSelectFields: function(selectFields) {
    if (!Array.isArray(selectFields)) {
      return null;
    }
    
    var sanitized = [];
    var maxFields = 100; // Limit number of select fields
    
    for (var i = 0; i < selectFields.length && i < maxFields; i++) {
      var field = selectFields[i];
      
      if (field && typeof field === 'string') {
        var sanitizedField = this.sanitizeString(field, { maxLength: 100, escapeHtml: false });
        
        // Validate field name format (alphanumeric, underscore, no spaces at start/end)
        if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(sanitizedField)) {
          sanitized.push(sanitizedField);
        }
      }
    }
    
    return sanitized;
  },
  
  /**
   * Sanitize expand fields array
   * @param {array} expandFields - Array of field names to expand
   * @returns {array} - Sanitized expand fields
   */
  sanitizeExpandFields: function(expandFields) {
    return this.sanitizeSelectFields(expandFields); // Same validation logic
  },
  
  /**
   * Sanitize $top parameter
   * @param {string|number} top - The $top value
   * @returns {number} - Sanitized $top value
   */
  sanitizeTop: function(top) {
    if (!top) {
      return 5000; // Default value
    }
    
    var parsed = parseInt(top, 10);
    
    if (isNaN(parsed) || parsed < 1) {
      return 5000;
    }
    
    // Limit maximum items to prevent resource exhaustion
    if (parsed > 10000) {
      return 10000;
    }
    
    return parsed;
  },
  
  /**
   * Validate authentication parameters
   * @param {object} params - Authentication parameters
   * @returns {object} - Validation result
   */
  validateAuthParams: function(params) {
    var errors = [];
    
    if (!params || typeof params !== 'object') {
      errors.push('Authentication parameters must be an object');
      return { isValid: false, errors: errors };
    }
    
    // Validate required fields
    if (!params.username || typeof params.username !== 'string') {
      errors.push('Username is required and must be a string');
    } else if (params.username.length > 256) {
      errors.push('Username is too long (max 256 characters)');
    }
    
    if (!params.password || typeof params.password !== 'string') {
      errors.push('Password is required and must be a string');
    } else if (params.password.length > 256) {
      errors.push('Password is too long (max 256 characters)');
    }
    
    if (!params.url || typeof params.url !== 'string') {
      errors.push('URL is required and must be a string');
    } else if (!/^https?:\/\/.+/.test(params.url)) {
      errors.push('URL must be a valid URL with http or https protocol');
    }
    
    // Validate auth type
    var validAuthTypes = ['basic', 'ntlm', 'online', 'onlinesaml'];
    if (params.type && validAuthTypes.indexOf(params.type) === -1) {
      errors.push('Invalid authentication type. Must be one of: ' + validAuthTypes.join(', '));
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};