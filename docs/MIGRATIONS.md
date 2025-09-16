# SharePoint Migrations

This document describes the migration system for SharePoint list schema changes in the SharePoint Connector library.

## Overview

The migration system allows you to programmatically:
- Add fields (columns) to SharePoint lists
- Backfill existing list items with new data
- Run complete migrations with rollback support
- Manage schema changes in a controlled, repeatable way

## Components

### 1. Migration System Core (`lib/migrations/index.js`)

The core migration system provides the following methods:

- `addField(listId, fieldConfig, callback)` - Add a field to a SharePoint list
- `fieldExists(listId, fieldName, callback)` - Check if a field exists in a list
- `backfillField(listId, fieldName, valueGenerator, callback)` - Backfill existing items
- `runMigration(listId, fieldConfig, valueGenerator, callback)` - Run complete migration

### 2. Migration Runner (`lib/migrations/runner.js`)

The migration runner manages migration execution:

- `runMigration(migrationPath, callback)` - Run a specific migration file
- `rollbackMigration(migrationPath, callback)` - Rollback a migration
- `runAllMigrations(migrationsDir, callback)` - Run all migrations in a directory

### 3. CLI Tool (`bin/migrate.js`)

Command-line interface for running migrations:

```bash
# Run a specific migration
node bin/migrate.js up migrations/001_add_legacy_id_to_orders.js

# Rollback a migration
node bin/migrate.js down migrations/001_add_legacy_id_to_orders.js

# Run all pending migrations
node bin/migrate.js run-all
```

## Creating Migrations

### Migration File Structure

Each migration should be a JavaScript module with the following structure:

```javascript
module.exports = {
  name: 'migration_name',
  description: 'Description of what this migration does',
  
  up: function(sharepoint, callback) {
    // Migration logic here
    callback(null, result);
  },
  
  down: function(sharepoint, callback) {
    // Rollback logic here
    callback(null, result);
  }
};
```

### Example Migration

Here's the legacy ID migration as an example:

```javascript
var crypto = require('crypto');

module.exports = {
  name: 'add_legacy_id_to_orders',
  description: 'Add legacy_id column to orders list and backfill existing rows',
  
  up: function(sharepoint, callback) {
    var migrations = require('../lib/migrations')(sharepoint);
    
    var fieldConfig = {
      Title: 'legacy_id',
      FieldTypeKind: 2, // Text field
      Description: 'Legacy identifier for orders',
      Required: false,
      MaxLength: 50,
      DefaultValue: ''
    };
    
    function generateLegacyId(item) {
      var timestamp = new Date(item.Created || new Date()).getTime();
      var hash = crypto.createHash('md5')
        .update(item.Id.toString() + (item.Title || ''))
        .digest('hex')
        .substring(0, 8);
      
      return 'LEGACY-' + timestamp + '-' + hash.toUpperCase();
    }
    
    migrations.runMigration('orders', fieldConfig, generateLegacyId, callback);
  },
  
  down: function(sharepoint, callback) {
    // Remove the field
    var doRequest = require('../lib/util/doRequest')(sharepoint);
    var host = sharepoint.BASE_LIST_URL + "/getByTitle('orders')/Fields/getByInternalNameOrTitle('legacy_id')";
    
    doRequest({
      url: host,
      method: 'POST',
      headers: {
        'X-RequestDigest': sharepoint.baseContext,
        'IF-MATCH': '*',
        'X-HTTP-Method': 'DELETE'
      }
    }, callback);
  }
};
```

## Field Types

When creating fields, use the appropriate `FieldTypeKind` value:

- `2` - Text (single line)
- `3` - Note (multiple lines)
- `4` - DateTime
- `8` - Boolean
- `9` - Number
- `10` - Currency
- `11` - URL
- `12` - Computed
- `17` - Counter
- `18` - Choice
- `19` - Lookup
- `20` - User

## Usage Examples

### Basic Usage

```javascript
var sharepoint = require('sharepointconnector')({
  username: 'user@domain.com',
  password: 'password',
  url: 'https://your-sharepoint.com',
  type: 'online'
});

sharepoint.login(function(err) {
  if (err) throw err;
  
  // Add a field
  var fieldConfig = {
    Title: 'custom_field',
    FieldTypeKind: 2,
    Description: 'A custom field',
    Required: false
  };
  
  sharepoint.migrations.addField('MyList', fieldConfig, function(err, result) {
    console.log('Field added:', result);
  });
});
```

### Running Migrations Programmatically

```javascript
sharepoint.login(function(err) {
  if (err) throw err;
  
  // Run a specific migration
  sharepoint.migrationRunner.runMigration('./migrations/001_add_legacy_id_to_orders.js', function(err, result) {
    console.log('Migration completed:', result);
  });
  
  // Run all migrations
  sharepoint.migrationRunner.runAllMigrations('./migrations', function(err, result) {
    console.log('All migrations completed:', result);
  });
});
```

## Environment Setup

For CLI usage, set these environment variables:

```bash
export SP_USERNAME="your-username"
export SP_PASSWORD="your-password"
export SP_HOST="https://your-sharepoint.com"
export SP_AUTH_TYPE="online"  # or ntlm, basic, onlinesaml
```

## Best Practices

1. **Naming Convention**: Use numbered prefixes for migrations (e.g., `001_`, `002_`)
2. **Descriptive Names**: Use clear, descriptive names for migration files
3. **Test Migrations**: Always test migrations in a development environment first
4. **Rollback Support**: Always implement the `down` method for rollback capability
5. **Batch Processing**: For large datasets, process items in batches to avoid API limits
6. **Error Handling**: Include proper error handling and logging
7. **Idempotent**: Make migrations idempotent (safe to run multiple times)

## Troubleshooting

### Common Issues

1. **Field Already Exists**: The migration system checks for existing fields and skips creation if they exist
2. **Permission Errors**: Ensure the SharePoint user has sufficient permissions to modify list schemas
3. **API Limits**: Large backfill operations are processed in batches to avoid SharePoint API limits
4. **Authentication**: Verify SharePoint credentials and authentication type are correct

### Debugging

Enable verbose logging by setting the `verbose` option when creating the SharePoint client:

```javascript
var sharepoint = require('sharepointconnector')({
  // ... other config
  verbose: true
});
```

## Testing

The migration system includes comprehensive unit and integration tests:

```bash
# Run unit tests
npm test

# Run integration tests (requires SharePoint environment)
grunt integration
```

Unit tests use mocked SharePoint responses, while integration tests require actual SharePoint credentials.