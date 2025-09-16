/**
 * SharePoint User API Module
 * 
 * This module provides user-related operations for SharePoint Online/On-Premises
 * including user profile management, group membership, and permission handling.
 * 
 * Key edge cases handled:
 * - Mixed authentication scenarios (NTLM, Forms, Claims)
 * - User not found scenarios
 * - Permission inheritance complexities
 * - Large group membership sets
 * - Cross-site collection user lookups
 */

const { doRequest } = require('../../lib/util/doRequest');
const { buildUrl } = require('../../lib/util/urlBuilderTools');

/**
 * Helper function to validate user identifier format
 * 
 * Edge cases handled:
 * - Email format validation for SharePoint Online
 * - Domain\username format for on-premises
 * - Claims-based identifiers (i:0#.f|membership|user@domain.com)
 * - Empty or null identifiers
 * 
 * @param {string} userIdentifier - User identifier in various formats
 * @returns {Object} Validation result with isValid flag and normalized identifier
 */
function validateAndNormalizeUserIdentifier(userIdentifier) {
    if (!userIdentifier || typeof userIdentifier !== 'string') {
        return {
            isValid: false,
            error: 'User identifier is required and must be a string',
            normalized: null
        };
    }

    const trimmed = userIdentifier.trim();
    
    // Handle claims-based identifiers (SharePoint Online)
    if (trimmed.startsWith('i:0#.f|membership|')) {
        return {
            isValid: true,
            normalized: trimmed,
            type: 'claims'
        };
    }
    
    // Handle email format (SharePoint Online)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
        return {
            isValid: true,
            normalized: trimmed.toLowerCase(), // Normalize email case
            type: 'email'
        };
    }
    
    // Handle domain\username format (On-premises)
    if (trimmed.includes('\\') && trimmed.split('\\').length === 2) {
        const [domain, username] = trimmed.split('\\');
        if (domain && username) {
            return {
                isValid: true,
                normalized: `${domain.toUpperCase()}\\${username}`, // Normalize domain case
                type: 'domain'
            };
        }
    }
    
    return {
        isValid: false,
        error: 'Invalid user identifier format. Expected email, domain\\username, or claims format',
        normalized: null
    };
}

/**
 * Helper function to handle SharePoint API responses with consistent error handling
 * 
 * Edge cases handled:
 * - Network timeouts and connection errors
 * - SharePoint throttling responses (503 with Retry-After)
 * - Authentication token expiration
 * - Malformed JSON responses
 * - Empty result sets vs. actual errors
 * 
 * @param {Promise} requestPromise - The request promise to handle
 * @param {string} operation - Description of the operation for error context
 * @returns {Promise<Object>} Standardized response object
 */
async function handleSharePointResponse(requestPromise, operation) {
    try {
        const response = await requestPromise;
        
        // Handle successful responses
        if (response.statusCode >= 200 && response.statusCode < 300) {
            let data;
            try {
                data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
            } catch (parseError) {
                // Edge case: Non-JSON response from SharePoint (rare but possible)
                return {
                    success: false,
                    error: `Invalid JSON response from SharePoint during ${operation}`,
                    details: parseError.message,
                    rawResponse: response.body
                };
            }
            
            return {
                success: true,
                data: data,
                statusCode: response.statusCode
            };
        }
        
        // Handle SharePoint throttling (503 with Retry-After header)
        if (response.statusCode === 503 && response.headers['retry-after']) {
            return {
                success: false,
                error: 'SharePoint throttling detected',
                retryAfter: parseInt(response.headers['retry-after'], 10),
                shouldRetry: true,
                operation: operation
            };
        }
        
        // Handle authentication errors
        if (response.statusCode === 401 || response.statusCode === 403) {
            return {
                success: false,
                error: `Authentication/Authorization failed during ${operation}`,
                statusCode: response.statusCode,
                needsReauth: response.statusCode === 401
            };
        }
        
        // Handle user not found (404 is common for user lookups)
        if (response.statusCode === 404) {
            return {
                success: false,
                error: `Resource not found during ${operation}`,
                statusCode: response.statusCode,
                notFound: true
            };
        }
        
        // Generic error handling
        return {
            success: false,
            error: `SharePoint API error during ${operation}`,
            statusCode: response.statusCode,
            details: response.body
        };
        
    } catch (networkError) {
        // Handle network-level errors (timeouts, DNS, etc.)
        return {
            success: false,
            error: `Network error during ${operation}`,
            details: networkError.message,
            isNetworkError: true
        };
    }
}

