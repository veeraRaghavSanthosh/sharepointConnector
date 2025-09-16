# SharePoint Connector Authentication API Documentation

## Overview

The SharePoint Connector provides multiple authentication methods to connect to SharePoint Online and on-premises instances. This document covers all public authentication APIs with examples and response schemas.

## Table of Contents

1. [Client Initialization](#client-initialization)
2. [Authentication Types](#authentication-types)
3. [API Methods](#api-methods)
4. [Response Schemas](#response-schemas)
5. [Error Handling](#error-handling)
6. [Backward Compatibility](#backward-compatibility)

## Client Initialization

### Basic Client Setup

```javascript
const SharePointConnector = require('sharepointconnector');

// Create a client instance
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'basic' // or 'ntlm', 'online', 'onlinesaml'
});
```

### Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `username` | string | ✓ | SharePoint username | - |
| `password` | string | ✓ | SharePoint password | - |
| `url` | string | ✓ | SharePoint site URL | - |
| `type` | string | | Authentication type | `'basic'` |
| `domain` | string | | Domain for NTLM auth | `''` |
| `workstation` | string | | Workstation for NTLM auth | `''` |
| `federatedAuthUrl` | string | | Federated auth URL for SAML | - |
| `context` | string | | Site context | `'web'` |
| `verbose` | boolean | | Enable verbose logging | `false` |
| `strictSSL` | boolean | | Enforce SSL verification | `true` |
| `proxy` | string | | Proxy server URL | - |
| `FedAuth` | string | | Pre-existing FedAuth token | - |
| `rtFa` | string | | Pre-existing rtFa token | - |

## Authentication Types

### 1. Basic Authentication

```javascript
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  type: 'basic'
});
```

**Use Case:** SharePoint on-premises with basic authentication enabled.

**Implementation:** Uses HTTP Basic Authentication with username/password credentials.

### 2. NTLM Authentication

```javascript
const client = SharePointConnector({
  username: 'username',
  password: 'password',
  domain: 'DOMAIN',
  workstation: 'WORKSTATION',
  url: 'https://sharepoint.company.com',
  type: 'ntlm'
});
```

**Use Case:** SharePoint on-premises with Windows Authentication (NTLM).

**Implementation:** Performs NTLM handshake with Type 1, Type 2, and Type 3 messages.

### 3. SharePoint Online Authentication

```javascript
const client = SharePointConnector({
  username: 'user@tenant.onmicrosoft.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'online'
});
```

**Use Case:** SharePoint Online with standard Microsoft 365 accounts.

**Implementation:** Uses SAML-based authentication flow with Microsoft STS.

### 4. SharePoint Online SAML Authentication

```javascript
const client = SharePointConnector({
  username: 'user@company.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  federatedAuthUrl: 'https://company.com/adfs/services/trust/2005/usernamemixed',
  type: 'onlinesaml'
});
```

**Use Case:** SharePoint Online with federated authentication (ADFS).

**Implementation:** Dual SAML authentication flow - first with federated identity provider, then with Microsoft Online.

### 5. Custom Authentication

```javascript
const customAuthenticator = (client, httpOpts, callback) => {
  // Custom authentication logic
  // Must call callback(error, response, body)
};

const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  authenticator: customAuthenticator
});
```

**Use Case:** Custom authentication mechanisms not covered by built-in types.

## API Methods

### login()

Authenticates with SharePoint and retrieves context information.

```javascript
client.login((error, response, body) => {
  if (error) {
    console.error('Login failed:', error);
    return;
  }
  
  console.log('Login successful');
  console.log('Form digest:', client.baseContext);
});
```

#### Parameters

- `callback` (Function): Callback function with signature `(error, response, body)`

#### Response Schema

```javascript
{
  // HTTP Response object
  response: {
    statusCode: 200,
    headers: { ... },
    ...
  },
  
  // Response body
  body: {
    GetContextWebInformation: {
      FormDigestValue: "0x1234567890ABCDEF...",
      FormDigestTimeoutSeconds: 1800,
      LibraryVersion: "16.0.0.0",
      SiteFullUrl: "https://tenant.sharepoint.com",
      SupportedSchemaVersions: [...],
      WebFullUrl: "https://tenant.sharepoint.com"
    }
  }
}
```

#### Client State After Login

After successful login, the client object contains:

```javascript
{
  baseContext: "0x1234567890ABCDEF...", // Form digest for subsequent requests
  FedAuth: "77u/PD9...", // (Online auth) Authentication cookie
  rtFa: "AQABAAA...", // (Online auth) Refresh token cookie
  httpClient: Function // Configured HTTP client for the auth type
}
```

## Response Schemas

### Success Response

```javascript
{
  error: null,
  response: {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {
      'content-type': 'application/json;odata=verbose',
      'x-ms-version': '16.0.0.0',
      // ... other headers
    }
  },
  body: {
    GetContextWebInformation: {
      FormDigestValue: string,
      FormDigestTimeoutSeconds: number,
      LibraryVersion: string,
      SiteFullUrl: string,
      SupportedSchemaVersions: string[],
      WebFullUrl: string
    }
  }
}
```

### Error Response

```javascript
{
  error: {
    message: string,
    code?: string,
    statusCode?: number,
    body?: object
  },
  response: null,
  body: null
}
```

## Error Handling

### Common Error Types

#### Authentication Errors

```javascript
// Invalid credentials
{
  message: "Unexpected status code 401",
  statusCode: 401
}

// Missing required parameters
{
  message: "SharePoint client needs a username, password and instance URL"
}

// Unsupported auth type
{
  message: "Unsupported auth type: invalid_type"
}
```

#### Network Errors

```javascript
// Connection timeout
{
  message: "ETIMEDOUT",
  code: "ETIMEDOUT"
}

// SSL certificate errors
{
  message: "CERT_UNTRUSTED",
  code: "CERT_UNTRUSTED"
}
```

#### SAML-specific Errors

```javascript
// Missing SAML response
{
  message: "No response body from SAML request"
}

// Invalid SAML response
{
  message: "www-authenticate not found on response of second request"
}
```

### Error Handling Best Practices

```javascript
client.login((error, response, body) => {
  if (error) {
    // Check for specific error types
    if (error.statusCode === 401) {
      console.error('Authentication failed - check credentials');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timeout - check network/proxy settings');
    } else if (error.code === 'CERT_UNTRUSTED') {
      console.error('SSL certificate error - consider setting strictSSL: false');
    } else {
      console.error('Login error:', error.message || error);
    }
    return;
  }
  
  // Success handling
  console.log('Authentication successful');
});
```

## Advanced Configuration

### Proxy Configuration

```javascript
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  proxy: 'http://proxy.company.com:8080'
});
```

### SSL Configuration

```javascript
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  strictSSL: false // Disable SSL verification (not recommended for production)
});
```

### Token Reuse (SharePoint Online)

```javascript
// Save tokens after first login
let fedAuth, rtFa;

client.login((error, response, body) => {
  if (!error) {
    fedAuth = client.FedAuth;
    rtFa = client.rtFa;
  }
});

// Reuse tokens in subsequent sessions
const clientWithTokens = SharePointConnector({
  username: 'user@tenant.onmicrosoft.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'online',
  FedAuth: fedAuth,
  rtFa: rtFa
});
```

## Backward Compatibility

### Version Compatibility Matrix

| Feature | v1.x | v2.x | v3.x | Notes |
|---------|------|------|------|-------|
| Basic Auth | ✓ | ✓ | ✓ | Fully compatible |
| NTLM Auth | ✓ | ✓ | ✓ | Fully compatible |
| Online Auth | ✓ | ✓ | ✓ | Fully compatible |
| Online SAML | - | ✓ | ✓ | Added in v2.x |
| Custom Auth | - | - | ✓ | Added in v3.x |

### Deprecated Features

None currently. All authentication methods remain supported.

### Migration Guide

#### From v1.x to v2.x

No breaking changes. New `onlinesaml` authentication type available.

#### From v2.x to v3.x

No breaking changes. New `authenticator` parameter for custom authentication.

### Legacy Parameter Support

The following parameters are maintained for backward compatibility:

```javascript
// Legacy parameter names (still supported)
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  type: 'basic',
  
  // Legacy parameters
  context: 'sites/mysite', // Still supported alongside siteContext
  verbose: true,           // Still supported
  fieldValuesAsText: true  // Still supported
});
```

## Examples

### Complete Authentication Flow

```javascript
const SharePointConnector = require('sharepointconnector');

// Initialize client
const client = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_URL,
  type: 'online'
});

// Authenticate
client.login((error, response, body) => {
  if (error) {
    console.error('Authentication failed:', error);
    return;
  }
  
  console.log('Successfully authenticated with SharePoint');
  console.log('Form digest:', client.baseContext);
  
  // Now you can use client.lists and client.listItems
  client.lists((error, lists) => {
    if (!error) {
      console.log('Available lists:', lists.length);
    }
  });
});
```

### Error Recovery Pattern

```javascript
function authenticateWithRetry(client, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attempt() {
      attempts++;
      
      client.login((error, response, body) => {
        if (!error) {
          resolve({ response, body });
          return;
        }
        
        if (attempts < maxRetries && error.code === 'ETIMEDOUT') {
          console.log(`Retry attempt ${attempts}/${maxRetries}`);
          setTimeout(attempt, 1000 * attempts);
        } else {
          reject(error);
        }
      });
    }
    
    attempt();
  });
}

// Usage
authenticateWithRetry(client)
  .then(() => console.log('Authentication successful'))
  .catch(error => console.error('Authentication failed after retries:', error));
```

## Security Considerations

### Credential Storage

- Never hardcode credentials in source code
- Use environment variables or secure configuration files
- Consider using Azure Key Vault or similar services for production

### Token Management

- FedAuth and rtFa tokens should be stored securely
- Tokens have expiration times and should be refreshed
- Clear tokens from memory when no longer needed

### SSL/TLS

- Always use `strictSSL: true` in production
- Only disable SSL verification for development/testing
- Ensure SharePoint endpoints use valid certificates

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check username/password
   - Verify account has access to SharePoint site
   - For NTLM, ensure domain is correct

2. **Connection Timeouts**
   - Check network connectivity
   - Verify proxy settings if behind corporate firewall
   - Consider increasing timeout values

3. **SAML Authentication Failures**
   - Verify federatedAuthUrl is correct
   - Check if ADFS endpoint is accessible
   - Ensure SAML configuration is properly set up

4. **SSL Certificate Errors**
   - Verify certificate chain is valid
   - Check if corporate proxy is intercepting SSL
   - Consider certificate pinning for security

### Debug Mode

Enable verbose logging for troubleshooting:

```javascript
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  verbose: true // Enables detailed logging
});
```

---

*This documentation covers SharePoint Connector v3.x authentication APIs. For the most up-to-date information, refer to the project repository.*