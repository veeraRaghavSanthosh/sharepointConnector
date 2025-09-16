# SharePoint Connector Billing Tests

This document describes the comprehensive billing test suite added to the SharePoint Connector library. The tests cover success cases, failure scenarios, and boundary conditions while maintaining backward compatibility.

## 📁 Test Structure

```
lib/billing/
├── billingManager.js                 # Core billing functionality

test/unit/
├── test-billing-manager.js           # Core billing unit tests
├── test-billing-sharepoint-specific.js # SharePoint-specific billing tests
└── test-billing-integration.js       # Unit test wrapper for integration tests

test/integration/
└── test-billing-integration.js       # Integration tests with SharePoint operations
```

## 🧪 Test Coverage

### Core Billing Tests (`test-billing-manager.js`)

#### Account Management
- ✅ **Success Cases**: Account creation, user data validation, multiple accounts
- ❌ **Failure Cases**: Missing user ID, empty user ID, null data
- 🔍 **Boundary Cases**: Minimal user data, legacy data formats

#### Bill Calculation
- ✅ **Success Cases**: Monthly bill calculation, usage-based pricing, breakdown generation
- ❌ **Failure Cases**: Non-existent users
- 🔍 **Boundary Cases**: Zero usage, maximum usage, fractional values, decimal precision

#### Payment Processing
- ✅ **Success Cases**: Credit card payments, minimum/maximum amounts
- ❌ **Failure Cases**: Insufficient funds, invalid tokens, zero/negative amounts, missing tokens
- 🔍 **Boundary Cases**: Edge payment amounts, network timeouts

#### Usage Tracking
- ✅ **Success Cases**: API calls, document operations, storage tracking, multiple operations
- ❌ **Failure Cases**: Negative storage values
- 🔍 **Boundary Cases**: Zero usage, maximum usage limits

#### Backward Compatibility
- ✅ Legacy user data formats (case-insensitive fields, different naming conventions)
- ✅ Legacy payment data formats (string amounts, camelCase fields)
- ✅ Missing optional fields with defaults

#### Integration Tests
- ✅ End-to-end billing flow (account → usage → billing → invoice → payment)

### SharePoint-Specific Tests (`test-billing-sharepoint-specific.js`)

#### Document Operations
- ✅ Document upload billing (1000+ uploads)
- ✅ Document download billing (5000+ downloads)
- ✅ Mixed document operations with accurate cost calculation

#### SharePoint Search
- ✅ Search query billing
- ✅ Zero search queries handling
- ✅ High-volume search scenarios (100K+ queries)

#### API Rate Limiting
- ✅ API call tracking for rate limiting
- ✅ Overage charges for excessive API usage (5M+ calls)

#### Storage Billing
- ✅ SharePoint document library storage (500+ GB)
- ✅ Incremental storage additions
- ✅ Storage usage tracking accuracy

#### Integration Scenarios
- ✅ Office 365 integration billing patterns
- ✅ Multi-site collection scenarios (1TB+ usage)

#### Edge Cases
- ✅ SharePoint connection failures (no billing for failed operations)
- ✅ Partial operation success/failure
- ✅ Quota exceeded scenarios (15TB+ storage, 15M+ API calls)

#### Performance
- ✅ High-frequency billing calculations (100 concurrent calculations in <3s)

### Integration Tests (`test-billing-integration.js`)

#### SharePoint Operations Integration
- ✅ Billing tracking during SharePoint operations
- ✅ Concurrent operations across multiple users
- ✅ SharePoint list operations billing
- ✅ Large file operations (GB-sized files)

#### Error Handling
- ✅ Non-existent user scenarios
- ✅ Invalid payment processing
- ✅ Network timeout simulation

## 🚀 Running the Tests

### Using Grunt (Recommended)
```bash
# Run all tests including billing tests
npm test

# Or directly with grunt
grunt test
```

### Using Mocha Directly
```bash
# Run all unit tests
./node_modules/.bin/mocha test/unit/test-billing-*.js

# Run specific test file
./node_modules/.bin/mocha test/unit/test-billing-manager.js

# Run with verbose output
./node_modules/.bin/mocha test/unit/test-billing-*.js --reporter spec

# Run integration tests
./node_modules/.bin/mocha test/integration/test-billing-integration.js
```

### Test Categories
```bash
# Core billing functionality
./node_modules/.bin/mocha test/unit/test-billing-manager.js

# SharePoint-specific features
./node_modules/.bin/mocha test/unit/test-billing-sharepoint-specific.js

# Integration scenarios
./node_modules/.bin/mocha test/integration/test-billing-integration.js
```

## 📊 Billing Features Tested

### Usage Tracking
- **API Calls**: Track SharePoint API usage for billing
- **Document Operations**: Upload/download billing
- **Storage Usage**: Track storage consumption in GB
- **Search Operations**: Query-based billing
- **Data Transfer**: Bandwidth usage tracking

### Pricing Models
- **Storage**: $0.10 per GB per month
- **API Calls**: $0.001 per call
- **Data Transfer**: $0.05 per GB
- **Document Upload**: $0.01 per upload
- **Document Download**: $0.005 per download
- **Search Query**: $0.001 per query

### Payment Processing
- **Credit Card Payments**: Via token-based system
- **Multiple Currencies**: USD support with extensibility
- **Payment Validation**: Amount, token, and currency validation
- **Error Handling**: Declined cards, invalid tokens, network errors

