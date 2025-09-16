# SharePoint Connector - Reporting Examples

This document provides practical examples of how to use the SharePoint Connector for various reporting scenarios.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Simple Reports](#simple-reports)
3. [Advanced Analytics](#advanced-analytics)
4. [Custom Report Functions](#custom-report-functions)
5. [Real-time Monitoring](#real-time-monitoring)
6. [Export and Integration](#export-and-integration)

## Basic Setup

```javascript
const sharepoint = require('sharepointconnector')({
  username: 'your-username',
  password: 'your-password',
  type: 'ntlm', // or 'basic', 'online', 'onlinesaml'
  url: 'https://your-sharepoint-site.com'
});

// Login and start reporting
sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  console.log('Connected to SharePoint');
  // Your reporting code here
});
```

## Simple Reports

### 1. List Inventory Report

Generate a report of all lists and their item counts:

```javascript
function generateListInventoryReport() {
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    console.log('\n=== SharePoint List Inventory ===');
    console.log('Generated:', new Date().toLocaleString());
    console.log('-'.repeat(50));
    
    const sortedLists = lists.sort((a, b) => b.ItemCount - a.ItemCount);
    
    sortedLists.forEach((list, index) => {
      console.log(`${index + 1}. ${list.Title}`);
      console.log(`   Items: ${list.ItemCount}`);
      console.log(`   Created: ${new Date(list.Created).toLocaleDateString()}`);
      console.log(`   Last Modified: ${new Date(list.LastItemModifiedDate).toLocaleDateString()}`);
      console.log('');
    });
    
    const totalItems = lists.reduce((sum, list) => sum + list.ItemCount, 0);
    console.log(`Total Lists: ${lists.length}`);
    console.log(`Total Items: ${totalItems}`);
    console.log(`Average Items per List: ${(totalItems / lists.length).toFixed(1)}`);
  });
}
```

### 2. Recent Activity Report

Show recently modified items across all lists:

```javascript
function generateRecentActivityReport(daysBack = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    console.log(`\n=== Recent Activity Report (Last ${daysBack} days) ===`);
    console.log('Generated:', new Date().toLocaleString());
    console.log('-'.repeat(60));
    
    let processedLists = 0;
    const activityData = [];
    
    lists.forEach(list => {
      if (list.ItemCount > 0) {
        sharepoint.lists.read(list.Id, {
          filterFields: [
            {field: 'Modified', value: cutoffDate.toISOString(), operator: 'ge'}
          ],
          selectFields: ['Title', 'Modified', 'EditorId'],
          $top: "100"
        }, function(err, listData) {
          processedLists++;
          
          if (!err && listData.Items && listData.Items.length > 0) {
            activityData.push({
              listTitle: listData.Title,
              recentItems: listData.Items.length,
              items: listData.Items
            });
          }
          
          if (processedLists === lists.length) {
            displayActivityReport(activityData, daysBack);
          }
        });
      } else {
        processedLists++;
        if (processedLists === lists.length) {
          displayActivityReport(activityData, daysBack);
        }
      }
    });
  });
}

function displayActivityReport(activityData, daysBack) {
  if (activityData.length === 0) {
    console.log(`No activity found in the last ${daysBack} days.`);
    return;
  }
  
  // Sort by most active lists
  activityData.sort((a, b) => b.recentItems - a.recentItems);
  
  console.log('Most Active Lists:');
  activityData.forEach((data, index) => {
    console.log(`${index + 1}. ${data.listTitle}: ${data.recentItems} items modified`);
  });
  
  console.log('\nRecent Items:');
  activityData.forEach(data => {
    console.log(`\n${data.listTitle}:`);
    data.items.slice(0, 5).forEach(item => {
      console.log(`  - ${item.Title} (${new Date(item.Modified).toLocaleString()})`);
    });
  });
  
  const totalRecentItems = activityData.reduce((sum, data) => sum + data.recentItems, 0);
  console.log(`\nTotal recent activity: ${totalRecentItems} items across ${activityData.length} lists`);
}
```

### 3. Task Status Report

Generate a status report for a task list:

```javascript
function generateTaskStatusReport(taskListId) {
  sharepoint.lists.read(taskListId, {
    selectFields: ['Title', 'Status', 'Priority', 'DueDate', 'AssignedTo', 'PercentComplete'],
    fieldValuesAsText: true
  }, function(err, listData) {
    if (err) {
      console.error('Error reading task list:', err);
      return;
    }
    
    console.log(`\n=== Task Status Report: ${listData.Title} ===`);
    console.log('Generated:', new Date().toLocaleString());
    console.log('-'.repeat(50));
    
    const statusCounts = {};
    const priorityCounts = {};
    const overdueTasks = [];
    const today = new Date();
    
    listData.Items.forEach(task => {
      // Count by status
      const status = task.Status || 'Not Started';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Count by priority
      const priority = task.Priority || 'Normal';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      
      // Check for overdue tasks
      if (task.DueDate) {
        const dueDate = new Date(task.DueDate);
        if (dueDate < today && status !== 'Completed') {
          overdueTasks.push(task);
        }
      }
    });
    
    console.log('Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = (count / listData.Items.length * 100).toFixed(1);
      console.log(`  ${status}: ${count} (${percentage}%)`);
    });
    
    console.log('\nPriority Distribution:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const percentage = (count / listData.Items.length * 100).toFixed(1);
      console.log(`  ${priority}: ${count} (${percentage}%)`);
    });
    
    if (overdueTasks.length > 0) {
      console.log(`\nOverdue Tasks (${overdueTasks.length}):`);
      overdueTasks.forEach(task => {
        console.log(`  - ${task.Title} (Due: ${new Date(task.DueDate).toLocaleDateString()})`);
      });
    }
    
    console.log(`\nTotal Tasks: ${listData.Items.length}`);
    console.log(`Completed: ${statusCounts['Completed'] || 0}`);
    console.log(`In Progress: ${statusCounts['In Progress'] || 0}`);
    console.log(`Not Started: ${statusCounts['Not Started'] || 0}`);
    console.log(`Overdue: ${overdueTasks.length}`);
  });
}
```

## Advanced Analytics

### 1. User Activity Analytics

Track user contributions across lists:

```javascript
function generateUserActivityAnalytics(daysBack = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  sharepoint.lists.list(function(err, lists) {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    const userActivity = {};
    let processedLists = 0;
    
    lists.forEach(list => {
      if (list.ItemCount > 0) {
        sharepoint.lists.read(list.Id, {
          filterFields: [
            {field: 'Modified', value: cutoffDate.toISOString(), operator: 'ge'}
          ],
          selectFields: ['Title', 'Created', 'Modified', 'AuthorId', 'EditorId'],
          expandFields: ['Author', 'Editor'],
          $top: "500"
        }, function(err, listData) {
          processedLists++;
          
          if (!err && listData.Items) {
            listData.Items.forEach(item => {
              const editorId = item.EditorId;
              const authorId = item.AuthorId;
              
              // Track editor activity
              if (editorId && !userActivity[editorId]) {
                userActivity[editorId] = {
                  userId: editorId,
                  itemsModified: 0,
                  itemsCreated: 0,
                  listsActive: new Set()
                };
              }
              if (editorId) {
                userActivity[editorId].itemsModified++;
                userActivity[editorId].listsActive.add(listData.Title);
              }
              
              // Track author activity (if item was created in the period)
              const createdDate = new Date(item.Created);
              if (createdDate >= cutoffDate && authorId) {
                if (!userActivity[authorId]) {
                  userActivity[authorId] = {
                    userId: authorId,
                    itemsModified: 0,
                    itemsCreated: 0,
                    listsActive: new Set()
                  };
                }
                userActivity[authorId].itemsCreated++;
                userActivity[authorId].listsActive.add(listData.Title);
              }
            });
          }
          
          if (processedLists === lists.length) {
            displayUserActivityReport(userActivity, daysBack);
          }
        });
      } else {
        processedLists++;
        if (processedLists === lists.length) {
          displayUserActivityReport(userActivity, daysBack);
        }
      }
    });
  });
}

function displayUserActivityReport(userActivity, daysBack) {
  console.log(`\n=== User Activity Analytics (Last ${daysBack} days) ===`);
  console.log('Generated:', new Date().toLocaleString());
  console.log('-'.repeat(60));
  
  const users = Object.values(userActivity).map(user => ({
    ...user,
    listsActive: user.listsActive.size,
    totalActivity: user.itemsModified + user.itemsCreated
  })).sort((a, b) => b.totalActivity - a.totalActivity);
  
  console.log('Most Active Users:');
  users.slice(0, 10).forEach((user, index) => {
    console.log(`${index + 1}. User ID ${user.userId}:`);
    console.log(`   Items Created: ${user.itemsCreated}`);
    console.log(`   Items Modified: ${user.itemsModified}`);
    console.log(`   Lists Active In: ${user.listsActive}`);
    console.log(`   Total Activity: ${user.totalActivity}`);
    console.log('');
  });
  
  const totalUsers = users.length;
  const totalActivity = users.reduce((sum, user) => sum + user.totalActivity, 0);
  const averageActivity = totalActivity / totalUsers;
  
  console.log(`Total Active Users: ${totalUsers}`);
  console.log(`Total Activity Events: ${totalActivity}`);
  console.log(`Average Activity per User: ${averageActivity.toFixed(1)}`);
}
```

### 2. Content Growth Analysis

Track how content grows over time:

```javascript
function generateContentGrowthAnalysis(listId, monthsBack = 6) {
  sharepoint.lists.read(listId, {
    selectFields: ['Title', 'Created', 'Modified'],
    $top: "5000"
  }, function(err, listData) {
    if (err) {
      console.error('Error reading list:', err);
      return;
    }
    
    console.log(`\n=== Content Growth Analysis: ${listData.Title} ===`);
    console.log('Generated:', new Date().toLocaleString());
    console.log('-'.repeat(60));
    
    const monthlyData = {};
    const now = new Date();
    
    // Initialize months
    for (let i = monthsBack; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        created: 0,
        modified: 0,
        cumulativeTotal: 0
      };
    }
    
    // Analyze items
    listData.Items.forEach(item => {
      const createdDate = new Date(item.Created);
      const modifiedDate = new Date(item.Modified);
      
      const createdKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      const modifiedKey = `${modifiedDate.getFullYear()}-${String(modifiedDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[createdKey]) {
        monthlyData[createdKey].created++;
      }
      
      if (monthlyData[modifiedKey] && createdKey !== modifiedKey) {
        monthlyData[modifiedKey].modified++;
      }
    });
    
    // Calculate cumulative totals
    let cumulative = 0;
    Object.keys(monthlyData).sort().forEach(month => {
      cumulative += monthlyData[month].created;
      monthlyData[month].cumulativeTotal = cumulative;
    });
    
    console.log('Monthly Growth:');
    console.log('Month        | Created | Modified | Total Items');
    console.log('-'.repeat(50));
    
    Object.entries(monthlyData).forEach(([month, data]) => {
      console.log(`${month}     | ${String(data.created).padStart(7)} | ${String(data.modified).padStart(8)} | ${String(data.cumulativeTotal).padStart(10)}`);
    });
    
    const totalCreated = Object.values(monthlyData).reduce((sum, data) => sum + data.created, 0);
    const totalModified = Object.values(monthlyData).reduce((sum, data) => sum + data.modified, 0);
    const avgCreatedPerMonth = totalCreated / monthsBack;
    
    console.log('\nSummary:');
    console.log(`Total Items Created: ${totalCreated}`);
    console.log(`Total Modifications: ${totalModified}`);
    console.log(`Average Items Created per Month: ${avgCreatedPerMonth.toFixed(1)}`);
    console.log(`Current Total Items: ${listData.Items.length}`);
  });
}
```

## Custom Report Functions

### 1. Configurable Dashboard Report

```javascript
function generateDashboardReport(config) {
  const defaultConfig = {
    lists: [], // List IDs to include, empty = all lists
    metrics: ['itemCount', 'recentActivity', 'userActivity'],
    timeframe: 30, // days
    outputFormat: 'console' // 'console', 'json', 'csv'
  };
  
  const settings = { ...defaultConfig, ...config };
  
  sharepoint.lists.list(function(err, allLists) {
    if (err) {
      console.error('Error fetching lists:', err);
      return;
    }
    
    const listsToAnalyze = settings.lists.length > 0 
      ? allLists.filter(list => settings.lists.includes(list.Id))
      : allLists;
    
    const dashboard = {
      generated: new Date().toISOString(),
      timeframe: settings.timeframe,
      lists: [],
      summary: {}
    };
    
    let processedLists = 0;
    
    listsToAnalyze.forEach(list => {
      analyzeListForDashboard(list, settings, function(listReport) {
        dashboard.lists.push(listReport);
        processedLists++;
        
        if (processedLists === listsToAnalyze.length) {
          generateDashboardSummary(dashboard);
          outputDashboardReport(dashboard, settings.outputFormat);
        }
      });
    });
  });
}

function analyzeListForDashboard(list, settings, callback) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.timeframe);
  
  sharepoint.lists.read(list.Id, {
    filterFields: [
      {field: 'Modified', value: cutoffDate.toISOString(), operator: 'ge'}
    ],
    selectFields: ['Title', 'Created', 'Modified', 'EditorId'],
    $top: "1000"
  }, function(err, listData) {
    const report = {
      listId: list.Id,
      listTitle: list.Title,
      totalItems: list.ItemCount,
      recentActivity: 0,
      uniqueUsers: new Set(),
      averageAge: 0
    };
    
    if (!err && listData.Items) {
      report.recentActivity = listData.Items.length;
      
      listData.Items.forEach(item => {
        if (item.EditorId) {
          report.uniqueUsers.add(item.EditorId);
        }
      });
      
      report.uniqueUsers = report.uniqueUsers.size;
    }
    
    callback(report);
  });
}

