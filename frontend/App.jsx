import React, { useState, useEffect } from 'react';

/**
 * SharePoint Connector Frontend Application
 * Converted from callbacks to async/await for better error handling and readability
 */
const App = () => {
  const [lists, setLists] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedList, setSelectedList] = useState('');

  // Async function to fetch SharePoint lists
  const fetchLists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulating SharePoint connector API call
      const response = await fetch('/api/sharepoint/lists');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLists(data);
    } catch (err) {
      setError(`Error fetching lists: ${err.message}`);
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Async function to fetch items from a specific list
  const fetchListItems = async (listId) => {
    if (!listId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sharepoint/lists/${listId}/items`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch list items: ${response.statusText}`);
      }
      
      const data = await response.json();
      setListItems(data);
    } catch (err) {
      setError(`Error fetching list items: ${err.message}`);
      console.error('Error fetching list items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Async function to create a new list item
  const createListItem = async (listId, itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sharepoint/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create item: ${response.statusText}`);
      }
      
      const newItem = await response.json();
      
      // Refresh the list items
      await fetchListItems(listId);
      
      return newItem;
    } catch (err) {
      setError(`Error creating item: ${err.message}`);
      console.error('Error creating item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Async function to update a list item
  const updateListItem = async (listId, itemId, itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sharepoint/lists/${listId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
      }
      
      const updatedItem = await response.json();
      
      // Refresh the list items
      await fetchListItems(listId);
      
      return updatedItem;
    } catch (err) {
      setError(`Error updating item: ${err.message}`);
      console.error('Error updating item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Async function to delete a list item
  const deleteListItem = async (listId, itemId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sharepoint/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.statusText}`);
      }
      
      // Refresh the list items
      await fetchListItems(listId);
    } catch (err) {
      setError(`Error deleting item: ${err.message}`);
      console.error('Error deleting item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Effect to load lists on component mount
  useEffect(() => {
    fetchLists();
  }, []);

  // Effect to load list items when a list is selected
  useEffect(() => {
    if (selectedList) {
      fetchListItems(selectedList);
    }
  }, [selectedList]);

  // Handle list selection
  const handleListSelect = (listId) => {
    setSelectedList(listId);
    setListItems([]);
  };

  // Handle form submission for creating new items
  const handleCreateItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemData = Object.fromEntries(formData.entries());
    
    try {
      await createListItem(selectedList, itemData);
      e.target.reset();
    } catch (err) {
      // Error is already handled in createListItem
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SharePoint Connector</h1>
        <p>Manage your SharePoint lists and items</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="lists-section">
          <h2>SharePoint Lists</h2>
          {loading && <div className="loading">Loading...</div>}
          
          <div className="lists-container">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`list-item ${selectedList === list.id ? 'selected' : ''}`}
                onClick={() => handleListSelect(list.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleListSelect(list.id);
                  }
                }}
              >
                <h3>{list.title}</h3>
                <p>{list.description}</p>
                <span className="item-count">{list.itemCount} items</span>
              </div>
            ))}
          </div>
        </section>

        {selectedList && (
          <section className="list-items-section">
            <h2>List Items</h2>
            
            <form onSubmit={handleCreateItem} className="create-item-form">
              <h3>Create New Item</h3>
              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Item'}
              </button>
            </form>

            <div className="list-items-container">
              {listItems.map((item) => (
                <div key={item.id} className="list-item-card">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <div className="item-actions">
                    <button
                      onClick={() => updateListItem(selectedList, item.id, { ...item, title: item.title + ' (Updated)' })}
                      disabled={loading}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deleteListItem(selectedList, item.id)}
                      disabled={loading}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
