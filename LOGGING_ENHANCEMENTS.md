# SharePoint Connector Logging Enhancements

This document describes the logging enhancements added to the SharePoint Connector library to provide better visibility into notification events and system operations.

## Overview

The enhanced logging system provides:
- **Configurable log levels** (error, warn, info, debug, trace)
- **Trace-level debug logging** for detailed troubleshooting
- **Notification-specific logging** for all SharePoint operations
- **Backward compatibility** with existing configurations

## New Features

### 1. Centralized Logger Module (`lib/util/logger.js`)

A new logger module provides:
- Configurable log levels via client configuration or environment variables
- Structured logging with timestamps, levels, and categories
- JSON formatting for complex data objects
- Conditional logging based on current log level

### 2. Enhanced Client Configuration

The client constructor now accepts a `logLevel` parameter:

```javascript
var client = require('sharepointconnector')({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://company.sharepoint.com',
  logLevel: 'trace' // New: Set log level (error, warn, info, debug, trace)
});
```

### 3. Environment Variable Support

Log level can also be set via environment variable:
```bash
export SP_LOG_LEVEL=debug
```

## Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| error | 0 | Critical errors only |
| warn  | 1 | Warnings and errors |
| info  | 2 | General information, warnings, and errors |
| debug | 3 | Debug information and above |
| trace | 4 | Most verbose - all operations |

## Notification Logging Categories

All logs are categorized as 'notification' to identify SharePoint-related events:

### Request/Response Logging
- **trace**: Request initiation and completion details
- **debug**: Byte stream responses, pagination detection
- **warn**: Non-success HTTP status codes
- **error**: Request failures, authentication errors

### Authentication Logging
- **info**: Authentication method selection, login completion
- **error**: Authentication failures, unsupported auth types
- **debug**: Authentication response details

### Data Processing Logging
- **trace**: Response processing, data size information
- **debug**: Pagination detection and handling

## Enhanced Files

### 1. `lib/util/logger.js` (NEW)
Centralized logging module with configurable levels.

### 2. `lib/client.js` (ENHANCED)
Added `logLevel` configuration parameter.

### 3. `lib/util/doRequest_enhanced.js` (ENHANCED)
Enhanced request handling with comprehensive logging:
- Request initiation logging
- Error and status code logging
- Response processing logging
- Pagination detection logging

### 4. `lib/login_enhanced.js` (ENHANCED)
Enhanced authentication with logging:
- Authentication method selection
- Login attempt and completion logging
- Context extraction logging
- Error handling with detailed logging

## Usage Examples

### Basic Usage (maintains backward compatibility)
```javascript
var client = require('sharepointconnector')({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://company.sharepoint.com'
  // logLevel defaults to 'info'
});
```

### Enhanced Logging
```javascript
var client = require('sharepointconnector')({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://company.sharepoint.com',
  logLevel: 'trace' // Enable detailed logging
});
```

### Environment-based Configuration
```bash
export SP_LOG_LEVEL=debug
node your-app.js
```

## Sample Log Output

```
[2025-09-16T12:00:00.000Z] [INFO] [notification] Authentication method selected {"authType":"basic","isCustom":false}
[2025-09-16T12:00:00.100Z] [INFO] [notification] Initiating SharePoint login {"contextUrl":"https://company.sharepoint.com/_api/contextinfo","siteContext":"web","authType":"basic"}
[2025-09-16T12:00:00.500Z] [TRACE] [notification] Initiating SharePoint request {"url":"https://company.sharepoint.com/_api/web/lists","method":"get","byteStream":false,"pagination":false}
[2025-09-16T12:00:01.000Z] [TRACE] [notification] SharePoint request completed {"url":"https://company.sharepoint.com/_api/web/lists","method":"get","statusCode":200,"hasBody":true}
```

## Backward Compatibility

All enhancements maintain full backward compatibility:
- Existing code continues to work without modification
- Default log level is 'info' (existing behavior)
- No breaking changes to existing APIs
- Enhanced files are provided as alternatives (e.g., `doRequest_enhanced.js`)

## Migration Guide

To use the enhanced logging features:

1. **Optional**: Update client initialization to include `logLevel`
2. **Optional**: Replace `lib/util/doRequest.js` with `lib/util/doRequest_enhanced.js`
3. **Optional**: Replace `lib/login.js` with `lib/login_enhanced.js`
4. **Optional**: Set `SP_LOG_LEVEL` environment variable

## Performance Considerations

- Logging operations are conditional based on current log level
- JSON serialization only occurs when log level is enabled
- Minimal performance impact when using 'error' or 'warn' levels
- 'trace' level provides maximum detail but may impact performance in high-volume scenarios

## Troubleshooting

### Enable Debug Logging
```javascript
var client = require('sharepointconnector')({
  // ... other config
  logLevel: 'debug'
});
```

### Enable Trace Logging for Maximum Detail
```javascript
var client = require('sharepointconnector')({
  // ... other config
  logLevel: 'trace'
});
```

### Check Current Log Level
```javascript
var logger = require('./lib/util/logger')(client);
console.log('Current log level:', logger.getLevel());
console.log('Is debug enabled:', logger.isLevelEnabled('debug'));
```