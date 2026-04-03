const mongoose = require('mongoose');
const crypto = require('crypto');
const tls = require('tls');
require('dotenv').config();

mongoose.set('strictQuery', false);

const NODE_ENV = process.env.NODE_ENV || 'local';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set in environment variables');
}

const isLocal = NODE_ENV === 'local';

const getMongooseOptions = () => {
  if (isLocal) {
    return {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    };
  }

  const secureContext = tls.createSecureContext({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
  });

  return {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 50,
    minPoolSize: 5,
    family: 4,
    tls: true,
    secureContext: secureContext
  };
};

const connectDB = async () => {
  try {
    const options = getMongooseOptions();

    const conn = await mongoose.connect(MONGODB_URI, options);

    console.log(
      `MongoDB connected (${NODE_ENV}) to ${conn.connection.host}/${conn.connection.name}`
    );
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected - attempting to reconnect...');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    
      setTimeout(() => {
        console.log('Attempting to reconnect after connection error...');
        mongoose.connect(MONGODB_URI);
      }, 5000);
    });
    
    return conn;
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    
    if (error.cause) {
      console.error(`Underlying error: ${error.cause.message}`);
    }
    
 
    setTimeout(() => connectDB(), 10000);
    return null;
  }
};

module.exports = connectDB;