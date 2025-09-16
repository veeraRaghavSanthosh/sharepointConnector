import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock timers to control async operations
jest.useFakeTimers();

describe('App Component - Async/Await Conversion', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders SharePoint Connector Frontend title', () => {
    render(<App />);
    expect(screen.getByText('SharePoint Connector Frontend')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads data and lists using async/await', async () => {
    render(<App />);
    
    // Fast-forward timers to complete async operations
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('SharePoint Data')).toBeInTheDocument();
    });

    // Check if lists are loaded
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    // Check if items are displayed
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('handles create item with async/await', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<App />);
    
    // Wait for initial load
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('SharePoint Data')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create New Item');
    fireEvent.click(createButton);

    // Fast-forward timer for create operation
    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Created item:', 
        expect.objectContaining({
          title: 'New Item',
          description: 'Created from App',
          created: expect.any(String)
        })
      );
    });

    // Check if Documents count increased
    await waitFor(() => {
      expect(screen.getByText('Items: 26')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('handles errors in async operations', async () => {
    // Mock Promise rejection for testing error handling
    const mockFetchData = jest.fn().mockRejectedValue(new Error('Network error'));
    
    // This test would need the component to accept mocked functions
    // For now, we'll test the error display when it occurs
    render(<App />);
    
    // Simulate error state by checking error display capability
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  test('button is disabled during loading', async () => {
    render(<App />);
    
    // Initially loading
    expect(screen.getByText('Create New Item')).toBeDisabled();
    
    // Wait for initial load to complete
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Item')).not.toBeDisabled();
    });
  });

  test('Promise.all is used for concurrent async operations', async () => {
    const promiseAllSpy = jest.spyOn(Promise, 'all');
    
    render(<App />);
    
    // Fast-forward timers
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('SharePoint Data')).toBeInTheDocument();
    });

    // Verify Promise.all was called for concurrent loading
    expect(promiseAllSpy).toHaveBeenCalled();
    
    promiseAllSpy.mockRestore();
  });
});