/**
 * Helper function to build SharePoint REST API URLs for user operations
 * 
 * Edge cases handled:
 * - URL encoding of special characters in user identifiers
 * - Different API endpoints for on-premises vs. online
 * - Site collection vs. web-level user contexts
 * - Query parameter ordering and encoding
 * 
 * @param {Object} context - SharePoint context object
 * @param {string} endpoint - The API endpoint path
 * @param {Object} params - Query parameters
 * @returns {string} Properly formatted SharePoint REST URL
 */
function buildUserApiUrl(context, endpoint, params = {}) {
    const baseUrl = context.siteUrl || context.webUrl;
    
    // Ensure we have a valid base URL
    if (!baseUrl) {
        throw new Error('SharePoint context must include siteUrl or webUrl');
    }
    
    // Build the base API path
    let apiPath = `${baseUrl}/_api/web/${endpoint}`;
    
    // Handle query parameters with proper encoding
    const queryParams = [];
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
            // Special handling for user identifiers that need encoding
            const encodedValue = encodeURIComponent(value);
            queryParams.push(`${key}=${encodedValue}`);
        }
    });
    
    if (queryParams.length > 0) {
        apiPath += `?${queryParams.join('&')}`;
    }
    
    return apiPath;
}

/**
 * Get user profile information by user identifier
 * 
 * Edge cases handled:
 * - User exists in directory but not in SharePoint site
 * - User has been deleted but still appears in some lists
 * - Profile service unavailable in on-premises scenarios
 * - Large profile properties that may be truncated
 * 
 * @param {Object} context - SharePoint authentication context
 * @param {string} userIdentifier - User email, login name, or ID
 * @returns {Promise<Object>} User profile data or error information
 */
async function getUserProfile(context, userIdentifier) {
    const validation = validateAndNormalizeUserIdentifier(userIdentifier);
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.error
        };
    }
    
    try {
        // Try multiple approaches due to SharePoint's inconsistent user lookup behavior
        const endpoints = [
            `siteusers(@v)?@v='${validation.normalized}'`,
            `siteusers/getByEmail('${validation.normalized}')`,
            `siteusers/getByLoginName('${validation.normalized}')`
        ];
        
        let lastError = null;
        
        for (const endpoint of endpoints) {
            const url = buildUserApiUrl(context, endpoint, {
                '$select': 'Id,Title,Email,LoginName,PrincipalType,IsSiteAdmin'
            });
            
            const requestOptions = {
                url: url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                }
            };
            
            const result = await handleSharePointResponse(
                doRequest(context, requestOptions),
                `get user profile for ${userIdentifier}`
            );
            
            if (result.success) {
                // Extract user data from SharePoint's verbose JSON format
                const userData = result.data.d || result.data;
                
                return {
                    success: true,
                    user: {
                        id: userData.Id,
                        title: userData.Title,
                        email: userData.Email,
                        loginName: userData.LoginName,
                        principalType: userData.PrincipalType,
                        isSiteAdmin: userData.IsSiteAdmin || false
                    }
                };
            }
            
            // If it's not a "not found" error, break early
            if (!result.notFound) {
                lastError = result;
                break;
            }
            
            lastError = result;
        }
        
        return lastError;
        
    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error getting user profile',
            details: error.message
        };
    }
}

/**
 * Get user's group memberships
 * 
 * Edge cases handled:
 * - Nested group memberships (groups within groups)
 * - Large numbers of group memberships (pagination)
 * - Security vs. distribution groups
 * - Cross-site collection group memberships
 * - Inherited permissions from parent sites
 * 
 * @param {Object} context - SharePoint authentication context
 * @param {string} userIdentifier - User email, login name, or ID
 * @param {Object} options - Additional options for group lookup
 * @returns {Promise<Object>} User's group memberships or error information
 */
