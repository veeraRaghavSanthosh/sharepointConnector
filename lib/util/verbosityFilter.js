/*
  The sharepoint API is very verbose. By default, let's return what "looks" useful, with the option to filter further. 
 */
var _ = require('underscore'),
verbosityFilters = {
  "DefaultPick": ['Created', 'Description', 'Id', 'Title'],
  "DefaultOmit": ['__metadata', 'FirstUniqueAncestorSecurableObject', 'RoleAssignments', 'AttachmentFiles', 'ContentType', 'FieldValuesAsHtml', 'FieldValuesAsText', 'FieldValuesForEdit', 'Folder', 'ParentList'],
  // NB: Specify these lowercase
  "lists": {
    type: 'pick',
    fields: ['ImageUrl', 'LastItemDeletedDate', 'LastItemModifiedDate', 'ListItemEntityTypeFullName', 'ItemCount']
  },
  "list": {
    type: 'pick',
    fields: ['DocumentTemplateUrl', 'EntityTypeName', 'ImageUrl', 'LastItemDeletedDate', 'LastItemModifiedDate', 'ListItemEntityTypeFullName', 'TemplateFeatureId', 'ItemCount']
  },
  "fields": {
    type: 'omit',
    fields: ['SchemaXml', 'File']
  },
  "listitem": {
    type: 'omit',
    fields: []
  },
  "listitems": {
    type: 'omit',
    fields: []
  },
  "items": {
    type: 'omit',
    fields: []
  }
};


module.exports = function(client) {
  function processSingleItem(item, typeOverride) {
    var type = typeOverride || item.__metadata && item.__metadata.type;
    if (!type) {
      return item;
    }
    type = type.replace('SP.', '');
    type = type.toLowerCase();
    if (!verbosityFilters.hasOwnProperty(type)) {
      item = _.omit(item, verbosityFilters.DefaultOmit);
      return item;
    }
    var verbosityFilterDefinition = verbosityFilters[type],
    fieldsToFilter = verbosityFilterDefinition.fields, // the fields we operate on
    fieldFilterType = verbosityFilterDefinition.type; // pick or omit
    if (fieldFilterType === 'pick') {
      fieldsToFilter = fieldsToFilter.concat(verbosityFilters.DefaultPick);
    } else {
      fieldsToFilter = fieldsToFilter.concat(verbosityFilters.DefaultOmit);
    }
    item = _[fieldFilterType](item, fieldsToFilter);
    return item;
  }

  return function filterVerboseFields(itemOrItems, url) {
    if (client.verbose === true) {
      return itemOrItems;
    }

    if (_.isArray(itemOrItems)) {
      var typeOverride = _.last(url.split('/'));
      return _.map(itemOrItems, function(item) {
        return processSingleItem(item, typeOverride);
      });
    } else {
      return processSingleItem(itemOrItems);
    }
  };
};
