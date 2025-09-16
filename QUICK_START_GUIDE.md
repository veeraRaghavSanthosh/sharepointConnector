# SharePoint Connector - Quick Start Guide

This guide will help you get started with the SharePoint Connector for reporting and data analysis.

## Installation

```bash
npm install sharepointconnector
```

## Basic Setup

### 1. Environment Configuration

Create a `.env` file with your SharePoint credentials:

```env
SP_USERNAME=your-username
SP_PASSWORD=your-password
SP_URL=https://your-sharepoint-site.com
SP_AUTH_TYPE=ntlm
```

### 2. Basic Connection

```javascript
require('dotenv').config(); // Load environment variables

const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE,
  url: process.env.SP_URL
});

sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  console.log('Connected to SharePoint!');
  
  // Your code here
});
```

## Common Reporting Tasks

### 1. List All SharePoint Lists

```javascript
sharepoint.lists.list(function(err, lists) {
  if (err) return console.error(err);
  
  console.log('SharePoint Lists:');
  lists.forEach(list => {
    console.log(`- ${list.Title} (${list.ItemCount} items)`);
  });
});
```

### 2. Get Items from a Specific List

```javascript
// Replace 'Tasks' with your list name or use the list GUID
sharepoint.lists.read('Tasks', {
  selectFields: ['Title', 'Status', 'DueDate', 'Priority']
}, function(err, listData) {
  if (err) return console.error(err);
  
  console.log(`\n${listData.Title} Items:`);
  listData.Items.forEach(item => {
    console.log(`- ${item.Title} [${item.Status}]`);
  });
});
```

### 3. Filter and Analyze Data

```javascript
// Get only high-priority, active tasks
sharepoint.lists.read('Tasks', {
  filterFields: [
    {field: 'Priority', value: 'High'},
    {field: 'Status', value: 'In Progress'}
  ],
  selectFields: ['Title', 'Status', 'Priority', 'DueDate', 'AssignedTo']
}, function(err, listData) {
  if (err) return console.error(err);
  
  console.log(`High Priority Active Tasks: ${listData.Items.length}`);
  
  // Create a simple report
  const report = {
    totalHighPriorityTasks: listData.Items.length,
    tasksByStatus: {},
    upcomingDeadlines: []
  };
  
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
  listData.Items.forEach(task => {
    // Count by status
    const status = task.Status || 'No Status';
    report.tasksByStatus[status] = (report.tasksByStatus[status] || 0) + 1;
    
    // Check for upcoming deadlines
    if (task.DueDate) {
      const dueDate = new Date(task.DueDate);
      if (dueDate <= oneWeekFromNow) {
        report.upcomingDeadlines.push({
          title: task.Title,
          dueDate: dueDate.toLocaleDateString(),
          assignedTo: task.AssignedTo
        });
      }
    }
  });
  
  console.log('\nReport Summary:');
  console.log('Status breakdown:', report.tasksByStatus);
  console.log(`Tasks due within a week: ${report.upcomingDeadlines.length}`);
});
```

## Authentication Types

### NTLM (On-Premise SharePoint)

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'domain\\username',
  password: 'password',
  type: 'ntlm',
  url: 'https://sharepoint.company.com'
});
```

### SharePoint Online

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'user@company.onmicrosoft.com',
  password: 'password',
  type: 'online',
  url: 'https://company.sharepoint.com'
});
```

