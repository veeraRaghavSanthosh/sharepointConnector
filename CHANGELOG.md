# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2025-09-16

### Added
- New User API module (`src/api/user.js`) with comprehensive input validation
- Unit tests for User API functionality (`test/unit/test-user.js`)
- Input validation to prevent TypeError when handling null or undefined inputs

### Fixed
- **BREAKING BUG FIX**: Fixed TypeError in `src/api/user.js` when input is null or undefined
  - Added proper null/undefined input validation for all user API functions
  - Added type checking to ensure inputs are objects when required
  - Added specific validation for required fields (user ID, user name)
  - All functions now return meaningful error messages with error codes instead of throwing TypeErrors

### Security
- Enhanced input validation prevents potential security issues from malformed inputs

## [1.1.6] - Previous Release
- See git history for previous changes