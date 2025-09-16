# SharePoint Connector Usage Examples

This repository includes comprehensive usage examples for the `sharepointconnector` library in both JavaScript and TypeScript.

## Files

- `javascript-usage-example.js` - Complete JavaScript examples with all major features
- `typescript-usage-example.ts` - TypeScript examples with proper type definitions
- `USAGE_EXAMPLES.md` - This documentation file

## Quick Start

### JavaScript Example

```javascript
const sharepointconnector = require('sharepointconnector');

const sharepoint = sharepointconnector({
  username: 'your-username@company.com',
  password: 'your-password',
  url: 'https://your-company.sharepoint.com',
  type: 'online' // or 'ntlm', 'basic', 'onlinesaml'
});

sharepoint.login((err) => {
  if (err) {
    return console.error('Login failed:', err);
  }
  
  // List all SharePoint lists
  sharepoint.lists.list((err, lists) => {
    if (err) return console.error(err);
    
    console.log('Available lists:');
    lists.forEach(list => {
      console.log(`- ${list.Title} (ID: ${list.Id})`);
    });
  });
});
```

### TypeScript Example

```typescript
import * as sharepointconnector from 'sharepointconnector';

interface SharePointConfig {
  username: string;
  password: string;
  url: string;
  type: 'ntlm' | 'basic' | 'online' | 'onlinesaml';
}

const config: SharePointConfig = {
  username: 'your-username@company.com',
  password: 'your-password',
  url: 'https://your-company.sharepoint.com',
  type: 'online'
};

const sharepoint = sharepointconnector(config);

sharepoint.login((err: Error | null) => {
  if (err) {
    return console.error('Login failed:', err);
  }
  
  console.log('Successfully connected to SharePoint!');
});
```

## Authentication Types

### 1. Online (SharePoint 365)
```javascript
{
  type: 'online',
  username: 'user@company.com',
  password: 'password',
  url: 'https://company.sharepoint.com'
}
```

### 2. NTLM (On-premises)
```javascript
{
  type: 'ntlm',
  username: 'domain\\username',
  password: 'password',
  url: 'https://sharepoint.company.com',
  domain: 'COMPANY',
  workstation: 'WORKSTATION'
}
```

### 3. Basic Authentication
```javascript
{
  type: 'basic',
  username: 'username',
  password: 'password',
  url: 'https://sharepoint.company.com'
}
```

### 4. Online SAML (Federated)
```javascript
{
  type: 'onlinesaml',
  username: 'user@company.com',
  password: 'password',
  url: 'https://company.sharepoint.com',
  federatedAuthUrl: 'https://sts.company.com/adfs/ls'
}
```

## Advanced Configuration

```javascript
const sharepoint = sharepointconnector({
  username: 'user@company.com',
  password: 'password',
  url: 'https://company.sharepoint.com',
  type: 'online',
  
  // Optional parameters
  context: 'sites/mysite',           // Site context
  verbose: false,                    // Detailed logging
  strictSSL: true,                   // SSL verification
  proxy: 'http://proxy:8080',        // Proxy server
  
  // Query options
  fieldValuesAsText: true,           // Return lookup values as text
  filterFields: [                    // Filter results
    { field: 'Status', value: 'Active' }
  ],
  selectFields: ['Title', 'Status'], // Select specific fields
  expandFields: ['Author'],          // Expand lookup fields
  orOperator: false,                 // Use OR logic in filters
  $top: '100'                        // Limit results
});
```

## Running the Examples

### Prerequisites
```bash
npm install sharepointconnector
```

### Set Environment Variables
```bash
export SP_USERNAME="your-username@company.com"
export SP_PASSWORD="your-password"
export SP_URL="https://your-company.sharepoint.com"
```

### Run JavaScript Examples
```bash
node javascript-usage-example.js
```

### Run TypeScript Examples
```bash
# Install TypeScript if not already installed
npm install -g typescript ts-node

# Compile and run
tsc typescript-usage-example.ts
node typescript-usage-example.js

# Or run directly with ts-node
ts-node typescript-usage-example.ts
```

## Example Features Covered

### Lists Operations
- List all lists
- Create new lists
- Read list details (including items and fields)
- Update list properties
- Delete lists
- Filter and paginate results

### List Items Operations
- List items with pagination
- Get all items (handles pagination automatically)
- Create new items
- Read item details
- Update items
- Delete items

### File Operations
- Download files by path
- Download files by folder/filename
- Stream binary content
- Get current user information

### Advanced Features
- Multiple authentication methods
- Error handling patterns
- Convenience methods on objects
- Filtering and field selection
- Pagination handling
- Custom site contexts

## Error Handling

The library uses Node.js callback patterns. Always check for errors:

```javascript
sharepoint.login((err) => {
  if (err) {
    // Handle authentication errors
    if (err.message.includes('401')) {
      console.error('Invalid credentials');
    } else if (err.message.includes('timeout')) {
      console.error('Connection timeout');
    } else {
      console.error('Login error:', err.message);
    }
    return;
  }
  
  // Proceed with operations
});
```

## Best Practices

1. **Always handle errors** - Check the `err` parameter in all callbacks
2. **Use environment variables** - Don't hardcode credentials
3. **Enable verbose mode** - For debugging connection issues
4. **Set appropriate timeouts** - For slow networks
5. **Use pagination** - For large datasets
6. **Filter results** - To reduce network traffic
7. **Validate required fields** - Before creating items

## Support

For more information, see the main README.md file or visit the [GitHub repository](https://github.com/veeraRaghavSanthosh/sharepointConnector).