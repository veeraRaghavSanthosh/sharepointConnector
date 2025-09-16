"""
SharePoint Authentication Module
Handles authentication for SharePoint Online and On-Premises
"""
import requests
from requests_ntlm import HttpNtlmAuth
import json
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class SharePointAuthError(Exception):
    """Custom exception for SharePoint authentication errors"""
    pass


class SharePointAuth:
    """SharePoint authentication handler supporting multiple auth methods"""
    
    def __init__(self, site_url: str):
        """
        Initialize SharePoint authentication
        
        Args:
            site_url: SharePoint site URL
        """
        if not site_url:
            raise ValueError("Site URL cannot be empty")
        
        self.site_url = site_url.rstrip('/')
        self.session = requests.Session()
        self._auth_token = None
        self._cookies = None
    
    def authenticate_basic(self, username: str, password: str) -> bool:
        """
        Authenticate using basic authentication
        
        Args:
            username: User's username
            password: User's password
            
        Returns:
            bool: True if authentication successful, False otherwise
            
        Raises:
            SharePointAuthError: If authentication fails with specific error
            ValueError: If username or password is invalid
        """
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
        
        try:
            # Simulate SharePoint authentication endpoint
            auth_url = f"{self.site_url}/_api/web/currentuser"
            
            response = self.session.get(
                auth_url,
                auth=(username, password),
                headers={'Accept': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                self._auth_token = response.headers.get('X-RequestDigest')
                self._cookies = response.cookies
                logger.info(f"Authentication successful for user: {username}")
                return True
            elif response.status_code == 401:
                raise SharePointAuthError("Invalid credentials provided")
            elif response.status_code == 403:
                raise SharePointAuthError("Access forbidden - user may not have permissions")
            elif response.status_code == 404:
                raise SharePointAuthError("SharePoint site not found")
            else:
                raise SharePointAuthError(f"Authentication failed with status code: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            raise SharePointAuthError("Unable to connect to SharePoint server")
        except requests.exceptions.Timeout:
            raise SharePointAuthError("Authentication request timed out")
        except requests.exceptions.RequestException as e:
            raise SharePointAuthError(f"Network error during authentication: {str(e)}")
    
    def authenticate_ntlm(self, username: str, password: str, domain: str = None) -> bool:
        """
        Authenticate using NTLM authentication
        
        Args:
            username: User's username
            password: User's password
            domain: Windows domain (optional)
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        if not username or not password:
            raise ValueError("Username and password are required")
        
        try:
            full_username = f"{domain}\\{username}" if domain else username
            auth_url = f"{self.site_url}/_api/web/currentuser"
            
            response = self.session.get(
                auth_url,
                auth=HttpNtlmAuth(full_username, password),
                headers={'Accept': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                self._auth_token = response.headers.get('X-RequestDigest')
                self._cookies = response.cookies
                return True
            else:
                raise SharePointAuthError(f"NTLM authentication failed: {response.status_code}")
                
        except Exception as e:
            raise SharePointAuthError(f"NTLM authentication error: {str(e)}")
    
    def get_auth_headers(self) -> Dict[str, str]:
        """
        Get authentication headers for API requests
        
        Returns:
            Dict containing authentication headers
        """
        if not self._auth_token:
            raise SharePointAuthError("Not authenticated - call authenticate_* method first")
        
        return {
            'X-RequestDigest': self._auth_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    def is_authenticated(self) -> bool:
        """
        Check if currently authenticated
        
        Returns:
            bool: True if authenticated, False otherwise
        """
        return self._auth_token is not None
    
    def logout(self) -> None:
        """Clear authentication tokens and cookies"""
        self._auth_token = None
        self._cookies = None
        self.session.cookies.clear()