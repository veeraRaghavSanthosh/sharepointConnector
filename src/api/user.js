/**
 * User API module for SharePoint Connector
 * Handles user-related operations with proper input validation
 */

/**
 * Validates user input to prevent TypeError when input is null
 * @param {*} input - The input to validate
 * @returns {boolean} - True if input is valid, false otherwise
 */
function validateInput(input) {
  return input !== null && input !== undefined;
}

/**
 * Gets user information from SharePoint
 * @param {Object} userInput - User input object
 * @param {Function} callback - Callback function
 * @returns {void}
 */
function getUserInfo(userInput, callback) {
  // Validate input to prevent TypeError
  if (!validateInput(userInput)) {
    const error = new Error('Invalid input: userInput cannot be null or undefined');
    error.code = 'INVALID_INPUT';
    return callback(error);
  }

  // Additional validation for required properties
  if (typeof userInput !== 'object') {
    const error = new Error('Invalid input: userInput must be an object');
    error.code = 'INVALID_INPUT_TYPE';
    return callback(error);
  }

  // Simulate user info retrieval (placeholder implementation)
  try {
    const userInfo = {
      id: userInput.id || null,
      name: userInput.name || 'Unknown User',
      email: userInput.email || null,
      timestamp: new Date().toISOString()
    };

    callback(null, userInfo);
  } catch (error) {
    error.code = 'PROCESSING_ERROR';
    callback(error);
  }
}

/**
 * Updates user information in SharePoint
 * @param {Object} userInput - User input object with update data
 * @param {Function} callback - Callback function
 * @returns {void}
 */
function updateUser(userInput, callback) {
  // Validate input to prevent TypeError
  if (!validateInput(userInput)) {
    const error = new Error('Invalid input: userInput cannot be null or undefined');
    error.code = 'INVALID_INPUT';
    return callback(error);
  }

  if (typeof userInput !== 'object') {
    const error = new Error('Invalid input: userInput must be an object');
    error.code = 'INVALID_INPUT_TYPE';
    return callback(error);
  }

  if (!userInput.id) {
    const error = new Error('Invalid input: user ID is required for updates');
    error.code = 'MISSING_USER_ID';
    return callback(error);
  }

  try {
    // Simulate user update (placeholder implementation)
    const updatedUser = {
      ...userInput,
      lastModified: new Date().toISOString()
    };

    callback(null, updatedUser);
  } catch (error) {
    error.code = 'UPDATE_ERROR';
    callback(error);
  }
}

/**
 * Creates a new user in SharePoint
 * @param {Object} userInput - User input object with creation data
 * @param {Function} callback - Callback function
 * @returns {void}
 */
function createUser(userInput, callback) {
  // Validate input to prevent TypeError
  if (!validateInput(userInput)) {
    const error = new Error('Invalid input: userInput cannot be null or undefined');
    error.code = 'INVALID_INPUT';
    return callback(error);
  }

  if (typeof userInput !== 'object') {
    const error = new Error('Invalid input: userInput must be an object');
    error.code = 'INVALID_INPUT_TYPE';
    return callback(error);
  }

  if (!userInput.name) {
    const error = new Error('Invalid input: user name is required for creation');
    error.code = 'MISSING_USER_NAME';
    return callback(error);
  }

  try {
    // Simulate user creation (placeholder implementation)
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: userInput.name,
      email: userInput.email || null,
      created: new Date().toISOString()
    };

    callback(null, newUser);
  } catch (error) {
    error.code = 'CREATION_ERROR';
    callback(error);
  }
}

module.exports = {
  getUserInfo,
  updateUser,
  createUser,
  validateInput
};