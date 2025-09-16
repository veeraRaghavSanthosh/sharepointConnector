const http = require('http');

// Test data
const validOrder = {
  customer_name: "John Doe",
  customer_email: "john.doe@example.com",
  items: [
    { name: "Product A", quantity: 2, price: 25.99 },
    { name: "Product B", quantity: 1, price: 15.50 }
  ],
  total_amount: 67.48
};

const invalidOrder = {
  customer_name: "Jane",
  customer_email: "invalid-email",
  items: [],
  total_amount: -10
};

function makeRequest(data, callback) {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/v1/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        data: JSON.parse(responseData)
      });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.write(postData);
  req.end();
}

// Test function
function runTests() {
  console.log('Testing POST /v1/orders endpoint...\n');

  // Test 1: Valid order
  console.log('Test 1: Valid order');
  makeRequest(validOrder, (err, result) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('Status Code:', result.statusCode);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    console.log('Expected: 201 Created\n');

    // Test 2: Invalid order
    console.log('Test 2: Invalid order');
    makeRequest(invalidOrder, (err, result) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('Status Code:', result.statusCode);
      console.log('Response:', JSON.stringify(result.data, null, 2));
      console.log('Expected: 400 Bad Request\n');

      // Test 3: Health check
      console.log('Test 3: Health check');
      const healthOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET'
      };

      const healthReq = http.request(healthOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('Status Code:', res.statusCode);
          console.log('Response:', JSON.stringify(JSON.parse(responseData), null, 2));
          console.log('Expected: 200 OK');
          console.log('\nAll tests completed!');
        });
      });

      healthReq.on('error', (err) => {
        console.error('Health check error:', err);
      });

      healthReq.end();
    });
  });
}

// Wait a moment for server to start, then run tests
setTimeout(runTests, 1000);