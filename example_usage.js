/**
 * Example usage of SharePoint Connector with enhanced logging
 * This demonstrates the new logging capabilities while maintaining backward compatibility
 */

var sharepoint = require('./sharepointconnector');

// Example 1: Using the new logLevel configuration
console.log('=== Example 1: Using logLevel configuration ===');
var clientWithTrace = sharepoint({
  username: 'test@example.com',
  password: 'testpassword',
  url: 'https://example.sharepoint.com',
  type: 'basic',
  logLevel: 'trace' // New logging configuration
});

// Example 2: Backward compatibility - using verbose flag (maps to debug level)
console.log('\n=== Example 2: Backward compatibility with verbose flag ===');
var clientWithVerbose = sharepoint({
  username: 'test@example.com', 
  password: 'testpassword',
  url: 'https://example.sharepoint.com',
  type: 'basic',
  verbose: true // Existing verbose flag still works
});

// Example 3: Default logging (info level)
console.log('\n=== Example 3: Default logging level (info) ===');
var clientDefault = sharepoint({
  username: 'test@example.com',
  password: 'testpassword', 
  url: 'https://example.sharepoint.com',
  type: 'basic'
  // No logging configuration - uses default 'info' level
});

// Example 4: Environment variable configuration
console.log('\n=== Example 4: Environment variable configuration ===');
// Set environment variable: SHAREPOINT_LOG_LEVEL=debug
process.env.SHAREPOINT_LOG_LEVEL = 'debug';
var clientWithEnv = sharepoint({
  username: 'test@example.com',
  password: 'testpassword',
  url: 'https://example.sharepoint.com', 
  type: 'basic'
  // Will use 'debug' level from environment variable
});

console.log('\n=== Logging Configuration Examples ===');
console.log('Available log levels: error, warn, info, debug, trace');
console.log('Configuration options:');
console.log('1. logLevel: "trace" - Explicit log level');
console.log('2. verbose: true - Backward compatible (maps to debug)');
console.log('3. SHAREPOINT_LOG_LEVEL env var - System-wide setting');
console.log('4. Default: info level');

// Example of what the logs would look like (commented out to avoid actual execution)
/*
clientWithTrace.login(function(err) {
  if (err) {
    console.error('Login failed:', err);
    return;
  }
  
  console.log('Login successful!');
  
  // This would trigger user-service logging
  clientWithTrace.listItems.currentuser('Id eq 1', function(err, user) {
    if (err) {
      console.error('Failed to get current user:', err);
      return;
    }
    
    console.log('Current user:', user);
  });
});
*/

console.log('\n=== Expected Log Output Examples ===');
console.log('With logLevel: "trace":');
console.log('[2025-09-16T...] [TRACE] [login] login() called { authType: "basic", username: "tes***", ... }');
console.log('[2025-09-16T...] [DEBUG] [auth.basic] Making basic auth request { url: "...", method: "post", ... }');
console.log('[2025-09-16T...] [INFO] [login] Authentication successful { authType: "basic", username: "tes***" }');
console.log('[2025-09-16T...] [TRACE] [listItems] currentuser() called { filter: "Id eq 1" }');
console.log('[2025-09-16T...] [DEBUG] [listItems] Successfully retrieved current user information { userId: 1, ... }');

console.log('\nWith logLevel: "error":');
console.log('(Only error messages would be shown)');

console.log('\nWith verbose: true (backward compatible):');
console.log('[2025-09-16T...] [DEBUG] [login] Authentication type validated { authType: "basic" }');
console.log('(Debug and higher priority messages would be shown)');