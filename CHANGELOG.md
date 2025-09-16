# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2025-09-16

### Fixed
- Fixed TypeError in `src/db/index.js` when input is null or undefined
- Added comprehensive input validation to prevent null reference errors
- Added safe wrapper functions that return error objects instead of throwing exceptions

### Added
- New `src/db/index.js` module with database utility functions
- Input validation functions for null/undefined checking
- Safe processing functions that handle invalid input gracefully
- Comprehensive unit tests for null input scenarios

### Security
- Improved error handling to prevent potential crashes from malformed input
- Added type checking to ensure data integrity

## [1.1.6] - Previous Release
- Previous functionality (see git history for details)