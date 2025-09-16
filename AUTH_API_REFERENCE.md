# SharePoint Connector Authentication API Reference

## Quick Start

```javascript
const SharePointConnector = require('sharepointconnector');

// Basic usage
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'online'
});

client.login((error, response, body) => {
  if (error) {
    console.error('Login failed:', error);
    return;
  }
  console.log('Successfully authenticated!');
});
```

## Type Definitions

### ClientOptions

```typescript
interface ClientOptions {
  // Required parameters
  username: string;
  password: string;
  url: string;
  
  // Authentication configuration
  type?: 'basic' | 'ntlm' | 'online' | 'onlinesaml';
  domain?: string;                    // For NTLM authentication
  workstation?: string;               // For NTLM authentication
  federatedAuthUrl?: string;          // For SAML authentication
  authenticator?: CustomAuthFunction; // For custom authentication
  
  // Site configuration
  context?: string;                   // Site context (default: 'web')
  siteContext?: string;              // Alias for context
  
  // Request configuration
  strictSSL?: boolean;               // SSL verification (default: true)
  proxy?: string;                    // Proxy server URL
  verbose?: boolean;                 // Enable logging (default: false)
  
  // Data formatting options
  fieldValuesAsText?: boolean;       // Return field values as text
  filterFields?: FilterField[];      // Field filtering options
  selectFields?: string[];           // Fields to select
  expandFields?: string[];           // Fields to expand
  orOperator?: boolean;              // Use OR in queries
  andOrOperator?: boolean;           // Use AND/OR in queries
  $top?: string;                     // Query limit (default: "5000")
  
  // Token reuse (SharePoint Online)
  FedAuth?: string;                  // Pre-existing FedAuth cookie
  rtFa?: string;                     // Pre-existing rtFa cookie
}

interface FilterField {
  field: string;
  value: any;
}

interface CustomAuthFunction {
  (client: ClientInstance, httpOpts: HttpOptions, callback: AuthCallback): void;
}

interface AuthCallback {
  (error: Error | null, response?: HttpResponse, body?: any): void;
}
```

### Client Instance

```typescript
interface ClientInstance {
  // Configuration
  url: string;
  federatedAuthUrl?: string;
  auth: AuthConfig;
  siteContext: string;
  verbose: boolean;
  fieldValuesAsText: boolean;
  
  // Authentication state
  FedAuth?: string;        // SharePoint Online auth cookie
  rtFa?: string;          // SharePoint Online refresh token
  baseContext?: string;    // Form digest value
  httpClient?: Function;   // HTTP client function
  
  // HTTP configuration
  baseHTTPOptions: HttpOptions;
  BASE_LIST_URL: string;
  $top: string;
  
  // API methods
  login: LoginFunction;
  lists: ListsAPI;
  listItems: ListItemsAPI;
}

interface AuthConfig {
  username: string;
  password: string;
  workstation: string;
  domain: string;
  type: string;
  custom?: CustomAuthFunction;
}
```

### Response Types

```typescript
interface LoginResponse {
  GetContextWebInformation: {
    FormDigestValue: string;
    FormDigestTimeoutSeconds: number;
    LibraryVersion: string;
    SiteFullUrl: string;
    SupportedSchemaVersions: string[];
    WebFullUrl: string;
  };
}

interface HttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: { [key: string]: string };
  body?: any;
}

interface AuthError extends Error {
  statusCode?: number;
  code?: string;
  body?: any;
}
```

## Authentication Methods

### 1. Basic Authentication

```javascript
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  type: 'basic'
});
```

**HTTP Implementation:**
- Uses standard HTTP Basic Authentication
- Sends `Authorization: Basic <base64-encoded-credentials>` header
- Suitable for SharePoint on-premises with basic auth enabled

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

**HTTP Implementation:**
- Performs 3-way NTLM handshake
- Type 1: Initial negotiation message
- Type 2: Server challenge
- Type 3: Authentication response
- Maintains connection with keep-alive

### 3. SharePoint Online Authentication

```javascript
const client = SharePointConnector({
  username: 'user@tenant.onmicrosoft.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  type: 'online'
});
```

**SAML Flow:**
1. Request SAML token from Microsoft STS
2. Submit SAML assertion to SharePoint Online
3. Receive FedAuth and rtFa cookies
4. Use cookies for subsequent requests

### 4. Federated SAML Authentication

```javascript
const client = SharePointConnector({
  username: 'user@company.com',
  password: 'password',
  url: 'https://tenant.sharepoint.com',
  federatedAuthUrl: 'https://company.com/adfs/services/trust/2005/usernamemixed',
  type: 'onlinesaml'
});
```

**Dual SAML Flow:**
1. Authenticate with federated identity provider (ADFS)
2. Exchange federated token for Microsoft Online token
3. Use Microsoft token to authenticate with SharePoint Online
4. Receive and store authentication cookies

## API Methods

### login(callback)

Authenticates with SharePoint and establishes session context.

```javascript
client.login((error, response, body) => {
  if (error) {
    // Handle authentication error
    return;
  }
  
  // Authentication successful
  // client.baseContext now contains form digest
  // client.FedAuth and client.rtFa contain auth cookies (if online)
});
```

#### Callback Parameters

