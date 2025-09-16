# Changelog

## [1.1.7] - 2025-09-16

### Added
- New `src/utils/parse.js` module with async/await parsing utilities
- Comprehensive unit tests for parsing functionality
- Legacy callback wrapper functions for backward compatibility

### Changed
- Converted callback-based parsing functions to async/await pattern
- Improved error handling with more descriptive error messages
- Added token trimming to handle XML whitespace properly

### Technical Details
- **parseSamlResponse()**: Async function to parse SAML responses and extract binary security tokens
- **parseSamlAssertion()**: Async function to parse SAML assertions from XML responses  
- **parseFilterField()**: Async function to parse JSON filter field strings
- **parseFilterFields()**: Async function to parse arrays of JSON filter fields
- **parseSamlResponseCallback()**: Legacy callback wrapper for backward compatibility
- **parseSamlAssertionCallback()**: Legacy callback wrapper for backward compatibility

### Dependencies
- Utilizes existing `xml2js`, `dotty`, and `util` modules
- Maintains compatibility with existing SharePoint connector architecture

### Testing
- Added 13 comprehensive unit tests covering all parsing functions
- Tests include success cases, error handling, and legacy callback compatibility
- All tests pass with existing JSHint configuration

This update modernizes the parsing functionality while maintaining full backward compatibility with existing callback-based code.