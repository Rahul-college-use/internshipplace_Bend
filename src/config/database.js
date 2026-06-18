import mongoose from 'mongoose';
import config from './config.js';

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const opts = {
      bufferCommands: false, // This is fine, but requires strict connection handling
      serverSelectionTimeoutMS: 30000,
    };

    await mongoose.connect(config.MONGO_URL, opts);
    console.log("=> MongoDB connected successfully");
    
    return mongoose.connection;
  } catch (err) {
    console.error("=> MongoDB connection error:", err);
    // REMOVED process.exit(1) for Vercel compatibility
    throw err; 
  }
}

export default connectDB;