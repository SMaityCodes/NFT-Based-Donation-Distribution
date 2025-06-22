const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  schoolType: {
    type: String,
    required: true,
    enum: ['Government', 'Private', 'International']
  },
  standard: {
    type: Number,
    required: true
  },
  campaignId: {
    type: Number,
    required: true
  },
  admissionLetterUrl: {
    type: String,
    required: true
  },
  admissionLetterPublicId: {
    type: String,
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  nftMinted: {
    type: Boolean,
    default: false
  },
  nftTransactionHash: {
    type: String
  },
  nftId: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema); 