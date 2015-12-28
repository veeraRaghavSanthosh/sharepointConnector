var _ = require('underscore'),
apis = require('../fixtures/apis').create(),
intTest = require('../integration/test-list-create-delete');

module.exports = _.extend(intTest, {
  after : function(finish){
    apis.done();
    return finish();
    //return intTest.after();
  }
});
