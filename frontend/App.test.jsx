import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch globally
global.fetch = jest.fn();

describe('App Component - Async/Await Functionality', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders SharePoint Connector header', () => {
    render(<App />);
    expect(screen.getByText('SharePoint Connector')).toBeInTheDocument();
    expect(screen.getByText('Manage your SharePoint lists and items')).toBeInTheDocument();
  });

  test('fetches and displays lists on component mount', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 },
      { id: '2', title: 'Test List 2', description: 'Description 2', itemCount: 10 }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLists,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
      expect(screen.getByText('Test List 2')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists');
  });

  test('handles fetch lists error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error fetching lists/)).toBeInTheDocument();
    });
  });

  test('fetches list items when a list is selected', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 }
    ];
    const mockItems = [
      { id: '101', title: 'Item 1', description: 'Item description 1' },
      { id: '102', title: 'Item 2', description: 'Item description 2' }
    ];

    // First call for lists
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLists,
    });

    // Second call for list items
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    render(<App />);

    // Wait for lists to load
    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
    });

    // Click on the list
    fireEvent.click(screen.getByText('Test List 1'));

    // Wait for list items to load
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists/1/items');
  });

  test('handles create item form submission', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 }
    ];
    const mockItems = [];
    const newItem = { id: '103', title: 'New Item', description: 'New description' };

    // Mock fetch calls
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockLists }) // Initial lists fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockItems }) // Initial items fetch
      .mockResolvedValueOnce({ ok: true, json: async () => newItem }) // Create item
      .mockResolvedValueOnce({ ok: true, json: async () => [newItem] }); // Refresh items

    render(<App />);

    // Wait for lists to load and select a list
    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test List 1'));

    // Wait for the create form to appear
    await waitFor(() => {
      expect(screen.getByText('Create New Item')).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Title:'), {
      target: { value: 'New Item' }
    });
    fireEvent.change(screen.getByLabelText('Description:'), {
      target: { value: 'New description' }
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Item'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists/1/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Item',
          description: 'New description'
        }),
      });
    });
  });

  test('handles update item functionality', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 }
    ];
    const mockItems = [
      { id: '101', title: 'Item 1', description: 'Item description 1' }
    ];
    const updatedItem = { id: '101', title: 'Item 1 (Updated)', description: 'Item description 1' };

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockLists }) // Initial lists
      .mockResolvedValueOnce({ ok: true, json: async () => mockItems }) // Initial items
      .mockResolvedValueOnce({ ok: true, json: async () => updatedItem }) // Update item
      .mockResolvedValueOnce({ ok: true, json: async () => [updatedItem] }); // Refresh items

    render(<App />);

    // Wait for lists and select one
    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test List 1'));

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Click update button
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists/1/items/101', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: '101',
          title: 'Item 1 (Updated)',
          description: 'Item description 1'
        }),
      });
    });
  });

  test('handles delete item functionality', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 }
    ];
    const mockItems = [
      { id: '101', title: 'Item 1', description: 'Item description 1' }
    ];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockLists }) // Initial lists
      .mockResolvedValueOnce({ ok: true, json: async () => mockItems }) // Initial items
      .mockResolvedValueOnce({ ok: true }) // Delete item
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // Refresh items (empty)

    render(<App />);

    // Wait for lists and select one
    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test List 1'));

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists/1/items/101', {
        method: 'DELETE',
      });
    });
  });

  test('shows loading state during async operations', async () => {
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ ok: true, json: async () => [] }), 100);
    }));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('handles API errors with proper error messages', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch lists: Internal Server Error/)).toBeInTheDocument();
    });
  });

  test('clears error state on successful operations', async () => {
    // First call fails
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { rerender } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error fetching lists/)).toBeInTheDocument();
    });

    // Second call succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    rerender(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Error fetching lists/)).not.toBeInTheDocument();
    });
  });

  test('handles keyboard navigation for list selection', async () => {
    const mockLists = [
      { id: '1', title: 'Test List 1', description: 'Description 1', itemCount: 5 }
    ];
    const mockItems = [];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockLists })
      .mockResolvedValueOnce({ ok: true, json: async () => mockItems });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test List 1')).toBeInTheDocument();
    });

    const listItem = screen.getByText('Test List 1').closest('[role="button"]');
    
    // Test Enter key
    fireEvent.keyDown(listItem, { key: 'Enter' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/sharepoint/lists/1/items');
    });
  });
});
