const { doRequest } = require('../../lib/util/doRequest');
const { buildUrl } = require('../../lib/util/urlBuilderTools');

/**
 * SharePoint User API operations
 * Handles user management, profile operations, and group memberships
 */

class UserAPI {
    constructor(client) {
        this.client = client;
        this.baseUrl = client.baseUrl;
    }

    /**
     * Helper function to validate user ID input
     * Extracted to reduce code duplication across methods
     * @private
     * @param {string} userId - User ID to validate
     * @throws {Error} If userId is invalid
     */
    _validateUserId(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (typeof userId !== 'string') {
            throw new Error('User ID must be a string');
        }
    }

    /**
     * Helper function to validate search term input
     * Extracted to handle search-specific validation logic
     * @private
     * @param {string} searchTerm - Search term to validate
     * @throws {Error} If searchTerm is invalid
     */
    _validateSearchTerm(searchTerm) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        if (typeof searchTerm !== 'string') {
            throw new Error('Search term must be a string');
        }
    }

    /**
     * Helper function to build standard request options
     * Extracted to ensure consistent headers and options across all requests
     * @private
     * @param {string} method - HTTP method
     * @param {Object} options - Additional options to merge
     * @param {Object} body - Request body (optional)
     * @returns {Object} Complete request options
     */
    _buildRequestOptions(method, options = {}, body = null) {
        const requestOptions = {
            method,
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                ...options.headers
            },
            ...options
        };

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        return requestOptions;
    }

    /**
     * Helper function to process and validate API responses
     * Extracted to handle consistent response validation and error handling
     * @private
     * @param {Object} response - API response to process
     * @param {boolean} expectArray - Whether to return results array (default: false)
     * @returns {Object|Array} Processed response data
     * @throws {Error} If response format is invalid
     */
    _processResponse(response, expectArray = false) {
        if (!response || !response.d) {
            throw new Error('Invalid response format');
        }

        // Edge case: Handle empty or malformed response data
        // SharePoint sometimes returns d: null for valid but empty results
        if (response.d === null) {
            return expectArray ? [] : null;
        }

        return expectArray ? (response.d.results || []) : response.d;
    }

    /**
     * Helper function to handle common SharePoint API errors
     * Extracted to provide consistent error handling across methods
     * @private
     * @param {Error} error - Original error
     * @param {string} context - Context information for better error messages
     * @returns {*} Fallback value for non-critical errors, or throws enhanced error
     */
    _handleApiError(error, context) {
        const errorMessage = error.message || '';

        // Edge case: User not found - return null instead of throwing
        if (errorMessage.includes('User not found')) {
            return null;
        }

        // Edge case: Access denied - return empty array for list operations
        if (errorMessage.includes('Access denied')) {
            return [];
        }

        // Edge case: Search service unavailable - return empty results
        if (errorMessage.includes('Search service unavailable')) {
            return [];
        }

        // Edge case: Permission issues - provide more specific error message
        if (errorMessage.includes('Insufficient permissions')) {
            throw new Error(`Insufficient permissions for ${context}: ${errorMessage}`);
        }

        // Re-throw all other errors with context
        throw new Error(`${context} failed: ${errorMessage}`);
    }

    /**
     * Get user profile information
     * @param {string} userId - User ID or login name
     * @param {Object} options - Request options
     * @returns {Promise<Object>} User profile data
     */
    async getUserProfile(userId, options = {}) {
        this._validateUserId(userId);

        const url = buildUrl(this.baseUrl, `_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)`, {
            '@v': `'${userId}'`
        });

        try {
            const requestOptions = this._buildRequestOptions('GET', options);
            const response = await doRequest(this.client, url, requestOptions);
            return this._processResponse(response);
        } catch (error) {
            return this._handleApiError(error, 'Get user profile');
        }
    }

    /**
     * Get user groups
     * @param {string} userId - User ID or login name
     * @param {Object} options - Request options
     * @returns {Promise<Array>} User groups
     */
    async getUserGroups(userId, options = {}) {
        this._validateUserId(userId);

        const url = buildUrl(this.baseUrl, `_api/web/siteusers('${userId}')/groups`);

        try {
            const requestOptions = this._buildRequestOptions('GET', options);
            const response = await doRequest(this.client, url, requestOptions);
            return this._processResponse(response, true);
        } catch (error) {
            return this._handleApiError(error, 'Get user groups');
        }
    }

    /**
     * Update user profile property
     * @param {string} userId - User ID or login name
     * @param {string} propertyName - Property name to update
     * @param {*} propertyValue - New property value
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Update result
     */
    async updateUserProperty(userId, propertyName, propertyValue, options = {}) {
        this._validateUserId(userId);
        
        if (!propertyName) {
            throw new Error('Property name is required');
        }

        const url = buildUrl(this.baseUrl, `_api/SP.UserProfiles.PeopleManager/SetSingleValueProfileProperty`);

        const requestBody = {
            accountName: userId,
            propertyName: propertyName,
            propertyValue: propertyValue
        };

        try {
            // Edge case: Request digest is required for POST operations
            // SharePoint requires this token to prevent CSRF attacks
            const requestDigest = await this._getRequestDigest();
            const requestOptions = this._buildRequestOptions('POST', {
                ...options,
                headers: {
                    'X-RequestDigest': requestDigest,
                    ...options.headers
                }
            }, requestBody);

            const response = await doRequest(this.client, url, requestOptions);
            return this._processResponse(response);
        } catch (error) {
            return this._handleApiError(error, `Update user property '${propertyName}'`);
        }
    }

    /**
     * Search for users
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchUsers(searchTerm, options = {}) {
        this._validateSearchTerm(searchTerm);

        const maxResults = options.maxResults || 50;
        
        // Edge case: Escape single quotes in search term to prevent OData injection
        const escapedSearchTerm = searchTerm.replace(/'/g, "''");
        
        const url = buildUrl(this.baseUrl, `_api/SP.UserProfiles.PeopleManager/GetPeopleFollowedByMe`, {
            '$filter': `substringof('${escapedSearchTerm}', DisplayName)`,
            '$top': maxResults
        });

        try {
            const requestOptions = this._buildRequestOptions('GET', options);
            const response = await doRequest(this.client, url, requestOptions);
            return this._processResponse(response, true);
        } catch (error) {
            return this._handleApiError(error, 'Search users');
        }
    }

    /**
     * Get request digest for POST operations
     * @private
     * @returns {Promise<string>} Request digest value
     */
    async _getRequestDigest() {
        const url = buildUrl(this.baseUrl, '_api/contextinfo');
        
        try {
            const requestOptions = this._buildRequestOptions('POST');
            const response = await doRequest(this.client, url, requestOptions);

            // Edge case: Handle missing or malformed context info response
            if (!response || !response.d || !response.d.GetContextWebInformation) {
                throw new Error('Failed to get request digest - invalid context info response');
            }

            return response.d.GetContextWebInformation.FormDigestValue;
        } catch (error) {
            throw new Error(`Failed to get request digest: ${error.message}`);
        }
    }
}

module.exports = UserAPI;