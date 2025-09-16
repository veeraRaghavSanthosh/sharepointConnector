const validator = require('validator');
const xss = require('xss');

/**
 * Input sanitization middleware for SharePoint connector
 * Sanitizes and validates incoming request data to prevent XSS, injection attacks, and malformed data
 */
class InputSanitizer {
  constructor(options = {}) {
    this.options = {
      maxStringLength: options.maxStringLength || 1000,
      allowedFileTypes: options.allowedFileTypes || ['.docx', '.xlsx', '.pdf', '.txt', '.png', '.jpg'],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...options
    };
  }

  /**
   * Sanitize string input - remove XSS attempts and validate length
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    if (input.length > this.options.maxStringLength) {
      throw new Error(`Input exceeds maximum length of ${this.options.maxStringLength} characters`);
    }
    
    // Remove XSS attempts
    const sanitized = xss(input, {
      whiteList: {}, // Remove all HTML tags
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    });
    
    // Additional validation for SharePoint-specific fields
    return validator.escape(sanitized.trim());
  }

  /**
   * Sanitize SharePoint site URL
   */
  sanitizeSiteUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Site URL is required and must be a string');
    }
    
    // Validate URL format
    if (!validator.isURL(url, {
      protocols: ['https'],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true
    })) {
      throw new Error('Invalid SharePoint site URL format. HTTPS URLs only.');
    }
    
    // Ensure it's a SharePoint URL
    if (!url.includes('sharepoint.com') && !url.includes('.sharepoint.')) {
      throw new Error('URL must be a valid SharePoint site');
    }
    
    return url.trim();
  }

  /**
   * Sanitize file path/name
   */
  sanitizeFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path is required and must be a string');
    }
    
    // Remove dangerous characters
    const sanitized = filePath.replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
    
    // Validate file extension
    const extension = sanitized.toLowerCase().substring(sanitized.lastIndexOf('.'));
    if (extension && !this.options.allowedFileTypes.includes(extension)) {
      throw new Error(`File type ${extension} not allowed. Allowed types: ${this.options.allowedFileTypes.join(', ')}`);
    }
    
    return sanitized.trim();
  }

  /**
   * Sanitize list/library name
   */
  sanitizeListName(listName) {
    if (!listName || typeof listName !== 'string') {
      throw new Error('List name is required and must be a string');
    }
    
    // SharePoint list names have specific restrictions
    const sanitized = listName.replace(/[<>:"|?*\/\\]/g, '').trim();
    
    if (sanitized.length === 0) {
      throw new Error('List name cannot be empty after sanitization');
    }
    
    if (sanitized.length > 128) {
      throw new Error('List name cannot exceed 128 characters');
    }
    
    return sanitized;
  }

  /**
   * Sanitize query parameters for SharePoint OData queries
   */
  sanitizeODataQuery(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous OData operations
    const dangerousPatterns = [
      /javascript:/gi,
      /<script/gi,
      /exec\(/gi,
      /eval\(/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi
    ];
    
    let sanitized = query;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return validator.escape(sanitized.trim());
  }

  /**
   * Express middleware for request sanitization
   */
  middleware() {
    return (req, res, next) => {
      try {
        // Sanitize common SharePoint connector parameters
        if (req.body) {
          if (req.body.siteUrl) {
            req.body.siteUrl = this.sanitizeSiteUrl(req.body.siteUrl);
          }
          
          if (req.body.listName) {
            req.body.listName = this.sanitizeListName(req.body.listName);
          }
          
          if (req.body.fileName) {
            req.body.fileName = this.sanitizeFilePath(req.body.fileName);
          }
          
          if (req.body.query) {
            req.body.query = this.sanitizeODataQuery(req.body.query);
          }
          
          // Sanitize any string fields in the request body
          Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string' && key !== 'siteUrl' && key !== 'listName' && key !== 'fileName' && key !== 'query') {
              req.body[key] = this.sanitizeString(req.body[key]);
            }
          });
        }
        
        // Sanitize query parameters
        if (req.query) {
          Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
              if (key === 'siteUrl') {
                req.query[key] = this.sanitizeSiteUrl(req.query[key]);
              } else if (key === '$filter' || key === '$select' || key === '$orderby') {
                req.query[key] = this.sanitizeODataQuery(req.query[key]);
              } else {
                req.query[key] = this.sanitizeString(req.query[key]);
              }
            }
          });
        }
        
        next();
      } catch (error) {
        res.status(400).json({
          error: 'Input validation failed',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

module.exports = InputSanitizer;