function generateDashboardSummary(dashboard) {
  dashboard.summary = {
    totalLists: dashboard.lists.length,
    totalItems: dashboard.lists.reduce((sum, list) => sum + list.totalItems, 0),
    totalRecentActivity: dashboard.lists.reduce((sum, list) => sum + list.recentActivity, 0),
    totalUniqueUsers: new Set(dashboard.lists.flatMap(list => 
      Array.from({length: list.uniqueUsers}, (_, i) => `${list.listId}-${i}`)
    )).size,
    mostActiveList: dashboard.lists.reduce((max, list) => 
      list.recentActivity > (max?.recentActivity || 0) ? list : max, null),
    leastActiveList: dashboard.lists.reduce((min, list) => 
      list.recentActivity < (min?.recentActivity || Infinity) ? list : min, null)
  };
}

function outputDashboardReport(dashboard, format) {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(dashboard, null, 2));
      break;
    case 'csv':
      outputDashboardCSV(dashboard);
      break;
    default:
      outputDashboardConsole(dashboard);
  }
}

function outputDashboardConsole(dashboard) {
  console.log('\n=== SharePoint Dashboard Report ===');
  console.log(`Generated: ${new Date(dashboard.generated).toLocaleString()}`);
  console.log(`Timeframe: Last ${dashboard.timeframe} days`);
  console.log('-'.repeat(50));
  
  console.log('\nSummary:');
  console.log(`Total Lists: ${dashboard.summary.totalLists}`);
  console.log(`Total Items: ${dashboard.summary.totalItems}`);
  console.log(`Recent Activity: ${dashboard.summary.totalRecentActivity} items`);
  console.log(`Most Active List: ${dashboard.summary.mostActiveList?.listTitle} (${dashboard.summary.mostActiveList?.recentActivity} items)`);
  
  console.log('\nList Details:');
  dashboard.lists.sort((a, b) => b.recentActivity - a.recentActivity).forEach(list => {
    console.log(`${list.listTitle}:`);
    console.log(`  Total Items: ${list.totalItems}`);
    console.log(`  Recent Activity: ${list.recentActivity}`);
    console.log(`  Active Users: ${list.uniqueUsers}`);
    console.log('');
  });
}
```

### 2. Automated Report Scheduler

```javascript
class SharePointReportScheduler {
  constructor(sharepointConfig, reportConfig) {
    this.sharepoint = require('sharepointconnector')(sharepointConfig);
    this.config = reportConfig;
    this.isLoggedIn = false;
  }
  
