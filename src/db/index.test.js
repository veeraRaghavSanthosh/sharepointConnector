const Database = require('./index');
const fs = require('fs');
const path = require('path');

// Test data directory
const TEST_DATA_DIR = './test_data';

describe('Database (Async/Await)', () => {
  let db;

  beforeEach(() => {
    // Clean up test data directory
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    db = new Database(TEST_DATA_DIR);
  });

  afterEach(() => {
    // Clean up test data directory
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  test('should create a record', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    
    const result = await db.create('users', testData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe(testData.name);
    expect(result.email).toBe(testData.email);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  test('should read a record', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    
    const createdRecord = await db.create('users', testData);
    const readRecord = await db.read('users', createdRecord.id);
    
    expect(readRecord).toEqual(createdRecord);
  });

  test('should update a record', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    const updateData = { name: 'Updated User' };
    
    const createdRecord = await db.create('users', testData);
    const updatedRecord = await db.update('users', createdRecord.id, updateData);
    
    expect(updatedRecord.name).toBe(updateData.name);
    expect(updatedRecord.email).toBe(testData.email);
    expect(updatedRecord.updatedAt).not.toBe(createdRecord.updatedAt);
  });

  test('should delete a record', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    
    const createdRecord = await db.create('users', testData);
    const deletedRecord = await db.delete('users', createdRecord.id);
    
    expect(deletedRecord).toEqual(createdRecord);
    
    // Verify record is deleted
    await expect(db.read('users', createdRecord.id)).rejects.toThrow('not found');
  });

  test('should list all records', async () => {
    const testData1 = { name: 'User 1', email: 'user1@example.com' };
    const testData2 = { name: 'User 2', email: 'user2@example.com' };
    
    const record1 = await db.create('users', testData1);
    const record2 = await db.create('users', testData2);
    const records = await db.list('users');
    
    expect(records).toHaveLength(2);
    expect(records).toContainEqual(record1);
    expect(records).toContainEqual(record2);
  });

  test('should query records with filter', async () => {
    const testData1 = { name: 'User 1', role: 'admin' };
    const testData2 = { name: 'User 2', role: 'user' };
    const testData3 = { name: 'User 3', role: 'admin' };
    
    await db.create('users', testData1);
    await db.create('users', testData2);
    await db.create('users', testData3);
    
    const adminUsers = await db.query('users', { role: 'admin' });
    
    expect(adminUsers).toHaveLength(2);
    expect(adminUsers.every(user => user.role === 'admin')).toBe(true);
  });

  test('should perform batch operations', async () => {
    const operations = [
      { type: 'create', collection: 'users', data: { name: 'User 1' } },
      { type: 'create', collection: 'users', data: { name: 'User 2' } },
    ];
    
    const results = await db.batch(operations);
    
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('User 1');
    expect(results[1].name).toBe('User 2');
  });

  test('should handle errors gracefully', async () => {
    await expect(db.read('nonexistent', 'invalid-id')).rejects.toThrow('not found');
  });

  test('should close database connection', async () => {
    await expect(db.close()).resolves.toBeUndefined();
  });

  test('should handle invalid data in create', async () => {
    await expect(db.create('users', null)).rejects.toThrow('Data must be an object');
    await expect(db.create('users', 'string')).rejects.toThrow('Data must be an object');
  });

  test('should handle non-existent record in update', async () => {
    await expect(db.update('users', 'non-existent-id', { name: 'Test' })).rejects.toThrow('not found');
  });

  test('should handle non-existent record in delete', async () => {
    await expect(db.delete('users', 'non-existent-id')).rejects.toThrow('not found');
  });

  test('should handle unknown operation type in batch', async () => {
    const operations = [
      { type: 'unknown', collection: 'users', data: { name: 'User 1' } },
    ];
    
    await expect(db.batch(operations)).rejects.toThrow('Unknown operation type');
  });
});