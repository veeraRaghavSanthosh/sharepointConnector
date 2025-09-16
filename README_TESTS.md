# SharePoint Connector Billing Test Suite

This comprehensive test suite provides unit tests for billing functionality in the SharePoint Connector, covering success cases, failure scenarios, and boundary conditions while maintaining backward compatibility.

## 📁 Test Structure

```
├── test_billing.py                    # Core billing functionality tests
├── test_billing_sharepoint_specific.py # SharePoint-specific billing tests
├── test_runner.py                     # Custom test runner with reporting
├── requirements_test.txt              # Testing dependencies
├── pytest.ini                        # PyTest configuration
└── README_TESTS.md                   # This documentation
```

## 🧪 Test Coverage Areas

### Core Billing Tests (`test_billing.py`)
- **Success Cases**: Account creation, bill calculation, payment processing, invoice generation
- **Failure Cases**: Invalid data, insufficient funds, authentication errors, processing failures
- **Boundary Cases**: Zero usage, maximum usage, minimum/maximum payments, decimal precision
- **Integration Tests**: End-to-end billing flows, multi-user scenarios
- **Backward Compatibility**: Legacy data formats, deprecated APIs, configuration support

### SharePoint-Specific Tests (`test_billing_sharepoint_specific.py`)
- **Document Operations**: Upload/download billing, storage costs
- **Search Operations**: Basic, advanced, and faceted search billing
- **Site Collections**: Active/inactive sites, premium features
- **API Operations**: Rate limiting, premium tiers, overage charges
- **Compliance Features**: Retention policies, DLP, audit logs, eDiscovery
- **Integration Billing**: Azure AD, Office 365, Power Platform
- **Backup & Restore**: Backup operations, restore costs, storage billing

## 🚀 Running Tests

### Quick Start

```bash
# Install dependencies
pip install -r requirements_test.txt

# Run all tests with custom runner
python test_runner.py

# Run specific test suite
python test_runner.py --suite basic
python test_runner.py --suite sharepoint
```

### Using PyTest

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest test_billing.py

# Run specific test class
pytest test_billing.py::TestBillingManager

# Run specific test method
pytest test_billing.py::TestBillingManager::test_create_billing_account_success

# Run tests with specific markers
pytest -m "unit"
pytest -m "integration"
pytest -m "sharepoint"
```

### Using Standard Unittest

```bash
# Run all tests
python -m unittest discover

# Run specific test file
python -m unittest test_billing

# Run with verbose output
python -m unittest -v test_billing.TestBillingManager
```

## 📊 Test Categories

### Success Cases ✅
- Valid account creation with complete data
- Successful bill calculation with various usage patterns
- Payment processing with valid payment methods
- Invoice generation with proper formatting
- Usage tracking for all operation types

### Failure Cases ❌
- Invalid or missing required data
- Payment failures (insufficient funds, declined cards)
- Authentication and authorization failures
- Network timeouts and connection errors
- Invalid currency codes and payment tokens

### Boundary Cases 🔍
- Zero usage scenarios
- Maximum allowed usage limits
- Minimum and maximum payment amounts
- Fractional usage values and decimal precision
- Date boundary conditions (month/year edges)
- Concurrent operations and race conditions

### SharePoint-Specific Cases 📄
- Document upload/download billing
- SharePoint search operation costs
- Site collection management billing
- Workflow execution charges
- Compliance feature billing
- Multi-tenant deployment costs

## 🔧 Configuration

### Environment Variables
```bash
# Test configuration
export BILLING_TEST_MODE=true
export MOCK_PAYMENT_PROCESSOR=true
export TEST_DATABASE_URL=sqlite:///:memory:

# SharePoint test configuration
export SHAREPOINT_TEST_TENANT=test-tenant
export SHAREPOINT_MOCK_RESPONSES=true
```

### Test Data
The tests use mock data and fixtures to ensure:
- Consistent test results
- No dependency on external services
- Fast test execution
- Isolated test environments

## 📈 Coverage Requirements

- **Minimum Coverage**: 80%
- **Target Coverage**: 95%
- **Critical Paths**: 100% (payment processing, billing calculations)

### Coverage Areas
- ✅ Account Management: 95%+
- ✅ Bill Calculation: 100%
- ✅ Payment Processing: 100%
- ✅ Invoice Generation: 90%+
- ✅ Usage Tracking: 85%+
- ✅ Error Handling: 90%+
- ✅ Backward Compatibility: 85%+

## 🔄 Backward Compatibility

The test suite ensures backward compatibility by:

1. **Legacy Data Format Support**
   - String amounts converted to Decimal
   - Case-insensitive field handling
   - Optional field defaults

2. **API Compatibility**
   - Deprecated method support
   - Legacy endpoint testing
   - Configuration format migration

3. **Database Schema Changes**
   - Migration testing
   - Data integrity verification
   - Performance impact assessment

## 🚨 Error Handling

Tests cover comprehensive error scenarios:

- **Network Failures**: Connection timeouts, DNS resolution
- **Authentication Errors**: Invalid tokens, expired credentials
- **Payment Failures**: Declined cards, insufficient funds
- **Data Validation**: Invalid formats, missing fields
- **System Limits**: Quota exceeded, rate limiting
- **Concurrent Access**: Race conditions, deadlocks

## 🔍 Test Utilities

### Mock Objects
- `MockBillingManager`: Simulates billing operations
- `MockPaymentProcessor`: Handles payment simulation
- `MockUsageTracker`: Tracks usage data
- `MockInvoiceGenerator`: Creates test invoices

### Test Fixtures
- Sample user data with various configurations
- Usage data patterns (zero, normal, maximum)
- Payment data with different scenarios
- SharePoint-specific test data

### Assertion Helpers
- Decimal precision validation
- Date range verification
- Error message checking
- Response format validation

## 📝 Writing New Tests

### Test Naming Convention
```python
def test_[component]_[scenario]_[expected_outcome](self):
    """Test description explaining what is being tested."""
    pass
```

### Test Structure
```python
def test_example(self):
    """Test description."""
    # Arrange: Set up test data and mocks
    test_data = {...}
    
    # Act: Execute the function under test
    result = function_under_test(test_data)
    
    # Assert: Verify the results
    self.assertEqual(result['status'], 'success')
    self.assertIn('transaction_id', result)
```

### Adding SharePoint-Specific Tests
1. Create test in `test_billing_sharepoint_specific.py`
2. Use SharePoint-specific mock data
3. Test both success and failure scenarios
4. Include boundary conditions
5. Add appropriate test markers

## 🔧 Maintenance

### Regular Tasks
- Update test data for new features
- Add tests for new billing scenarios
- Review and update mock responses
- Validate backward compatibility
- Performance test updates

### Test Review Checklist
- [ ] All success paths tested
- [ ] Error conditions covered
- [ ] Boundary cases included
- [ ] Backward compatibility verified
- [ ] Performance impact assessed
- [ ] Documentation updated

## 📞 Support

For questions about the test suite:
1. Check existing test documentation
2. Review test patterns in similar components
3. Consult the main project documentation
4. Create issue with test-related questions

## 🎯 Future Enhancements

- Performance benchmarking tests
- Load testing for high-volume scenarios
- Integration with CI/CD pipelines
- Automated test data generation
- Cross-platform compatibility testing
- Security-focused billing tests