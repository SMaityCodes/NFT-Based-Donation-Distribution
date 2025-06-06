const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Vendor = require('../models/Vendor');
const Donor = require('../models/Donor');
const blockchainService = require('../services/blockchainService');

// Check if address is admin
const checkAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ address: req.params.address.toLowerCase() });
    res.json({ isAdmin: !!admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if address is student
const checkStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentAddress: req.params.address.toLowerCase() });
    res.json({ isStudent: !!student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if address is vendor
const checkVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ vendorAddress: req.params.address.toLowerCase() });
    res.json({ isVendor: !!vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if address is donor
const checkDonor = async (req, res) => {
  try {
    const donor = await Donor.findOne({ donorAddress: req.params.address.toLowerCase() });
    res.json({ isDonor: !!donor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Controller Methods
const createAdmin = async (req, res) => {
  try {
    const admin = await Admin.create(req.body);
    res.status(201).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ address: req.params.address });
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Vendor Controller Methods
const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ address: req.params.address });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { address: req.params.address },
      { approved: true },
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Student Controllers
const getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ address: req.params.address.toLowerCase() });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const approveStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { approved: true },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Export all controller methods
module.exports = {
  checkAdmin,
  checkStudent,
  checkVendor,
  checkDonor,
  createAdmin,
  getAdmin,
  createVendor,
  getVendor,
  approveVendor,
  getStudent,
  approveStudent
}; 