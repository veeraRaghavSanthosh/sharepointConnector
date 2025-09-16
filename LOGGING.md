# SharePoint Connector - Enhanced Logging

## Overview
The SharePoint Connector now includes comprehensive logging with configurable log levels and trace-level debugging for user-service functionality.

## Log Levels
- **error** (0) - Error messages only
- **warn** (1) - Warnings and errors  
- **info** (2) - General information (default)
- **debug** (3) - Debug information
- **trace** (4) - Detailed trace information

## Configuration

### New logLevel Option
```javascript
var sharepoint = require('sharepointconnector')({
  username: 'user@example.com',
  password: 'password',
  url: 'https://company.sharepoint.com', 
  type: 'basic',
  logLevel: 'trace' // New option
});
```

### Backward Compatible
```javascript  
var sharepoint = require('sharepointconnector')({
  // ... config
  verbose: true // Still works, maps to debug level
});
```

### Environment Variable
```bash
export SHAREPOINT_LOG_LEVEL=debug
```

## User-Service Logging

### Authentication
- Login process tracing
- Auth type validation  
- Context retrieval
- Success/failure indicators

### Current User Service
- API call tracing
- Request construction
- Response handling
- Error logging with context

### HTTP Requests  
- Request preparation
- Response status/data
- Error conditions
- Pagination handling

## Security
- Passwords never logged
- Usernames masked (e.g., "use***")  
- Tokens truncated
- Sensitive data filtered

## Example Output
```
[2025-09-16T10:30:45.123Z] [INFO] [login] Authentication successful
[2025-09-16T10:30:45.456Z] [DEBUG] [listItems] Retrieved current user { userId: 123 }
```

## Backward Compatibility
- All existing APIs unchanged
- `verbose: true` continues to work
- No breaking changes
- Additive logging only