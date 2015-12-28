var async = require('async'),
  _ = require('underscore');

module.exports = function(client) {
  var doRequest = require('../util/doRequest')(client),
    urlBuilder = require('../util/urlBuilderTools'),
    conveniences,
    crudl = {
      // We're the only one calling this function, so relatively safe in our params
      list: function(listId, cb) {
        // var host = client.BASE_LIST_URL + "(guid'" + listId + "')" + "/Items";
        var host = client.BASE_LIST_URL +  "/getByTitle('" + listId + "')" + "/Items";

        //FieldValuesAsText is not supported here by Sharepoint, Append filterFields
        // and / or selectFields  and / or expandFields to host
        host = urlBuilder.augmentURL(host, false, client.filterFields, client.selectFields, client.expandFields,client.orOperator);

        //console.log('list Items URL ' + host);
        return doRequest(host, function(err, items) {
          if (err) {
            return cb(err);
          }
          items = conveniences('ListItems', items, listId);
          return cb(null, items);
        });
      },
      currentuser: function(filter, cb) {
      //console.log("i am in ");
      //console.log("Client Object in litsItems.js -->",client);
      //var baseString = client.BASE_CURRENTUSER;
      //console.log("base string "+baseString);
      var host = client.BASE_LIST_URL.substring(0,client.BASE_LIST_URL.indexOf('_api/'))+"_api/web/currentuser?$filter="+filter;
      return doRequest(host, function(err, response) {
        if (err) {
          return cb(err);
        }
        //console.log("currentUser"+response);
        return cb(null, response);
      });
    },
      byteStream: function(floderName, filename, cb) {
        var host = client.BASE_LIST_URL.substring(0,client.BASE_LIST_URL.indexOf('_api/'))+ "/_api/web/GetFolderByServerRelativeUrl('" + floderName + "')/Files('" + filename + "')/openbinarystream";
        return doRequest(host, function(err, items) {
          if (err) {
            return cb(err);
          }
          return cb(null, items);
        });
      },
      read: function(listId, itemId, cb) {
        if (!listId || !itemId) {
          return cb('Error reading - unspecified listId or itemId');
        }
 
        // var host = client.BASE_LIST_URL + "(guid'" + listId + "')" + "/Items(" + itemId + ")",
        var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')"+ "/Items(" + itemId + ")",
          fileHost = host + '/File';

        //Append fieldValuesAsText (filters are not supported by Sharepoint at the item level)
        // and / or selectFields  and / or expandFields to host 
        host = urlBuilder.augmentURL(host, client.fieldValuesAsText, null, client.selectFields, client.expandFields,client.orOperator);
       // console.log('read Items URL ' + host);

        async.parallel({
          item: async.apply(doRequest, host),
          file: async.apply(doRequest, fileHost)
        }, function(err, response) {
          if (err) {
            return cb(err);
          }
          var item = response.item;
          item.File = response.File;

          item = conveniences('ListItem', item, listId);
          return cb(null, item);
        });
      },
      create: function(listId, listItem, cb) {
        if (!listId || !listItem) {
          return cb('No list or listItem specifided');
        }

        // var host = client.BASE_LIST_URL + "(guid'" + listId + "')" + "/Items";
        var host = client.BASE_LIST_URL +  "/getByTitle('" + listId + "')" + "/Items";
        
        listItem = _.extend({
          "__metadata": {
            "type": "SP.List"
          }
        }, listItem);
        return doRequest({
          url: host,
          method: 'POST',
          json: listItem,
          headers: {
            'X-RequestDigest': client.baseContext,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'POST'
          }
        }, function(err, createResult) {
          if (err) {
            return cb(err);
          }
          createResult = conveniences('ListItem', createResult, listId);
          return cb(null, createResult);
        });
      },
      update: function(listId, listItem, cb) {
        if (!listId || !listItem) {
          return cb('No list or listItem specifided');
        }
        doRequest({
          url: client.BASE_LIST_URL.substring(0,client.BASE_LIST_URL.indexOf('_api/'))+ '_api/contextinfo',
          method: 'POST',
          json: listItem,
          headers: {
            // 'X-RequestDigest': client.baseContext,
            'IF-MATCH': '*',
            'content-Type': 'application/json;odata=verbose'
              // 'X-HTTP-Method': 'MERGE'
          }
        }, function(err, digestToekn) {
          if (err) {
          //  console.log("error in digest call", digestToekn);
            return cb(err);
          } else {
//console.log("digestToekn  --> ",digestToekn);
            //console.log('**listId: ' + listId);
            //console.log('**listItem: ' + JSON.stringify(listItem));

            //console.log("----> client.BASE_LIST_URL", client.BASE_LIST_URL);

            // var host = client.BASE_LIST_URL + "(guid'" + listId + "')" + "/Items(" + listItem.itemId + ")";
            var host = client.BASE_LIST_URL +  "/getByTitle('" + listId + "')" + "/Items(" + listItem.itemId + ")";
           // delete listItem.itemID;
           // console.log("client.baseContext in listsItem.js-->", client.baseContext);

            listItem = _.extend({
              "__metadata": {
                "type": "SP.FieldStringValues"
              }
            }, listItem);
            return doRequest({
              url: host,
              method: 'POST',
              json: listItem,
              headers: {
                'X-RequestDigest': digestToekn.GetContextWebInformation?digestToekn.GetContextWebInformation.FormDigestValue:"",
                'IF-MATCH': '*',
                'content-Type': 'application/json;odata=verbose',
                'X-HTTP-Method': 'MERGE'
              }
            }, function(err, updateResult) {
              if (err) {
                return cb(err);
              }
             // updateResult = conveniences('ListItem', updateResult, listId);
              return cb(null, {"status": " Updated successfully","msg":updateResult});
            });
          }
        });




      },
      del: function(listId, itemId, cb) {
        if (!listId || !itemId) {
          return cb('Error deleting - unspecified listId or itemId');
        }

        // var host = client.BASE_LIST_URL + "(guid'" + listId + "')" + "/Items(" + itemId + ")";
        var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items(" + itemId + ")";
        return doRequest({
          url: host,
          method: 'POST',
          headers: {
            'X-RequestDigest': client.baseContext,
            'IF-MATCH': '*',
            'X-HTTP-Method': 'DELETE'
          }
        }, function(err, createResult) {
          if (err) {
            return cb(err);
          }
          return cb(null, createResult);
        });
      }
    };
  crudl['delete'] = crudl.del;
  conveniences = require('../util/conveniences')(crudl);
  return crudl;
};
