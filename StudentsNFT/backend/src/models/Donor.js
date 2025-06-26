const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  donorAddress: { type: String, required: true, lowercase: true, unique: true, index: true },
  totalDonated: { type: String, required: true }, // Store as string to handle large BigInt values from ethers.js
  // Can add a sub-document or separate collection for donations per campaign if detailed history is needed
  // For now, `totalDonated` is the total across all campaigns from the contract.
  campaignContributions: [ // To store how much they donated to each campaign
    {
      campaignId: { type: Number, required: true },
      amount: { type: String, required: true },
    }
  ],
  firstDonationAt: { type: Date, default: Date.now },
  lastDonationAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Donor', donorSchema);