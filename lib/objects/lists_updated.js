var _ = require('underscore'),
async = require('async');

module.exports = function(client) {
  var doRequest = require('../util/doRequest')(client),
  listItems = require('./listItems')(client),
  urlBuilder = require('../util/urlBuilderTools'),
  logger = require('../util/logger')(client),
  conveniences;

  var crudl = {
    readOrList: function(params, cb) {
      var startTime = Date.now();
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

      // Log the operation start
      logger.operation('LIST', isReadOperation ? 'READ' : 'LIST', {
        guid: guid,
        name: name,
        isReadOperation: isReadOperation
      });

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
      
      logger.trace('LIST_URL', 'Generated SharePoint list URL', {
        baseUrl: host,
        fieldsUrl: fieldsHost,
        filters: client.filterFields,
        selects: client.selectFields,
        expands: client.expandFields
      });
      
      if (!isReadOperation) {
        return doRequest(host, function(err, lists) {
          if (err) {
            logger.error('LIST', 'Failed to list SharePoint lists', { error: err, duration: Date.now() - startTime });
            return cb(err);
          }
          
          lists = conveniences('Lists', lists);
          logger.timing('LIST.LIST', startTime, { 
            listCount: lists && lists.length ? lists.length : 0,
            url: host 
          });
          return cb(null, lists);
        });
      }
      
      return async.parallel({
        List: async.apply(doRequest, host),
        Fields: async.apply(doRequest, fieldsHost),
        Items: async.apply(listItems.list, guid)
      }, function(err, combinedReadResult) {
        if (err) {
          logger.error('LIST', 'Failed to read SharePoint list', { 
            error: err, 
            guid: guid,
            name: name,
            duration: Date.now() - startTime 
          });
          return cb(err);
        }

        var list = combinedReadResult.List;
        list.Fields = combinedReadResult.Fields;
        list.Items = combinedReadResult.Items;
        list = conveniences('List', list);

        logger.timing('LIST.READ', startTime, {
          listId: guid || name,
          fieldCount: list.Fields && list.Fields.length ? list.Fields.length : 0,
          itemCount: list.Items && list.Items.length ? list.Items.length : 0,
          listTitle: list.Title
        });

        return cb(null, list);
      });
    },
    
    create: function(params, cb) {
      var startTime = Date.now();
      var title, description;
      title = params.title || params.Title;
      description = params.description || params.Description || '';
      
      logger.operation('LIST', 'CREATE', {
        title: title,
        description: description
      });
      
      if (!title) {
        logger.error('LIST', 'Create operation missing required title parameter');
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
          logger.error('LIST', 'Failed to create SharePoint list', { 
            error: err, 
            title: title,
            duration: Date.now() - startTime 
          });
          return cb(err);
        }
        
        logger.timing('LIST.CREATE', startTime, {
          title: title,
          listId: listCreateResult && listCreateResult.Id ? listCreateResult.Id : 'unknown'
        });
        
        return cb(null, listCreateResult);
      });
    },
    
    del: function(params, cb) {
      var startTime = Date.now();
      if (!params || _.isFunction(params)) {
        logger.error('LIST', 'Delete operation called without required parameters');
        return cb('Delete operations need an Id and callback');
      }

      var host = client.BASE_LIST_URL,
        guid;
      if (_.isString(params)) {
        guid = params;
      } else {
        guid = params.guid || params.Guid || params.id || params.Id;
      }
      
      logger.operation('LIST', 'DELETE', { guid: guid });
      
      if (!guid) {
        logger.error('LIST', 'Delete operation missing required GUID parameter');
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
          logger.error('LIST', 'Failed to delete SharePoint list', { 
            error: err, 
            guid: guid,
            duration: Date.now() - startTime 
          });
          return cb(err);
        }
        
        logger.timing('LIST.DELETE', startTime, { guid: guid });
        return cb(null, listCreateResult);
      });

    },
    
    update: function(id, updated, cb) {
      var startTime = Date.now();
      
      if (_.isFunction(updated)) {
        cb = updated;
        updated = id;
        id = updated.Id || updated.guid || updated.Guid || updated.id;
        // Ensure our updated object has appropriate Id object set
        updated.Id = id;
      }

      logger.operation('LIST', 'UPDATE', {
        id: id,
        updateFields: updated ? Object.keys(updated) : []
      });

      if (!id || !_.isObject(updated) || arguments.length < 2) {
        logger.error('LIST', 'Update operation missing required parameters');
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
          logger.error('LIST', 'Failed to update SharePoint list', { 
            error: err, 
            id: id,
            duration: Date.now() - startTime 
          });
          return cb(err);
        }
        
        logger.timing('LIST.UPDATE', startTime, { 
          id: id,
          updatedFields: Object.keys(updated)
        });
        
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