- `error` (Error | null): Authentication error or null on success
- `response` (HttpResponse): HTTP response object
- `body` (LoginResponse): Parsed response body with context information

#### Side Effects

After successful login:
- `client.baseContext`: Contains form digest for subsequent requests
- `client.FedAuth`: Contains authentication cookie (SharePoint Online)
- `client.rtFa`: Contains refresh token cookie (SharePoint Online)
- `client.httpClient`: Configured for the selected authentication type

## HTTP Client Implementation

Each authentication type provides an HTTP client function with the signature:

```typescript
type HttpClient = (
  client: ClientInstance,
  httpOpts: HttpOptions,
  callback: (error: Error | null, response?: HttpResponse, body?: any) => void
) => void;
```

### Custom Authentication

Implement custom authentication by providing an `authenticator` function:

```javascript
function customAuth(client, httpOpts, callback) {
  // Modify httpOpts to include custom authentication
  httpOpts.headers = httpOpts.headers || {};
  httpOpts.headers['Authorization'] = 'Custom ' + getCustomToken();
  
  // Make the request
  require('request')(httpOpts, callback);
}

const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  authenticator: customAuth
});
```

## Request Flow

### 1. Client Initialization
```
SharePointConnector(options) → ClientInstance
```

### 2. Authentication Setup
```
client.login() → Selects auth type → Configures httpClient
```

### 3. Context Retrieval
```
POST /_api/contextinfo → Receives FormDigestValue → Stores in client.baseContext
```

### 4. Subsequent Requests
```
API calls → Use client.httpClient → Include authentication headers/cookies
```

## Configuration Examples

### Development Environment

```javascript
const client = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_URL,
  type: 'basic',
  strictSSL: false,  // Only for development
  verbose: true      // Enable debug logging
});
```

### Production Environment

```javascript
const client = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_URL,
  type: 'online',
  strictSSL: true,
  proxy: process.env.HTTP_PROXY
});
```

### Corporate Network with Proxy

```javascript
const client = SharePointConnector({
  username: 'domain\\username',
  password: process.env.SP_PASSWORD,
  domain: 'CORPORATE',
  workstation: 'WORKSTATION01',
  url: 'https://sharepoint.corporate.com',
  type: 'ntlm',
  proxy: 'http://proxy.corporate.com:8080'
});
```

## Error Codes and Messages

### Authentication Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Unexpected status code 401` | Invalid credentials | Check username/password |
| `Unexpected status code 403` | Access denied | Verify user permissions |
| `Unsupported auth type: X` | Invalid auth type | Use basic/ntlm/online/onlinesaml |
| `SharePoint client needs a username, password and instance URL` | Missing required params | Provide all required parameters |

### Network Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `ETIMEDOUT` | Request timeout | Network issues, slow server |
| `ECONNREFUSED` | Connection refused | Wrong URL, server down |
| `CERT_UNTRUSTED` | SSL certificate error | Invalid/self-signed certificate |
| `ENOTFOUND` | DNS resolution failed | Wrong hostname |

### SAML-Specific Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `No response body from SAML request` | SAML endpoint issue | Check federatedAuthUrl |
| `www-authenticate not found on response` | NTLM handshake failure | Verify domain/workstation |
| `Failed to load default context` | Context API failure | Check site permissions |

## Security Best Practices

### 1. Credential Management

```javascript
// ✅ Good: Use environment variables
const client = SharePointConnector({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  url: process.env.SP_URL
});

// ❌ Bad: Hardcoded credentials
const client = SharePointConnector({
  username: 'user@company.com',
  password: 'hardcoded-password',  // Never do this!
  url: 'https://company.sharepoint.com'
});
```

### 2. SSL Configuration

```javascript
// ✅ Production: Always verify SSL
const client = SharePointConnector({
  // ... other options
  strictSSL: true
});

// ⚠️ Development only: Disable SSL verification
const client = SharePointConnector({
  // ... other options
  strictSSL: false  // Only for development/testing
});
```

### 3. Token Storage

```javascript
// ✅ Secure token storage
const tokenStore = new SecureTokenStore();

client.login((error, response, body) => {
  if (!error) {
    // Store tokens securely
    tokenStore.set('fedauth', client.FedAuth);
    tokenStore.set('rtfa', client.rtFa);
  }
});

// Reuse stored tokens
const storedFedAuth = tokenStore.get('fedauth');
const storedRtFa = tokenStore.get('rtfa');

const clientWithTokens = SharePointConnector({
  // ... other options
  FedAuth: storedFedAuth,
  rtFa: storedRtFa
});
```

## Backward Compatibility

### Supported Legacy Parameters

```javascript
// These legacy parameter names are still supported:
const client = SharePointConnector({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://sharepoint.company.com',
  
  // Legacy parameters (still work)
  context: 'sites/mysite',      // Same as siteContext
  verbose: true,                // Still supported
  fieldValuesAsText: true       // Still supported
});
```

### Version Migration

- **v1.x → v2.x**: No breaking changes
- **v2.x → v3.x**: No breaking changes
- **v3.x → v4.x**: Full backward compatibility maintained

All existing authentication methods and parameters continue to work across versions.

---

*This reference covers all public authentication APIs for SharePoint Connector. For implementation examples and troubleshooting, see the main documentation.*