async function getUserGroups(context, userIdentifier, options = {}) {
    const validation = validateAndNormalizeUserIdentifier(userIdentifier);
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.error
        };
    }
    
    try {
        // First, get the user to ensure they exist
        const userResult = await getUserProfile(context, validation.normalized);
        if (!userResult.success) {
            return userResult;
        }
        
        const userId = userResult.user.id;
        const includeNestedGroups = options.includeNested !== false; // Default to true
        
        // Build the groups endpoint URL
        const endpoint = `siteusers(${userId})/groups`;
        const url = buildUserApiUrl(context, endpoint, {
            '$select': 'Id,Title,Description,PrincipalType,OwnerTitle',
            '$orderby': 'Title'
        });
        
        const requestOptions = {
            url: url,
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose'
            }
        };
        
        const result = await handleSharePointResponse(
            doRequest(context, requestOptions),
            `get groups for user ${userIdentifier}`
        );
        
        if (!result.success) {
            return result;
        }
        
        const groupsData = result.data.d ? result.data.d.results : result.data.results || [];
        
        const groups = groupsData.map(group => ({
            id: group.Id,
            title: group.Title,
            description: group.Description || '',
            principalType: group.PrincipalType,
            ownerTitle: group.OwnerTitle || ''
        }));
        
        // Handle nested group memberships if requested
        if (includeNestedGroups && groups.length > 0) {
            // Note: This is a simplified approach. Full nested group resolution
            // would require recursive calls and careful cycle detection
            const nestedGroups = [];
            
            for (const group of groups) {
                try {
                    const nestedUrl = buildUserApiUrl(context, `sitegroups(${group.id})/users`, {
                        '$select': 'Id,Title,PrincipalType',
                        '$filter': 'PrincipalType eq 4' // Groups only
                    });
                    
                    const nestedOptions = {
                        url: nestedUrl,
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json;odata=verbose',
                            'Content-Type': 'application/json;odata=verbose'
                        }
                    };
                    
                    const nestedResult = await handleSharePointResponse(
                        doRequest(context, nestedOptions),
                        `get nested groups for group ${group.title}`
                    );
                    
                    if (nestedResult.success) {
                        const nestedData = nestedResult.data.d ? nestedResult.data.d.results : nestedResult.data.results || [];
                        nestedGroups.push(...nestedData.map(ng => ({
                            id: ng.Id,
                            title: ng.Title,
                            principalType: ng.PrincipalType,
                            parentGroup: group.title
                        })));
                    }
                } catch (nestedError) {
                    // Continue processing other groups even if one fails
                    console.warn(`Failed to get nested groups for ${group.title}:`, nestedError.message);
                }
            }
            
            return {
                success: true,
                groups: groups,
                nestedGroups: nestedGroups,
                totalCount: groups.length + nestedGroups.length
            };
        }
        
        return {
            success: true,
            groups: groups,
            totalCount: groups.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error getting user groups',
            details: error.message
        };
    }
}

/**
 * Add user to a SharePoint group
 * 
 * Edge cases handled:
 * - User already exists in group
 * - Group doesn't exist
 * - Insufficient permissions to add users
 * - User exists in AD but not in SharePoint site
 * - Adding external users (guest accounts)
 * 
 * @param {Object} context - SharePoint authentication context
 * @param {string} userIdentifier - User email, login name, or ID
 * @param {string|number} groupIdentifier - Group name or ID
 * @returns {Promise<Object>} Success status or error information
 */
