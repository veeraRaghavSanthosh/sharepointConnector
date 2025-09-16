# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive usage examples in JavaScript and TypeScript demonstrating various SharePoint Connector features
  - Basic, NTLM, and SharePoint Online authentication examples
  - Complete CRUD operations for lists and list items
  - Advanced querying and filtering examples
  - File operations and binary stream handling
  - Error handling best practices
  - Modern async/await patterns with promise wrappers
  - TypeScript type definitions and interfaces
  - Object-oriented service classes and managers
  - Configuration builder pattern for type-safe setup

- Extensive unit test coverage for usage examples
  - Authentication method testing with mocked responses
  - List and list item operations testing
  - Advanced query and filtering scenarios
  - File operations testing
  - Error handling and edge cases
  - Promise wrapper utility testing
  - TypeScript-specific class and interface testing

### Enhanced
- Documentation structure with practical, runnable examples
- Type safety improvements with comprehensive TypeScript definitions
- Better error handling patterns and custom error types
- Modern JavaScript/TypeScript development patterns

### Files Added
- `examples/usage-examples.js` - Comprehensive JavaScript usage examples
- `examples/usage-examples.ts` - TypeScript usage examples with full type definitions
- `test/examples/test-usage-examples.js` - Unit tests for JavaScript examples
- `test/examples/test-usage-examples-typescript.js` - Unit tests for TypeScript examples
- `CHANGELOG.md` - This changelog file

## [1.1.6] - Previous Release

### Features
- SharePoint library with multiple authentication strategies
- File streaming support
- List title-based querying
- Pagination support
- Extendable record fetch limit
- Query operators support (OR, AND)
- Concurrent user login support

### Authentication Types Supported
- NTLM
- Basic
- Online (SharePoint 365/Online login flow)
- Online with SAML SSO (SharePoint 365 to Federated SAML SSO flow)

### Core Functionality
- Lists: Create, Read, Update, Delete, List operations
- List Items: Create, Read, Delete, List operations with pagination
- File operations: Binary streaming, file path-based access
- User context: Current user information retrieval
- Advanced querying: Field filtering, selection, expansion, operators

---

## Usage Examples Overview

The new examples demonstrate:

### JavaScript Examples (`examples/usage-examples.js`)
1. **Authentication Examples**: Basic, NTLM, and SharePoint Online authentication
2. **List Operations**: Creating, reading, updating, and managing SharePoint lists
3. **List Item Operations**: CRUD operations on list items with proper error handling
4. **Advanced Querying**: Filtering, field selection, expansion, and pagination
5. **File Operations**: Binary stream handling for document libraries
6. **Error Handling**: Comprehensive error handling patterns and best practices
7. **Modern Patterns**: Promise wrappers and async/await usage

### TypeScript Examples (`examples/usage-examples.ts`)
1. **Type Definitions**: Complete interface definitions for all SharePoint entities
2. **Service Classes**: Object-oriented approach with proper TypeScript typing
3. **Configuration Builder**: Type-safe configuration building with method chaining
4. **Task Management**: Example task management system with full typing
5. **Document Library Manager**: Typed document management with search and filtering
6. **Error Handling**: Custom error types and proper error propagation
7. **Complete Application**: Full application example showing best practices

### Unit Tests
- **Comprehensive Coverage**: Tests for all example functions and classes
- **Mocked Responses**: Proper SharePoint API response mocking with nock
- **Error Scenarios**: Testing of error conditions and edge cases
- **Promise Testing**: Verification of async/await and promise-based patterns
- **TypeScript Testing**: Mock implementations of TypeScript classes and interfaces

These additions significantly improve the developer experience by providing:
- Clear, practical examples for immediate use
- Comprehensive test coverage ensuring reliability
- Modern development patterns and best practices
- Full TypeScript support with proper typing
- Extensive documentation through working code examples