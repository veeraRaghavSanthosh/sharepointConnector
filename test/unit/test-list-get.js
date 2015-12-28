var apis = require('../fixtures/apis').list();

module.exports = require('../integration/test-list-get');
exports.after = function(finish){
  apis.done();
  return finish();
};
