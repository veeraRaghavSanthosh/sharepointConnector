var setupHelpers = require('../../tests/setup.test'),
intTest = require('../integration/test-list-items');

// Export the specific test function
exports.test_list_items = intTest.test_list_items;

// Use the refactored helper with multiple API instances
var testModule = setupHelpers.createUnitTestModule(
  intTest,
  [
    function() { return setupHelpers.createApiMock('list'); },
    function() { return setupHelpers.createApiMock('listitems'); }
  ]
);

// Apply the after hook to exports
exports.after = testModule.after;
