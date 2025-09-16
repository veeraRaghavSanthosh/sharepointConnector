/**
 * SharePoint Connector Server
 * Handles SharePoint operations with proper input validation
 */

const sharepoint = require('../lib/sharepoint');

/**
 * Validates input to ensure it's not null or undefined
 * @param {*} input - The input to validate
 * @param {string} paramName - Name of the parameter for error messages
 * @throws {TypeError} When input is null or undefined
 */
function validateInput(input, paramName = 'input') {
    if (input === null) {
        throw new TypeError(`${paramName} cannot be null`);
    }
    if (input === undefined) {
        throw new TypeError(`${paramName} cannot be undefined`);
    }
}

/**
 * Validates configuration object
 * @param {Object} config - Configuration object
 * @throws {TypeError} When config is invalid
 */
function validateConfig(config) {
    validateInput(config, 'config');
    
    if (typeof config !== 'object') {
        throw new TypeError('config must be an object');
    }
    
    if (!config.siteUrl) {
        throw new TypeError('config.siteUrl is required');
    }
    
    if (typeof config.siteUrl !== 'string') {
        throw new TypeError('config.siteUrl must be a string');
    }
}

/**
 * Processes SharePoint requests with proper validation
 * @param {Object} config - SharePoint configuration
 * @param {Object} options - Request options
 * @returns {Promise} Promise resolving to SharePoint response
 */
async function processRequest(config, options) {
    try {
        // Validate inputs
        validateConfig(config);
        validateInput(options, 'options');
        
        if (typeof options !== 'object') {
            throw new TypeError('options must be an object');
        }
        
        // Process the request
        return await sharepoint.connect(config, options);
    } catch (error) {
        console.error('Error processing SharePoint request:', error.message);
        throw error;
    }
}

/**
 * Creates a SharePoint list item with validation
 * @param {Object} config - SharePoint configuration
 * @param {string} listName - Name of the SharePoint list
 * @param {Object} itemData - Data for the new item
 * @returns {Promise} Promise resolving to created item
 */
async function createListItem(config, listName, itemData) {
    try {
        validateConfig(config);
        validateInput(listName, 'listName');
        validateInput(itemData, 'itemData');
        
        if (typeof listName !== 'string') {
            throw new TypeError('listName must be a string');
        }
        
        if (typeof itemData !== 'object') {
            throw new TypeError('itemData must be an object');
        }
        
        return await sharepoint.createItem(config, listName, itemData);
    } catch (error) {
        console.error('Error creating SharePoint list item:', error.message);
        throw error;
    }
}

module.exports = {
    validateInput,
    validateConfig,
    processRequest,
    createListItem
};
