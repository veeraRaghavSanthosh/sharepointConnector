var nock = require('nock'),
baseUrl = 'https://www.example.com',
headers = {
  'Content-Type': 'application/json; odata=verbose',
  'Accept': 'application/json; odata=verbose'
},
getreply = function(url) {
  return getfixtures[url] || {};
},
postreply = function(url){
  return postfixtures[url] || {};
},
allowAllRequestBodies = function() {
  return '*';
},
apiBase = '/_api',
contextUrl = apiBase + '/contextinfo',
listsUrl = apiBase + '/web/lists',
// Note the hardcoded URI components we've decoded here %27
listUrl = apiBase + "/web/lists(guid%27698e8de7-37f2-49a9-a49e-fe2d96b4864e%27)",
listFieldsUrl = listUrl + '/Fields',
listItemsUrl = listUrl + '/Items',
listItemUrl = listItemsUrl + '(1)',
listItemFileUrl = listItemUrl + '/File',
postfixtures = {},
getfixtures = {};
postfixtures[contextUrl] = require('./context');
getfixtures[listsUrl] = require('./lists');
getfixtures[listUrl] = require('./list');
getfixtures[listItemsUrl] = require('./listitems');
getfixtures[listFieldsUrl] = require('./listfields');
getfixtures[listItemUrl] = require('./listitem');
getfixtures[listItemFileUrl] = require('./listitemfile');
postfixtures[listsUrl] = require('./list');
postfixtures[listUrl] = require('./list');

exports.list = function(){
  return nock(baseUrl)
  .filteringRequestBody(allowAllRequestBodies)
  .post(contextUrl, '*')
  .reply(200, postreply, headers)
  .get(listsUrl, '*')
  .reply(200, getreply, headers)
  .get(listUrl, '*')
  .reply(200, getreply, headers)
  .get(listItemsUrl, '*')
  .reply(200, getreply, headers)
  .get(listFieldsUrl, '*')
  .reply(200, getreply, headers);
};

exports.create = function(){
  return nock(baseUrl)
  .filteringRequestBody(allowAllRequestBodies)
  .post(contextUrl, '*')
  .reply(200, postreply, headers)
  .post(listsUrl, '*')
  .reply(200, postreply, headers)
  // This is actually the "MERGE" update request
  .post(listUrl, '*')
  .reply(200, postreply, headers)
  // This is actually the DELETE request
  .post(listUrl, '*')
  .reply(200, postreply, headers);
};

exports.listitems = function(){
  return nock(baseUrl)
  .filteringRequestBody(allowAllRequestBodies)
  .get(listItemUrl, '*')
  .reply(200, getreply, headers)
  .get(listItemFileUrl, '*')
  .reply(200, getreply, headers)
  // This represents the delete request
  .post(listItemUrl, '*')
  .reply(200, function(){ return ''; }, headers)
  // this represents the list item create request
  .post(listItemsUrl, '*')
  .times(2)
  .reply(200, getreply, headers);
};
