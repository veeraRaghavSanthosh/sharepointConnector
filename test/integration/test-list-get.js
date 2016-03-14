var assert = require('assert'),
_ = require('underscore');

exports.it_should_login_and_retrieve_lists = function(done) {
  var sharepoint = require('../../sharepointconnector.js')({
    username: process.env.SP_USERNAME,
    password: process.env.SP_PASSWORD,
    type: process.env.SP_AUTH_TYPE,
    url: process.env.SP_HOST,
    context : process.env.SP_CONTEXT || 'web',
    strictSSL: false
  });

  sharepoint.login(function(err) {
    assert.ok(!err, 'Error logging in' + JSON.stringify(err));
    sharepoint.lists.list(function(err, listRes) {
      assert.ok(!err, 'Error listing lists: ' + JSON.stringify(err));
      var one = _.find(listRes, function(aListItem) {
        return aListItem.ItemCount && aListItem.ItemCount > 0;
      });
      assert.ok(one, 'Error find list result: ' + listRes);
      one.read(function(err, singleListResult) {
        assert.ok(!err, 'Error reading a list result: ' + JSON.stringify(err));
        assert.ok(singleListResult, 'Error finding response from read result: ' + singleListResult);
        return done(null, singleListResult);
      });
    });
  });
};
