const fs = require('fs').promises;
const path = require('path');

/**
 * Simple database operations using async/await for SharePoint data persistence
 * This module provides basic CRUD operations with Promise-based API
 */

class Database {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.ensureDataDir().catch(err => {
      console.error('Failed to create data directory:', err);
    });
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err) {
      throw err;
    }
  }

  // Create operation with async/await
  async create(collection, data) {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data must be an object');
    }

    const filePath = path.join(this.dataDir, `${collection}.json`);
    
    try {
      // Read existing data
      const existingData = await this.readCollection(collection);
      const records = existingData || [];
      
      const newRecord = {
        id: this.generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      records.push(newRecord);

      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
      return newRecord;
    } catch (err) {
      throw err;
    }
  }

  // Read operation with async/await
  async read(collection, id) {
    try {
      const records = await this.readCollection(collection);
      const record = records.find(r => r.id === id);
      
      if (!record) {
        throw new Error(`Record with id ${id} not found`);
      }

      return record;
    } catch (err) {
      throw err;
    }
  }

  // Update operation with async/await
  async update(collection, id, data) {
    try {
      const records = await this.readCollection(collection);
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error(`Record with id ${id} not found`);
      }

      const updatedRecord = {
        ...records[index],
        ...data,
        updatedAt: new Date().toISOString()
      };

      records[index] = updatedRecord;

      const filePath = path.join(this.dataDir, `${collection}.json`);
      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
      
      return updatedRecord;
    } catch (err) {
      throw err;
    }
  }

  // Delete operation with async/await
  async delete(collection, id) {
    try {
      const records = await this.readCollection(collection);
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error(`Record with id ${id} not found`);
      }

      const deletedRecord = records[index];
      records.splice(index, 1);

      const filePath = path.join(this.dataDir, `${collection}.json`);
      await fs.writeFile(filePath, JSON.stringify(records, null, 2));
      
      return deletedRecord;
    } catch (err) {
      throw err;
    }
  }

  // List all records with async/await
  async list(collection) {
    try {
      return await this.readCollection(collection);
    } catch (err) {
      throw err;
    }
  }

  // Query records with async/await
  async query(collection, filter) {
    try {
      const records = await this.readCollection(collection);
      
      const filteredRecords = records.filter(record => {
        return Object.keys(filter).every(key => {
          return record[key] === filter[key];
        });
      });

      return filteredRecords;
    } catch (err) {
      throw err;
    }
  }

  // Batch operations with async/await
  async batch(operations) {
    try {
      if (operations.length === 0) {
        return [];
      }

      const promises = operations.map(async (operation) => {
        const { type, collection, id, data } = operation;
        
        switch (type) {
          case 'create':
            return await this.create(collection, data);
          case 'read':
            return await this.read(collection, id);
          case 'update':
            return await this.update(collection, id, data);
          case 'delete':
            return await this.delete(collection, id);
          default:
            throw new Error(`Unknown operation type: ${type}`);
        }
      });

      return await Promise.all(promises);
    } catch (err) {
      throw err;
    }
  }

  // Helper method to read collection file with async/await
  async readCollection(collection) {
    const filePath = path.join(this.dataDir, `${collection}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  // Helper method to generate unique IDs
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Close database connection (cleanup) with async/await
  async close() {
    // In a real database, this would close connections
    // For file-based storage, we just return a resolved promise
    return Promise.resolve();
  }
}

module.exports = Database;