### Basic Authentication

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'username',
  password: 'password',
  type: 'basic',
  url: 'https://sharepoint.company.com'
});
```

## Simple Reporting Functions

### Site Overview Report

```javascript
function generateSiteOverview() {
  sharepoint.lists.list(function(err, lists) {
    if (err) return console.error(err);
    
    const overview = {
      totalLists: lists.length,
      totalItems: 0,
      listTypes: {},
      topLists: []
    };
    
    lists.forEach(list => {
      overview.totalItems += list.ItemCount;
      
      // Count list types
      const type = list.BaseTemplate || 'Unknown';
      overview.listTypes[type] = (overview.listTypes[type] || 0) + 1;
    });
    
    // Get top 5 lists by item count
    overview.topLists = lists
      .sort((a, b) => b.ItemCount - a.ItemCount)
      .slice(0, 5)
      .map(list => ({
        name: list.Title,
        itemCount: list.ItemCount
      }));
    
    console.log('\n=== SharePoint Site Overview ===');
    console.log(`Total Lists: ${overview.totalLists}`);
    console.log(`Total Items: ${overview.totalItems}`);
    console.log(`Average Items per List: ${Math.round(overview.totalItems / overview.totalLists)}`);
    
    console.log('\nTop Lists by Item Count:');
    overview.topLists.forEach((list, index) => {
      console.log(`${index + 1}. ${list.name}: ${list.itemCount} items`);
    });
    
    console.log('\nList Types:');
    Object.entries(overview.listTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} lists`);
    });
  });
}
```

### Recent Activity Report

```javascript
function getRecentActivity(daysBack = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  sharepoint.lists.list(function(err, lists) {
    if (err) return console.error(err);
    
    console.log(`\n=== Recent Activity (Last ${daysBack} days) ===`);
    
    let processedLists = 0;
    const activitySummary = [];
    
    lists.forEach(list => {
      if (list.ItemCount === 0) {
        processedLists++;
        return;
      }
      
      sharepoint.lists.read(list.Id, {
        filterFields: [
          {field: 'Modified', value: cutoffDate.toISOString(), operator: 'ge'}
        ],
        selectFields: ['Title', 'Modified'],
        $top: "100"
      }, function(err, listData) {
        processedLists++;
        
        if (!err && listData.Items.length > 0) {
          activitySummary.push({
            listName: listData.Title,
            recentItems: listData.Items.length,
            lastActivity: listData.Items[0].Modified
          });
        }
        
        // When all lists are processed
        if (processedLists === lists.length) {
          displayActivitySummary(activitySummary, daysBack);
        }
      });
    });
  });
}

function displayActivitySummary(activitySummary, daysBack) {
  if (activitySummary.length === 0) {
    console.log(`No activity found in the last ${daysBack} days.`);
    return;
  }
  
  // Sort by most recent activity
  activitySummary.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  
  console.log('Lists with Recent Activity:');
  activitySummary.forEach((item, index) => {
    const lastActivity = new Date(item.lastActivity).toLocaleDateString();
    console.log(`${index + 1}. ${item.listName}: ${item.recentItems} items (last: ${lastActivity})`);
  });
  
  const totalActivity = activitySummary.reduce((sum, item) => sum + item.recentItems, 0);
  console.log(`\nTotal Recent Activity: ${totalActivity} items across ${activitySummary.length} lists`);
}
```

## Working with Different Data Types

### Dates

```javascript
// Filter by date range
const startDate = new Date('2024-01-01').toISOString();
const endDate = new Date('2024-12-31').toISOString();

sharepoint.lists.read('Tasks', {
  filterFields: [
    {field: 'Created', value: startDate, operator: 'ge'},
    {field: 'Created', value: endDate, operator: 'le'}
  ]
}, callback);
```

### Lookup Fields

```javascript
// Expand lookup fields to get related data
sharepoint.lists.read('Tasks', {
  expandFields: ['AssignedTo', 'Category'],
  selectFields: ['Title', 'AssignedTo/Title', 'Category/Title']
}, function(err, listData) {
  if (err) return console.error(err);
  
  listData.Items.forEach(task => {
    console.log(`${task.Title} - Assigned to: ${task.AssignedTo?.Title || 'Unassigned'}`);
  });
});
```

### Choice Fields

```javascript
// Filter by choice field values
sharepoint.lists.read('Issues', {
  filterFields: [
    {field: 'Priority', value: 'High'}
  ],
  selectFields: ['Title', 'Priority', 'Status']
}, callback);
```

## Error Handling Best Practices

```javascript
function robustListRead(listId, options, callback) {
  sharepoint.lists.read(listId, options, function(err, listData) {
    if (err) {
      // Log the error for debugging
      console.error('Error reading list:', {
        listId: listId,
        error: err.message,
        statusCode: err.statusCode
      });
      
      // Handle specific error types
      if (err.statusCode === 404) {
        return callback(new Error(`List '${listId}' not found`));
      } else if (err.statusCode === 403) {
        return callback(new Error(`Access denied to list '${listId}'`));
      } else if (err.statusCode === 401) {
        return callback(new Error('Authentication failed'));
      }
      
      return callback(err);
    }
    
    // Validate the response
    if (!listData || !listData.Items) {
      return callback(new Error('Invalid response from SharePoint'));
    }
    
    callback(null, listData);
  });
}
```

## Complete Example: Daily Report Script

```javascript
#!/usr/bin/env node

require('dotenv').config();

const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE || 'ntlm',
  url: process.env.SP_URL
});

function generateDailyReport() {
  console.log('='.repeat(50));
  console.log('SHAREPOINT DAILY REPORT');
  console.log(`Generated: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  
  sharepoint.login(function(err) {
    if (err) {
      console.error('Login failed:', err);
      process.exit(1);
    }
    
    // Run multiple reports in sequence
    runReportSequence([
      generateSiteOverview,
      () => getRecentActivity(1), // Last 1 day
      generateTaskSummary
    ]);
  });
}

function runReportSequence(reports) {
  if (reports.length === 0) {
    console.log('\n' + '='.repeat(50));
    console.log('Report generation complete!');
    process.exit(0);
  }
  
  const nextReport = reports.shift();
  nextReport();
  
  // Wait 2 seconds between reports to avoid overwhelming SharePoint
  setTimeout(() => {
    runReportSequence(reports);
  }, 2000);
}

function generateTaskSummary() {
  console.log('\n=== Task Summary ===');
  
  sharepoint.lists.read('Tasks', {
    selectFields: ['Title', 'Status', 'Priority', 'DueDate'],
    fieldValuesAsText: true
  }, function(err, listData) {
    if (err) {
      console.error('Could not load task list:', err.message);
      return;
    }
    
    const summary = {
      total: listData.Items.length,
      byStatus: {},
      byPriority: {},
      overdue: 0
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    listData.Items.forEach(task => {
      // Count by status
      const status = task.Status || 'No Status';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      
      // Count by priority
      const priority = task.Priority || 'Normal';
      summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
      
      // Check if overdue
      if (task.DueDate && task.Status !== 'Completed') {
        const dueDate = new Date(task.DueDate);
        if (dueDate < today) {
          summary.overdue++;
        }
      }
    });
    
    console.log(`Total Tasks: ${summary.total}`);
    console.log('\nBy Status:');
    Object.entries(summary.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nBy Priority:');
    Object.entries(summary.byPriority).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });
    
    if (summary.overdue > 0) {
      console.log(`\n⚠️  Overdue Tasks: ${summary.overdue}`);
    }
  });
}

// Run the report
generateDailyReport();
```

## Running Your Reports

### 1. Save as a script file (e.g., `daily-report.js`)

### 2. Make it executable:
```bash
chmod +x daily-report.js
```

### 3. Run it:
```bash
node daily-report.js
```

### 4. Schedule it with cron (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 9 AM
0 9 * * * /usr/bin/node /path/to/your/daily-report.js
```

## Next Steps

1. **Read the full documentation**: Check out `REPORTING_API_DOCUMENTATION.md` for comprehensive API coverage
2. **Explore examples**: Look at `REPORTING_EXAMPLES.md` for advanced reporting scenarios
3. **Customize for your needs**: Modify the examples to match your SharePoint structure and reporting requirements
4. **Set up monitoring**: Implement error handling and logging for production use
5. **Scale up**: Consider implementing caching and rate limiting for large-scale reporting

## Common Issues and Solutions

### "Login failed" error
- Verify your credentials are correct
- Check if your SharePoint site URL is accessible
- Ensure you're using the correct authentication type

### "List not found" error
- Verify the list name or GUID is correct
- Check if you have permission to access the list
- Try using the list GUID instead of the title

### "Access denied" error
- Verify your account has read permissions on the list
- Check if the list requires special permissions
- Contact your SharePoint administrator

### Performance issues
- Use `selectFields` to limit returned data
- Implement pagination with `$top` parameter
- Add delays between requests to avoid throttling

This quick start guide should get you up and running with SharePoint reporting in minutes!