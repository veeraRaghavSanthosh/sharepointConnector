const sharepointConnector = require('../sharepointconnector');

/**
 * SharePoint Server wrapper with input validation
 */
class SharePointServer {
  constructor(config) {
    this.validateConfig(config);
    this.client = sharepointConnector(config);
  }

  /**
   * Validates configuration object
   * @param {Object} config - Configuration object
   * @throws {TypeError} When config is null or undefined
   * @throws {Error} When required fields are missing
   */
  validateConfig(config) {
    if (config === null || config === undefined) {
      throw new TypeError('Configuration cannot be null or undefined');
    }

    if (typeof config !== 'object') {
      throw new TypeError('Configuration must be an object');
    }

    const requiredFields = ['username', 'password', 'url'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validates input parameters for API calls
   * @param {*} input - Input to validate
   * @param {string} paramName - Name of the parameter for error messages
   * @throws {TypeError} When input is null or undefined
   */
  validateInput(input, paramName = 'input') {
    if (input === null) {
      throw new TypeError(`${paramName} cannot be null`);
    }
    
    if (input === undefined) {
      throw new TypeError(`${paramName} cannot be undefined`);
    }
  }

  /**
   * Get lists with input validation
   * @param {Object} options - Options for getting lists
   * @returns {Promise} Promise resolving to lists
   */
  async getLists(options = {}) {
    this.validateInput(options, 'options');
    
    return new Promise((resolve, reject) => {
      this.client.lists.getLists(options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Get list items with input validation
   * @param {string} listTitle - Title of the list
   * @param {Object} options - Options for getting list items
   * @returns {Promise} Promise resolving to list items
   */
  async getListItems(listTitle, options = {}) {
    this.validateInput(listTitle, 'listTitle');
    this.validateInput(options, 'options');

    if (typeof listTitle !== 'string') {
      throw new TypeError('listTitle must be a string');
    }

    return new Promise((resolve, reject) => {
      this.client.listItems.getListItems(listTitle, options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Create list item with input validation
   * @param {string} listTitle - Title of the list
   * @param {Object} itemData - Data for the new item
   * @returns {Promise} Promise resolving to created item
   */
  async createListItem(listTitle, itemData) {
    this.validateInput(listTitle, 'listTitle');
    this.validateInput(itemData, 'itemData');

    if (typeof listTitle !== 'string') {
      throw new TypeError('listTitle must be a string');
    }

    if (typeof itemData !== 'object') {
      throw new TypeError('itemData must be an object');
    }

    return new Promise((resolve, reject) => {
      this.client.listItems.createListItem(listTitle, itemData, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Login with input validation
   * @returns {Promise} Promise resolving to login result
   */
  async login() {
    return new Promise((resolve, reject) => {
      this.client.login((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}

module.exports = SharePointServer;