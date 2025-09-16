# SharePoint Connector - Notification APIs Documentation

## Overview

This document provides comprehensive documentation for the notification-related APIs in the SharePoint Connector library. The notification system allows you to subscribe to and receive real-time updates from SharePoint lists and libraries.

## Table of Contents

1. [Authentication](#authentication)
2. [Webhook Subscriptions](#webhook-subscriptions)
3. [Event Notifications](#event-notifications)
4. [Error Handling](#error-handling)
5. [Examples](#examples)
6. [Response Schemas](#response-schemas)

## Authentication

All notification APIs require proper authentication. Use the same authentication methods as the main SharePoint connector:

```javascript
var sharepoint = require('sharepointconnector')({
  username: 'someusername',
  password: 'somepassword',
  type: 'ntlm', // or 'basic', 'online', 'onlinesaml'
  url: 'https://sharepointHostname.com'
});
```

## Webhook Subscriptions

### Subscribe to List Changes

Subscribe to receive notifications when items in a SharePoint list are created, updated, or deleted.

#### Endpoint
```javascript
sharepoint.notifications.subscribe(listId, options, callback)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | String | Yes | The ID or title of the SharePoint list |
| `options` | Object | Yes | Subscription configuration options |
| `callback` | Function | Yes | Callback function to handle the response |

#### Options Object

```javascript
{
  notificationUrl: 'https://your-webhook-endpoint.com/webhook',
  resource: 'lists/{listId}/items',
  changeTypes: ['created', 'updated', 'deleted'],
  expirationDateTime: '2025-12-31T23:59:59Z',
  clientState: 'optional-client-state-value'
}
```

#### Example

```javascript
sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  const subscriptionOptions = {
    notificationUrl: 'https://myapp.com/webhook/sharepoint',
    resource: 'lists/MyTaskList/items',
    changeTypes: ['created', 'updated', 'deleted'],
    expirationDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    clientState: 'myapp-subscription-001'
  };
  
  sharepoint.notifications.subscribe('MyTaskList', subscriptionOptions, function(err, subscription) {
    if (err) {
      return console.error('Subscription failed:', err);
    }
    
    console.log('Subscription created:', subscription);
    // Save subscription.id for future reference
  });
});
```

#### Response Schema

```json
{
  "id": "subscription-uuid",
  "resource": "lists/MyTaskList/items",
  "notificationUrl": "https://myapp.com/webhook/sharepoint",
  "changeTypes": ["created", "updated", "deleted"],
  "expirationDateTime": "2025-12-31T23:59:59Z",
  "clientState": "myapp-subscription-001",
  "createdDateTime": "2025-09-16T10:30:00Z"
}
```

### List Active Subscriptions

Retrieve all active webhook subscriptions for the current SharePoint site.

#### Endpoint
```javascript
sharepoint.notifications.list(callback)
```

#### Example

```javascript
sharepoint.notifications.list(function(err, subscriptions) {
  if (err) {
    return console.error('Failed to list subscriptions:', err);
  }
  
  console.log('Active subscriptions:', subscriptions);
  subscriptions.forEach(sub => {
    console.log(`- ${sub.id}: ${sub.resource} -> ${sub.notificationUrl}`);
  });
});
```

#### Response Schema

```json
{
  "value": [
    {
      "id": "subscription-uuid-1",
      "resource": "lists/MyTaskList/items",
      "notificationUrl": "https://myapp.com/webhook/sharepoint",
      "changeTypes": ["created", "updated", "deleted"],
      "expirationDateTime": "2025-12-31T23:59:59Z",
      "clientState": "myapp-subscription-001"
    },
    {
      "id": "subscription-uuid-2",
      "resource": "lists/Documents/items",
      "notificationUrl": "https://myapp.com/webhook/documents",
      "changeTypes": ["created", "updated"],
      "expirationDateTime": "2025-11-30T23:59:59Z",
      "clientState": "myapp-docs-subscription"
    }
  ]
}
```

### Update Subscription

Update an existing webhook subscription, typically to extend the expiration date.

#### Endpoint
```javascript
sharepoint.notifications.update(subscriptionId, updates, callback)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscriptionId` | String | Yes | The ID of the subscription to update |
| `updates` | Object | Yes | Properties to update |
| `callback` | Function | Yes | Callback function to handle the response |

#### Example

```javascript
const updates = {
  expirationDateTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // Extend by 60 days
};

sharepoint.notifications.update('subscription-uuid', updates, function(err, updatedSubscription) {
  if (err) {
    return console.error('Update failed:', err);
  }
  
  console.log('Subscription updated:', updatedSubscription);
});
```

### Delete Subscription

Remove a webhook subscription.

#### Endpoint
```javascript
sharepoint.notifications.delete(subscriptionId, callback)
```

#### Example

```javascript
sharepoint.notifications.delete('subscription-uuid', function(err) {
  if (err) {
    return console.error('Delete failed:', err);
  }
  
  console.log('Subscription deleted successfully');
});
```

## Event Notifications

### Webhook Event Handler

When SharePoint sends notifications to your webhook endpoint, you'll receive events in the following format:

#### Webhook Request Schema

```json
{
  "value": [
    {
      "subscriptionId": "subscription-uuid",
      "clientState": "myapp-subscription-001",
      "expirationDateTime": "2025-12-31T23:59:59Z",
      "resource": "lists/MyTaskList/items",
      "tenantId": "tenant-uuid",
      "siteUrl": "https://contoso.sharepoint.com/sites/mysite",
      "webId": "web-uuid",
      "changeType": "created",
      "resourceData": {
        "@odata.type": "#Microsoft.Graph.listItem",
        "@odata.id": "https://contoso.sharepoint.com/sites/mysite/_api/web/lists('list-uuid')/items('item-id')",
        "id": "item-id",
        "listId": "list-uuid"
      }
    }
  ]
}
```

### Processing Webhook Events

Here's how to handle incoming webhook notifications:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/sharepoint', (req, res) => {
  const notifications = req.body.value;
  
  notifications.forEach(notification => {
    console.log(`Received ${notification.changeType} event for ${notification.resource}`);
    
    // Verify client state
    if (notification.clientState !== 'myapp-subscription-001') {
      console.warn('Invalid client state received');
      return;
    }
    
    // Process the notification
    processNotification(notification);
  });
  
  // Always respond with 200 OK
  res.status(200).send('OK');
});

function processNotification(notification) {
  switch (notification.changeType) {
    case 'created':
      handleItemCreated(notification);
      break;
    case 'updated':
      handleItemUpdated(notification);
      break;
    case 'deleted':
      handleItemDeleted(notification);
      break;
    default:
      console.log('Unknown change type:', notification.changeType);
  }
}

function handleItemCreated(notification) {
  console.log('New item created:', notification.resourceData.id);
  // Fetch full item details if needed
  sharepoint.listItems.read(notification.resourceData.listId, notification.resourceData.id, function(err, item) {
    if (err) return console.error(err);
    console.log('Full item details:', item);
  });
}

function handleItemUpdated(notification) {
  console.log('Item updated:', notification.resourceData.id);
  // Handle update logic
}

function handleItemDeleted(notification) {
  console.log('Item deleted:', notification.resourceData.id);
  // Handle deletion logic
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Error Handling

### Common Error Responses

#### Authentication Errors

```json
{
  "error": {
    "code": "Unauthorized",
    "message": "Access denied. Check credentials and permissions.",
    "details": [
      {
        "code": "InvalidAuthenticationToken",
        "message": "The access token is invalid."
      }
    ]
  }
}
```

#### Subscription Errors

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Invalid subscription request.",
    "details": [
      {
        "code": "InvalidNotificationUrl",
        "message": "The notification URL must be a valid HTTPS endpoint."
      }
    ]
  }
}
```

#### Rate Limiting

```json
{
  "error": {
    "code": "TooManyRequests",
    "message": "Request rate limit exceeded.",
    "retryAfter": 60
  }
}
```

### Error Handling Best Practices

```javascript
sharepoint.notifications.subscribe('MyList', options, function(err, subscription) {
  if (err) {
    switch (err.code) {
      case 'Unauthorized':
        console.error('Authentication failed. Please check credentials.');
        break;
      case 'BadRequest':
        console.error('Invalid request:', err.message);
        break;
      case 'TooManyRequests':
        console.error('Rate limited. Retry after:', err.retryAfter, 'seconds');
        break;
      default:
        console.error('Subscription failed:', err);
    }
    return;
  }
  
  console.log('Subscription successful:', subscription.id);
});
```

## Complete Example Application

Here's a complete example that demonstrates subscribing to notifications and handling webhook events:

```javascript
const sharepoint = require('sharepointconnector')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: 'online',
  url: 'https://contoso.sharepoint.com'
});

const express = require('express');
const app = express();
app.use(express.json());

// Store active subscriptions
const activeSubscriptions = new Map();

// Initialize SharePoint connection and create subscriptions
sharepoint.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Connected to SharePoint');
  
  // Subscribe to a task list
  const taskListOptions = {
    notificationUrl: 'https://myapp.ngrok.io/webhook/tasks',
    resource: 'lists/Tasks/items',
    changeTypes: ['created', 'updated', 'deleted'],
    expirationDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    clientState: 'tasks-subscription-001'
  };
  
  sharepoint.notifications.subscribe('Tasks', taskListOptions, function(err, subscription) {
    if (err) {
      console.error('Task subscription failed:', err);
      return;
    }
    
    console.log('Task subscription created:', subscription.id);
    activeSubscriptions.set(subscription.id, subscription);
  });
  
  // Subscribe to a document library
  const docsOptions = {
    notificationUrl: 'https://myapp.ngrok.io/webhook/documents',
    resource: 'lists/Documents/items',
    changeTypes: ['created', 'updated'],
    expirationDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    clientState: 'docs-subscription-001'
  };
  
  sharepoint.notifications.subscribe('Documents', docsOptions, function(err, subscription) {
    if (err) {
      console.error('Documents subscription failed:', err);
      return;
    }
    
    console.log('Documents subscription created:', subscription.id);
    activeSubscriptions.set(subscription.id, subscription);
  });
});

// Webhook endpoints
app.post('/webhook/tasks', (req, res) => {
  console.log('Task notification received');
  processWebhook(req.body, 'tasks');
  res.status(200).send('OK');
});

app.post('/webhook/documents', (req, res) => {
  console.log('Document notification received');
  processWebhook(req.body, 'documents');
  res.status(200).send('OK');
});

function processWebhook(body, type) {
  const notifications = body.value || [];
  
  notifications.forEach(notification => {
    console.log(`[${type}] ${notification.changeType} event for item ${notification.resourceData.id}`);
    
    // Verify subscription exists
    const subscription = activeSubscriptions.get(notification.subscriptionId);
    if (!subscription) {
      console.warn('Unknown subscription ID:', notification.subscriptionId);
      return;
    }
    
    // Verify client state
    if (notification.clientState !== subscription.clientState) {
      console.warn('Client state mismatch');
      return;
    }
    
    // Process based on change type
    switch (notification.changeType) {
      case 'created':
        console.log(`New ${type} item created:`, notification.resourceData.id);
        break;
      case 'updated':
        console.log(`${type} item updated:`, notification.resourceData.id);
        break;
      case 'deleted':
        console.log(`${type} item deleted:`, notification.resourceData.id);
        break;
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeSubscriptions: activeSubscriptions.size,
    subscriptions: Array.from(activeSubscriptions.values()).map(sub => ({
      id: sub.id,
      resource: sub.resource,
      expirationDateTime: sub.expirationDateTime
    }))
  });
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('Cleaning up subscriptions...');
  
  const cleanupPromises = Array.from(activeSubscriptions.keys()).map(subscriptionId => {
    return new Promise((resolve) => {
      sharepoint.notifications.delete(subscriptionId, (err) => {
        if (err) {
          console.error(`Failed to delete subscription ${subscriptionId}:`, err);
        } else {
          console.log(`Deleted subscription ${subscriptionId}`);
        }
        resolve();
      });
    });
  });
  
  Promise.all(cleanupPromises).then(() => {
    console.log('Cleanup complete');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
```

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `notifications.subscribe(listId, options, callback)` | Create a new webhook subscription |
| `GET` | `notifications.list(callback)` | List all active subscriptions |
| `PATCH` | `notifications.update(subscriptionId, updates, callback)` | Update an existing subscription |
| `DELETE` | `notifications.delete(subscriptionId, callback)` | Delete a subscription |

## Notes

1. **HTTPS Required**: Webhook notification URLs must use HTTPS
2. **Validation**: SharePoint will validate your webhook endpoint before creating subscriptions
3. **Expiration**: Subscriptions have a maximum lifetime and must be renewed
4. **Rate Limits**: Be aware of SharePoint's rate limiting policies
5. **Client State**: Use client state to verify notification authenticity
6. **Error Handling**: Always implement proper error handling for webhook failures

## Support

For issues or questions about the notification APIs, please refer to the main SharePoint Connector documentation or create an issue in the GitHub repository.