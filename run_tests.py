#!/usr/bin/env python3
"""
Test runner script for SharePoint Authentication tests
Provides options for running different test suites and generating coverage reports
"""
import sys
import unittest
import argparse
import os
from io import StringIO


def run_basic_tests():
    """Run basic authentication tests"""
    print("Running basic authentication tests...")
    
    # Import and run basic tests
    try:
        from test_auth import TestSharePointAuth, TestBasicAuthenticationSuccess, TestBasicAuthenticationFailure, TestBoundaryConditions, TestEdgeCases
        
        test_classes = [
            TestSharePointAuth,
            TestBasicAuthenticationSuccess, 
            TestBasicAuthenticationFailure,
            TestBoundaryConditions,
            TestEdgeCases
        ]
        
        suite = unittest.TestSuite()
        for test_class in test_classes:
            tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
            suite.addTests(tests)
        
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result
        
    except ImportError as e:
        print(f"Could not import basic tests: {e}")
        return None


def run_comprehensive_tests():
    """Run comprehensive authentication tests"""
    print("Running comprehensive authentication tests...")
    
    try:
        from test_auth_comprehensive import (
            TestSuccessScenarios,
            TestFailureScenarios, 
            TestBoundaryConditions,
            TestStateManagement,
            TestInitializationEdgeCases
        )
        
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
        
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result
        
    except ImportError as e:
        print(f"Could not import comprehensive tests: {e}")
        return None


def run_all_tests():
    """Run all available tests"""
    print("Running all authentication tests...")
    
    results = []
    
    # Run basic tests
    basic_result = run_basic_tests()
    if basic_result:
        results.append(("Basic Tests", basic_result))
    
    print("\n" + "="*60 + "\n")
    
    # Run comprehensive tests  
    comprehensive_result = run_comprehensive_tests()
    if comprehensive_result:
        results.append(("Comprehensive Tests", comprehensive_result))
    
    return results


def print_summary(results):
    """Print test summary"""
    print("\n" + "="*60)
    print("OVERALL TEST SUMMARY")
    print("="*60)
    
    total_tests = 0
    total_failures = 0
    total_errors = 0
    
    for test_name, result in results:
        print(f"\n{test_name}:")
        print(f"  Tests run: {result.testsRun}")
        print(f"  Failures: {len(result.failures)}")
        print(f"  Errors: {len(result.errors)}")
        
        success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0
        print(f"  Success rate: {success_rate:.1f}%")
        
        total_tests += result.testsRun
        total_failures += len(result.failures)
        total_errors += len(result.errors)
    
    print(f"\nOVERALL TOTALS:")
    print(f"  Total tests: {total_tests}")
    print(f"  Total failures: {total_failures}")
    print(f"  Total errors: {total_errors}")
    
    if total_tests > 0:
        overall_success_rate = ((total_tests - total_failures - total_errors) / total_tests * 100)
        print(f"  Overall success rate: {overall_success_rate:.1f}%")
    
    print("="*60)
    
    return total_failures + total_errors == 0


def main():
    """Main test runner function"""
    parser = argparse.ArgumentParser(description='Run SharePoint Authentication tests')
    parser.add_argument('--type', choices=['basic', 'comprehensive', 'all'], default='all',
                       help='Type of tests to run (default: all)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    print("SharePoint Authentication Test Runner")
    print("="*40)
    
    if args.type == 'basic':
        result = run_basic_tests()
        results = [("Basic Tests", result)] if result else []
    elif args.type == 'comprehensive':
        result = run_comprehensive_tests()
        results = [("Comprehensive Tests", result)] if result else []
    else:
        results = run_all_tests()
    
    if results:
        success = print_summary(results)
        sys.exit(0 if success else 1)
    else:
        print("No tests were run successfully.")
        sys.exit(1)


if __name__ == '__main__':
    main()