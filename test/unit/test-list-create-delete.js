var setupHelpers = require('../../tests/setup.test'),
intTest = require('../integration/test-list-create-delete');

// Use the refactored helper to create unit test module with proper cleanup
module.exports = setupHelpers.createUnitTestModule(
  intTest, 
  function() { return setupHelpers.createApiMock('create'); }
);
