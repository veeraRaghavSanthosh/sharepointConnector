# SharePoint Connector Usage Examples

This directory contains comprehensive usage examples for the SharePoint Connector library, demonstrating various authentication methods, operations, and best practices.

## Files Overview

### JavaScript Examples
- **`usage-examples.js`** - Complete JavaScript examples covering all major functionality

### TypeScript Examples  
- **`usage-examples.ts`** - TypeScript examples with full type definitions and modern patterns

## Features Demonstrated

### 1. Authentication Methods
- **Basic Authentication**: Simple username/password authentication
- **NTLM Authentication**: Windows domain authentication with workstation support
- **SharePoint Online**: Office 365/SharePoint Online authentication
- **Error Handling**: Proper authentication error management

### 2. List Operations
- **List Management**: Create, read, update, and delete SharePoint lists
- **List Discovery**: Enumerate all available lists
- **Metadata Access**: Retrieve list fields and properties

### 3. List Item Operations
- **CRUD Operations**: Complete create, read, update, delete functionality
- **Batch Operations**: Handle multiple items efficiently
- **Pagination**: Work with large datasets using pagination

### 4. Advanced Features
- **Filtering**: Query items based on field values
- **Field Selection**: Optimize queries by selecting specific fields
- **Field Expansion**: Join related data from lookup fields
- **Query Operators**: Use AND/OR operators for complex queries

### 5. File Operations
- **Binary Streaming**: Download files from document libraries
- **File Metadata**: Access file properties and information
- **Path-based Access**: Retrieve files by path

### 6. Modern Development Patterns
- **Promise Wrappers**: Convert callback-based APIs to promises
- **Async/Await**: Modern asynchronous programming patterns
- **Error Handling**: Comprehensive error management strategies
- **TypeScript Support**: Full type safety and IntelliSense support

## Quick Start

### JavaScript Usage
```javascript
const sharepoint = require('sharepointconnector');
const examples = require('./usage-examples');

// Run a basic authentication example
examples.basicAuthExample()
  .then(client => {
    console.log('Successfully connected to SharePoint');
    return examples.listOperationsExample();
  })
  .catch(console.error);
```

### TypeScript Usage
```typescript
import { SharePointService, SharePointConfigBuilder } from './usage-examples';

// Create a type-safe configuration
const config = SharePointConfigBuilder
  .create()
  .withBasicAuth('username', 'password', 'https://company.sharepoint.com')
  .withFieldSelection(['Title', 'Status', 'Priority'])
  .withTopLimit(100)
  .build();

// Initialize the service
const service = new SharePointService(config);

// Use with async/await
async function main() {
  await service.login();
  const lists = await service.getLists();
  console.log(`Found ${lists.length} lists`);
}
```

## Configuration Options

The examples demonstrate various configuration options:

### Basic Configuration
```javascript
{
  username: 'your-username',
  password: 'your-password',
  type: 'basic',
  url: 'https://your-sharepoint-site.com'
}
```

### Advanced Configuration
```javascript
{
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm',
  url: 'https://your-sharepoint-site.com',
  domain: 'your-domain',
  workstation: 'your-workstation',
  fieldValuesAsText: true,
  filterFields: [
    { field: 'Status', value: 'Active' },
    { field: 'Priority', value: 'High' }
  ],
  selectFields: ['Title', 'Status', 'Priority', 'Created'],
  expandFields: ['Author', 'AssignedTo'],
  $top: '100',
  verbose: true
}
```

## Error Handling

The examples include comprehensive error handling patterns:

### JavaScript Error Handling
```javascript
async function handleErrors() {
  try {
    const client = await basicAuthExample();
    const lists = await getLists(client);
    return lists;
  } catch (error) {
    console.error('Operation failed:', error.message);
    // Handle specific error types
    if (error.message.includes('authentication')) {
      // Handle authentication errors
    } else if (error.message.includes('network')) {
      // Handle network errors
    }
    throw error;
  }
}
```

### TypeScript Error Handling
```typescript
class SharePointError extends Error {
  constructor(
    message: string,
    public operation: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SharePointError';
  }
}

// Usage in service methods
async createListItem(listId: string, itemData: Partial<SharePointListItem>): Promise<SharePointListItem> {
  try {
    return await super.createListItem(listId, itemData);
  } catch (error) {
    throw new SharePointError(
      `Failed to create item in list ${listId}`,
      'createListItem',
      undefined,
      error
    );
  }
}
```

## Testing

The examples include comprehensive unit tests demonstrating:
- Authentication testing with mocked responses
- CRUD operation testing
- Error scenario testing
- Promise and async/await testing
- TypeScript class and interface testing

Run the tests:
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test files
npx mocha test/examples/test-usage-examples.js
npx mocha test/examples/test-usage-examples-typescript.js
```

## Best Practices

The examples demonstrate several best practices:

1. **Connection Management**: Proper login and session handling
2. **Error Handling**: Comprehensive error catching and reporting
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Resource Cleanup**: Proper cleanup of resources and connections
5. **Configuration Management**: Secure and flexible configuration handling
6. **Testing**: Comprehensive test coverage with mocked dependencies
7. **Documentation**: Clear documentation and code comments

## Real-World Applications

The examples show patterns suitable for:
- **Task Management Systems**: Complete task CRUD with status tracking
- **Document Management**: File upload, download, and metadata management
- **Data Integration**: Synchronizing data between SharePoint and other systems
- **Reporting Systems**: Extracting and processing SharePoint data
- **Workflow Automation**: Automated processing of SharePoint content

## Contributing

When adding new examples:
1. Follow the established patterns and naming conventions
2. Include comprehensive error handling
3. Add corresponding unit tests
4. Document the example with clear comments
5. Update this README with new functionality

## Support

For issues or questions about the examples:
1. Check the main project README
2. Review the test files for usage patterns
3. Examine the source code for additional details
4. Create an issue in the main repository