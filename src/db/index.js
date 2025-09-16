'use strict';

/**
 * Database utility module for SharePoint Connector
 * Handles data validation, transformation and storage operations
 */

/**
 * Validates input data to ensure it's not null or undefined
 * @param {*} input - Input data to validate
 * @param {string} fieldName - Name of the field being validated (for error messages)
 * @returns {boolean} - Returns true if valid, throws error if invalid
 */
function validateInput(input, fieldName) {
    fieldName = fieldName || 'input';
    if (input === null) {
        throw new TypeError(fieldName + ' cannot be null');
    }
    if (input === undefined) {
        throw new TypeError(fieldName + ' cannot be undefined');
    }
    return true;
}

/**
 * Processes SharePoint list data with null validation
 * @param {Object} data - The data object to process
 * @returns {Object} - Processed data object
 */
function processListData(data) {
    // Validate input is not null
    validateInput(data, 'data');
    
    // Ensure data is an object
    if (typeof data !== 'object') {
        throw new TypeError('data must be an object');
    }
    
    // Create a safe copy of the data
    var processedData = {};
    
    // Process each field with null safety
    Object.keys(data).forEach(function(key) {
        var value = data[key];
        
        // Handle null values gracefully
        if (value === null) {
            processedData[key] = null;
        } else if (value === undefined) {
            processedData[key] = null;
        } else if (typeof value === 'string') {
            processedData[key] = value.trim();
        } else {
            processedData[key] = value;
        }
    });
    
    return processedData;
}

/**
 * Transforms SharePoint item data with validation
 * @param {Object} item - SharePoint item to transform
 * @returns {Object} - Transformed item
 */
function transformItem(item) {
    validateInput(item, 'item');
    
    if (typeof item !== 'object') {
        throw new TypeError('item must be an object');
    }
    
    var transformed = {
        id: item.Id || null,
        title: item.Title || '',
        created: item.Created || null,
        modified: item.Modified || null,
        author: null,
        editor: null
    };
    
    // Safely extract author information
    if (item.Author && typeof item.Author === 'object') {
        transformed.author = {
            id: item.Author.Id || null,
            title: item.Author.Title || '',
            email: item.Author.EMail || ''
        };
    }
    
    // Safely extract editor information
    if (item.Editor && typeof item.Editor === 'object') {
        transformed.editor = {
            id: item.Editor.Id || null,
            title: item.Editor.Title || '',
            email: item.Editor.EMail || ''
        };
    }
    
    return transformed;
}

/**
 * Safely extracts nested properties from objects
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path to property
 * @param {*} defaultValue - Default value if property not found
 * @returns {*} - Property value or default
 */
function safeGet(obj, path, defaultValue) {
    if (arguments.length < 3) {
        defaultValue = null;
    }
    
    if (obj === null || obj === undefined) {
        return defaultValue;
    }
    
    if (typeof path !== 'string') {
        throw new TypeError('path must be a string');
    }
    
    var keys = path.split('.');
    var current = obj;
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
}

/**
 * Formats query parameters with null validation
 * @param {Object} params - Query parameters
 * @returns {Object} - Formatted parameters
 */
function formatQueryParams(params) {
    if (params === null || params === undefined) {
        return {};
    }
    
    validateInput(params, 'params');
    
    if (typeof params !== 'object') {
        throw new TypeError('params must be an object');
    }
    
    var formatted = {};
    
    Object.keys(params).forEach(function(key) {
        var value = params[key];
        
        if (value !== null && value !== undefined) {
            if (typeof value === 'string') {
                formatted[key] = value.trim();
            } else {
                formatted[key] = value;
            }
        }
    });
    
    return formatted;
}

module.exports = {
    validateInput: validateInput,
    processListData: processListData,
    transformItem: transformItem,
    safeGet: safeGet,
    formatQueryParams: formatQueryParams
};