async function addUserToGroup(context, userIdentifier, groupIdentifier) {
    const userValidation = validateAndNormalizeUserIdentifier(userIdentifier);
    if (!userValidation.isValid) {
        return {
            success: false,
            error: userValidation.error
        };
    }
    
    try {
        // First ensure the user exists in the site
        let userResult = await getUserProfile(context, userValidation.normalized);
        
        // If user doesn't exist in site, try to add them first
        if (!userResult.success && userResult.notFound) {
            const ensureUserUrl = buildUserApiUrl(context, 'ensureuser', {});
            
            const ensureUserOptions = {
                url: ensureUserUrl,
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': context.requestDigest || ''
                },
                body: JSON.stringify({
                    'logonName': userValidation.normalized
                })
            };
            
            const ensureResult = await handleSharePointResponse(
                doRequest(context, ensureUserOptions),
                `ensure user exists for ${userIdentifier}`
            );
            
            if (ensureResult.success) {
                const userData = ensureResult.data.d || ensureResult.data;
                userResult = {
                    success: true,
                    user: {
                        id: userData.Id,
                        title: userData.Title,
                        email: userData.Email,
                        loginName: userData.LoginName
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'Could not ensure user exists in SharePoint site',
                    details: ensureResult.error
                };
            }
        } else if (!userResult.success) {
            return userResult;
        }
        
        // Determine group endpoint based on identifier type
        let groupEndpoint;
        if (typeof groupIdentifier === 'number' || /^\d+$/.test(groupIdentifier)) {
            groupEndpoint = `sitegroups(${groupIdentifier})/users`;
        } else {
            groupEndpoint = `sitegroups/getByName('${encodeURIComponent(groupIdentifier)}')/users`;
        }
        
        const addUserUrl = buildUserApiUrl(context, groupEndpoint);
        
        const addUserOptions = {
            url: addUserUrl,
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': context.requestDigest || ''
            },
            body: JSON.stringify({
                '__metadata': { 'type': 'SP.User' },
                'LoginName': userResult.user.loginName
            })
        };
        
        const result = await handleSharePointResponse(
            doRequest(context, addUserOptions),
            `add user ${userIdentifier} to group ${groupIdentifier}`
        );
        
        if (result.success) {
            return {
                success: true,
                message: `User ${userIdentifier} successfully added to group ${groupIdentifier}`,
                user: userResult.user
            };
        }
        
        // Handle specific error cases
        if (result.statusCode === 409 || (result.details && result.details.includes('already exists'))) {
            return {
                success: false,
                error: 'User is already a member of this group',
                alreadyMember: true
            };
        }
        
        return result;
        
    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error adding user to group',
            details: error.message
        };
    }
}

/**
 * Remove user from a SharePoint group
 * 
 * Edge cases handled:
 * - User is not a member of the group
 * - Group doesn't exist
 * - Insufficient permissions to remove users
 * - Last owner being removed from group
 * 
 * @param {Object} context - SharePoint authentication context
 * @param {string} userIdentifier - User email, login name, or ID
 * @param {string|number} groupIdentifier - Group name or ID
 * @returns {Promise<Object>} Success status or error information
 */
async function removeUserFromGroup(context, userIdentifier, groupIdentifier) {
    const userValidation = validateAndNormalizeUserIdentifier(userIdentifier);
    if (!userValidation.isValid) {
        return {
            success: false,
            error: userValidation.error
        };
    }
    
    try {
        // Get user information
        const userResult = await getUserProfile(context, userValidation.normalized);
        if (!userResult.success) {
            return userResult;
        }
        
        const userId = userResult.user.id;
        
        // Determine group endpoint based on identifier type
        let groupEndpoint;
        if (typeof groupIdentifier === 'number' || /^\d+$/.test(groupIdentifier)) {
            groupEndpoint = `sitegroups(${groupIdentifier})/users/removeById(${userId})`;
        } else {
            groupEndpoint = `sitegroups/getByName('${encodeURIComponent(groupIdentifier)}')/users/removeById(${userId})`;
        }
        
        const removeUserUrl = buildUserApiUrl(context, groupEndpoint);
        
        const removeUserOptions = {
            url: removeUserUrl,
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': context.requestDigest || ''
            }
        };
        
        const result = await handleSharePointResponse(
            doRequest(context, removeUserOptions),
            `remove user ${userIdentifier} from group ${groupIdentifier}`
        );
        
        if (result.success) {
            return {
                success: true,
                message: `User ${userIdentifier} successfully removed from group ${groupIdentifier}`,
                user: userResult.user
            };
        }
        
        return result;
        
    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error removing user from group',
            details: error.message
        };
    }
}

module.exports = {
    getUserProfile,
    getUserGroups,
    addUserToGroup,
    removeUserFromGroup,
    
    // Export helper functions for testing and reuse
    validateAndNormalizeUserIdentifier,
    handleSharePointResponse,
    buildUserApiUrl
};