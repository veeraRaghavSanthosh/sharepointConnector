/**
 * Database utility module for SharePoint Connector
 * This module provides database operations and data processing utilities
 */

var _ = require('underscore');

/**
 * Processes database query results
 * @param {Object} data - The input data to process
 * @param {Object} options - Processing options
 * @returns {Object} Processed data
 */
function processQueryResult(data, options) {
  // This is where the TypeError occurs when data is null
  // The code was trying to access properties on null/undefined data
  if (!data || typeof data !== 'object') {
    throw new TypeError('Input data must be a valid object, received: ' + typeof data);
  }
  
  // Process the data
  var result = {
    items: data.items || [],
    count: data.count || 0,
    metadata: data.metadata || {}
  };
  
  if (options && options.transform) {
    result.items = _.map(result.items, options.transform);
  }
  
  return result;
}

/**
 * Validates input data before processing
 * @param {*} input - The input to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateInput(input) {
  if (input === null || input === undefined) {
    return false;
  }
  
  if (typeof input !== 'object') {
    return false;
  }
  
  return true;
}

/**
 * Safe data processor that handles null inputs gracefully
 * @param {Object} data - The input data to process
 * @param {Object} options - Processing options
 * @returns {Object} Processed data or empty result for invalid input
 */
function safeProcessQueryResult(data, options) {
  if (!validateInput(data)) {
    return {
      items: [],
      count: 0,
      metadata: {},
      error: 'Invalid input data: expected object, received ' + (data === null ? 'null' : typeof data)
    };
  }
  
  try {
    return processQueryResult(data, options);
  } catch (error) {
    return {
      items: [],
      count: 0,
      metadata: {},
      error: error.message
    };
  }
}

/**
 * Transforms SharePoint list data
 * @param {Object} listData - SharePoint list data
 * @returns {Object} Transformed data
 */
function transformListData(listData) {
  if (!validateInput(listData)) {
    throw new TypeError('List data must be a valid object, received: ' + (listData === null ? 'null' : typeof listData));
  }
  
  return {
    id: listData.Id || null,
    title: listData.Title || '',
    created: listData.Created || null,
    modified: listData.Modified || null,
    items: listData.Items || []
  };
}

/**
 * Safe list data transformer
 * @param {Object} listData - SharePoint list data
 * @returns {Object} Transformed data or error result
 */
function safeTransformListData(listData) {
  if (!validateInput(listData)) {
    return {
      id: null,
      title: '',
      created: null,
      modified: null,
      items: [],
      error: 'Invalid list data: expected object, received ' + (listData === null ? 'null' : typeof listData)
    };
  }
  
  try {
    return transformListData(listData);
  } catch (error) {
    return {
      id: null,
      title: '',
      created: null,
      modified: null,
      items: [],
      error: error.message
    };
  }
}

module.exports = {
  processQueryResult: processQueryResult,
  safeProcessQueryResult: safeProcessQueryResult,
  validateInput: validateInput,
  transformListData: transformListData,
  safeTransformListData: safeTransformListData
};
