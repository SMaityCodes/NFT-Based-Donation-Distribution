const Campaign = require('../models/Campaign');
const Student = require('../models/Student');
const Donor = require('../models/Donor');
const Vendor = require('../models/Vendor');
const VendorTransaction = require('../models/VendorTransaction');
const blockchainService = require('../services/blockchainService');

// Get all campaigns
const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await blockchainService.getCampaigns();
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single campaign
const getCampaign = async (req, res) => {
  try {
    const campaign = await blockchainService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create campaign
const createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all donors
const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: donors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get donors for a specific campaign
const getDonorsForCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    res.json({
      success: true,
      data: campaign.donors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get students by campaign ID
const getStudentsByCampaignId = async (req, res) => {
  try {
    const students = await Student.find({ campaignId: req.params.id }).sort({ registeredAt: 1 });
    res.json({
      success: true,
      data: students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get approved students by campaign ID
const getApprovedStudentsByCampaignId = async (req, res) => {
  try {
    const students = await Student.find({ campaignId: req.params.id, approved: true }).sort({ approvedAt: 1 });
    res.json({
      success: true,
      data: students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all vendors
const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ registeredAt: 1 });
    res.json({
      success: true,
      data: vendors
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get NFT details
const getNFTDetails = async (req, res) => {
  try {
    const nftId = parseInt(req.params.id);
    const vendorTx = await VendorTransaction.findOne({ nftId: nftId });
    const student = await Student.findOne({ nftId: nftId });

    if (!student && !vendorTx) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found in indexed data'
      });
    }

    // Combine data from student and vendor transaction if available
    const response = {
      nftId: nftId,
      studentAddress: student ? student.studentAddress : null,
      standard: student ? student.standard : null,
      amount: student ? student.nftAmount : null,
      isUsed: !!vendorTx,
      itemProvided: vendorTx ? vendorTx.itemProvided : null,
      vendorAddress: vendorTx ? vendorTx.vendorAddress : null,
      timestamp: vendorTx ? vendorTx.timestamp : null
    };

    res.json({
      success: true,
      data: response
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all vendor transactions
const getAllVendorTransactions = async (req, res) => {
  try {
    const transactions = await VendorTransaction.find().sort({ timestamp: -1 });
    res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllDonors,
  getDonorsForCampaign,
  getStudentsByCampaignId,
  getApprovedStudentsByCampaignId,
  getAllVendors,
  getNFTDetails,
  getAllVendorTransactions
};