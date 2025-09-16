"""
Comprehensive unit tests for SharePoint Authentication Module
Covers success cases, failure cases, boundary conditions, and network scenarios
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import requests
from requests.exceptions import ConnectionError, Timeout, RequestException, HTTPError
import json
import time


class SharePointAuthError(Exception):
    """Custom exception for SharePoint authentication errors"""
    pass


class MockSharePointAuth:
    """Mock SharePoint authentication class for testing purposes"""
    
    def __init__(self, site_url):
        if not site_url:
            raise ValueError("Site URL cannot be empty")
        self.site_url = site_url.rstrip('/')
        self.session = requests.Session()
        self._auth_token = None
        self._cookies = None
        self._last_auth_time = None
    
    def authenticate_basic(self, username, password):
        """Mock basic authentication with comprehensive validation"""
        # Input validation
        if not username or not isinstance(username, str):
            raise ValueError("Username must be a non-empty string")
        if not password or not isinstance(password, str):
            raise ValueError("Password must be a non-empty string")
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(username) > 100:
            raise ValueError("Username cannot exceed 100 characters")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(password) > 128:
            raise ValueError("Password cannot exceed 128 characters")
        
        # Simulate network call
        try:
            auth_url = f"{self.site_url}/_api/web/currentuser"
            response = self.session.get(
                auth_url,
                auth=(username, password),
                headers={'Accept': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                self._auth_token = response.headers.get('X-RequestDigest', 'mock_token')
                self._cookies = response.cookies
                self._last_auth_time = time.time()
                return True
            elif response.status_code == 401:
                raise SharePointAuthError("Invalid credentials provided")
            elif response.status_code == 403:
                raise SharePointAuthError("Access forbidden - user may not have permissions")
            elif response.status_code == 404:
                raise SharePointAuthError("SharePoint site not found")
            else:
                raise SharePointAuthError(f"Authentication failed with status code: {response.status_code}")
                
        except ConnectionError:
            raise SharePointAuthError("Unable to connect to SharePoint server")
        except Timeout:
            raise SharePointAuthError("Authentication request timed out")
        except RequestException as e:
            raise SharePointAuthError(f"Network error during authentication: {str(e)}")
    
    def is_authenticated(self):
        return self._auth_token is not None
    
    def get_auth_headers(self):
        if not self._auth_token:
            raise SharePointAuthError("Not authenticated - call authenticate_* method first")
        return {
            'X-RequestDigest': self._auth_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    def logout(self):
        self._auth_token = None
        self._cookies = None
        self._last_auth_time = None
        self.session.cookies.clear()
    
    def get_last_auth_time(self):
        return self._last_auth_time


class TestSharePointAuthComprehensive(unittest.TestCase):
    """Comprehensive test suite for SharePoint authentication"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.site_url = "https://company.sharepoint.com/sites/test"
        self.valid_username = "testuser@company.com"
        self.valid_password = "ValidPass123!"
        self.auth = MockSharePointAuth(self.site_url)
    
    def tearDown(self):
        """Clean up after tests"""
        self.auth = None


