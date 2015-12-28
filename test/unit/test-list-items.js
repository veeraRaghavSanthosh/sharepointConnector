exports.test_list_items = require('../integration/test-list-items').test_list_items;
var listApis = require('../fixtures/apis').list(),
listItemsApis = require('../fixtures/apis').listitems();

exports.after = function(finish){
  listApis.done();
  listItemsApis.done();
  return finish();
};
