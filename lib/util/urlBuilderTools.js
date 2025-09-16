/*
 This function is used to add parameters to a URL used to call Sharepoint.
 -/FieldValuesAsText will make all fields for an item show as a text value instead of an identifier.
 -filter fields are used to limit items returned based on value of one or more fields
 -select fields are used to limit the fields returned
 -expand fields are used to "JOIN" a lookup list to the list currently being Read / Listed
 */
exports.augmentURL = function(url, fieldValuesAsText, filterFields, selectFields, expandFields, orOperator, andOrOperator,capValue) {
  // Validate input parameters to prevent TypeError
  if (url === null || url === undefined || typeof url !== 'string') {
    throw new Error('URL parameter must be a non-null string');
  }
  
  var finalURL = url.trim(),
    filter = '',
    filterField = '',
    filterString = '',
    select = '',
    expand = '';
    capValue=capValue?capValue.toString():false;
    // capFlag = true;

  // if (filterFields === 'proxyFlag') {
  //   capFlag = false;
  //   filterFields=null;
  // }
  //Show all values as text
  if (fieldValuesAsText) {
    finalURL += '/FieldValuesAsText';
  }

  //build filter string - used to get items with a specific value for a field
  if (filterFields !== null && filterFields.hasOwnProperty('length')) {
    filter = '$filter=';
    if (filterFields.length === 1) {
      try {
        filterField = JSON.parse(filterFields[0]);
      } catch (e) {
        }
      filterString = filterField['field'] + '%20eq%20' + "'" + filterField['value'] + "'";
    } else if (andOrOperator) {
      for (index = 0; index < filterFields.length; index++) {
        try {
          filterField = JSON.parse(filterFields[index]);
          //console.log("length in filter field " + JSON.stringify(filterFields.length));
          //console.log("json data " + JSON.stringify(filterField));
        } catch (e) {
          console.log('Unable to parse filterFields, expecting {"field":"Field", "value":"Value"}');
        }
        // Validate filterField properties before using trim()
        var fieldValue = filterField && filterField['field'] ? filterField['field'].toString().trim() : '';
        var valueValue = filterField && filterField['value'] ? filterField['value'].toString().trim() : '';
        
        if (!fieldValue || !valueValue) {
          continue; // Skip invalid filter fields
        }
        
        if (index === 0) {
          filterString = '(' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        } else if (index === 1) {
          filterString += '%20and%20((' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        } else {
          filterString += '%20or%20(' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        }
      }
      filterString = filterString + ')';
    } else {
      for (i = 0; i < filterFields.length; i++) {
        try {
          filterField = JSON.parse(filterFields[i]);
        } catch (e) {
                }
        // Validate filterField properties before using trim()
        var fieldValue = filterField && filterField['field'] ? filterField['field'].toString().trim() : '';
        var valueValue = filterField && filterField['value'] ? filterField['value'].toString().trim() : '';
        
        if (!fieldValue || !valueValue) {
          continue; // Skip invalid filter fields
        }
        
        if (i === 0) {
          filterString = '(' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        } else if (orOperator) {
          filterString += '%20or%20(' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        } else {
          filterString += '%20and%20(' + fieldValue + '%20eq%20' + "'" + valueValue + "')";
        }
      }
    }
    filter += filterString;
  }

  //build select string - used to tell Sharepoint which fields to return in response to REST call
  if (selectFields !== null && selectFields.constructor === Array) {
    select = '$select=';
    selectFields.forEach(function(fields) {
      try {
        select += fields.toString().trim() + ',';
      } catch (e) {

      }
    });
    select = select.slice(0, -1);
  }

  //build expand string - used to tell Sharepoint to provide detail on value
  if (expandFields !== null && expandFields.constructor === Array) {
    expand = '$expand=';
    expandFields.forEach(function(fields) {
      try {
        expand += fields.toString().trim() + ',';
      } catch (e) {

      }
    });
    expand = expand.slice(0, -1);
  }

  //Append filter and / or select query parameters to finalURL
  if (filter.length > 0) {
    finalURL += '?' + filter;
    if (select.length > 0) {
      finalURL += '&' + select;
    }
    if (expand.length > 0) {
      finalURL += '&' + expand;
    }
    if (capValue) {
      finalURL += '&$top='+capValue;
    }
   } else if (select.length > 0) {
    finalURL += '?' + select;
    if (expand.length > 0) {
      finalURL += '&' + expand;
    }
    if (capValue) {
      finalURL += '&$top='+capValue;
    }
  } else if (expand.length > 0) {
    finalURL += '?' + expand;
    if (capValue) {
      finalURL += '&$top='+capValue;
    }
  } else {
    if (capValue) {
      finalURL += '?$top='+capValue;
    }
  }
  //console.log("finalURL",finalURL);
  return finalURL;
};
