const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: Number, required: true, unique: true, index: true },
  studentAddress: { type: String, required: true, lowercase: true, index: true },
  schoolType: { type: String, required: true },
  standard: { type: Number, required: true },
  admissionLetterHash: { type: String, required: true }, // Store as hex string
  approved: { type: Boolean, default: false },
  nftId: { type: Number, default: 0 },
  campaignId: { type: Number, required: true, index: true },
  registeredAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }, // Will be set when approved
});

module.exports = mongoose.model('Student', studentSchema);