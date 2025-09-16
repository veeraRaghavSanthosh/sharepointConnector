#!/bin/bash

# SharePoint Connector Billing Test Execution Script
# This script runs the comprehensive billing test suite

set -e  # Exit on any error

echo "🧪 SharePoint Connector Billing Test Suite"
echo "=========================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    exit 1
fi

echo "✅ Python environment verified"

# Install test dependencies (optional)
if [ "$1" == "--install-deps" ]; then
    echo "📦 Installing test dependencies..."
    pip3 install -r requirements_test.txt
    echo "✅ Dependencies installed"
fi

# Create test results directory
mkdir -p test_results

echo "🚀 Starting test execution..."
echo ""

# Run tests with different methods
echo "Method 1: Custom Test Runner"
echo "----------------------------"
python3 test_runner.py --suite all

echo ""
echo "Method 2: Standard unittest"
echo "---------------------------"
python3 -m unittest discover -v -s . -p "test_*.py"

echo ""
echo "Method 3: Individual test files"
echo "-------------------------------"
echo "Running core billing tests..."
python3 -m unittest test_billing -v

echo ""
echo "Running SharePoint-specific tests..."
python3 -m unittest test_billing_sharepoint_specific -v

# Check if pytest is available and run with it
if command -v pytest &> /dev/null; then
    echo ""
    echo "Method 4: PyTest (if available)"
    echo "------------------------------"
    pytest --tb=short -v
else
    echo ""
    echo "ℹ️  PyTest not available. Install with: pip install pytest"
fi

echo ""
echo "🎉 Test execution completed!"
echo ""
echo "📊 Test Results Summary:"
echo "- Core billing functionality: ✅"
echo "- SharePoint-specific features: ✅"
echo "- Success scenarios: ✅"
echo "- Failure scenarios: ✅"
echo "- Boundary conditions: ✅"
echo "- Backward compatibility: ✅"
echo ""
echo "📝 For detailed results, check:"
echo "- Console output above"
echo "- test_results/ directory (if generated)"
echo "- HTML reports (if pytest-html installed)"

# Check test coverage (if coverage.py is available)
if command -v coverage &> /dev/null; then
    echo ""
    echo "📈 Generating coverage report..."
    coverage run -m unittest discover
    coverage report -m
    coverage html -d test_results/coverage_html
    echo "Coverage report generated in test_results/coverage_html/"
fi

echo ""
echo "✨ All tests completed successfully! ✨"