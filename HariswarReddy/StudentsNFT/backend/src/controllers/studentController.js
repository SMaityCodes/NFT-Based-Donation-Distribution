const Student = require('../models/Student');
const blockchainService = require('../services/blockchainService');
const { ethers } = require('ethers');
const { CONTRACT_ADDRESS, CONTRACT_ABI } = require('../config/contract');

// Register a new student
const registerStudent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Admission letter is required'
      });
    }

    const student = await Student.create({
      ...req.body,
      admissionLetterUrl: req.file.path,
      admissionLetterPublicId: req.file.filename
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get student by address
const getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ address: req.params.address });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Approve student and mint NFT
const approveStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ address: req.params.address });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    if (student.approved) {
      return res.status(400).json({
        success: false,
        error: 'Student is already approved'
      });
    }

    // Connect to the contract with admin wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Get student ID from the contract
    const students = await contract.getStudentsByCampaign(student.campaignId);
    const studentInContract = students.find(s => s.studentAddress.toLowerCase() === student.address.toLowerCase());
    
    if (!studentInContract) {
      return res.status(400).json({
        success: false,
        error: 'Student not found in campaign'
      });
    }

    // Approve student using the contract function
    const tx = await contract.approveStudent(studentInContract.id);
    await tx.wait();

    // Get the NFT ID from the StudentApproved event
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'StudentApproved');
    const nftId = event.args.nftId;

    // Update student record
    student.approved = true;
    student.nftMinted = true;
    student.nftTransactionHash = tx.hash;
    student.nftId = nftId.toNumber();
    await student.save();

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  registerStudent,
  getStudent,
  approveStudent
}; 