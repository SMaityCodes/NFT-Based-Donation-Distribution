const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required']
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required']
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  allowedSchoolTypes: [{
    type: String,
    enum: ['Government', 'Private', 'International']
  }],
  allowedStandards: [{
    type: Number
  }],
  donors: [{
    address: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);