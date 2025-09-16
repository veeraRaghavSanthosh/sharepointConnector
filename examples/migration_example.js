/**
 * Example: Running SharePoint Migrations
 * 
 * This example demonstrates how to use the SharePoint migration system
 * to add fields to lists and backfill existing data.
 */

var sharepoint = require('../sharepointconnector');

// SharePoint configuration
var config = {
  username: process.env.SP_USERNAME || 'your-username',
  password: process.env.SP_PASSWORD || 'your-password',
  url: process.env.SP_HOST || 'https://your-sharepoint.com',
  type: process.env.SP_AUTH_TYPE || 'basic'
};

// Create SharePoint client
var sp = sharepoint(config);

console.log('SharePoint Migration Example');
console.log('============================');

// Login and run migration example
sp.login(function(err) {
  if (err) {
    console.error('Failed to login to SharePoint:', err.message);
    return;
  }
  
  console.log('✓ Connected to SharePoint');
  
  // Example 1: Check if a field exists
  console.log('\\n1. Checking if legacy_id field exists in orders list...');
  sp.migrations.fieldExists('orders', 'legacy_id', function(err, exists) {
    if (err) {
      console.error('Error checking field:', err.message);
      return;
    }
    
    console.log('   Field exists:', exists);
    
    if (!exists) {
      // Example 2: Add a field to a list
      console.log('\\n2. Adding legacy_id field to orders list...');
      
      var fieldConfig = {
        Title: 'legacy_id',
        FieldTypeKind: 2, // Text field
        Description: 'Legacy identifier for orders migrated from previous system',
        Required: false,
        MaxLength: 50,
        DefaultValue: ''
      };
      
      sp.migrations.addField('orders', fieldConfig, function(err, result) {
        if (err) {
          console.error('Error adding field:', err.message);
          return;
        }
        
        console.log('✓ Field added successfully');
        
        // Example 3: Backfill existing items
        console.log('\\n3. Backfilling existing items with legacy IDs...');
        
        function generateLegacyId(item) {
          var timestamp = new Date(item.Created || new Date()).getTime();
          var hash = require('crypto')
            .createHash('md5')
            .update(item.Id.toString() + (item.Title || ''))
            .digest('hex')
            .substring(0, 8);
          
          return 'LEGACY-' + timestamp + '-' + hash.toUpperCase();
        }
        
        sp.migrations.backfillField('orders', 'legacy_id', generateLegacyId, function(err, result) {
          if (err) {
            console.error('Error backfilling field:', err.message);
            return;
          }
          
          console.log('✓ Backfill completed');
          console.log('   Items updated:', result.updated);
          
          runCompleteExamples();
        });
      });
    } else {
      runCompleteExamples();
    }
  });
  
  function runCompleteExamples() {
    // Example 4: Run a complete migration
    console.log('\\n4. Running complete migration example...');
    
    var fieldConfig = {
      Title: 'example_field',
      FieldTypeKind: 2,
      Description: 'Example field for demonstration',
      Required: false,
      MaxLength: 100,
      DefaultValue: 'Default Value'
    };
    
    function generateExampleValue(item) {
      return 'EXAMPLE-' + item.Id + '-' + new Date().getTime();
    }
    
    sp.migrations.runMigration('orders', fieldConfig, generateExampleValue, function(err, result) {
      if (err) {
        console.error('Error running migration:', err.message);
        return;
      }
      
      console.log('✓ Complete migration finished');
      console.log('   Field added:', result.fieldAdded);
      console.log('   Field already existed:', result.fieldExists);
      console.log('   Items updated:', result.backfillResult.updated);
      
      // Example 5: Run the legacy ID migration using the migration file
      console.log('\\n5. Running legacy ID migration from file...');
      
      var migrationPath = require('path').join(__dirname, '../migrations/001_add_legacy_id_to_orders.js');
      
      sp.migrationRunner.runMigration(migrationPath, function(err, result) {
        if (err) {
          console.error('Error running migration file:', err.message);
          return;
        }
        
        console.log('✓ Migration file executed successfully');
        console.log('   Result:', JSON.stringify(result, null, 2));
        
        console.log('\\n============================');
        console.log('Migration examples completed!');
      });
    });
  }
});

// Handle process termination
process.on('SIGINT', function() {
  console.log('\\nExiting...');
  process.exit(0);
});

process.on('uncaughtException', function(err) {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});