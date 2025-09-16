const axios = require('axios');
const { Client } = require('@microsoft/microsoft-graph-client');
const InputSanitizer = require('../middleware/inputSanitization');
const securityConfig = require('../config/security');

/**
 * SharePoint service with built-in security features
 * Handles all SharePoint operations with input sanitization and security checks
 */
class SharePointService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.graphClient = Client.init({
      authProvider: {
        getAccessToken: async () => accessToken
      }
    });
    
    // Initialize input sanitizer for service-level validation
    this.sanitizer = new InputSanitizer(securityConfig.inputSanitization);
  }

  /**
   * Get site information with security validation
   */
  async getSiteInfo(siteUrl) {
    try {
      // Sanitize and validate the site URL
      const sanitizedUrl = this.sanitizer.sanitizeSiteUrl(siteUrl);
      
      // Extract site ID from URL
      const siteId = this.extractSiteId(sanitizedUrl);
      
      const site = await this.graphClient
        .api(`/sites/${siteId}`)
        .get();
        
      return {
        id: site.id,
        displayName: site.displayName,
        webUrl: site.webUrl,
        createdDateTime: site.createdDateTime,
        lastModifiedDateTime: site.lastModifiedDateTime
      };
    } catch (error) {
      console.error('Error getting site info:', error);
      throw new Error(`Failed to retrieve site information: ${error.message}`);
    }
  }

  /**
   * List documents in a library with security checks
   */
  async getDocuments(siteUrl, libraryName, options = {}) {
    try {
      // Sanitize inputs
      const sanitizedUrl = this.sanitizer.sanitizeSiteUrl(siteUrl);
      const sanitizedLibraryName = this.sanitizer.sanitizeListName(libraryName);
      
      // Validate and sanitize OData query options
      const sanitizedOptions = this.sanitizeQueryOptions(options);
      
      const siteId = this.extractSiteId(sanitizedUrl);
      
      let query = this.graphClient
        .api(`/sites/${siteId}/drives`)
        .filter(`name eq '${sanitizedLibraryName}'`);
        
      const drives = await query.get();
      
      if (!drives.value || drives.value.length === 0) {
        throw new Error('Document library not found');
      }
      
      const driveId = drives.value[0].id;
      
      // Build query with sanitized options
      let documentsQuery = this.graphClient.api(`/sites/${siteId}/drives/${driveId}/root/children`);
      
      if (sanitizedOptions.$select) {
        documentsQuery = documentsQuery.select(sanitizedOptions.$select);
      }
      
      if (sanitizedOptions.$filter) {
        documentsQuery = documentsQuery.filter(sanitizedOptions.$filter);
      }
      
      if (sanitizedOptions.$top) {
        const topValue = Math.min(parseInt(sanitizedOptions.$top), 1000); // Limit to prevent abuse
        documentsQuery = documentsQuery.top(topValue);
      }
      
      const documents = await documentsQuery.get();
      
      return {
        documents: documents.value.map(doc => ({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          createdDateTime: doc.createdDateTime,
          lastModifiedDateTime: doc.lastModifiedDateTime,
          webUrl: doc.webUrl,
          downloadUrl: doc['@microsoft.graph.downloadUrl']
        })),
        totalCount: documents.value.length
      };
    } catch (error) {
      console.error('Error getting documents:', error);
      throw new Error(`Failed to retrieve documents: ${error.message}`);
    }
  }

  /**
   * Upload file with security validation
   */
  async uploadFile(siteUrl, libraryName, fileName, fileContent, options = {}) {
    try {
      // Sanitize inputs
      const sanitizedUrl = this.sanitizer.sanitizeSiteUrl(siteUrl);
      const sanitizedLibraryName = this.sanitizer.sanitizeListName(libraryName);
      const sanitizedFileName = this.sanitizer.sanitizeFilePath(fileName);
      
      // Validate file size
      if (fileContent.length > securityConfig.inputSanitization.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${securityConfig.inputSanitization.maxFileSize} bytes`);
      }
      
      const siteId = this.extractSiteId(sanitizedUrl);
      
      // Get drive ID
      const drives = await this.graphClient
        .api(`/sites/${siteId}/drives`)
        .filter(`name eq '${sanitizedLibraryName}'`)
        .get();
        
      if (!drives.value || drives.value.length === 0) {
        throw new Error('Document library not found');
      }
      
      const driveId = drives.value[0].id;
      
      // Upload file
      const uploadResult = await this.graphClient
        .api(`/sites/${siteId}/drives/${driveId}/root:/${sanitizedFileName}:/content`)
        .put(fileContent);
        
      return {
        id: uploadResult.id,
        name: uploadResult.name,
        size: uploadResult.size,
        webUrl: uploadResult.webUrl,
        uploadDateTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Create list item with input validation
   */
  async createListItem(siteUrl, listName, itemData) {
    try {
      // Sanitize inputs
      const sanitizedUrl = this.sanitizer.sanitizeSiteUrl(siteUrl);
      const sanitizedListName = this.sanitizer.sanitizeListName(listName);
      
      // Sanitize item data
      const sanitizedItemData = this.sanitizeItemData(itemData);
      
      const siteId = this.extractSiteId(sanitizedUrl);
      
      // Get list ID
      const lists = await this.graphClient
        .api(`/sites/${siteId}/lists`)
        .filter(`displayName eq '${sanitizedListName}'`)
        .get();
        
      if (!lists.value || lists.value.length === 0) {
        throw new Error('List not found');
      }
      
      const listId = lists.value[0].id;
      
      // Create list item
      const newItem = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .post({
          fields: sanitizedItemData
        });
        
      return {
        id: newItem.id,
        fields: newItem.fields,
        createdDateTime: newItem.createdDateTime
      };
    } catch (error) {
      console.error('Error creating list item:', error);
      throw new Error(`Failed to create list item: ${error.message}`);
    }
  }

  /**
   * Search with query sanitization
   */
  async search(siteUrl, query, options = {}) {
    try {
      // Sanitize inputs
      const sanitizedUrl = this.sanitizer.sanitizeSiteUrl(siteUrl);
      const sanitizedQuery = this.sanitizer.sanitizeODataQuery(query);
      
      if (!sanitizedQuery || sanitizedQuery.length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }
      
      const siteId = this.extractSiteId(sanitizedUrl);
      
      // Limit search results to prevent abuse
      const maxResults = Math.min(parseInt(options.top) || 50, 100);
      
      const searchResults = await this.graphClient
        .api('/search/query')
        .post({
          requests: [{
            entityTypes: ['driveItem'],
            query: {
              queryString: sanitizedQuery
            },
            from: 0,
            size: maxResults,
            sharePointOneDriveOptions: {
              includeHiddenContent: false
            }
          }]
        });
        
      return {
        results: searchResults.value[0].hitsContainers[0].hits.map(hit => ({
          id: hit.resource.id,
          name: hit.resource.name,
          webUrl: hit.resource.webUrl,
          summary: hit.summary,
          rank: hit.rank
        })),
        totalCount: searchResults.value[0].hitsContainers[0].total
      };
    } catch (error) {
      console.error('Error searching:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Extract site ID from SharePoint URL
   */
  extractSiteId(siteUrl) {
    // This is a simplified implementation
    // In practice, you'd use the Graph API to resolve the site ID
    const urlParts = new URL(siteUrl);
    const hostname = urlParts.hostname;
    const pathname = urlParts.pathname;
    
    return `${hostname},${pathname}`;
  }

  /**
   * Sanitize query options for OData queries
   */
  sanitizeQueryOptions(options) {
    const sanitized = {};
    
    if (options.$select) {
      sanitized.$select = this.sanitizer.sanitizeODataQuery(options.$select);
    }
    
    if (options.$filter) {
      sanitized.$filter = this.sanitizer.sanitizeODataQuery(options.$filter);
    }
    
    if (options.$orderby) {
      sanitized.$orderby = this.sanitizer.sanitizeODataQuery(options.$orderby);
    }
    
    if (options.$top) {
      const topValue = parseInt(options.$top);
      if (!isNaN(topValue) && topValue > 0) {
        sanitized.$top = Math.min(topValue, 1000); // Limit to prevent abuse
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize list item data
   */
  sanitizeItemData(itemData) {
    const sanitized = {};
    
    Object.keys(itemData).forEach(key => {
      const value = itemData[key];
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizer.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value instanceof Date) {
        sanitized[key] = value.toISOString();
      } else {
        // For complex objects, convert to JSON string and sanitize
        sanitized[key] = this.sanitizer.sanitizeString(JSON.stringify(value));
      }
    });
    
    return sanitized;
  }
}

module.exports = SharePointService;