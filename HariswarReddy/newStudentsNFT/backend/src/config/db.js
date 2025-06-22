const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/students-nft';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Please make sure MongoDB is running or set MONGODB_URI environment variable');
    console.log('You can install MongoDB locally or use MongoDB Atlas');
    // Don't exit the process, let it continue with limited functionality
    console.log('Backend will start but some features may not work without database');
  }
};

module.exports = connectDB; 