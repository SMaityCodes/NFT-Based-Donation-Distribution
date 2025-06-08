const mongoose = require('mongoose');

const vendorTransactionSchema = new mongoose.Schema({
  nftId: { type: Number, required: true, unique: true, index: true },
  studentAddress: { type: String, required: true, lowercase: true },
  vendorAddress: { type: String, required: true, lowercase: true, index: true },
  itemProvided: { type: String, required: true },
  timestamp: { type: Date, required: true }, // Store as Date object
});

module.exports = mongoose.model('VendorTransaction', vendorTransactionSchema);