# Notification System Unit Tests

This directory contains comprehensive unit tests for the SharePoint Connector notification system.

## Test Files

1. **test-notification.js** - Core request/response notifications
2. **test-auth-notification.js** - Authentication flow notifications  
3. **test-object-notification.js** - Object convenience method notifications
4. **test-verbosity-notification.js** - Verbosity filter notifications

## Coverage

- Success cases: Valid operations with proper callbacks
- Failure cases: Network errors, auth failures, validation errors
- Boundary cases: Empty data, large datasets, concurrent operations
- Backward compatibility: Legacy callback signatures and method aliases

## Running Tests

```bash
npm test
```

The tests maintain full backward compatibility while providing comprehensive coverage of all notification scenarios.