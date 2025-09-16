# Changelog

## [1.1.7] - 2025-09-16

### Added
- **Security Enhancements**: Added comprehensive input sanitization and rate limiting to prevent abuse
  - Input sanitization for all user inputs including list IDs, item IDs, paths, and filter fields
  - Rate limiting with configurable limits per second, minute, and hour
  - Security middleware that integrates both features into the request pipeline
  - HTML entity escaping and script tag removal to prevent XSS attacks
  - Path traversal protection and URL validation
  - Authentication parameter validation

### Security
- **Input Sanitization**: All user inputs are now validated and sanitized before processing
  - GUID format validation for list IDs
  - Integer validation for item IDs with range checking
  - Path sanitization to prevent directory traversal attacks
  - Filter field sanitization with length limits
  - HTML escaping to prevent XSS attacks
  
- **Rate Limiting**: Configurable rate limits to prevent API abuse
  - Default limits: 10 requests/second, 100 requests/minute, 1000 requests/hour
  - Customizable limits via client configuration
  - Rate limiting statistics and monitoring
  - Graceful error handling with appropriate HTTP status codes

### Technical Details
- New modules: `inputSanitizer.js`, `rateLimiter.js`, `securityMiddleware.js`
- Comprehensive unit tests for all security features
- No breaking changes to existing API
- Optional security features that can be configured during client initialization

### Files Added
- `lib/util/inputSanitizer.js` - Input validation and sanitization utilities
- `lib/util/rateLimiter.js` - Rate limiting implementation
- `lib/util/securityMiddleware.js` - Security middleware integration
- `test/unit/test-security.js` - Unit tests for security features