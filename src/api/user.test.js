/**
 * Basic tests for the refactored user.js module
 * These tests verify the helper functions work correctly
 */

const { 
    validateAndNormalizeUserIdentifier,
    buildUserApiUrl 
} = require('./user');

// Test the user identifier validation helper
console.log('Testing validateAndNormalizeUserIdentifier...');

// Test email format
const emailTest = validateAndNormalizeUserIdentifier('user@example.com');
console.log('Email test:', emailTest.isValid ? 'PASS' : 'FAIL', emailTest);

// Test domain format
const domainTest = validateAndNormalizeUserIdentifier('DOMAIN\\username');
console.log('Domain test:', domainTest.isValid ? 'PASS' : 'FAIL', domainTest);

// Test claims format
const claimsTest = validateAndNormalizeUserIdentifier('i:0#.f|membership|user@example.com');
console.log('Claims test:', claimsTest.isValid ? 'PASS' : 'FAIL', claimsTest);

// Test invalid format
const invalidTest = validateAndNormalizeUserIdentifier('invalid-user');
console.log('Invalid test:', !invalidTest.isValid ? 'PASS' : 'FAIL', invalidTest);

// Test the URL builder helper
console.log('\nTesting buildUserApiUrl...');

const mockContext = {
    siteUrl: 'https://contoso.sharepoint.com/sites/test'
};

try {
    const url = buildUserApiUrl(mockContext, 'siteusers', { '$select': 'Id,Title' });
    console.log('URL builder test: PASS', url);
} catch (error) {
    console.log('URL builder test: FAIL', error.message);
}

console.log('\nAll helper function tests completed!');