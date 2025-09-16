var _ = require('underscore'),
async = require('async');
module.exports = function(CRUDL){
  var conveniences = {
    List : function(list){
      list.read = async.apply(CRUDL.read, list.Id);
      list.del = async.apply(CRUDL.del, list.Id);
      list['delete'] = list.del;
      list.update = function(updatedObject, cb){
        return CRUDL.update(list.Id, updatedObject, cb);
      };
      list.createItem = function(newListItem, cb){
        return CRUDL.createItem(list.Id, newListItem, cb);
      };
      return list;
    },
    ListItem : function(listItem, parentId){
      if (!listItem || !listItem.Id || !parentId){
        return listItem;
      }
      listItem.read = async.apply(CRUDL.read, parentId, listItem.Id);
      listItem.del = async.apply(CRUDL.del, parentId, listItem.Id);
      listItem['delete'] = listItem.del;
      return listItem;
    },
    ListItems : function(listItems, parentId){
      // Ensure listItems is always an array to prevent flaky behavior
      if (!Array.isArray(listItems)) {
        listItems = [];
      }
      listItems = _.map(listItems, function(item){
        return conveniences.ListItem(item, parentId);
      });
      listItems.create = function(newListItem, cb){
        return CRUDL.create(parentId, newListItem, cb);
      };
      return listItems;
    },
    Lists : function(lists){
      // Ensure lists is always an array to prevent flaky behavior
      if (!Array.isArray(lists)) {
        lists = [];
      }
      return _.map(lists, conveniences.List);
    },
    Items : function(items){
      return items;
    },
    Fields : function(fields){
      return fields;
    }
  };
  return function(type, objects, parentId){
    if (!conveniences.hasOwnProperty(type)){
      return objects;
    }    
    return conveniences[type](objects, parentId);
  };
};
