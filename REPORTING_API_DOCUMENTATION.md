# SharePoint Connector - Reporting APIs Documentation

## Overview

The SharePoint Connector provides comprehensive APIs for extracting, filtering, and analyzing data from SharePoint lists and libraries. While there are no dedicated "reporting" endpoints, the connector offers powerful data retrieval capabilities that serve as the foundation for building reports and analytics.

## Table of Contents

1. [Authentication](#authentication)
2. [Lists API](#lists-api)
3. [List Items API](#list-items-api)
4. [Data Filtering and Querying](#data-filtering-and-querying)
5. [Response Schemas](#response-schemas)
6. [Reporting Use Cases](#reporting-use-cases)
7. [Examples](#examples)

## Authentication

### Supported Authentication Types

The connector supports multiple authentication methods:

- **NTLM**: For on-premise SharePoint instances
- **Basic**: Basic authentication
- **Online**: SharePoint 365/Online login flow
- **Online SAML**: SharePoint 365 with federated SAML SSO

### Configuration

```javascript
var sharepoint = require('sharepointconnector')({
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm', // or 'basic', 'online', 'onlinesaml'
  url: 'https://your-sharepoint-site.com',
  
  // Optional parameters
  context: 'your-site-context',
  verbose: false,
  proxy: undefined,
  strictSSL: true,
  federatedAuthUrl: 'https://your-saml-service.com',
  rtFa: 'optional-rtfa-token',
  FedAuth: 'optional-fedauth-token'
});
```

## Lists API

### 1. List All Lists

Retrieve all lists from the SharePoint site.

#### Method
```javascript
sharepoint.lists.list(callback)
```

#### Parameters
- `callback(err, listRes, nextUrl)`: Callback function

#### Response Schema
```json
[
  {
    "Id": "string (GUID)",
    "Title": "string",
    "Description": "string",
    "ItemCount": "number",
    "Created": "string (ISO date)",
    "LastItemModifiedDate": "string (ISO date)",
    "ListItemEntityTypeFullName": "string",
    "BaseType": "number",
    "BaseTemplate": "number",
    "ContentTypesEnabled": "boolean",
    "Hidden": "boolean",
    "EnableVersioning": "boolean"
  }
]
```

#### Example
```javascript
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  sharepoint.lists.list(function(err, lists, nextUrl) {
    if (err) return console.error(err);
    
    console.log('Found', lists.length, 'lists');
    lists.forEach(list => {
      console.log(`List: ${list.Title} (${list.ItemCount} items)`);
    });
  });
});
```

### 2. Read Specific List

Retrieve detailed information about a specific list, including its fields and items.

#### Method
```javascript
sharepoint.lists.read(listId, options, callback)
```

#### Parameters
- `listId`: String (GUID) or object `{id: 'guid'}` or `{title: 'List Title'}`
- `options`: Object with filtering options (optional)
- `callback(err, listData)`: Callback function

#### Options
```javascript
{
  fieldValuesAsText: true,        // Return lookup field values as text
  filterFields: [                 // Filter items based on field values
    {field: 'Status', value: 'Active'},
    {field: 'Category', value: 'Important'}
  ],
  selectFields: ['Title', 'Status', 'Created'], // Only return specified fields
  expandFields: ['Author', 'Editor'],           // Expand lookup fields
  orOperator: false,              // Use OR instead of AND for filters
  andOrOperator: false,           // Enable complex AND/OR operations
  $top: "1000"                    // Limit number of items returned (default: 5000)
}
```

#### Response Schema
```json
{
  "Id": "string (GUID)",
  "Title": "string",
  "Description": "string",
  "ItemCount": "number",
  "Fields": [
    {
      "Id": "string (GUID)",
      "Title": "string",
      "InternalName": "string",
      "TypeAsString": "string",
      "Required": "boolean",
      "ReadOnlyField": "boolean"
    }
  ],
  "Items": [
    {
      "Id": "number",
      "Title": "string",
      "Created": "string (ISO date)",
      "Modified": "string (ISO date)",
      "AuthorId": "number",
      "EditorId": "number",
      "__metadata": {
        "id": "string",
        "uri": "string",
        "etag": "string",
        "type": "string"
      }
    }
  ]
}
```

#### Example
```javascript
// Read list by ID with filtering
sharepoint.lists.read(
  'your-list-guid',
  {
    filterFields: [{field: 'Status', value: 'Active'}],
    selectFields: ['Title', 'Status', 'Created', 'Category'],
    $top: "500"
  },
  function(err, listData) {
    if (err) return console.error(err);
    
    console.log(`List: ${listData.Title}`);
    console.log(`Total items: ${listData.Items.length}`);
    
    // Generate simple report
    const statusReport = listData.Items.reduce((acc, item) => {
      acc[item.Status] = (acc[item.Status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status Distribution:', statusReport);
  }
);
```

### 3. Create List

Create a new list in SharePoint.

#### Method
```javascript
sharepoint.lists.create(listData, callback)
```

#### Parameters
- `listData`: Object with list properties
- `callback(err, createdList)`: Callback function

#### Request Schema
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "template": "number (optional, default: 100)"
}
```

#### Example
```javascript
sharepoint.lists.create({
  title: 'Project Reports',
  description: 'List for storing project reporting data'
}, function(err, newList) {
  if (err) return console.error(err);
  console.log('Created list:', newList.Title, 'with ID:', newList.Id);
});
```

### 4. Update List

Update an existing list's properties.

#### Method
```javascript
sharepoint.lists.update(listId, updateData, callback)
```

#### Example
```javascript
sharepoint.lists.update('your-list-guid', {
  Description: 'Updated description for reporting list'
}, function(err, updatedList) {
  if (err) return console.error(err);
  console.log('List updated successfully');
});
```

### 5. Delete List

Delete a list from SharePoint.

#### Method
```javascript
sharepoint.lists.delete(listId, callback)
```

#### Example
```javascript
sharepoint.lists.delete('your-list-guid', function(err) {
  if (err) return console.error(err);
  console.log('List deleted successfully');
});
```

## List Items API

### 1. List Items

Retrieve items from a specific list.

#### Method
```javascript
sharepoint.listItems.list(listId, options, callback)
```

#### Parameters
- `listId`: String (GUID) or list title
- `options`: Object with query options
- `callback(err, items, nextUrl)`: Callback function

#### Response Schema
```json
[
  {
    "Id": "number",
    "Title": "string",
    "Created": "string (ISO date)",
    "Modified": "string (ISO date)",
    "AuthorId": "number",
    "EditorId": "number",
    "__metadata": {
      "id": "string",
      "uri": "string",
      "etag": "string",
      "type": "string"
    }
  }
]
```

### 2. Read Item

Retrieve a specific item from a list.

#### Method
```javascript
sharepoint.listItems.read(listId, itemId, options, callback)
```

#### Example
```javascript
sharepoint.listItems.read('your-list-guid', 1, {
  selectFields: ['Title', 'Status', 'Priority', 'DueDate']
}, function(err, item) {
  if (err) return console.error(err);
  console.log('Item details:', item);
});
```

### 3. Create Item

Add a new item to a list.

#### Method
```javascript
sharepoint.listItems.create(listId, itemData, callback)
```

#### Example
```javascript
sharepoint.listItems.create('your-list-guid', {
  Title: 'Q4 Sales Report',
  Status: 'In Progress',
  Priority: 'High',
  DueDate: '2024-12-31'
}, function(err, newItem) {
  if (err) return console.error(err);
  console.log('Created item with ID:', newItem.Id);
});
```

### 4. Update Item

Update an existing list item.

#### Method
```javascript
sharepoint.listItems.update(listId, itemId, updateData, callback)
```

### 5. Delete Item

Delete an item from a list.

#### Method
```javascript
sharepoint.listItems.delete(listId, itemId, callback)
```

## Data Filtering and Querying

### Filter Operations

The connector supports OData-style filtering:

```javascript
{
  filterFields: [
    {field: 'Status', value: 'Active'},
    {field: 'Priority', value: 'High'},
    {field: 'Created', value: '2024-01-01', operator: 'ge'} // greater than or equal
  ],
  orOperator: true // Use OR between filters instead of AND
}
```

### Supported Operators
- `eq` (equals) - default
- `ne` (not equals)
- `gt` (greater than)
- `ge` (greater than or equal)
- `lt` (less than)
- `le` (less than or equal)
- `startswith`
- `endswith`
- `substringof`

### Field Selection

Optimize queries by selecting only required fields:

```javascript
{
  selectFields: ['Title', 'Status', 'Created', 'Category']
}
```

### Field Expansion

Expand lookup fields to get related data:

```javascript
{
  expandFields: ['Author', 'Category', 'AssignedTo']
}
```

## Response Schemas

### Error Response Schema
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

### Pagination Response
When results exceed the limit, a `nextUrl` parameter is provided:

```javascript
sharepoint.lists.list(function(err, lists, nextUrl) {
  if (nextUrl) {
    // More results available
    console.log('Next page URL:', nextUrl);
  }
});
```

## Reporting Use Cases

### 1. List Analytics Report

```javascript
function generateListAnalyticsReport(callback) {
  sharepoint.lists.list(function(err, lists) {
    if (err) return callback(err);
    
    const analytics = {
      totalLists: lists.length,
      totalItems: lists.reduce((sum, list) => sum + list.ItemCount, 0),
      listsByType: {},
      averageItemsPerList: 0,
      listsWithMostItems: lists.sort((a, b) => b.ItemCount - a.ItemCount).slice(0, 5)
    };
    
    // Calculate average
    analytics.averageItemsPerList = analytics.totalItems / analytics.totalLists;
    
    // Group by base template
    lists.forEach(list => {
      const type = list.BaseTemplate || 'Unknown';
      analytics.listsByType[type] = (analytics.listsByType[type] || 0) + 1;
    });
    
    callback(null, analytics);
  });
}
```

### 2. Content Activity Report

```javascript
function generateContentActivityReport(listId, days = 30, callback) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  sharepoint.lists.read(listId, {
    filterFields: [
      {field: 'Modified', value: cutoffDate.toISOString(), operator: 'ge'}
    ],
    selectFields: ['Title', 'Created', 'Modified', 'AuthorId', 'EditorId']
  }, function(err, listData) {
    if (err) return callback(err);
    
    const report = {
      listTitle: listData.Title,
      periodDays: days,
      totalItems: listData.Items.length,
      itemsCreated: 0,
      itemsModified: 0,
      mostActiveUsers: {},
      dailyActivity: {}
    };
    
    listData.Items.forEach(item => {
      const createdDate = new Date(item.Created);
      const modifiedDate = new Date(item.Modified);
      
      if (createdDate >= cutoffDate) {
        report.itemsCreated++;
      }
      
      if (modifiedDate >= cutoffDate && createdDate < cutoffDate) {
        report.itemsModified++;
      }
      
      // Track user activity
      const editorId = item.EditorId;
      report.mostActiveUsers[editorId] = (report.mostActiveUsers[editorId] || 0) + 1;
      
      // Track daily activity
      const dayKey = modifiedDate.toISOString().split('T')[0];
      report.dailyActivity[dayKey] = (report.dailyActivity[dayKey] || 0) + 1;
    });
    
    callback(null, report);
  });
}
```

### 3. Status Distribution Report

```javascript
function generateStatusDistributionReport(listId, statusField = 'Status', callback) {
  sharepoint.lists.read(listId, {
    selectFields: ['Title', statusField, 'Created', 'Priority']
  }, function(err, listData) {
    if (err) return callback(err);
    
    const distribution = {};
    const priorityBreakdown = {};
    
    listData.Items.forEach(item => {
      const status = item[statusField] || 'Unknown';
      const priority = item.Priority || 'Normal';
      
      // Count by status
      distribution[status] = (distribution[status] || 0) + 1;
      
      // Count by status and priority
      if (!priorityBreakdown[status]) {
        priorityBreakdown[status] = {};
      }
      priorityBreakdown[status][priority] = (priorityBreakdown[status][priority] || 0) + 1;
    });
    
    const report = {
      listTitle: listData.Title,
      totalItems: listData.Items.length,
      statusDistribution: distribution,
      priorityBreakdown: priorityBreakdown,
      percentages: {}
    };
    
    // Calculate percentages
    Object.keys(distribution).forEach(status => {
      report.percentages[status] = (distribution[status] / report.totalItems * 100).toFixed(2);
    });
    
    callback(null, report);
  });
}
```

## Examples

### Complete Reporting Workflow

```javascript
const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: 'ntlm',
  url: process.env.SP_URL
});

sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Connected to SharePoint');
  
  // Generate comprehensive report
  generateComprehensiveReport();
});

function generateComprehensiveReport() {
  // Step 1: Get all lists
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Failed to get lists:', err);
      return;
    }
    
    console.log(`\n=== SharePoint Site Report ===`);
    console.log(`Total Lists: ${lists.length}`);
    
    // Step 2: Analyze each list
    let processedLists = 0;
    const listReports = [];
    
    lists.forEach(list => {
      if (list.ItemCount > 0) {
        sharepoint.lists.read(list.Id, {
          selectFields: ['Title', 'Created', 'Modified', 'Status'],
          $top: "1000"
        }, function(err, listData) {
          processedLists++;
          
          if (!err && listData.Items) {
            const report = analyzeListData(listData);
            listReports.push(report);
          }
          
          // When all lists are processed, generate final report
          if (processedLists === lists.length) {
            generateFinalReport(listReports);
          }
        });
      } else {
        processedLists++;
        if (processedLists === lists.length) {
          generateFinalReport(listReports);
        }
      }
    });
  });
}