  async initialize() {
    return new Promise((resolve, reject) => {
      this.sharepoint.login((err) => {
        if (err) {
          reject(err);
        } else {
          this.isLoggedIn = true;
          resolve();
        }
      });
    });
  }
  
  scheduleReports() {
    if (!this.isLoggedIn) {
      console.error('Not logged in to SharePoint');
      return;
    }
    
    // Schedule daily reports
    if (this.config.dailyReports) {
      setInterval(() => {
        this.generateDailyReport();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
    
    // Schedule weekly reports
    if (this.config.weeklyReports) {
      setInterval(() => {
        this.generateWeeklyReport();
      }, 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    
    console.log('Report scheduler initialized');
  }
  
  generateDailyReport() {
    console.log('\n=== Daily Report ===', new Date().toLocaleString());
    generateRecentActivityReport(1); // Last 1 day
  }
  
  generateWeeklyReport() {
    console.log('\n=== Weekly Report ===', new Date().toLocaleString());
    generateContentGrowthAnalysis('your-main-list-id', 1); // Last month
    generateUserActivityAnalytics(7); // Last 7 days
  }
}

// Usage
const scheduler = new SharePointReportScheduler({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: 'ntlm',
  url: process.env.SP_URL
}, {
  dailyReports: true,
  weeklyReports: true
});

scheduler.initialize().then(() => {
  scheduler.scheduleReports();
}).catch(err => {
  console.error('Failed to initialize scheduler:', err);
});
```

## Real-time Monitoring

### 1. Change Detection Monitor

```javascript
function startChangeMonitor(listIds, intervalMinutes = 5) {
  const lastModified = {};
  
  // Initialize last modified times
  listIds.forEach(listId => {
    lastModified[listId] = new Date();
  });
  
  console.log(`Starting change monitor for ${listIds.length} lists (checking every ${intervalMinutes} minutes)`);
  
  setInterval(() => {
    checkForChanges(listIds, lastModified);
  }, intervalMinutes * 60 * 1000);
  
  // Initial check
  checkForChanges(listIds, lastModified);
}

function checkForChanges(listIds, lastModified) {
  listIds.forEach(listId => {
    const since = lastModified[listId];
    
    sharepoint.lists.read(listId, {
      filterFields: [
        {field: 'Modified', value: since.toISOString(), operator: 'gt'}
      ],
      selectFields: ['Title', 'Modified', 'EditorId'],
      $top: "50"
    }, function(err, listData) {
      if (err) {
        console.error(`Error checking changes for list ${listId}:`, err);
        return;
      }
      
      if (listData.Items && listData.Items.length > 0) {
        console.log(`\n[${new Date().toLocaleString()}] Changes detected in ${listData.Title}:`);
        listData.Items.forEach(item => {
          console.log(`  - ${item.Title} (modified: ${new Date(item.Modified).toLocaleString()})`);
        });
        
        // Update last modified time
        const latestModified = listData.Items.reduce((latest, item) => {
          const itemModified = new Date(item.Modified);
          return itemModified > latest ? itemModified : latest;
        }, since);
        
        lastModified[listId] = latestModified;
      }
    });
  });
}
```

## Export and Integration

### 1. Export to Excel-compatible CSV

```javascript
function exportReportToCSV(listId, filename, options = {}) {
  const fs = require('fs');
  
  sharepoint.lists.read(listId, {
    selectFields: options.fields || ['Title', 'Created', 'Modified', 'Status'],
    fieldValuesAsText: true,
    $top: options.limit || "5000"
  }, function(err, listData) {
    if (err) {
      console.error('Error reading list for export:', err);
      return;
    }
    
    const fields = options.fields || Object.keys(listData.Items[0] || {});
    let csvContent = fields.join(',') + '\n';
    
    listData.Items.forEach(item => {
      const row = fields.map(field => {
        const value = item[field] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\n';
    });
    
    fs.writeFileSync(filename, csvContent);
    console.log(`Report exported to ${filename} (${listData.Items.length} items)`);
  });
}

// Usage
exportReportToCSV('your-list-id', 'report.csv', {
  fields: ['Title', 'Status', 'Priority', 'DueDate', 'AssignedTo'],
  limit: "1000"
});
```

### 2. Integration with External Systems

```javascript
function sendReportToWebhook(reportData, webhookUrl) {
  const https = require('https');
  const url = require('url');
  
  const parsedUrl = url.parse(webhookUrl);
  const postData = JSON.stringify({
    type: 'sharepoint_report',
    timestamp: new Date().toISOString(),
    data: reportData
  });
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Webhook response: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`Response body: ${chunk}`);
    });
  });
  
  req.on('error', (e) => {
    console.error(`Webhook error: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

// Usage with dashboard report
generateDashboardReport({
  outputFormat: 'json',
  callback: (dashboardData) => {
    sendReportToWebhook(dashboardData, 'https://your-webhook-url.com/sharepoint-reports');
  }
});
```

### 3. Email Report Integration

```javascript
function emailReport(reportData, emailConfig) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.user,
      pass: emailConfig.smtp.password
    }
  });
  
  const htmlReport = generateHTMLReport(reportData);
  
  const mailOptions = {
    from: emailConfig.from,
    to: emailConfig.to,
    subject: `SharePoint Report - ${new Date().toLocaleDateString()}`,
    html: htmlReport,
    attachments: emailConfig.attachments || []
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email error:', error);
    } else {
      console.log('Report emailed successfully:', info.messageId);
    }
  });
}

function generateHTMLReport(reportData) {
  return `
    <html>
      <head>
        <title>SharePoint Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { background-color: #e7f3ff; padding: 15px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>SharePoint Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Lists: ${reportData.summary.totalLists}</p>
          <p>Total Items: ${reportData.summary.totalItems}</p>
          <p>Recent Activity: ${reportData.summary.totalRecentActivity}</p>
        </div>
        
        <h2>List Details</h2>
        <table>
          <thead>
            <tr>
              <th>List Name</th>
              <th>Total Items</th>
              <th>Recent Activity</th>
              <th>Active Users</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.lists.map(list => `
              <tr>
                <td>${list.listTitle}</td>
                <td>${list.totalItems}</td>
                <td>${list.recentActivity}</td>
                <td>${list.uniqueUsers}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
}
```

## Running the Examples

To use these examples in your project:

1. Install the SharePoint Connector:
```bash
npm install sharepointconnector
```

2. Set up your environment variables:
```bash
export SP_USERNAME="your-username"
export SP_PASSWORD="your-password"
export SP_URL="https://your-sharepoint-site.com"
export SP_AUTH_TYPE="ntlm"
```

3. Create your reporting script:
```javascript
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
  
  // Run your reports here
  generateListInventoryReport();
  generateRecentActivityReport(7);
});
```

4. Run your script:
```bash
node your-reporting-script.js
```

These examples provide a comprehensive foundation for building custom SharePoint reporting solutions using the SharePoint Connector library.