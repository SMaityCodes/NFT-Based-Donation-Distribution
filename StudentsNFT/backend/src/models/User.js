const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'donor', 'vendor'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
userSchema.index({ walletAddress: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 