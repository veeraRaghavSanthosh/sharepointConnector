#!/usr/bin/env node

// Test script to verify the async/await conversion
const login = require('./lib/login');

console.log('🔍 Testing SharePoint Connector Auth Conversion');
console.log('=' .repeat(50));

// Mock client configuration
const mockClient = {
  auth: { 
    type: 'custom',
    custom: function(client, opts, cb) {
      // Mock successful SharePoint response
      const mockResponse = { statusCode: 200 };
      const mockBody = {
        GetContextWebInformation: {
          FormDigestValue: 'mock-digest-value-12345'
        }
      };
      // Simulate async operation
      setTimeout(() => cb(null, mockResponse, mockBody), 50);
    }
  },
  url: 'https://mocksharepoint.example.com',
  siteContext: 'web',
  baseHTTPOptions: {}
};

// Test 1: Callback Pattern (Backward Compatibility)
console.log('\n1️⃣  Testing Callback Pattern (Backward Compatibility)');
const loginFunc = login(mockClient);

loginFunc((err, response, body) => {
  if (err) {
    console.error('❌ Callback test failed:', err);
    process.exit(1);
  }
  
  console.log('✅ Callback pattern works correctly');
  console.log('✅ Base context set:', mockClient.baseContext);
  console.log('✅ Response status:', response.statusCode);
  
  // Reset for next test
  delete mockClient.baseContext;
  
  // Test 2: Promise Pattern
  console.log('\n2️⃣  Testing Promise Pattern');
  
  loginFunc()
    .then(result => {
      console.log('✅ Promise pattern works correctly');
      console.log('✅ Base context set:', mockClient.baseContext);
      console.log('✅ Response status:', result.response.statusCode);
      
      // Test 3: Error Handling
      console.log('\n3️⃣  Testing Error Handling');
      
      const errorClient = {
        auth: { 
          type: 'custom',
          custom: function(client, opts, cb) {
            setTimeout(() => cb(new Error('Mock authentication error')), 10);
          }
        },
        url: 'https://error.example.com'
      };
      
      const errorLoginFunc = login(errorClient);
      return errorLoginFunc();
    })
    .then(() => {
      console.error('❌ Error test should have failed');
      process.exit(1);
    })
    .catch(err => {
      console.log('✅ Error handling works:', err.message);
      
      // Test 4: Async/Await Usage
      console.log('\n4️⃣  Testing Async/Await Usage');
      
      (async () => {
        try {
          delete mockClient.baseContext;
          const loginFunc2 = login(mockClient);
          const result = await loginFunc2();
          
          console.log('✅ Async/await pattern works correctly');
          console.log('✅ Base context set:', mockClient.baseContext);
          console.log('✅ Response status:', result.response.statusCode);
          
          // Test 5: Direct Async Function
          if (typeof login.async === 'function') {
            console.log('\n5️⃣  Testing Direct Async Function');
            delete mockClient.baseContext;
            const directResult = await login.async(mockClient);
            console.log('✅ Direct async function works correctly');
            console.log('✅ Base context set:', mockClient.baseContext);
          }
          
          console.log('\n🎉 All tests passed successfully!');
          console.log('✅ Backward compatibility maintained');
          console.log('✅ Async/await functionality added');
          console.log('✅ Error handling works correctly');
          
        } catch (asyncErr) {
          console.error('❌ Async/await test failed:', asyncErr);
          process.exit(1);
        }
      })();
    })
    .catch(testErr => {
      console.error('❌ Test suite failed:', testErr);
      process.exit(1);
    });
});