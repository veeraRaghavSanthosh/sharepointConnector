var setupHelpers = require('../../tests/setup.test'),
intTest = require('../integration/test-list-get');

// Use the refactored helper to create unit test module with proper cleanup
module.exports = setupHelpers.createUnitTestModule(
  intTest,
  function() { return setupHelpers.createApiMock('list'); }
);