class TestSuccessScenarios(TestSharePointAuthComprehensive):
    """Test successful authentication scenarios"""
    
    @patch('requests.Session.get')
    def test_successful_basic_authentication(self, mock_get):
        """Test successful basic authentication with valid credentials"""
        # Arrange
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'valid_token_12345'}
        mock_response.cookies = {'SPOIDCRL': 'session_cookie'}
        mock_get.return_value = mock_response
        
        # Act
        result = self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        # Assert
        self.assertTrue(result)
        self.assertTrue(self.auth.is_authenticated())
        self.assertEqual(self.auth._auth_token, 'valid_token_12345')
        self.assertIsNotNone(self.auth.get_last_auth_time())
        
        # Verify correct API call
        mock_get.assert_called_once_with(
            f"{self.site_url}/_api/web/currentuser",
            auth=(self.valid_username, self.valid_password),
            headers={'Accept': 'application/json'},
            timeout=30
        )
    
    @patch('requests.Session.get')
    def test_authentication_with_minimum_valid_credentials(self, mock_get):
        """Test authentication with minimum valid credential lengths"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'min_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        min_username = "abc"  # 3 characters (minimum)
        min_password = "12345678"  # 8 characters (minimum)
        
        result = self.auth.authenticate_basic(min_username, min_password)
        self.assertTrue(result)
    
    @patch('requests.Session.get')
    def test_authentication_with_maximum_valid_credentials(self, mock_get):
        """Test authentication with maximum valid credential lengths"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'max_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        max_username = "u" * 100  # 100 characters (maximum)
        max_password = "p" * 128  # 128 characters (maximum)
        
        result = self.auth.authenticate_basic(max_username, max_password)
        self.assertTrue(result)
    
    @patch('requests.Session.get')
    def test_authentication_with_special_characters(self, mock_get):
        """Test authentication with special characters in credentials"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'special_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        special_username = "test.user+tag@domain-name.co.uk"
        special_password = "P@ssw0rd!@#$%^&*()_+-={}[]|\\:;\"'<>?,./"
        
        result = self.auth.authenticate_basic(special_username, special_password)
        self.assertTrue(result)
    
    @patch('requests.Session.get')
    def test_get_auth_headers_after_authentication(self, mock_get):
        """Test getting authentication headers after successful login"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'header_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        self.auth.authenticate_basic(self.valid_username, self.valid_password)
        headers = self.auth.get_auth_headers()
        
        expected_headers = {
            'X-RequestDigest': 'header_token',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        self.assertEqual(headers, expected_headers)


class TestFailureScenarios(TestSharePointAuthComprehensive):
    """Test authentication failure scenarios"""
    
    @patch('requests.Session.get')
    def test_invalid_credentials_401(self, mock_get):
        """Test authentication failure with invalid credentials (401 Unauthorized)"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic("invalid@user.com", "wrongpassword")
        
        self.assertIn("Invalid credentials provided", str(context.exception))
        self.assertFalse(self.auth.is_authenticated())
    
    @patch('requests.Session.get')
    def test_access_forbidden_403(self, mock_get):
        """Test authentication failure with forbidden access (403 Forbidden)"""
        mock_response = Mock()
        mock_response.status_code = 403
        mock_get.return_value = mock_response
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("Access forbidden", str(context.exception))
        self.assertFalse(self.auth.is_authenticated())
    
    @patch('requests.Session.get')
    def test_site_not_found_404(self, mock_get):
        """Test authentication failure when SharePoint site not found (404)"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("SharePoint site not found", str(context.exception))
    
    @patch('requests.Session.get')
    def test_server_error_500(self, mock_get):
        """Test authentication failure with server error (500)"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("Authentication failed with status code: 500", str(context.exception))
    
    @patch('requests.Session.get')
    def test_connection_error(self, mock_get):
        """Test authentication failure due to connection error"""
        mock_get.side_effect = ConnectionError("Network unreachable")
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("Unable to connect to SharePoint server", str(context.exception))
    
    @patch('requests.Session.get')
    def test_timeout_error(self, mock_get):
        """Test authentication failure due to timeout"""
        mock_get.side_effect = Timeout("Request timed out after 30 seconds")
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("Authentication request timed out", str(context.exception))
    
    @patch('requests.Session.get')
    def test_general_request_exception(self, mock_get):
        """Test authentication failure due to general request exception"""
        mock_get.side_effect = RequestException("SSL certificate verification failed")
        
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertIn("Network error during authentication", str(context.exception))
    
    def test_get_auth_headers_without_authentication(self):
        """Test getting auth headers fails when not authenticated"""
        with self.assertRaises(SharePointAuthError) as context:
            self.auth.get_auth_headers()
        
        self.assertIn("Not authenticated", str(context.exception))


class TestBoundaryConditions(TestSharePointAuthComprehensive):
    """Test boundary conditions and edge cases"""
    
    def test_empty_username(self):
        """Test authentication fails with empty username"""
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic("", self.valid_password)
        self.assertIn("Username must be a non-empty string", str(context.exception))
    
    def test_none_username(self):
        """Test authentication fails with None username"""
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(None, self.valid_password)
        self.assertIn("Username must be a non-empty string", str(context.exception))
    
    def test_non_string_username(self):
        """Test authentication fails with non-string username"""
        test_cases = [123, [], {}, True, 0.5]
        for invalid_username in test_cases:
            with self.subTest(username=invalid_username):
                with self.assertRaises(ValueError) as context:
                    self.auth.authenticate_basic(invalid_username, self.valid_password)
                self.assertIn("Username must be a non-empty string", str(context.exception))
    
    def test_empty_password(self):
        """Test authentication fails with empty password"""
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(self.valid_username, "")
        self.assertIn("Password must be a non-empty string", str(context.exception))
    
    def test_none_password(self):
        """Test authentication fails with None password"""
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(self.valid_username, None)
        self.assertIn("Password must be a non-empty string", str(context.exception))
    
    def test_non_string_password(self):
        """Test authentication fails with non-string password"""
        test_cases = [123, [], {}, True, 0.5]
        for invalid_password in test_cases:
            with self.subTest(password=invalid_password):
                with self.assertRaises(ValueError) as context:
                    self.auth.authenticate_basic(self.valid_username, invalid_password)
                self.assertIn("Password must be a non-empty string", str(context.exception))
    
    def test_username_length_boundaries(self):
        """Test username length boundary conditions"""
        # Too short (2 chars, minimum is 3)
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic("ab", self.valid_password)
        self.assertIn("Username must be at least 3 characters long", str(context.exception))
        
        # Too long (101 chars, maximum is 100)
        long_username = "a" * 101
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(long_username, self.valid_password)
        self.assertIn("Username cannot exceed 100 characters", str(context.exception))
    
    def test_password_length_boundaries(self):
        """Test password length boundary conditions"""
        # Too short (7 chars, minimum is 8)
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(self.valid_username, "1234567")
        self.assertIn("Password must be at least 8 characters long", str(context.exception))
        
        # Too long (129 chars, maximum is 128)
        long_password = "a" * 129
        with self.assertRaises(ValueError) as context:
            self.auth.authenticate_basic(self.valid_username, long_password)
        self.assertIn("Password cannot exceed 128 characters", str(context.exception))
    
    @patch('requests.Session.get')
    def test_exact_boundary_lengths(self, mock_get):
        """Test exact boundary lengths work correctly"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'boundary_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        # Test exact minimum lengths
        min_username = "abc"  # exactly 3 chars
        min_password = "12345678"  # exactly 8 chars
        result = self.auth.authenticate_basic(min_username, min_password)
        self.assertTrue(result)
        
        # Test exact maximum lengths
        max_username = "u" * 100  # exactly 100 chars
        max_password = "p" * 128  # exactly 128 chars
        result = self.auth.authenticate_basic(max_username, max_password)
        self.assertTrue(result)


class TestStateManagement(TestSharePointAuthComprehensive):
    """Test authentication state management"""
    
    def test_initial_state(self):
        """Test initial authentication state"""
        self.assertFalse(self.auth.is_authenticated())
        self.assertIsNone(self.auth._auth_token)
        self.assertIsNone(self.auth._cookies)
        self.assertIsNone(self.auth.get_last_auth_time())
    
    @patch('requests.Session.get')
    def test_state_after_successful_authentication(self, mock_get):
        """Test state changes after successful authentication"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'state_token'}
        mock_response.cookies = {'session': 'cookie_value'}
        mock_get.return_value = mock_response
        
        self.auth.authenticate_basic(self.valid_username, self.valid_password)
        
        self.assertTrue(self.auth.is_authenticated())
        self.assertEqual(self.auth._auth_token, 'state_token')
        self.assertIsNotNone(self.auth._cookies)
        self.assertIsNotNone(self.auth.get_last_auth_time())
    
    @patch('requests.Session.get')
    def test_logout_clears_state(self, mock_get):
        """Test logout clears all authentication state"""
        # First authenticate
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'logout_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        self.auth.authenticate_basic(self.valid_username, self.valid_password)
        self.assertTrue(self.auth.is_authenticated())
        
        # Then logout
        self.auth.logout()
        
        self.assertFalse(self.auth.is_authenticated())
        self.assertIsNone(self.auth._auth_token)
        self.assertIsNone(self.auth._cookies)
        self.assertIsNone(self.auth.get_last_auth_time())
    
    @patch('requests.Session.get')
    def test_multiple_authentications_overwrite_state(self, mock_get):
        """Test multiple authentications overwrite previous state"""
        # First authentication
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'X-RequestDigest': 'first_token'}
        mock_response.cookies = {}
        mock_get.return_value = mock_response
        
        self.auth.authenticate_basic(self.valid_username, self.valid_password)
        first_token = self.auth._auth_token
        first_time = self.auth.get_last_auth_time()
        
        # Second authentication (simulate token refresh)
        time.sleep(0.01)  # Ensure different timestamp
        mock_response.headers = {'X-RequestDigest': 'second_token'}
        
        self.auth.authenticate_basic(self.valid_username, self.valid_password)
        second_token = self.auth._auth_token
        second_time = self.auth.get_last_auth_time()
        
        self.assertNotEqual(first_token, second_token)
        self.assertGreater(second_time, first_time)


class TestInitializationEdgeCases(TestSharePointAuthComprehensive):
    """Test initialization edge cases"""
    
    def test_init_with_various_empty_values(self):
        """Test initialization with various empty values"""
        empty_values = ["", None, "   ", "\t", "\n"]
        for empty_value in empty_values:
            with self.subTest(site_url=empty_value):
                with self.assertRaises(ValueError):
                    MockSharePointAuth(empty_value)
    
    def test_init_with_trailing_slashes(self):
        """Test initialization removes various trailing slash patterns"""
        test_cases = [
            ("https://site.com/", "https://site.com"),
            ("https://site.com//", "https://site.com"),
            ("https://site.com///", "https://site.com"),
            ("https://site.com/sites/test/", "https://site.com/sites/test"),
        ]
        
        for input_url, expected_url in test_cases:
            with self.subTest(input_url=input_url):
                auth = MockSharePointAuth(input_url)
                self.assertEqual(auth.site_url, expected_url)
    
    def test_init_preserves_valid_urls(self):
        """Test initialization preserves valid URLs without trailing slashes"""
        valid_urls = [
            "https://company.sharepoint.com",
            "https://company.sharepoint.com/sites/test",
            "https://tenant.sharepoint.com/sites/project/subsite",
            "http://localhost:8080/sharepoint",
        ]
        
        for url in valid_urls:
            with self.subTest(url=url):
                auth = MockSharePointAuth(url)
                self.assertEqual(auth.site_url, url)


if __name__ == '__main__':
    # Create a test suite with all test classes
    test_classes = [
        TestSuccessScenarios,
        TestFailureScenarios, 
        TestBoundaryConditions,
        TestStateManagement,
        TestInitializationEdgeCases
    ]
    
    suite = unittest.TestSuite()
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Test Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print(f"{'='*50}")