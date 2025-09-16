var _ = require('underscore');

/**
 * Helper function to check if a body has the expected SharePoint OData structure
 * @param {*} body - The response body to validate
 * @returns {boolean} - True if body has valid structure, false otherwise
 */
function isValidODataBody(body) {
  return body && typeof body === 'object';
}

/**
 * Helper function to extract results from SharePoint OData response
 * Handles the edge case where SharePoint returns results in different formats
 * @param {Object} dataContainer - The 'd' property from SharePoint response
 * @returns {*} - Extracted results or the original container
 */
function extractResultsFromContainer(dataContainer) {
  // Edge case: SharePoint sometimes returns results as { 1: {}, 2: {} } 
  // instead of a proper array - we need to convert this to an actual array
  if (dataContainer.results) {
    // SP returns { 1 : {}, 2 : {} }.. Yeah, great - that's a frickin' array, Microsoft. 
    return _.values(dataContainer.results);
  }
  
  // Edge case: Single item responses or other data structures
  return dataContainer;
}

/**
 * Parses SharePoint OData response body and normalizes the data structure
 * 
 * Edge cases handled:
 * 1. Empty/null body responses
 * 2. Responses without the 'd' wrapper (legacy or different endpoints)
 * 3. Responses with 'd.results' in object format instead of array
 * 4. Single item responses wrapped in 'd' property
 * 
 * @param {*} body - The raw response body from SharePoint
 * @returns {*} - Normalized data structure
 */
module.exports = function(body) {
  // Edge case: Handle empty, null, or undefined responses
  if (!body) {
    return [];
  }
  
  // Edge case: Response doesn't follow standard OData format (missing 'd' wrapper)
  // This can happen with some SharePoint endpoints or legacy responses
  if (!body.d) {
    return body;
  }
  
  // Standard case: Extract data from the 'd' container
  return extractResultsFromContainer(body.d);
};