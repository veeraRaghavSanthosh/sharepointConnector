/**
 * Simple rate limiting module for SharePoint Connector
 * Prevents abuse by limiting the number of requests per time period
 */
module.exports = function(options) {
  options = options || {};
  
  // Default rate limits
  var limits = {
    requestsPerSecond: options.requestsPerSecond || 10,
    requestsPerMinute: options.requestsPerMinute || 100,
    requestsPerHour: options.requestsPerHour || 1000
  };
  
  // Request tracking windows
  var windows = {
    second: [],
    minute: [],
    hour: []
  };
  
  // Track request counts for monitoring
  var stats = {
    totalRequests: 0,
    rejectedRequests: 0,
    startTime: Date.now()
  };
  
  /**
   * Clean expired entries from tracking windows
   */
  function cleanWindows() {
    var now = Date.now();
    
    // Clean second window (keep last 1 second)
    windows.second = windows.second.filter(function(timestamp) {
      return now - timestamp < 1000;
    });
    
    // Clean minute window (keep last 60 seconds)
    windows.minute = windows.minute.filter(function(timestamp) {
      return now - timestamp < 60000;
    });
    
    // Clean hour window (keep last 3600 seconds)
    windows.hour = windows.hour.filter(function(timestamp) {
      return now - timestamp < 3600000;
    });
  }
  
  return {
    
    /**
     * Check if request is allowed under rate limits
     * @param {function} callback - Callback function (err, allowed, message)
     */
    checkLimit: function(callback) {
      var now = Date.now();
      
      // Clean expired entries
      cleanWindows();
      
      // Check rate limits
      if (windows.second.length >= limits.requestsPerSecond) {
        stats.rejectedRequests++;
        return callback(null, false, 'Rate limit exceeded: too many requests per second (max ' + limits.requestsPerSecond + ')');
      }
      
      if (windows.minute.length >= limits.requestsPerMinute) {
        stats.rejectedRequests++;
        return callback(null, false, 'Rate limit exceeded: too many requests per minute (max ' + limits.requestsPerMinute + ')');
      }
      
      if (windows.hour.length >= limits.requestsPerHour) {
        stats.rejectedRequests++;
        return callback(null, false, 'Rate limit exceeded: too many requests per hour (max ' + limits.requestsPerHour + ')');
      }
      
      // Request is allowed, record it
      windows.second.push(now);
      windows.minute.push(now);
      windows.hour.push(now);
      stats.totalRequests++;
      
      return callback(null, true);
    },
    
    /**
     * Get current rate limiting statistics
     * @returns {object} - Statistics object
     */
    getStats: function() {
      cleanWindows();
      
      var now = Date.now();
      var uptime = now - stats.startTime;
      
      return {
        totalRequests: stats.totalRequests,
        rejectedRequests: stats.rejectedRequests,
        acceptedRequests: stats.totalRequests - stats.rejectedRequests,
        rejectionRate: stats.totalRequests > 0 ? (stats.rejectedRequests / stats.totalRequests * 100).toFixed(2) + '%' : '0%',
        uptime: Math.floor(uptime / 1000) + 's',
        requestsPerSecond: stats.totalRequests > 0 ? (stats.totalRequests / (uptime / 1000)).toFixed(2) : '0',
        currentWindow: {
          second: windows.second.length,
          minute: windows.minute.length,
          hour: windows.hour.length
        }
      };
    },
    
    /**
     * Reset rate limiting statistics
     */
    resetStats: function() {
      stats.totalRequests = 0;
      stats.rejectedRequests = 0;
      stats.startTime = Date.now();
      windows.second = [];
      windows.minute = [];
      windows.hour = [];
    },
    
    /**
     * Update rate limits dynamically
     * @param {object} newLimits - New rate limit configuration
     */
    updateLimits: function(newLimits) {
      if (newLimits.requestsPerSecond && newLimits.requestsPerSecond > 0) {
        limits.requestsPerSecond = newLimits.requestsPerSecond;
      }
      if (newLimits.requestsPerMinute && newLimits.requestsPerMinute > 0) {
        limits.requestsPerMinute = newLimits.requestsPerMinute;
      }
      if (newLimits.requestsPerHour && newLimits.requestsPerHour > 0) {
        limits.requestsPerHour = newLimits.requestsPerHour;
      }
    },
    
    /**
     * Get current rate limit configuration
     * @returns {object} - Current limits
     */
    getLimits: function() {
      return {
        requestsPerSecond: limits.requestsPerSecond,
        requestsPerMinute: limits.requestsPerMinute,
        requestsPerHour: limits.requestsPerHour
      };
    }
  };
};