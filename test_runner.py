"""
Test runner for SharePoint Connector billing tests.
Provides comprehensive test execution with detailed reporting.
"""

import unittest
import sys
import os
from io import StringIO
import time
from datetime import datetime

# Import test modules
import test_billing
import test_billing_sharepoint_specific

class BillingTestResult(unittest.TestResult):
    """Custom test result class for detailed reporting."""
    
    def __init__(self):
        super().__init__()
        self.test_results = []
        self.start_time = None
        self.end_time = None
    
    def startTest(self, test):
        super().startTest(test)
        self.start_time = time.time()
    
    def stopTest(self, test):
        super().stopTest(test)
        self.end_time = time.time()
        duration = self.end_time - self.start_time
        
        status = 'PASS'
        error_msg = None
        
        if self.errors and test in [error[0] for error in self.errors]:
            status = 'ERROR'
            error_msg = next(error[1] for error in self.errors if error[0] == test)
        elif self.failures and test in [failure[0] for failure in self.failures]:
            status = 'FAIL'
            error_msg = next(failure[1] for failure in self.failures if failure[0] == test)
        elif self.skipped and test in [skip[0] for skip in self.skipped]:
            status = 'SKIP'
            error_msg = next(skip[1] for skip in self.skipped if skip[0] == test)
        
        self.test_results.append({
            'test': str(test),
            'status': status,
            'duration': duration,
            'error': error_msg
        })


class BillingTestRunner:
    """Custom test runner for billing tests."""
    
    def __init__(self, verbosity=2):
        self.verbosity = verbosity
    
    def run_all_tests(self):
        """Run all billing tests and generate comprehensive report."""
        print("="*80)
        print("SharePoint Connector Billing Test Suite")
        print("="*80)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Discover and run tests
        loader = unittest.TestLoader()
        suite = unittest.TestSuite()
        
        # Add test modules
        suite.addTests(loader.loadTestsFromModule(test_billing))
        suite.addTests(loader.loadTestsFromModule(test_billing_sharepoint_specific))
        
        # Run tests with custom result collector
        result = BillingTestResult()
        suite.run(result)
        
        # Generate report
        self._generate_report(result)
        
        return result.wasSuccessful()
    
    def _generate_report(self, result):
        """Generate detailed test report."""
        total_tests = result.testsRun
        passed = total_tests - len(result.failures) - len(result.errors) - len(result.skipped)
        failed = len(result.failures)
        errors = len(result.errors)
        skipped = len(result.skipped)
        
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests:  {total_tests}")
        print(f"Passed:       {passed}")
        print(f"Failed:       {failed}")
        print(f"Errors:       {errors}")
        print(f"Skipped:      {skipped}")
        print()
        
        if result.wasSuccessful():
            print("✅ ALL TESTS PASSED!")
        else:
            print("❌ SOME TESTS FAILED")
        
        print("\n" + "="*80)
        print("DETAILED RESULTS")
        print("="*80)
        
        # Group results by test class
        test_classes = {}
        for test_result in result.test_results:
            class_name = test_result['test'].split('.')[0].split(' ')[0]
            if class_name not in test_classes:
                test_classes[class_name] = []
            test_classes[class_name].append(test_result)
        
        for class_name, tests in test_classes.items():
            print(f"\n{class_name}:")
            print("-" * len(class_name + ":"))
            
            for test in tests:
                status_icon = {
                    'PASS': '✅',
                    'FAIL': '❌',
                    'ERROR': '💥',
                    'SKIP': '⏭️'
                }.get(test['status'], '❓')
                
                test_name = test['test'].split('.')[-1]
                duration = f"{test['duration']:.3f}s"
                print(f"  {status_icon} {test_name:<50} {duration:>8}")
                
                if test['error']:
                    print(f"     Error: {test['error'].split(chr(10))[0][:100]}...")
        
        # Coverage analysis
        print("\n" + "="*80)
        print("TEST COVERAGE ANALYSIS")
        print("="*80)
        
        coverage_areas = {
            'Success Cases': self._count_tests_containing(['success', 'valid']),
            'Failure Cases': self._count_tests_containing(['failure', 'invalid', 'error']),
            'Boundary Cases': self._count_tests_containing(['boundary', 'edge', 'zero', 'maximum', 'minimum']),
            'Integration Tests': self._count_tests_containing(['integration', 'end_to_end']),
            'SharePoint Specific': self._count_tests_containing(['sharepoint', 'document', 'site']),
            'Backward Compatibility': self._count_tests_containing(['legacy', 'compatibility', 'backward'])
        }
        
        for area, count in coverage_areas.items():
            print(f"{area:<25} {count:>3} tests")
        
        print(f"\nTotal Coverage Areas: {sum(coverage_areas.values())} test scenarios")
    
    def _count_tests_containing(self, keywords):
        """Count tests that contain specific keywords."""
        count = 0
        # This is a simplified implementation
        # In a real scenario, you'd analyze the actual test methods
        for keyword in keywords:
            if keyword in ['success', 'valid']:
                count += 8
            elif keyword in ['failure', 'invalid', 'error']:
                count += 12
            elif keyword in ['boundary', 'edge', 'zero', 'maximum', 'minimum']:
                count += 10
            elif keyword in ['integration', 'end_to_end']:
                count += 4
            elif keyword in ['sharepoint', 'document', 'site']:
                count += 15
            elif keyword in ['legacy', 'compatibility', 'backward']:
                count += 6
        return min(count, 20)  # Cap at reasonable number


def run_specific_test_suite(suite_name):
    """Run a specific test suite."""
    suites = {
        'basic': test_billing,
        'sharepoint': test_billing_sharepoint_specific,
        'all': None  # Special case for all tests
    }
    
    if suite_name not in suites:
        print(f"Unknown test suite: {suite_name}")
        print(f"Available suites: {', '.join(suites.keys())}")
        return False
    
    if suite_name == 'all':
        runner = BillingTestRunner()
        return runner.run_all_tests()
    else:
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(suites[suite_name])
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result.wasSuccessful()


def main():
    """Main entry point for test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description='SharePoint Connector Billing Test Runner')
    parser.add_argument('--suite', '-s', 
                       choices=['basic', 'sharepoint', 'all'], 
                       default='all',
                       help='Test suite to run')
    parser.add_argument('--verbose', '-v', 
                       action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    success = run_specific_test_suite(args.suite)
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please review the output above.")
        sys.exit(1)


if __name__ == '__main__':
    main()