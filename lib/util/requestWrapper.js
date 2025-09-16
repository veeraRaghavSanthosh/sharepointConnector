/**
 * Request wrapper to migrate from deprecated 'request' library to 'axios'
 * This provides backward compatibility while using the secure axios library
 */

const axios = require('axios');
const https = require('https');

/**
 * Convert request-style options to axios config
 */
function convertRequestOptionsToAxios(options, callback) {
  const axiosConfig = {
    method: options.method || 'GET',
    url: options.url || options.uri,
    headers: options.headers || {},
    timeout: options.timeout || 30000,
    maxRedirects: options.followRedirect !== false ? 5 : 0,
    validateStatus: () => true, // Don't throw on HTTP error codes
  };

  // Handle authentication
  if (options.auth) {
    if (typeof options.auth === 'object') {
      axiosConfig.auth = {
        username: options.auth.username,
        password: options.auth.password
      };
    } else if (typeof options.auth === 'string') {
      axiosConfig.headers.Authorization = options.auth;
    }
  }

  // Handle JSON data
  if (options.json) {
    if (typeof options.json === 'object') {
      axiosConfig.data = options.json;
      axiosConfig.headers['Content-Type'] = 'application/json';
    } else if (options.json === true) {
      axiosConfig.responseType = 'json';
    }
  }

  // Handle form data
  if (options.form) {
    axiosConfig.data = options.form;
    axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  // Handle body/data
  if (options.body) {
    axiosConfig.data = options.body;
  }

  // Handle agent (for keep-alive)
  if (options.agent) {
    axiosConfig.httpsAgent = options.agent;
  }

  // Handle proxy
  if (options.proxy) {
    const proxyUrl = new URL(options.proxy);
    axiosConfig.proxy = {
      protocol: proxyUrl.protocol,
      host: proxyUrl.hostname,
      port: proxyUrl.port,
      auth: proxyUrl.username && proxyUrl.password ? {
        username: proxyUrl.username,
        password: proxyUrl.password
      } : undefined
    };
  }

  // Handle strictSSL
  if (options.strictSSL === false) {
    axiosConfig.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  return axiosConfig;
}

/**
 * Convert axios response to request-style response
 */
function convertAxiosResponseToRequest(axiosResponse) {
  return {
    statusCode: axiosResponse.status,
    statusMessage: axiosResponse.statusText,
    headers: axiosResponse.headers,
    body: axiosResponse.data,
    request: {
      uri: axiosResponse.config.url,
      method: axiosResponse.config.method
    }
  };
}

/**
 * Main request function that mimics the request library API
 */
function request(options, callback) {
  // Handle request(url, callback) format
  if (typeof options === 'string') {
    options = { url: options };
  }

  const axiosConfig = convertRequestOptionsToAxios(options, callback);

  return axios(axiosConfig)
    .then(response => {
      const requestStyleResponse = convertAxiosResponseToRequest(response);
      if (callback) {
        callback(null, requestStyleResponse, response.data);
      }
      return requestStyleResponse;
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const requestStyleResponse = convertAxiosResponseToRequest(error.response);
        if (callback) {
          callback(null, requestStyleResponse, error.response.data);
        }
        return requestStyleResponse;
      } else {
        // Something happened in setting up the request that triggered an Error
        if (callback) {
          callback(error);
        }
        throw error;
      }
    });
}

// Add get method for compatibility
request.get = function(options, callback) {
  if (typeof options === 'string') {
    options = { url: options, method: 'GET' };
  } else {
    options = Object.assign({}, options, { method: 'GET' });
  }
  return request(options, callback);
};

// Add post method for compatibility
request.post = function(options, callback) {
  if (typeof options === 'string') {
    options = { url: options, method: 'POST' };
  } else {
    options = Object.assign({}, options, { method: 'POST' });
  }
  return request(options, callback);
};

module.exports = request;