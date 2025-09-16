# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-09-16

### Added - Security Enhancements

#### 🛡️ Input Sanitization
- **New utility module**: `lib/util/inputSanitizer.js` provides comprehensive input validation and sanitization
- **XSS Protection**: Automatic HTML entity encoding and dangerous pattern detection
- **SQL Injection Prevention**: Blocks common SQL injection patterns and validates data types
- **Parameter Validation**: Strict validation for all user inputs including:
  - SharePoint GUIDs (proper format validation)
  - Field names (alphanumeric + underscore, max 32 chars)
  - List titles (safe characters only, max 255 chars)
  - URL segments (prevents path traversal attacks)
  - Filter fields (JSON validation and field name checking)
  - Select/expand fields (field name validation)
  - $top values (positive integers within limits)
- **Client Parameter Sanitization**: All client initialization parameters are validated and sanitized
- **Integration Points**: Input sanitization integrated into:
  - Client initialization (`lib/client.js`)
  - List operations (`lib/objects/lists.js`)
  - List item operations (`lib/objects/listItems.js`)
  - URL building (`lib/util/urlBuilderTools.js`)
  - Request processing (`lib/util/doRequest.js`)

#### 🚦 Rate Limiting
- **New utility module**: `lib/util/rateLimiter.js` provides configurable rate limiting
- **Operation-Specific Limits**: Different rate limits for different operation types:
  - LOGIN: 10 requests per minute (default)
  - READ: 100 requests per minute (default)
  - WRITE: 50 requests per minute (default)
  - DELETE: 20 requests per minute (default)
  - GLOBAL: 200 total requests per minute (default)
- **Configurable Windows**: Customizable time windows for rate limiting
- **Client-Specific Tracking**: Rate limits tracked per client (username + URL combination)
- **Automatic Operation Detection**: Automatically determines operation type from request options
- **Error Handling**: Provides detailed error messages with retry-after information
- **Statistics**: Built-in statistics tracking for monitoring usage
- **Memory Management**: Automatic cleanup of expired rate limit records
- **Integration**: Rate limiting integrated into the core request processing pipeline

#### 🧪 Comprehensive Testing
- **Input Sanitization Tests**: Complete test suite covering all validation functions
- **Rate Limiting Tests**: Tests for rate limit enforcement, window expiration, and statistics
- **Integration Tests**: End-to-end tests combining input sanitization and rate limiting
- **Security Scenarios**: Tests for XSS, SQL injection, and abuse prevention
- **Edge Cases**: Comprehensive coverage of boundary conditions and error scenarios

### Changed
- **Package Version**: Bumped to 1.2.0 to reflect major security improvements
- **Package Description**: Updated to highlight security features
- **Keywords**: Added security-related keywords for better discoverability

### Security
- **Vulnerability Mitigation**: Protection against:
  - Cross-Site Scripting (XSS) attacks
  - SQL injection attempts
  - Path traversal attacks
  - API abuse and DoS attacks
  - Parameter pollution
  - Invalid data type attacks
- **Input Validation**: All user inputs are validated before processing
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Error Handling**: Secure error messages that don't leak sensitive information

### Configuration
Rate limiting can be configured during client initialization:

```javascript
var sharepoint = require('sharepointconnector')({
  username: 'someusername',
  password: 'somepassword',
  url: 'https://sharepointHostname.com',
  type: 'ntlm',
  rateLimitOptions: {
    enabled: true, // Enable/disable rate limiting
    limits: {
      LOGIN: { requests: 10, window: 60000 },   // 10 login attempts per minute
      READ: { requests: 100, window: 60000 },   // 100 read operations per minute
      WRITE: { requests: 50, window: 60000 },   // 50 write operations per minute
      DELETE: { requests: 20, window: 60000 },  // 20 delete operations per minute
      GLOBAL: { requests: 200, window: 60000 }  // 200 total requests per minute
    }
  }
});
```

### Backward Compatibility
- All existing APIs remain unchanged
- Input sanitization is transparent to existing code
- Rate limiting is enabled by default but can be disabled
- No breaking changes to existing functionality

### Files Added
- `lib/util/inputSanitizer.js` - Input validation and sanitization utilities
- `lib/util/rateLimiter.js` - Rate limiting implementation
- `test/unit/test-input-sanitization.js` - Input sanitization tests
- `test/unit/test-rate-limiting.js` - Rate limiting tests
- `test/unit/test-security-integration.js` - Integration tests

### Files Modified
- `lib/client.js` - Added input sanitization and rate limiting configuration
- `lib/util/doRequest.js` - Integrated rate limiting and input validation
- `lib/objects/lists.js` - Added input validation for list operations
- `lib/objects/listItems.js` - Added input validation for list item operations
- `lib/util/urlBuilderTools.js` - Added input validation for URL parameters
- `package.json` - Version bump and description updates

## [1.1.6] - Previous Release
- Previous functionality maintained
- See git history for details of earlier releases