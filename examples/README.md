# SharePoint Connector Usage Examples

This directory contains comprehensive usage examples for the `sharepointconnector` library in both JavaScript and TypeScript.

## Overview

The SharePoint Connector is a Node.js library that provides a simple interface to interact with SharePoint sites, supporting multiple authentication methods and comprehensive CRUD operations for lists and list items.

## Files

- **`javascript-usage.js`** - Complete JavaScript usage examples with ES6+ features
- **`typescript-usage.ts`** - TypeScript examples with full type definitions and interfaces
- **`README.md`** - This documentation file

## Quick Start

### JavaScript Example

```javascript
const sharepoint = require('sharepointconnector');

const sp = sharepoint({
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.com',
  type: 'online' // or 'ntlm', 'basic', 'onlinesaml'
});

sp.login((err) => {
  if (err) {
    console.error('Authentication failed:', err);
    return;
  }
  
  // Get all lists
  sp.lists.list((err, lists) => {
    if (err) {
      console.error('Failed to get lists:', err);
      return;
    }
    
    console.log(`Found ${lists.length} lists`);
    lists.forEach(list => {
      console.log(`- ${list.Title} (${list.Id})`);
    });
  });
});
```

### TypeScript Example

```typescript
import { SharePointService, SharePointConfig } from './typescript-usage';

const config: SharePointConfig = {
  username: 'your-username@domain.com',
  password: 'your-password',
  url: 'https://your-sharepoint-site.com',
  type: 'online'
};

async function example() {
  const spService = new SharePointService(sharepoint(config));
  
  try {
    await spService.authenticate();
    const listsResult = await spService.getLists();
    
    console.log(`Found ${listsResult.items.length} lists`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Configuration Options

### Required Parameters
- `username` - SharePoint username
- `password` - SharePoint password  
- `url` - SharePoint site URL

### Authentication Types
- `ntlm` - NTLM authentication for on-premise SharePoint
- `basic` - Basic HTTP authentication
- `online` - SharePoint 365/Online authentication
- `onlinesaml` - Federated SAML SSO authentication

## Running the Examples

### Prerequisites
```bash
npm install sharepointconnector
```

### JavaScript
```bash
node examples/javascript-usage.js
```

### TypeScript
```bash
npm install -g typescript @types/node
tsc examples/typescript-usage.ts
node examples/typescript-usage.js
```