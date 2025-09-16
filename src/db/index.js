/**
 * Database operations module for SharePoint Connector
 * Handles data validation and processing to prevent TypeErrors with null inputs
 */

var _ = require('underscore');

/**
 * Validates and processes input data to prevent null/undefined TypeErrors
 * @param {*} input - The input data to validate
 * @param {string} type - The expected type of input
 * @returns {*} - Validated and processed input
 */
function validateInput(input, type) {
  if (input === null || input === undefined) {
    switch (type) {
      case 'string':
        return '';
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }
  return input;
}

/**
 * Safely trims a string, handling null/undefined inputs
 * @param {string} str - String to trim
 * @returns {string} - Trimmed string or empty string if input is null/undefined
 */
function safeTrim(str) {
  if (str === null || str === undefined || typeof str !== 'string') {
    return '';
  }
  return str.trim();
}

/**
 * Safely accesses object properties, handling null/undefined objects
 * @param {object} obj - Object to access
 * @param {string} prop - Property name
 * @returns {*} - Property value or null if object/property is null/undefined
 */
function safeGet(obj, prop) {
  if (!obj || typeof obj !== 'object' || obj[prop] === undefined) {
    return null;
  }
  return obj[prop];
}

/**
 * Safely maps over an array, handling null/undefined arrays
 * @param {Array} arr - Array to map over
 * @param {Function} fn - Mapping function
 * @returns {Array} - Mapped array or empty array if input is null/undefined
 */
function safeMap(arr, fn) {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map(fn);
}

/**
 * Processes filter field data with null safety
 * @param {string} filterFieldStr - JSON string of filter field
 * @returns {object|null} - Parsed filter field or null if invalid
 */
function processFilterField(filterFieldStr) {
  if (!filterFieldStr || typeof filterFieldStr !== 'string') {
    return null;
  }
  
  try {
    var filterField = JSON.parse(filterFieldStr);
    if (!filterField || typeof filterField !== 'object') {
      return null;
    }
    
    // Ensure field and value properties exist and are strings
    if (!filterField.field || !filterField.value) {
      return null;
    }
    
    return {
      field: safeTrim(filterField.field),
      value: safeTrim(filterField.value)
    };
  } catch (e) {
    console.log('Unable to parse filterField, expecting {"field":"Field", "value":"Value"}');
    return null;
  }
}

module.exports = {
  validateInput: validateInput,
  safeTrim: safeTrim,
  safeGet: safeGet,
  safeMap: safeMap,
  processFilterField: processFilterField
};