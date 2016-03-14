var assert = require('assert');
var idToDelete;

var sharepoint = require('../../sharepointconnector.js')({
  username: process.env.SP_USERNAME,
  password: process.env.SP_PASSWORD,
  type: process.env.SP_AUTH_TYPE,
  url: process.env.SP_HOST,
  context : process.env.SP_CONTEXT || 'web',
  strictSSL: false
});

exports.it_should_create_and_delete_lists = function(done) {
  sharepoint.login(function(err) {
    assert.ok(!err, 'Error logging in: ' + JSON.stringify(err));
    sharepoint.lists.create({
      title: 'mynewlisttester2'
    }, function(err, createRes) {
      assert.ok(!err, 'Error on creating list: ' + err);
      assert.ok(createRes, 'No create result found: ' + createRes);
      idToDelete = createRes.Id;
      return sharepoint.lists.update(createRes.Id, {
        Title: 'MyNewTitle'
      }, function(err, updateResult) {
        if (err) {
          console.log('List update error');
          console.log(err);
        }
        assert.ok(!err, 'Error on updating list: ' + err);
        assert.ok(updateResult, 'No update result found: ' + updateResult);

        sharepoint.lists.del(idToDelete, function(err) {
          assert.ok(!err, 'Error on deleting list: ' + err);
          // we've successfully cleaned up - no need to do it later
          idToDelete = false;
          return done();
        });
      });
    });
  });
};


exports.after = function(done) {
  if (!idToDelete) {
    // No tidy up needed
    return done();
  }
  sharepoint.lists.del(idToDelete, function(err) {
    assert.ok(!err, 'Error deleting list in cleanup: ' + JSON.stringify(err));
    return done();
  });
};
