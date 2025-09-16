var _ = require('underscore');

/**
 * Centralized logging utility for SharePoint Connector
 * Supports configurable log levels and maintains backward compatibility
 */

// Log levels in order of priority (lower number = higher priority)
var LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

// Default log level
var DEFAULT_LOG_LEVEL = 'info';

// ANSI color codes for console output
var COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[35m', // Magenta
  trace: '\x1b[90m', // Gray
  reset: '\x1b[0m'   // Reset
};

/**
 * Creates a logger instance for a specific module
 * @param {Object} client - SharePoint client instance
 * @param {string} moduleName - Name of the module using the logger
 * @returns {Object} Logger instance with level-specific methods
 */
function createLogger(client, moduleName) {
  // Determine the effective log level
  var effectiveLogLevel = getEffectiveLogLevel(client);
  var shouldUseColors = process.stdout.isTTY && process.env.NODE_ENV !== 'production';

  /**
   * Core logging function
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  function log(level, message, data) {
    // Check if this log level should be output
    if (LOG_LEVELS[level] > LOG_LEVELS[effectiveLogLevel]) {
      return;
    }

    var timestamp = new Date().toISOString();
    var prefix = '[' + timestamp + '] [' + level.toUpperCase() + '] [' + moduleName + ']';
    
    // Apply colors if supported
    if (shouldUseColors && COLORS[level]) {
      prefix = COLORS[level] + prefix + COLORS.reset;
    }

    var logMessage = prefix + ' ' + message;

    // Use appropriate console method based on level
    var consoleMethod = getConsoleMethod(level);
    
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        consoleMethod(logMessage);
        consoleMethod(JSON.stringify(data, null, 2));
      } else {
        consoleMethod(logMessage, data);
      }
    } else {
      consoleMethod(logMessage);
    }
  }

  /**
   * Get appropriate console method for log level
   * @param {string} level - Log level
   * @returns {Function} Console method
   */
  function getConsoleMethod(level) {
    switch (level) {
      case 'error':
        return console.error;
      case 'warn':
        return console.warn;
      case 'debug':
      case 'trace':
        return console.debug || console.log;
      default:
        return console.log;
    }
  }

  // Return logger instance with level-specific methods
  return {
    error: function(message, data) {
      log('error', message, data);
    },
    warn: function(message, data) {
      log('warn', message, data);
    },
    info: function(message, data) {
      log('info', message, data);
    },
    debug: function(message, data) {
      log('debug', message, data);
    },
    trace: function(message, data) {
      log('trace', message, data);
    },
    // Utility method to check if a level is enabled
    isLevelEnabled: function(level) {
      return LOG_LEVELS[level] <= LOG_LEVELS[effectiveLogLevel];
    },
    // Get current log level
    getLogLevel: function() {
      return effectiveLogLevel;
    }
  };
}

/**
 * Determine effective log level from client configuration
 * @param {Object} client - SharePoint client instance
 * @returns {string} Effective log level
 */
function getEffectiveLogLevel(client) {
  // Check for explicit log level configuration
  if (client && client.logLevel && LOG_LEVELS.hasOwnProperty(client.logLevel)) {
    return client.logLevel;
  }

  // Backward compatibility: if verbose is true, use debug level
  if (client && client.verbose === true) {
    return 'debug';
  }

  // Check environment variable
  var envLogLevel = process.env.SHAREPOINT_LOG_LEVEL;
  if (envLogLevel && LOG_LEVELS.hasOwnProperty(envLogLevel.toLowerCase())) {
    return envLogLevel.toLowerCase();
  }

  return DEFAULT_LOG_LEVEL;
}

/**
 * Validate log level
 * @param {string} level - Log level to validate
 * @returns {boolean} True if valid
 */
function isValidLogLevel(level) {
  return typeof level === 'string' && LOG_LEVELS.hasOwnProperty(level.toLowerCase());
}

module.exports = {
  createLogger: createLogger,
  LOG_LEVELS: LOG_LEVELS,
  isValidLogLevel: isValidLogLevel,
  getEffectiveLogLevel: getEffectiveLogLevel
};