function analyzeListData(listData) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  let recentItems = 0;
  const statusCounts = {};
  
  listData.Items.forEach(item => {
    // Count recent items
    const modifiedDate = new Date(item.Modified);
    if (modifiedDate >= thirtyDaysAgo) {
      recentItems++;
    }
    
    // Count by status
    const status = item.Status || 'No Status';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return {
    listTitle: listData.Title,
    totalItems: listData.Items.length,
    recentItems: recentItems,
    statusDistribution: statusCounts,
    activityScore: (recentItems / listData.Items.length * 100).toFixed(2)
  };
}

function generateFinalReport(listReports) {
  console.log(`\n=== Detailed Analysis ===`);
  
  listReports.sort((a, b) => b.activityScore - a.activityScore);
  
  console.log('\nMost Active Lists (by % of items modified in last 30 days):');
  listReports.slice(0, 5).forEach(report => {
    console.log(`${report.listTitle}: ${report.activityScore}% (${report.recentItems}/${report.totalItems})`);
  });
  
  console.log('\nOverall Statistics:');
  const totalItems = listReports.reduce((sum, report) => sum + report.totalItems, 0);
  const totalRecentItems = listReports.reduce((sum, report) => sum + report.recentItems, 0);
  
  console.log(`Total Items Across All Lists: ${totalItems}`);
  console.log(`Items Modified in Last 30 Days: ${totalRecentItems}`);
  console.log(`Overall Activity Rate: ${(totalRecentItems / totalItems * 100).toFixed(2)}%`);
}
```

### Export Report to JSON

```javascript
function exportReportToJSON(reportData, filename) {
  const fs = require('fs');
  const report = {
    generated: new Date().toISOString(),
    site: process.env.SP_URL,
    data: reportData
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`Report exported to ${filename}`);
}
```

## Error Handling

Always implement proper error handling in your reporting code:

```javascript
sharepoint.lists.read(listId, options, function(err, listData) {
  if (err) {
    console.error('Error details:', {
      message: err.message,
      statusCode: err.statusCode,
      body: err.body
    });
    return;
  }
  
  // Process successful response
  processReportData(listData);
});
```

## Best Practices

1. **Use Field Selection**: Always specify `selectFields` to reduce payload size
2. **Implement Pagination**: Handle large datasets with appropriate `$top` values
3. **Cache Results**: Cache frequently accessed list metadata
4. **Error Handling**: Always implement comprehensive error handling
5. **Rate Limiting**: Implement delays between requests for large batch operations
6. **Authentication**: Securely store and manage authentication credentials
7. **Logging**: Implement detailed logging for debugging and monitoring

## Backward Compatibility

This documentation covers the current API structure. All existing methods and parameters remain supported:

- All authentication types continue to work as documented
- Existing callback patterns are maintained
- Optional parameters remain optional with same defaults
- Response schemas are consistent with previous versions
- Error handling patterns remain unchanged

## Migration Notes

When updating from previous versions:
- No breaking changes in public API
- New optional parameters can be safely ignored
- Response schemas may include additional fields but existing fields remain unchanged
- Authentication methods remain fully compatible

---

*This documentation is maintained to ensure backward compatibility while providing comprehensive coverage of all reporting capabilities available through the SharePoint Connector.*