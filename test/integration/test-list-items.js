var assert = require('assert'),
testListget = require('./test-list-get');

exports.test_list_items = function(done){
  testListget.it_should_login_and_retrieve_lists(function(err, singleListResult){
    assert.ok(!err);
    var singleItem = singleListResult.Items[0];
    assert.ok(singleItem, 'No item found in result items - cant continue testing');
    singleItem.read(function(err, singleItemReadResult) {
      assert.ok(!err, 'Error reading item in list: ' + JSON.stringify(err));
      assert.ok(singleItemReadResult, 'No singleItemReadResult found');    
      // Now test both code paths for creating an item in a list
      
      singleListResult.createItem({ Title : 'test' }, function(err, listItemCreateRes){
        assert.ok(!err, 'Error creating item in list: ' + JSON.stringify(err));
        assert.ok(listItemCreateRes, 'No listItemCreateRes found');  
        singleItem.del(function(err){
          assert.ok(!err, 'Error deleting item in list: ' + JSON.stringify(err));
          singleListResult.Items.create({Title : 'foo'}, function(err, listItemCreateRes){
            assert.ok(!err, 'Error creating item in list: ' + JSON.stringify(err));
            assert.ok(listItemCreateRes, 'No listItemCreateRes found');
            return done();
          });
        });  
      });
    });
  });
};
