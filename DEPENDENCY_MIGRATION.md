# Dependency Migration Guide

This document outlines the dependency updates made to improve security and maintainability while preserving backward compatibility.

## Updated Dependencies

### Production Dependencies

| Package | Old Version | New Version | Changes |
|---------|-------------|-------------|---------|
| `agentkeepalive` | `>=1.2.0` | `^4.5.0` | Updated to latest stable version with security fixes |
| `async` | `^0.2.9` | `^3.2.4` | **BREAKING**: Major version update - see migration notes below |
| `dotty` | `0.0.2` | `^0.1.2` | Minor update with bug fixes |
| `httpntlm` | `^1.5.2` | `^1.7.7` | Updated with security patches |
| `request` | `^2.60.0` | **REMOVED** | **BREAKING**: Replaced with `axios ^1.6.0` - deprecated and vulnerable |
| `axios` | **NEW** | `^1.6.0` | **NEW**: Modern HTTP client replacing deprecated `request` |
| `underscore` | `^1.8.3` | `^1.13.6` | Updated with security fixes |
| `underscore-deep-extend` | `^1.0.4` | `^1.1.5` | Minor update |
| `xml2js` | `^0.4.16` | `^0.6.2` | Updated with security fixes and improvements |

### Development Dependencies

| Package | Old Version | New Version | Changes |
|---------|-------------|-------------|---------|
| `grunt-contrib-jshint` | `^1.0.0` | `^3.2.0` | Major version update |
| `mocha` | `^2.2.4` | `^10.2.0` | Major version update with modern features |
| `nock` | `^2.10.0` | `^13.4.0` | Major version update |

## Breaking Changes and Migration

### 1. `request` → `axios`

**Impact**: The deprecated `request` library has been replaced with `axios`.

**Migration Required**: 
- Update all `require('request')` to `require('axios')`
- Convert request-style options to axios configuration
- Update response handling (axios responses have different structure)

**Compatibility Layer**: A compatibility layer has been implemented in `lib/auth/basic.js` to maintain backward compatibility.

### 2. `async` Library (v0.2.9 → v3.2.4)

**Impact**: Major version change with API differences.

**Key Changes**:
- Callback signature may have changed
- Some methods renamed or removed
- Error handling improvements

**Migration**: 
- Review all `async` usage
- Test waterfall, parallel, and other async patterns
- Update error handling as needed

### 3. `mocha` (v2.2.4 → v10.2.0)

**Impact**: Major testing framework update.

**Key Changes**:
- Modern JavaScript support (ES6+)
- Improved async/await support
- CLI changes

## Security Vulnerabilities Addressed

1. **CVE-2023-28155**: `request` library - Complete removal of deprecated package
2. **Multiple vulnerabilities** in old `underscore` versions
3. **XML parsing vulnerabilities** in old `xml2js` versions
4. **HTTP connection vulnerabilities** in old `agentkeepalive` versions

## Testing Requirements

Before deploying these changes:

1. **Unit Tests**: Run all unit tests to ensure functionality
2. **Integration Tests**: Test SharePoint connectivity with all auth methods
3. **Authentication Tests**: Verify Basic, NTLM, and SAML authentication still work
4. **File Operations**: Test file upload/download operations
5. **List Operations**: Verify list CRUD operations

## Rollback Plan

If issues arise:

1. Revert `package.json` to original versions
2. Run `npm install` to restore old dependencies
3. Revert code changes in authentication modules

## Installation Instructions

```bash
# Remove old node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install updated dependencies
npm install

# Run tests
npm test
```

## Known Issues

1. Some legacy Node.js versions may not be compatible with newer dependencies
2. SSL/TLS configuration may need adjustment for newer `axios` version
3. Error handling patterns may need updates due to `async` library changes

## Recommendations

1. **Immediate**: Test thoroughly in development environment
2. **Short-term**: Update error handling for new async patterns  
3. **Long-term**: Consider migrating to modern async/await patterns instead of callback-based async library

## Support

For issues related to these dependency updates:
1. Check the individual package documentation
2. Review the compatibility layer implementations
3. Test with a minimal reproduction case