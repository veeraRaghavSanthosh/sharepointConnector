var axios = require('axios'),
_ = require('underscore');

module.exports = function(client, httpOpts, cb){
  const axiosConfig = _.extend({}, httpOpts, client.baseHTTPOptions, {
    auth : {
      username: client.auth.username,
      password: client.auth.password
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...httpOpts.headers
    },
    validateStatus: () => true // Don't throw errors for HTTP status codes
  });

  // Convert request-style options to axios
  if (httpOpts.json || httpOpts.json === true) {
    axiosConfig.headers['Accept'] = 'application/json';
    if (axiosConfig.data && typeof axiosConfig.data === 'object') {
      axiosConfig.headers['Content-Type'] = 'application/json';
    }
  }

  return axios(axiosConfig)
    .then(response => {
      // Convert axios response to request-like response for backward compatibility
      const requestResponse = {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: response.headers,
        body: response.data
      };
      cb(null, requestResponse, response.data);
    })
    .catch(error => {
      const requestError = new Error(error.message);
      if (error.response) {
        requestError.statusCode = error.response.status;
        requestError.response = error.response;
      }
      cb(requestError);
    });
};
