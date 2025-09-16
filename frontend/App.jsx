import React, { useState, useEffect } from 'react';

// Example App component converted from callbacks to async/await
const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lists, setLists] = useState([]);

  // Async/await function to fetch SharePoint data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulating SharePoint API call with Promise
      const mockData = await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const data = {
              title: 'SharePoint Data',
              items: ['Item 1', 'Item 2', 'Item 3']
            };
            resolve(data);
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });
      
      return mockData;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Async/await function to fetch SharePoint lists
  const fetchLists = async () => {
    setLoading(true);
    
    try {
      // Simulating SharePoint lists API call with Promise
      const mockLists = await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const lists = [
              { id: '1', title: 'Documents', itemCount: 25 },
              { id: '2', title: 'Tasks', itemCount: 12 },
              { id: '3', title: 'Calendar', itemCount: 8 }
            ];
            resolve(lists);
          } catch (err) {
            reject(err);
          }
        }, 800);
      });
      
      return mockLists;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Async/await function to create new list item
  const createListItem = async (listId, itemData) => {
    setLoading(true);
    
    try {
      // Simulating SharePoint create item API call with Promise
      const newItem = await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const item = {
              id: Date.now().toString(),
              ...itemData,
              created: new Date().toISOString()
            };
            resolve(item);
          } catch (err) {
            reject(err);
          }
        }, 600);
      });
      
      return newItem;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Using async/await in useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dataResult, listsResult] = await Promise.all([
          fetchData(),
          fetchLists()
        ]);
        
        setData(dataResult);
        setLists(listsResult);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Async/await event handler
  const handleCreateItem = async () => {
    const itemData = { title: 'New Item', description: 'Created from App' };
    
    try {
      const result = await createListItem('1', itemData);
      
      // Add new item to existing lists
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === '1' 
            ? { ...list, itemCount: list.itemCount + 1 }
            : list
        )
      );
      console.log('Created item:', result);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <h1>SharePoint Connector Frontend</h1>
      
      {data && (
        <div className="data-section">
          <h2>{data.title}</h2>
          <ul>
            {data.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="lists-section">
        <h2>SharePoint Lists</h2>
        <button onClick={handleCreateItem} disabled={loading}>
          Create New Item
        </button>
        <div className="lists-grid">
          {lists.map(list => (
            <div key={list.id} className="list-card">
              <h3>{list.title}</h3>
              <p>Items: {list.itemCount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
