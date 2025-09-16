/**
 * Security configuration for SharePoint connector
 * Centralizes all security-related settings and policies
 */

const securityConfig = {
  // Input sanitization settings
  inputSanitization: {
    maxStringLength: 1000,
    allowedFileTypes: [
      '.docx', '.xlsx', '.pptx', '.pdf', '.txt', '.csv',
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg',
      '.mp4', '.avi', '.mov', '.wmv', '.zip', '.7z'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowHtml: false,
    stripScripts: true
  },

  // Rate limiting configuration
  rateLimiting: {
    // Global limits
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // requests per window
      message: 'Too many requests from this origin'
    },

    // Per-user limits
    perUser: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per user per window
      message: 'Too many requests for this user'
    },

    // Per-IP limits
    perIP: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // requests per IP per window
      message: 'Too many requests from this IP'
    },

    // File upload limits
    uploads: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // uploads per window
      message: 'Too many file uploads'
    },

    // Complex query limits
    queries: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // complex queries per window
      message: 'Too many complex queries'
    }
  },

  // SharePoint-specific security settings
  sharepoint: {
    // Allowed SharePoint domains
    allowedDomains: [
      'sharepoint.com',
      '.sharepoint.com'
    ],

    // Required URL schemes
    allowedProtocols: ['https'],

    // Maximum query complexity
    maxQueryDepth: 5,
    maxQueryItems: 100,

    // File operation limits
    maxBatchSize: 50,
    maxConcurrentOperations: 10
  },

  // Authentication and authorization
  auth: {
    // Token expiration
    tokenExpiry: 3600, // 1 hour in seconds

    // Session settings
    sessionTimeout: 30 * 60 * 1000, // 30 minutes

    // Required permissions for operations
    permissions: {
      read: ['Sites.Read.All', 'Files.Read.All'],
      write: ['Sites.ReadWrite.All', 'Files.ReadWrite.All'],
      admin: ['Sites.FullControl.All']
    }
  },

  // Logging and monitoring
  logging: {
    // Log security events
    logSecurityEvents: true,
    
    // Log failed attempts
    logFailedAttempts: true,
    
    // Alert thresholds
    alertThresholds: {
      failedAttempts: 5, // per 5 minutes
      rateLimitHits: 10, // per minute
      suspiciousPatterns: 3 // per hour
    }
  },

  // CORS settings
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.sharepoint.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
};

module.exports = securityConfig;