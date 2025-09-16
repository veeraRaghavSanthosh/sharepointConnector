# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Migration System**: Added comprehensive migration system for SharePoint list schema changes
  - New `lib/migrations/index.js` module for handling field additions and backfills
  - New `lib/migrations/runner.js` for running and managing migrations
  - Support for adding fields to SharePoint lists programmatically
  - Backfill functionality for populating existing list items with new field values
  - Field existence checking to prevent duplicate field creation
- **Legacy ID Migration**: Added migration to add `legacy_id` column to orders list
  - New migration `migrations/001_add_legacy_id_to_orders.js`
  - Generates unique legacy IDs in format `LEGACY-{timestamp}-{hash}`
  - Backfills existing order items with generated legacy IDs
  - Includes rollback functionality to remove the field if needed
- **Unit Tests**: Comprehensive unit tests for migration system
  - Tests for field addition, existence checking, and backfill operations
  - Tests for complete migration workflow
  - Tests for legacy ID generation logic
- **Integration Tests**: Integration tests for real SharePoint environments
  - Tests migration system connectivity and functionality
  - Commented test cases for running migrations in test environments

### Changed
- Extended SharePoint client to include migration capabilities
- Added migration system to main client export

### Technical Details
- Migration system uses SharePoint REST API for field management
- Backfill operations process items in batches to avoid API limits
- Legacy ID generation uses MD5 hashing for uniqueness
- All migrations support both up and down operations for rollback capability
- Error handling and logging throughout migration process

## [1.1.6] - Previous Release
- Previous features and changes...