# Changelog

All notable changes to this project will be documented in this file.

## [1.1.7] - 2025-09-16

### Fixed
- Fixed TypeError in `src/server.js` when input parameters are null or undefined
- Added comprehensive input validation to prevent null/undefined parameter errors
- Improved error messages to be more descriptive and helpful for debugging

### Added
- Created `src/server.js` with SharePointServer class wrapper
- Added input validation for all public methods
- Added comprehensive unit tests for input validation and error handling
- Added proper error handling with descriptive TypeError messages

### Security
- Enhanced input validation to prevent potential security issues from null/undefined inputs

## [1.1.6] - Previous Release
- Previous version features and fixes