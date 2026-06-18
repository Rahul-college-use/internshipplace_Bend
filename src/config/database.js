import mongoose from 'mongoose';
import config from './config.js';

async function connectDB() {
  try {
    // If we're already connected, reuse the active connection
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
    };

    await mongoose.connect(config.MONGO_URL, opts);
    console.log("=> MongoDB connected successfully");
    
    return mongoose.connection;
  } catch (err) {
    console.error("=> MongoDB connection error:", err);
    process.exit(1); // Stop the server immediately if the database is down
  }
}

export default connectDB;