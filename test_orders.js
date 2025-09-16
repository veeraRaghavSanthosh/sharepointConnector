const http = require('http');

// Test data for the POST /v1/orders endpoint
const testOrder = {
  customer_name: "John Doe",
  customer_email: "john.doe@example.com",
  items: [
    {
      name: "Widget A",
      quantity: 2,
      price: 25.50
    },
    {
      name: "Widget B", 
      quantity: 1,
      price: 15.00
    }
  ],
  total_amount: 66.00
};

const postData = JSON.stringify(testOrder);

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

console.log('Testing POST /v1/orders endpoint...');
console.log('Test data:', JSON.stringify(testOrder, null, 2));

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    
    // Test GET endpoint to verify the order was saved
    console.log('\nTesting GET /v1/orders endpoint...');
    
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/v1/orders',
      method: 'GET'
    };
    
    const getReq = http.request(getOptions, (getRes) => {
      console.log(`GET Status: ${getRes.statusCode}`);
      
      let getData = '';
      getRes.on('data', (chunk) => {
        getData += chunk;
      });
      
      getRes.on('end', () => {
        console.log('GET Response:', JSON.stringify(JSON.parse(getData), null, 2));
      });
    });
    
    getReq.on('error', (err) => {
      console.error('GET Error:', err.message);
    });
    
    getReq.end();
  });
});

req.on('error', (err) => {
  console.error('POST Error:', err.message);
  console.log('Make sure the server is running with: node server.js');
});

req.write(postData);
req.end();