/**
 * SharePoint Connector Logger
 * 
 * Provides centralized logging functionality with configurable log levels.
 * Maintains backward compatibility with the existing verbose flag.
 * 
 * Log Levels:
 * - ERROR (0): Error conditions
 * - WARN (1): Warning conditions  
 * - INFO (2): Informational messages
 * - DEBUG (3): Debug-level messages
 * - TRACE (4): Trace-level messages (most verbose)
 */

var util = require('util');

// Log level constants
var LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Log level names for output
var LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
  4: 'TRACE'
};

/**
 * Creates a logger instance for the SharePoint client
 * @param {Object} client - SharePoint client configuration
 * @returns {Object} Logger instance with logging methods
 */
module.exports = function(client) {
  
  // Determine log level from client configuration
  var logLevel = getLogLevel(client);
  
  /**
   * Determines the appropriate log level based on client configuration
   * Maintains backward compatibility with verbose flag
   */
  function getLogLevel(client) {
    // Check for explicit logLevel configuration
    if (typeof client.logLevel === 'number' && client.logLevel >= 0 && client.logLevel <= 4) {
      return client.logLevel;
    }
    
    // Check for string-based log level
    if (typeof client.logLevel === 'string') {
      var level = client.logLevel.toUpperCase();
      if (LOG_LEVELS.hasOwnProperty(level)) {
        return LOG_LEVELS[level];
      }
    }
    
    // Backward compatibility: use verbose flag
    if (client.verbose === true) {
      return LOG_LEVELS.DEBUG; // When verbose=true, show DEBUG level
    }
    
    // Default to INFO level
    return LOG_LEVELS.INFO;
  }
  
  /**
   * Core logging function
   * @param {number} level - Log level (0-4)
   * @param {string} category - Log category/component
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  function log(level, category, message, data) {
    if (level > logLevel) {
      return; // Don't log if level is higher than configured
    }
    
    var timestamp = new Date().toISOString();
    var levelName = LOG_LEVEL_NAMES[level];
    var prefix = '[' + timestamp + '] [' + levelName + '] [' + category + ']';
    
    if (data && typeof data === 'object') {
      console.log(prefix + ' ' + message, util.inspect(data, { 
        depth: 3, 
        colors: false,
        showHidden: false,
        maxArrayLength: 10
      }));
    } else if (data !== undefined) {
      console.log(prefix + ' ' + message, data);
    } else {
      console.log(prefix + ' ' + message);
    }
  }
  
  /**
   * Logs performance timing information
   * @param {string} operation - Operation name
   * @param {number} startTime - Start time (Date.now())
   * @param {Object} [metadata] - Additional metadata
   */
  function logTiming(operation, startTime, metadata) {
    if (logLevel >= LOG_LEVELS.DEBUG) {
      var duration = Date.now() - startTime;
      var message = operation + ' completed in ' + duration + 'ms';
      log(LOG_LEVELS.DEBUG, 'PERF', message, metadata);
    }
  }
  
  /**
   * Logs HTTP request/response information
   * @param {Object} requestOpts - Request options
   * @param {Object} [response] - Response object
   * @param {string} [error] - Error message if request failed
   */
  function logHttpActivity(requestOpts, response, error) {
    if (logLevel >= LOG_LEVELS.TRACE) {
      var url = requestOpts.url || 'unknown';
      var method = (requestOpts.method || 'GET').toUpperCase();
      
      if (error) {
        log(LOG_LEVELS.ERROR, 'HTTP', method + ' ' + url + ' failed', { error: error });
      } else {
        var statusCode = response && response.statusCode ? response.statusCode : 'unknown';
        var message = method + ' ' + url + ' -> ' + statusCode;
        
        var logData = {
          method: method,
          url: url,
          statusCode: statusCode
        };
        
        // Add response headers for trace level
        if (response && response.headers) {
          logData.responseHeaders = response.headers;
        }
        
        log(LOG_LEVELS.TRACE, 'HTTP', message, logData);
      }
    }
  }
  
  /**
   * Logs SharePoint operation details
   * @param {string} operation - Operation type (LIST, ITEM, AUTH, etc.)
   * @param {string} action - Specific action (CREATE, READ, UPDATE, DELETE)
   * @param {Object} details - Operation details
   */
  function logOperation(operation, action, details) {
    if (logLevel >= LOG_LEVELS.DEBUG) {
      var message = operation + '.' + action;
      log(LOG_LEVELS.DEBUG, 'SP_OP', message, details);
    }
  }
  
  // Public API
  return {
    // Log level constants
    LEVELS: LOG_LEVELS,
    
    // Current log level
    level: logLevel,
    
    // Basic logging methods
    error: function(category, message, data) {
      log(LOG_LEVELS.ERROR, category, message, data);
    },
    
    warn: function(category, message, data) {
      log(LOG_LEVELS.WARN, category, message, data);
    },
    
    info: function(category, message, data) {
      log(LOG_LEVELS.INFO, category, message, data);
    },
    
    debug: function(category, message, data) {
      log(LOG_LEVELS.DEBUG, category, message, data);
    },
    
    trace: function(category, message, data) {
      log(LOG_LEVELS.TRACE, category, message, data);
    },
    
    // Specialized logging methods
    timing: logTiming,
    http: logHttpActivity,
    operation: logOperation,
    
    // Utility method to check if a log level is enabled
    isEnabled: function(level) {
      return level <= logLevel;
    },
    
    // Method to get current log level name
    getCurrentLevelName: function() {
      return LOG_LEVEL_NAMES[logLevel];
    }
  };
};