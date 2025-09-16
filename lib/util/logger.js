/*
  Logging utility for SharePoint Connector
  Supports different log levels and respects client configuration
*/

var LOG_LEVELS = {
  'trace': 0,
  'debug': 1,
  'info': 2,
  'warn': 3,
  'error': 4,
  'silent': 5
};

module.exports = function(client) {
  // Default log level is 'info' unless client specifies otherwise
  var logLevel = client.logLevel || 'info';
  var currentLevel = LOG_LEVELS[logLevel] || LOG_LEVELS['info'];

  function shouldLog(level) {
    return LOG_LEVELS[level] >= currentLevel;
  }

  function formatMessage(level, component, message, data) {
    var timestamp = new Date().toISOString();
    var prefix = '[' + timestamp + '] [' + level.toUpperCase() + '] [' + component + ']';
    
    if (data && typeof data === 'object') {
      return prefix + ' ' + message + ' ' + JSON.stringify(data, null, 2);
    }
    return prefix + ' ' + message;
  }

  return {
    trace: function(component, message, data) {
      if (shouldLog('trace')) {
        console.log(formatMessage('trace', component, message, data));
      }
    },

    debug: function(component, message, data) {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', component, message, data));
      }
    },

    info: function(component, message, data) {
      if (shouldLog('info')) {
        console.log(formatMessage('info', component, message, data));
      }
    },

    warn: function(component, message, data) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', component, message, data));
      }
    },

    error: function(component, message, data) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', component, message, data));
      }
    },

    // Utility method to check if a specific log level is enabled
    isLevelEnabled: function(level) {
      return shouldLog(level);
    },

    // Get current log level
    getLogLevel: function() {
      return logLevel;
    }
  };
};