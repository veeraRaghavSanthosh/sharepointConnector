# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2025-09-16

### Security
- **CRITICAL**: Replaced deprecated `request` library with `axios` to address multiple security vulnerabilities
- Updated `underscore` from ^1.8.3 to ^1.13.6 to fix arbitrary code execution vulnerability
- Updated `xml2js` from ^0.4.16 to ^0.6.2 to fix prototype pollution vulnerability
- Updated `dotty` from 0.0.2 to ^0.1.2 to fix prototype pollution vulnerabilities
- Updated `async` from ^0.2.9 to ^3.2.4 for better security and performance
- Updated `agentkeepalive` from >=1.2.0 to ^4.5.0 for improved HTTP keep-alive support
- Updated `httpntlm` from ^1.5.2 to ^1.7.7 for NTLM authentication improvements
- Updated `underscore-deep-extend` from ^1.0.4 to ^1.1.5

### Changed
- **BREAKING**: Migrated from deprecated `request` library to `axios`
- Created backward-compatible request wrapper to maintain API compatibility
- Updated dev dependencies:
  - `grunt-contrib-jshint` from ^1.0.0 to ^3.2.0
  - `grunt-fh-build` from ^0.5.0 to ^1.0.3
  - `mocha` from ^2.2.4 to ^10.7.3
  - `nock` from ^2.10.0 to ^13.5.4

### Added
- New request wrapper (`lib/util/requestWrapper.js`) for seamless migration from request to axios
- Comprehensive unit tests for the request wrapper
- Support for modern HTTP client features through axios
- Better error handling and response processing

### Fixed
- Resolved 53 security vulnerabilities identified in dependency audit
- Improved HTTP request reliability and performance
- Enhanced authentication handling for NTLM, Basic, and Online authentication methods

### Technical Details
The migration from `request` to `axios` was done with full backward compatibility in mind:
- All existing authentication methods (NTLM, Basic, Online, SAML) continue to work
- Request options are automatically converted to axios configuration
- Response format maintains compatibility with existing code
- Error handling preserves original behavior

### Security Vulnerabilities Addressed
- CVE issues in `request`, `underscore`, `xml2js`, `dotty`, `minimatch`, `lodash`, and other dependencies
- Prototype pollution vulnerabilities
- Regular expression denial of service (ReDoS) vulnerabilities
- Command injection vulnerabilities
- Memory exposure vulnerabilities

### Migration Notes
This update maintains full backward compatibility. No code changes are required in your application. The internal request handling has been updated to use the more secure and actively maintained `axios` library while preserving the existing API surface.