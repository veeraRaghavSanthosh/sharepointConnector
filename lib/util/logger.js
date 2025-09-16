var util = require('util');

var LOG_LEVELS = {
  'error': 0,
  'warn': 1,
  'info': 2,
  'debug': 3,
  'trace': 4
};

var DEFAULT_LOG_LEVEL = 'info';

module.exports = function(client) {
  var currentLogLevel = DEFAULT_LOG_LEVEL;
  
  if (client && client.logLevel && LOG_LEVELS.hasOwnProperty(client.logLevel.toLowerCase())) {
    currentLogLevel = client.logLevel.toLowerCase();
  } else if (process.env.SP_LOG_LEVEL && LOG_LEVELS.hasOwnProperty(process.env.SP_LOG_LEVEL.toLowerCase())) {
    currentLogLevel = process.env.SP_LOG_LEVEL.toLowerCase();
  }
  
  var currentLogLevelValue = LOG_LEVELS[currentLogLevel];
  
  function log(level, category, message, data) {
    if (LOG_LEVELS[level] > currentLogLevelValue) {
      return;
    }
    
    var timestamp = new Date().toISOString();
    var logMessage = util.format('[%s] [%s] [%s] %s', timestamp, level.toUpperCase(), category, message);
    
    if (data) {
      if (typeof data === 'object') {
        logMessage += ' ' + JSON.stringify(data, null, 2);
      } else {
        logMessage += ' ' + String(data);
      }
    }
    
    if (level === 'error') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }
  
  return {
    error: function(category, message, data) {
      log('error', category, message, data);
    },
    warn: function(category, message, data) {
      log('warn', category, message, data);
    },
    info: function(category, message, data) {
      log('info', category, message, data);
    },
    debug: function(category, message, data) {
      log('debug', category, message, data);
    },
    trace: function(category, message, data) {
      log('trace', category, message, data);
    },
    isLevelEnabled: function(level) {
      return LOG_LEVELS[level] <= currentLogLevelValue;
    },
    getLevel: function() {
      return currentLogLevel;
    }
  };
};