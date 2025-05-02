// test-write.js
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');

async function testWrite() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create a test schema and model
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Create a test document
    console.log('Attempting to write a test document...');
    const testDoc = new Test({ name: 'Connection Test' });
    await testDoc.save();
    
    console.log('✅ Successfully wrote test document to database!');
    
    // Find the document to verify read operation
    const foundDoc = await Test.findOne({ name: 'Connection Test' });
    console.log('✅ Successfully read test document:', foundDoc);
    
    // Clean up (optional)
    await Test.deleteOne({ _id: testDoc._id });
    console.log('✅ Successfully deleted test document');
    
    console.log('🎉 All database operations successful! Your connection is working properly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

testWrite();