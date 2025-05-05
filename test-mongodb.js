const mongoose = require('mongoose');
const connectDB = require('./src/config/database');

async function testWrite() {
  try {
    await connectDB();
    
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    const testDoc = new Test({ name: 'Connection Test' });
    await testDoc.save();
    
    const foundDoc = await Test.findOne({ name: 'Connection Test' });
    
    await Test.deleteOne({ _id: testDoc._id });
    
  } catch (error) {
  } finally {
    await mongoose.connection.close();
  }
}

testWrite();