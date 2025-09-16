# SharePoint Legacy ID Migration

This migration adds a `legacy_id` field to SharePoint lists and backfills existing items with generated legacy IDs. This is useful for maintaining references to legacy system identifiers during data migration processes.

## What This Migration Does

1. **Adds a new field**: Creates a `legacy_id` text field in the specified SharePoint list
2. **Backfills existing items**: Updates all existing list items with generated legacy IDs
3. **Handles duplicates**: Skips items that already have a legacy_id value
4. **Batch processing**: Processes items in batches to avoid overwhelming SharePoint

## Field Specification

- **Field Name**: `legacy_id`
- **Display Name**: Legacy ID
- **Type**: Text (Single line)
- **Max Length**: 50 characters
- **Required**: No
- **Unique**: No

## Legacy ID Format

Generated legacy IDs follow the pattern: `LEGACY_[ItemId]_[Timestamp]`

Example: `LEGACY_123_1640995200000`

## Usage

### Method 1: Using the Migration Runner Script

```bash
# Set environment variables
export SP_USERNAME="your-username"
export SP_PASSWORD="your-password" 
export SP_HOST="https://your-sharepoint-site.com"
export SP_AUTH_TYPE="ntlm"  # or basic, online, onlinesaml

# Run migration for "Orders" list (default)
node scripts/run-legacy-id-migration.js

# Run migration for a specific list
node scripts/run-legacy-id-migration.js "CustomListName"
```

### Method 2: Using the API Directly

```javascript
var sharepointconnector = require('sharepointconnector');

var sharepoint = sharepointconnector({
  username: 'your-username',
  password: 'your-password',
  url: 'https://your-sharepoint-site.com',
  type: 'ntlm'
});

sharepoint.login(function(err) {
  if (err) return console.error(err);
  
  // Run complete migration
  sharepoint.migrations.addLegacyIdField.run('Orders', function(err, results) {
    if (err) return console.error(err);
    console.log('Migration completed:', results);
  });
  
  // Or run individual steps
  
  // Add field only
  sharepoint.migrations.addLegacyIdField.addField('Orders', function(err, result) {
    // Handle result
  });
  
  // Backfill only (assumes field already exists)
  sharepoint.migrations.addLegacyIdField.backfill('Orders', function(err, result) {
    // Handle result
  });
});
```

## Migration Results

The migration returns detailed results:

```javascript
{
  fieldCreation: {
    status: 'created',  // or 'exists' if field already exists
    field: { /* SharePoint field object */ }
  },
  backfill: {
    status: 'completed',
    updated: 150,      // Number of items updated
    skipped: 5,        // Number of items skipped (already had legacy_id)
    total: 155         // Total number of items processed
  }
}
```

## Error Handling

The migration includes comprehensive error handling:

- **Authentication errors**: Clear messages if login fails
- **List not found**: Validates that the target list exists
- **Field conflicts**: Gracefully handles existing fields
- **Item update failures**: Logs individual item failures without stopping the process
- **SharePoint API limits**: Uses batch processing to respect API limits

## Rollback

To remove the legacy_id field (rollback):

1. Navigate to your SharePoint list settings
2. Go to "List Settings" → "Columns"
3. Click on "Legacy ID" column
4. Click "Delete" button
5. Confirm deletion

**Note**: This will permanently remove all legacy_id values. Make sure to backup data if needed.

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify SP_USERNAME, SP_PASSWORD, and SP_HOST environment variables
   - Check that SP_AUTH_TYPE matches your SharePoint setup
   - Ensure the user has permissions to modify list schema

2. **List Not Found**
   - Verify the list name is spelled correctly (case-sensitive)
   - Ensure the list exists in the target SharePoint site
   - Check that the user has access to the list

3. **Permission Denied**
   - User needs "Manage Lists" permission to add fields
   - User needs "Edit Items" permission to update existing items
   - Contact SharePoint administrator if needed

4. **Field Already Exists**
   - This is normal - the migration will skip field creation and proceed to backfill
   - If you need to recreate the field, delete it manually first

### Debug Mode

Enable verbose logging by setting environment variable:

```bash
export SP_DEBUG=true
node scripts/run-legacy-id-migration.js
```

## Files Created/Modified

This migration adds the following files:

- `lib/migrations/add-legacy-id-field.js` - Main migration logic
- `scripts/run-legacy-id-migration.js` - Command-line runner script
- `MIGRATION_README.md` - This documentation

And modifies:

- `lib/client.js` - Adds migration support to the main client

## Technical Details

### SharePoint REST API Calls

1. **Add Field**: `POST /_api/web/lists/getByTitle('ListName')/Fields`
2. **Get Items**: `GET /_api/web/lists(guid'list-id')/Items`
3. **Update Items**: `POST /_api/web/lists/getByTitle('ListName')/Items(itemId)` with MERGE method

### Batch Processing

Items are processed in batches of 5 concurrent requests to avoid overwhelming SharePoint's API limits.

### Field Definition

The legacy_id field is created as a SharePoint Text field with these specifications:

```javascript
{
  __metadata: { type: 'SP.FieldText' },
  Title: 'Legacy ID',
  FieldTypeKind: 2,  // Text field
  Required: false,
  EnforceUniqueValues: false,
  MaxLength: 50,
  StaticName: 'legacy_id',
  InternalName: 'legacy_id',
  Description: 'Legacy system identifier for migration purposes'
}
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review SharePoint permissions
3. Verify environment variables are set correctly
4. Check SharePoint server logs for detailed error messages