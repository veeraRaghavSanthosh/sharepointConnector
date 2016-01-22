var _ = require('underscore'),
async = require('async');

module.exports = function(client) {
  var doRequest = require('../util/doRequest')(client),
  listItems = require('./listItems')(client),
  urlBuilder = require('../util/urlBuilderTools'),
  conveniences;

  var crudl = {
    readOrList: function(params, cb) {
      var isReadOperation = true,
      guid, name, host, fieldsHost;
      if (_.isFunction(params)) {
        cb = params;
        params = undefined;
        isReadOperation = false;
      } else {
        guid = params.guid || params.id || params.Guid || params.Id;
        name = params.name || params.title || params.Name || params.Title;
      }

      host = client.BASE_LIST_URL;
      if (_.isString(params)) {
        guid = params;
      }

      // Spot the pattern! Yep, you got it - there isn't really one. Thanks, MSFT.
      if (guid) {
        // I have no idea why GUID follows some semblence of oData protocol..
        host += "(guid'" + guid + "')";
      } else if (name) {
        // by by name just ignores it. WTF is filter doing where the resource name should be. Bro, you don't even REST.
        host += "/getbytitle('" + name + "')";
      }

      //Don't mess with fieldsHost
      fieldsHost = host + '/Fields';

      // FieldValuesAsText is not supported here by Sharepoint, Append filterFields
      // and / or selectFields  and /or expandFields to host
      host = urlBuilder.augmentURL(host, false, client.filterFields, client.selectFields, client.expandFields,client.orOperator,client.andOrOperator);
      //console.log('read List URL ' + host);

      if (!isReadOperation) {
        return doRequest(host, function(err, lists) {
          if (err) {
            return cb(err);
          }
          lists = conveniences('Lists', lists);
          return cb(null, lists);
        });
      }
      //console.log('lists URL ' + host);

      return async.parallel({
        List: async.apply(doRequest, host),
        Fields: async.apply(doRequest, fieldsHost),
        Items: async.apply(listItems.list, guid)
      }, function(err, combinedReadResult) {
        if (err) {
          return cb(err);
        }

        var list = combinedReadResult.List;
        list.Fields = combinedReadResult.Fields;
        list.Items = combinedReadResult.Items;
        list = conveniences('List', list);

        return cb(null, list);
      });
    },
    create: function(params, cb) {
      var title, description;
      title = params.title || params.Title;
      description = params.description || params.Description || '';
      if (!title) {
        return cb('Create requests must specify a title!');
      }
      var listToCreate = {
        __metadata: {
          'type': 'SP.List'
        },
        BaseTemplate: 100,
        Title: title,
        Description: description
      };
      return doRequest({
        json: listToCreate,
        method: 'POST',
        headers: {
          'X-RequestDigest': client.baseContext
        },
        url: client.BASE_LIST_URL
      }, function(err, listCreateResult) {
        if (err) {
          return cb(err);
        }
        return cb(null, listCreateResult);
      });
    },
    del: function(params, cb) {
      if (!params || _.isFunction(params)) {
        return cb('Delete operations need an Id and callback');
      }

      var host = client.BASE_LIST_URL,
        guid;
      if (_.isString(params)) {
        guid = params;
      } else {
        guid = params.guid || params.Guid || params.id || params.Id;
      }
      if (!guid) {
        return cb('Delete operations must specify a list GUID');
      }
      host += "(guid'" + guid + "')";
      return doRequest({
        // POST? But I thought we were deleting?
        method: 'POST',
        headers: {
          'X-RequestDigest': client.baseContext,
          'IF-MATCH': '*',
          // Oh sharepoint you crack me up
          'X-HTTP-Method': 'DELETE'
        },
        url: host
      }, function(err, listCreateResult) {
        if (err) {
          return cb(err);
        }
        return cb(null, listCreateResult);
      });

    },
    update: function(id, updated, cb) {
      if (_.isFunction(updated)) {
        cb = updated;
        updated = id;
        id = updated.Id || updated.guid || updated.Guid || updated.id;
        // Ensure our updated object has appropriate Id object set
        updated.Id = id;
      }

      if (!id || !_.isObject(updated) || arguments.length < 2) {
        return cb('Update operations must at least specify an updated object and a callback');
      }
      var host = client.BASE_LIST_URL + "(guid'" + id + "')",
        listToUpdate = _.extend({
          "__metadata": {
            "type": "SP.List"
          },
          "AllowContentTypes": true,
          "BaseTemplate": 100,
          "ContentTypesEnabled": false
        }, updated);


      return doRequest({
        json: listToUpdate,
        method: 'POST',
        headers: {
          'X-RequestDigest': client.baseContext,
          'X-HTTP-Method': 'MERGE',
          "IF-MATCH": "*"
        },
        url: host
      }, function(err) {
        if (err) {
          return cb(err);
        }
        return cb(null, listToUpdate);
      });
    },
    // A passthru to listItems.js for conveniences.js
    createItem : listItems.create
  };
  crudl['delete'] = crudl.del;
  crudl.list = crudl.readOrList;
  crudl.read = crudl.readOrList;
  //TODO: This is a hacky way to include the convenience functions. Do this better.
  conveniences = require('../util/conveniences')(crudl);
  return crudl;
};
