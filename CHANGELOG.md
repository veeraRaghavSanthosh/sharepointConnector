# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-09-16

### Added
- **Input Sanitization**: Comprehensive input validation and sanitization to prevent injection attacks
  - GUID validation and normalization
  - Title and description sanitization with character filtering
  - URL and path validation to prevent path traversal attacks
  - OData filter sanitization to prevent SQL injection
  - Request options validation
- **Rate Limiting**: Token bucket-based rate limiting to prevent API abuse
  - Configurable rate limits per operation type (general, auth, file operations)
  - Per-client rate limiting with automatic cleanup
  - Default limits: 100 requests/minute for general operations, 20 requests/5 minutes for auth, 50 requests/minute for file operations
  - Graceful error responses with retry-after headers
- **Security Configuration Options**:
  - `enableInputSanitization` (default: true) - Enable/disable input sanitization
  - `enableRateLimiting` (default: true) - Enable/disable rate limiting
  - `rateLimitConfig` - Custom rate limiting configuration
- **Comprehensive Test Suite**:
  - Unit tests for input sanitization functions
  - Unit tests for rate limiting functionality
  - Integration tests for security features

### Security
- **BREAKING**: Invalid input now returns structured error objects with status codes instead of generic error messages
- **BREAKING**: Rate limiting may block legitimate requests if limits are exceeded
- Added protection against:
  - SQL injection in OData filters
  - Path traversal attacks in URLs
  - Cross-site scripting (XSS) in titles and descriptions
  - API abuse through rate limiting

### Dependencies
- Added `validator` ^13.11.0 for URL validation

### Documentation
- Updated README with security configuration options
- Added security best practices documentation
- Documented new error response formats

### Migration Guide
- **Input Validation**: Ensure your application handles the new structured error responses (objects with `message` and `statusCode` properties)
- **Rate Limiting**: Monitor your application's request patterns and adjust rate limits if needed using the `rateLimitConfig` option
- **Error Handling**: Update error handling to check for `statusCode` property in error responses
- **Dependencies**: Run `npm install` to install the new `validator` dependency

### Example Usage with Security Features
```javascript
var sharepoint = require('sharepointconnector')({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'online',
  // Security options (all default to true)
  enableInputSanitization: true,
  enableRateLimiting: true,
  // Custom rate limiting (optional)
  rateLimitConfig: {
    generalCapacity: 200,      // 200 requests per minute for general ops
    generalRefillRate: 200,
    generalRefillPeriod: 60000,
    authCapacity: 50,          // 50 auth requests per 5 minutes
    authRefillRate: 50,
    authRefillPeriod: 300000
  }
});

sharepoint.login(function(err) {
  if (err) {
    if (err.statusCode === 400) {
      console.error('Invalid input:', err.message);
    } else if (err.statusCode === 429) {
      console.error('Rate limited. Retry after:', err.retryAfter, 'seconds');
    } else {
      console.error('Other error:', err);
    }
    return;
  }
  
  // Your SharePoint operations here
});
```

## [1.1.6] - Previous Release
- Previous functionality and bug fixes