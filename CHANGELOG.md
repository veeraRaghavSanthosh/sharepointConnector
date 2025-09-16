# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-09-16

### Added
- **Input Sanitization**: Comprehensive input validation and sanitization to prevent injection attacks
  - URL validation with protocol filtering (blocks javascript:, data:, vbscript:, file: protocols)
  - String sanitization removing null bytes, control characters, script tags, and event handlers
  - Authentication credential validation with length limits and type checking
  - Parameter validation for filter fields, select fields, and numeric values
  - Maximum length enforcement for all string inputs
  
- **Rate Limiting**: Token bucket-based rate limiting to prevent API abuse
  - Configurable request limits per time window (default: 100 requests/minute)
  - Burst protection (default: max 10 rapid requests)
  - Per-user rate limiting based on username
  - Automatic token refill and cleanup of old entries
  - Rate limit middleware for easy integration
  - HTTP 429 status code responses for exceeded limits
  
- **Security Enhancements**:
  - Input validation at client initialization
  - Request-level URL sanitization
  - Rate limiting integration in doRequest utility
  - Comprehensive error handling with security-focused error messages

### Security
- **BREAKING**: Invalid URLs, malicious protocols, and suspicious input patterns are now rejected
- **BREAKING**: Requests exceeding rate limits will fail with rate limit errors
- Added protection against XSS attacks through input sanitization
- Added protection against path traversal attacks
- Added protection against script injection in various input fields

### Testing
- Added comprehensive unit tests for input sanitization functions
- Added unit tests for rate limiting functionality
- Added integration test demonstrating security features
- All tests validate both positive and negative security scenarios

### Configuration
- New optional `rateLimit` parameter in client initialization for custom rate limiting
- Rate limiting can be configured with `maxRequests`, `windowMs`, and `maxBurst` options
- Input validation limits are configurable through the sanitization functions

### Dependencies
- No new dependencies added - security features use only Node.js built-in modules

### Migration Guide
- **Users with valid, standard SharePoint URLs**: No changes required
- **Users with custom authentication flows**: Ensure all input parameters meet validation requirements
- **High-volume applications**: Consider configuring custom rate limits if needed
- **Applications with special URL patterns**: Review URL validation logic and adjust if necessary

### Examples

#### Basic Usage (No Changes Required)
```javascript
var sharepoint = require('sharepointconnector')({
  username: 'user@company.com',
  password: 'securepassword',
  url: 'https://company.sharepoint.com',
  type: 'online'
});
```

#### Custom Rate Limiting
```javascript
var sharepoint = require('sharepointconnector')({
  username: 'user@company.com',
  password: 'securepassword',
  url: 'https://company.sharepoint.com',
  type: 'online',
  rateLimit: {
    maxRequests: 200,    // 200 requests per window
    windowMs: 60000,     // 1 minute window
    maxBurst: 20         // Allow 20 rapid requests
  }
});
```

#### Error Handling for Rate Limits
```javascript
sharepoint.lists.list(function(err, lists) {
  if (err && err.rateLimitExceeded) {
    console.log('Rate limit exceeded. Retry after:', err.retryAfter, 'seconds');
    return;
  }
  // Handle normal response
});
```