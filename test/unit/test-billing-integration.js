/**
 * Unit test wrapper for billing integration tests
 * Follows the existing test pattern in the SharePoint connector
 */

// Import the integration tests
module.exports = require('../integration/test-billing-integration');

// Add cleanup
exports.after = function(finish) {
  // Any cleanup needed after tests
  return finish();
};