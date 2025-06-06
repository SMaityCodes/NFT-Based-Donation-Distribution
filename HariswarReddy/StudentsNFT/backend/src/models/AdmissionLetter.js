const mongoose = require('mongoose');

const admissionLetterSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  campaignId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('AdmissionLetter', admissionLetterSchema); 