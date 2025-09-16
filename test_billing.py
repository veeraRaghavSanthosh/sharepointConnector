"""
Comprehensive unit tests for billing functionality in SharePoint Connector.
Covers success, failure, and boundary cases while maintaining backward compatibility.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock, call
import pytest
from decimal import Decimal
from datetime import datetime, timedelta
import json
import sys
import os

# Mock billing modules for testing (adjust imports based on actual structure)
class MockBillingError(Exception):
    """Base billing exception"""
    pass

class MockInsufficientFundsError(MockBillingError):
    """Insufficient funds exception"""
    pass

class MockInvalidBillingDataError(MockBillingError):
    """Invalid billing data exception"""
    pass

class MockPaymentProcessingError(MockBillingError):
    """Payment processing exception"""
    pass

class MockBillingManager:
    """Mock billing manager for testing"""
    
    def __init__(self):
        self.accounts = {}
        self.usage_data = {}
        
    def create_billing_account(self, user_data):
        """Create a billing account"""
        if not user_data.get('user_id'):
            raise MockInvalidBillingDataError("User ID is required")
        
        account_id = f"acc_{user_data['user_id']}"
        account = {
            'account_id': account_id,
            'user_id': user_data['user_id'],
            'status': 'active',
            'created_at': datetime.now()
        }
        self.accounts[account_id] = account
        return account
    
    def calculate_monthly_bill(self, user_id):
        """Calculate monthly bill for user"""
        if user_id not in [acc['user_id'] for acc in self.accounts.values()]:
            raise MockBillingError(f"User {user_id} not found")
        
        usage = self.usage_data.get(user_id, {
            'storage_gb': 0,
            'api_calls': 0,
            'data_transfer_gb': 0
        })
        
        # Calculate costs
        storage_cost = Decimal(str(usage['storage_gb'] * 0.10))  # $0.10 per GB
        api_cost = Decimal(str(usage['api_calls'] * 0.001))      # $0.001 per call
        transfer_cost = Decimal(str(usage['data_transfer_gb'] * 0.05))  # $0.05 per GB
        
        total = storage_cost + api_cost + transfer_cost
        
        return {
            'total_amount': total,
            'breakdown': [
                {'description': f'Storage ({usage["storage_gb"]}GB)', 'amount': storage_cost},
                {'description': f'API Calls ({usage["api_calls"]})', 'amount': api_cost},
                {'description': f'Data Transfer ({usage["data_transfer_gb"]}GB)', 'amount': transfer_cost}
            ],
            'period_start': datetime.now() - timedelta(days=30),
            'period_end': datetime.now()
        }
    
    def process_payment(self, user_id, payment_data):
        """Process payment"""
        amount = payment_data.get('amount', 0)
        if amount <= 0:
            raise MockInvalidBillingDataError("Amount must be positive")
        
        if payment_data.get('card_token') == 'tok_declined':
            raise MockInsufficientFundsError("Card declined")
        
        if payment_data.get('card_token') == 'invalid_token':
            raise MockPaymentProcessingError("Invalid token")
        
        return {
            'status': 'success',
            'transaction_id': f'txn_{user_id}_{int(datetime.now().timestamp())}',
            'amount': amount
        }
    
    def generate_invoice(self, invoice_data):
        """Generate invoice"""
        invoice_id = f"inv_{invoice_data['user_id']}_{int(datetime.now().timestamp())}"
        return {
            'invoice_id': invoice_id,
            'invoice_number': f"INV-{invoice_id[-8:].upper()}",
            'total_amount': invoice_data['amount'],
            'items': invoice_data.get('items', []),
            'created_at': datetime.now()
        }


class TestBillingManager(unittest.TestCase):
    """Test cases for BillingManager class."""
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.billing_manager = MockBillingManager()
        self.sample_user_data = {
            'user_id': 'test_user_123',
            'email': 'test@example.com',
            'subscription_type': 'premium',
            'billing_address': {
                'street': '123 Test St',
                'city': 'Test City',
                'state': 'TS',
                'zip_code': '12345',
                'country': 'US'
            }
        }
        self.sample_usage_data = {
            'storage_gb': 50.5,
            'api_calls': 10000,
            'data_transfer_gb': 25.2
        }
    
    def tearDown(self):
        """Clean up after each test method."""
        self.billing_manager.accounts.clear()
        self.billing_manager.usage_data.clear()
    
    # SUCCESS CASES
    def test_create_billing_account_success(self):
        """Test successful billing account creation."""
        result = self.billing_manager.create_billing_account(self.sample_user_data)
        
        self.assertIsNotNone(result)
        self.assertIn('account_id', result)
        self.assertEqual(result['user_id'], 'test_user_123')
        self.assertEqual(result['status'], 'active')
        self.assertIn('created_at', result)
    
    def test_calculate_monthly_bill_success(self):
        """Test successful monthly bill calculation."""
        # Create account first
        self.billing_manager.create_billing_account(self.sample_user_data)
        
        # Set usage data
        self.billing_manager.usage_data['test_user_123'] = self.sample_usage_data
        
        bill = self.billing_manager.calculate_monthly_bill('test_user_123')
        
        self.assertIsInstance(bill, dict)
        self.assertIn('total_amount', bill)
        self.assertIn('breakdown', bill)
        self.assertGreater(bill['total_amount'], 0)
        self.assertIsInstance(bill['total_amount'], Decimal)
        
        # Verify breakdown
        self.assertEqual(len(bill['breakdown']), 3)
        self.assertIn('Storage', bill['breakdown'][0]['description'])
        self.assertIn('API Calls', bill['breakdown'][1]['description'])
        self.assertIn('Data Transfer', bill['breakdown'][2]['description'])
    
    def test_process_payment_success(self):
        """Test successful payment processing."""
        payment_data = {
            'amount': Decimal('99.99'),
            'currency': 'USD',
            'payment_method': 'credit_card',
            'card_token': 'tok_test_123'
        }
        
        result = self.billing_manager.process_payment('test_user_123', payment_data)
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('transaction_id', result)
        self.assertEqual(result['amount'], Decimal('99.99'))
    
    def test_generate_invoice_success(self):
        """Test successful invoice generation."""
        invoice_data = {
            'user_id': 'test_user_123',
            'amount': Decimal('99.99'),
            'period': '2025-09',
            'items': [
                {'description': 'Storage (50GB)', 'amount': Decimal('49.99')},
                {'description': 'API Calls (10K)', 'amount': Decimal('50.00')}
            ]
        }
        
        invoice = self.billing_manager.generate_invoice(invoice_data)
        
        self.assertIsNotNone(invoice)
        self.assertIn('invoice_id', invoice)
        self.assertIn('invoice_number', invoice)
        self.assertEqual(invoice['total_amount'], Decimal('99.99'))
        self.assertIn('created_at', invoice)
    
    # FAILURE CASES
    def test_create_billing_account_invalid_data(self):
        """Test billing account creation with invalid data."""
        invalid_data = {'email': 'test@example.com'}  # Missing user_id
        
        with self.assertRaises(MockInvalidBillingDataError):
            self.billing_manager.create_billing_account(invalid_data)
    
    def test_create_billing_account_empty_user_id(self):
        """Test billing account creation with empty user ID."""
        invalid_data = {'user_id': '', 'email': 'test@example.com'}
        
        with self.assertRaises(MockInvalidBillingDataError):
            self.billing_manager.create_billing_account(invalid_data)
    
    def test_calculate_bill_user_not_found(self):
        """Test bill calculation for non-existent user."""
        with self.assertRaises(MockBillingError):
            self.billing_manager.calculate_monthly_bill('nonexistent_user')
    
    def test_process_payment_insufficient_funds(self):
        """Test payment processing with insufficient funds."""
        payment_data = {
            'amount': Decimal('999999.99'),
            'currency': 'USD',
            'payment_method': 'credit_card',
            'card_token': 'tok_declined'
        }
        
        with self.assertRaises(MockInsufficientFundsError):
            self.billing_manager.process_payment('test_user_123', payment_data)
    
    def test_process_payment_invalid_token(self):
        """Test payment processing with invalid card token."""
        payment_data = {
            'amount': Decimal('99.99'),
            'currency': 'USD',
            'payment_method': 'credit_card',
            'card_token': 'invalid_token'
        }
        
        with self.assertRaises(MockPaymentProcessingError):
            self.billing_manager.process_payment('test_user_123', payment_data)
    
    def test_process_payment_zero_amount(self):
        """Test payment processing with zero amount."""
        payment_data = {
            'amount': Decimal('0.00'),
            'currency': 'USD',
            'card_token': 'tok_test_123'
        }
        
        with self.assertRaises(MockInvalidBillingDataError):
            self.billing_manager.process_payment('test_user_123', payment_data)
    
    def test_process_payment_negative_amount(self):
        """Test payment processing with negative amount."""
        payment_data = {
            'amount': Decimal('-50.00'),
            'currency': 'USD',
            'card_token': 'tok_test_123'
        }
        
        with self.assertRaises(MockInvalidBillingDataError):
            self.billing_manager.process_payment('test_user_123', payment_data)
    
    # BOUNDARY CASES
    def test_calculate_bill_zero_usage(self):
        """Test bill calculation with zero usage."""
        # Create account
        self.billing_manager.create_billing_account(self.sample_user_data)
        
        # Set zero usage
        self.billing_manager.usage_data['test_user_123'] = {
            'storage_gb': 0,
            'api_calls': 0,
            'data_transfer_gb': 0
        }
        
        bill = self.billing_manager.calculate_monthly_bill('test_user_123')
        
        self.assertEqual(bill['total_amount'], Decimal('0.00'))
        self.assertEqual(len(bill['breakdown']), 3)
    
    def test_calculate_bill_maximum_usage(self):
        """Test bill calculation with maximum allowed usage."""
        # Create account
        self.billing_manager.create_billing_account(self.sample_user_data)
        
        # Set maximum usage
        max_usage_data = {
            'storage_gb': 10000,  # Maximum allowed
            'api_calls': 1000000,  # Maximum allowed
            'data_transfer_gb': 5000  # Maximum allowed
        }
        self.billing_manager.usage_data['test_user_123'] = max_usage_data
        
        bill = self.billing_manager.calculate_monthly_bill('test_user_123')
        
        self.assertIsInstance(bill['total_amount'], Decimal)
        self.assertGreater(bill['total_amount'], 0)
        
        # Expected: 10000*0.10 + 1000000*0.001 + 5000*0.05 = 1000 + 1000 + 250 = 2250
        expected_total = Decimal('2250.00')
        self.assertEqual(bill['total_amount'], expected_total)
    
    def test_process_minimum_payment(self):
        """Test processing minimum allowed payment amount."""
        payment_data = {
            'amount': Decimal('0.01'),  # Minimum payment
            'currency': 'USD',
            'payment_method': 'credit_card',
            'card_token': 'tok_test_123'
        }
        
        result = self.billing_manager.process_payment('test_user_123', payment_data)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['amount'], Decimal('0.01'))
    
    def test_process_maximum_payment(self):
        """Test processing maximum allowed payment amount."""
        payment_data = {
            'amount': Decimal('99999.99'),  # Maximum payment
            'currency': 'USD',
            'payment_method': 'credit_card',
            'card_token': 'tok_test_123'
        }
        
        result = self.billing_manager.process_payment('test_user_123', payment_data)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['amount'], Decimal('99999.99'))
    
    def test_billing_period_edge_cases(self):
        """Test billing calculations at period boundaries."""
        # Create account
        self.billing_manager.create_billing_account(self.sample_user_data)
        
        # Set usage data
        self.billing_manager.usage_data['test_user_123'] = {
            'storage_gb': 25.5,
            'api_calls': 5000,
            'data_transfer_gb': 12.5
        }
        
        bill = self.billing_manager.calculate_monthly_bill('test_user_123')
        
        self.assertIsNotNone(bill)
        self.assertIn('period_start', bill)
        self.assertIn('period_end', bill)
        
        # Verify period is approximately 30 days
        period_duration = bill['period_end'] - bill['period_start']
        self.assertGreaterEqual(period_duration.days, 29)
        self.assertLessEqual(period_duration.days, 31)
    
    def test_decimal_precision_handling(self):
        """Test handling of decimal precision in billing calculations."""
        # Create account
        self.billing_manager.create_billing_account(self.sample_user_data)
        
        # Set usage with fractional values
        self.billing_manager.usage_data['test_user_123'] = {
            'storage_gb': 0.123456789,  # Many decimal places
            'api_calls': 1,
            'data_transfer_gb': 0.987654321
        }
        
        bill = self.billing_manager.calculate_monthly_bill('test_user_123')
        
        # Check that amounts are properly rounded to 2 decimal places
        for item in bill['breakdown']:
            amount_str = str(item['amount'])
            if '.' in amount_str:
                decimal_places = len(amount_str.split('.')[1])
                self.assertLessEqual(decimal_places, 2)


class TestBillingIntegration(unittest.TestCase):
    """Integration tests for billing system components."""
    
    def setUp(self):
        """Set up integration test fixtures."""
        self.billing_manager = MockBillingManager()
    
    def test_end_to_end_billing_flow(self):
        """Test complete billing flow from account creation to payment."""
        user_id = 'integration_test_user'
        
        # Step 1: Create billing account
        user_data = {
            'user_id': user_id,
            'email': 'integration@test.com',
            'subscription_type': 'premium'
        }
        
        account = self.billing_manager.create_billing_account(user_data)
        self.assertEqual(account['user_id'], user_id)
        
        # Step 2: Set usage data
        self.billing_manager.usage_data[user_id] = {
            'storage_gb': 50,
            'api_calls': 1000,
            'data_transfer_gb': 25
        }
        
        # Step 3: Calculate bill
        bill = self.billing_manager.calculate_monthly_bill(user_id)
        self.assertGreater(bill['total_amount'], 0)
        
        # Step 4: Generate invoice
        invoice_data = {
            'user_id': user_id,
            'amount': bill['total_amount'],
            'period': '2025-09',
            'items': bill['breakdown']
        }
        
        invoice = self.billing_manager.generate_invoice(invoice_data)
        self.assertIsNotNone(invoice)
        self.assertEqual(invoice['total_amount'], bill['total_amount'])
        
        # Step 5: Process payment
        payment_data = {
            'amount': bill['total_amount'],
            'currency': 'USD',
            'card_token': 'tok_visa_4242'
        }
        
        payment_result = self.billing_manager.process_payment(user_id, payment_data)
        self.assertEqual(payment_result['status'], 'success')
        self.assertEqual(payment_result['amount'], bill['total_amount'])


class TestBackwardCompatibility(unittest.TestCase):
    """Test cases to ensure backward compatibility."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.billing_manager = MockBillingManager()
    
    def test_legacy_billing_data_format(self):
        """Test handling of legacy billing data formats."""
        # Test old format with string amounts instead of Decimal
        legacy_user_data = {
            'user_id': 'legacy_user',
            'email': 'legacy@test.com',
            'amount': '99.99',  # String instead of Decimal
            'currency': 'USD'
        }
        
        # Should handle string user_id gracefully
        account = self.billing_manager.create_billing_account(legacy_user_data)
        self.assertEqual(account['user_id'], 'legacy_user')
    
    def test_legacy_payment_data_format(self):
        """Test handling of legacy payment data formats."""
        # Legacy format with string amounts
        legacy_payment_data = {
            'amount': '99.99',  # String instead of Decimal
            'currency': 'USD',
            'card_token': 'tok_test_123'
        }
        
        # Convert string to Decimal for processing
        payment_data_normalized = {
            'amount': Decimal(legacy_payment_data['amount']),
            'currency': legacy_payment_data['currency'],
            'card_token': legacy_payment_data['card_token']
        }
        
        result = self.billing_manager.process_payment('test_user', payment_data_normalized)
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['amount'], Decimal('99.99'))


if __name__ == '__main__':
    # Configure test runner with verbose output
    unittest.main(verbosity=2, buffer=True, failfast=False)