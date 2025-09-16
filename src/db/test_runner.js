const Database = require('./index');
const fs = require('fs');

async function runTests() {
  console.log('🚀 Starting Database async/await tests...\n');
  
  const TEST_DATA_DIR = './test_data_manual';
  
  // Clean up test directory
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  
  const db = new Database(TEST_DATA_DIR);
  
  try {
    // Test 1: Create operation
    console.log('✅ Test 1: Create operation');
    const testData = { name: 'John Doe', email: 'john@example.com', role: 'admin' };
    const createdRecord = await db.create('users', testData);
    console.log('   Created record:', createdRecord.id);
    
    // Test 2: Read operation
    console.log('✅ Test 2: Read operation');
    const readRecord = await db.read('users', createdRecord.id);
    console.log('   Read record:', readRecord.name);
    
    // Test 3: Update operation
    console.log('✅ Test 3: Update operation');
    const updatedRecord = await db.update('users', createdRecord.id, { name: 'Jane Doe' });
    console.log('   Updated record:', updatedRecord.name);
    
    // Test 4: List operation
    console.log('✅ Test 4: List operation');
    await db.create('users', { name: 'Bob Smith', email: 'bob@example.com', role: 'user' });
    const allRecords = await db.list('users');
    console.log('   Total records:', allRecords.length);
    
    // Test 5: Query operation
    console.log('✅ Test 5: Query operation');
    const adminUsers = await db.query('users', { role: 'admin' });
    console.log('   Admin users found:', adminUsers.length);
    
    // Test 6: Batch operation
    console.log('✅ Test 6: Batch operation');
    const batchOps = [
      { type: 'create', collection: 'users', data: { name: 'Alice', role: 'user' } },
      { type: 'create', collection: 'users', data: { name: 'Charlie', role: 'admin' } }
    ];
    const batchResults = await db.batch(batchOps);
    console.log('   Batch operations completed:', batchResults.length);
    
    // Test 7: Delete operation
    console.log('✅ Test 7: Delete operation');
    const deletedRecord = await db.delete('users', createdRecord.id);
    console.log('   Deleted record:', deletedRecord.name);
    
    // Test 8: Error handling
    console.log('✅ Test 8: Error handling');
    try {
      await db.read('users', 'non-existent-id');
    } catch (error) {
      console.log('   Error caught correctly:', error.message);
    }
    
    // Test 9: Close operation
    console.log('✅ Test 9: Close operation');
    await db.close();
    console.log('   Database closed successfully');
    
    console.log('\n🎉 All async/await tests passed!\n');
    
    // Cleanup
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().then(() => {
  console.log('✨ Test suite completed successfully!');
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});