### Invoice Generation
- **Detailed Breakdowns**: Line-item billing details
- **Multiple Formats**: JSON invoice generation
- **Period Tracking**: Monthly billing periods
- **Usage Summaries**: Comprehensive usage reporting

## 🔧 Configuration

### Environment Variables
```bash
# Test configuration (optional)
export BILLING_TEST_MODE=true
export MOCK_PAYMENTS=true

# SharePoint test configuration (for integration tests)
export SP_USERNAME=your_test_username
export SP_PASSWORD=your_test_password
export SP_HOST=https://your-sharepoint-site.com
export SP_AUTH_TYPE=ntlm
```

### Billing Manager Options
```javascript
var billingManager = new BillingManager({
  currency: 'USD',
  rates: {
    storage_gb: 0.10,
    api_calls: 0.001,
    data_transfer_gb: 0.05,
    document_upload: 0.01,
    document_download: 0.005,
    search_query: 0.001
  },
  limits: {
    max_storage_gb: 10000,
    max_api_calls: 10000000,
    max_data_transfer_gb: 5000
  }
});
```

## 🔄 Backward Compatibility

The billing system maintains backward compatibility through:

### Legacy Data Format Support
```javascript
// Old format
var legacyUserData = {
  USER_ID: 'user123',           // Uppercase
  Email: 'user@example.com',    // Mixed case
  subscriptionType: 'premium'   // camelCase
};

// New format (automatically normalized)
var normalizedData = {
  user_id: 'user123',
  email: 'user@example.com',
  subscription_type: 'premium'
};
```

### Legacy Payment Format
```javascript
// Old format
var legacyPayment = {
  amount: '99.99',              // String amount
  paymentMethod: 'credit_card', // camelCase
  cardToken: 'tok_123'          // camelCase
};

// Automatically converted to proper format
```

### API Compatibility
- Field name normalization (camelCase ↔ snake_case)
- String to number conversion for amounts
- Optional field defaults
- Graceful handling of missing data

## 📈 Performance Benchmarks

### Test Performance Targets
- **Account Creation**: <50ms per account
- **Bill Calculation**: <100ms per calculation
- **Payment Processing**: <200ms per transaction (including simulation delay)
- **Usage Tracking**: <10ms per operation
- **Concurrent Operations**: 100 operations in <3 seconds

### Memory Usage
- **Small Usage Data**: <1MB per 1000 users
- **Large Usage Data**: <10MB per 1000 enterprise users
- **Test Suite**: Complete test suite runs in <512MB memory

## 🚨 Error Scenarios Tested

### Account Management Errors
- Missing required fields (user_id)
- Invalid data types
- Null/undefined input

### Payment Processing Errors
- Insufficient funds (card declined)
- Invalid payment tokens
- Network timeouts
- Zero or negative amounts
- Missing payment information

### Usage Tracking Errors
- Negative usage values
- Non-existent users
- Invalid operation types

### SharePoint Integration Errors
- Connection failures
- Authentication errors
- Quota exceeded scenarios
- Partial operation failures

## 🔍 Test Data Patterns

### Typical Usage Patterns
```javascript
// Light user
{
  storage_gb: 5,
  api_calls: 1000,
  document_uploads: 100,
  document_downloads: 500
}

// Heavy user
{
  storage_gb: 500,
  api_calls: 50000,
  document_uploads: 5000,
  document_downloads: 25000
}

// Enterprise user
{
  storage_gb: 2000,
  api_calls: 500000,
  document_uploads: 50000,
  document_downloads: 250000
}
```

### Edge Case Patterns
- Zero usage across all metrics
- Maximum allowed usage limits
- Fractional usage values (0.123456789 GB)
- High-frequency operations (1M+ API calls)

## 📝 Adding New Tests

### Test Structure
```javascript
describe('New Billing Feature', function() {
  var billingManager;
  
  beforeEach(function() {
    billingManager = new BillingManager();
  });
  
  it('should handle new feature successfully', function(done) {
    // Test implementation
    done();
  });
});
```

### Test Categories
- **Success Cases**: Normal operation scenarios
- **Failure Cases**: Error conditions and invalid input
- **Boundary Cases**: Edge conditions and limits
- **Integration Cases**: Cross-component functionality

### Naming Convention
- `test-billing-[component].js` for unit tests
- `test-billing-[feature]-integration.js` for integration tests
- Descriptive test names: `should_handle_[scenario]_[expected_outcome]`

## 📞 Troubleshooting

### Common Issues
1. **Test Timeouts**: Increase timeout for performance tests
2. **Async Errors**: Ensure proper callback handling
3. **Memory Issues**: Clean up test data in `afterEach`
4. **Flaky Tests**: Use proper async patterns with `async` library

### Debug Tips
```javascript
// Enable verbose logging
var billingManager = new BillingManager({ verbose: true });

// Check usage data
console.log('Usage:', billingManager.usage_data);

// Verify account creation
console.log('Accounts:', billingManager.accounts);
```

## 🎯 Future Enhancements

### Planned Test Additions
- Multi-currency billing tests
- Subscription-based billing models
- Automated performance regression testing
- Cross-browser compatibility tests (for web components)
- Load testing with thousands of concurrent users

### Integration Opportunities
- CI/CD pipeline integration
- Automated billing accuracy validation
- Real-time billing monitoring tests
- Cost optimization testing scenarios

This comprehensive test suite ensures the SharePoint Connector's billing functionality is robust, accurate, and maintains backward compatibility while supporting future enhancements.