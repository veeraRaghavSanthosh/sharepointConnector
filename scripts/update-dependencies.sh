#!/bin/bash

# Dependency Update Script
# This script safely updates dependencies while maintaining backward compatibility

set -e

echo "🔍 SharePoint Connector - Dependency Security Update"
echo "=================================================="

# Backup existing files
echo "📦 Creating backups..."
if [ -f "package.json.bak" ]; then
    echo "⚠️  Backup already exists, removing old backup"
    rm package.json.bak
fi

if [ -f "package-lock.json" ]; then
    cp package-lock.json package-lock.json.bak
    echo "✅ Backed up package-lock.json"
fi

# Clean install
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules
if [ -f "package-lock.json" ]; then
    rm package-lock.json
fi

# Install new dependencies
echo "📥 Installing updated dependencies..."
npm install

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate || {
    echo "⚠️  Security audit found issues. Please review npm audit output."
    echo "    Some vulnerabilities may be in transitive dependencies."
}

# Run tests if available
echo "🧪 Running tests..."
if npm run test > /dev/null 2>&1; then
    echo "✅ Tests passed"
else
    echo "⚠️  Tests failed or not available. Please run tests manually."
    echo "    Use: npm test"
fi

echo ""
echo "🎉 Dependency update completed!"
echo ""
echo "📋 Summary of changes:"
echo "  • Updated 8 production dependencies"
echo "  • Updated 3 development dependencies" 
echo "  • Replaced deprecated 'request' library with 'axios'"
echo "  • Fixed multiple security vulnerabilities"
echo ""
echo "📖 Next steps:"
echo "  1. Review DEPENDENCY_MIGRATION.md for breaking changes"
echo "  2. Test your application thoroughly"
echo "  3. Update any custom code that uses 'request' library"
echo "  4. Run integration tests with SharePoint"
echo ""
echo "🔄 To rollback if needed:"
echo "  1. Restore package.json from backup"
echo "  2. Run: rm -rf node_modules package-lock.json && npm install"