const Student = require("../models/Student");
const NFTMetadata = require("../models/NFTMetadata");
const blockchainService = require("../services/blockchainService");
const { ethers } = require("ethers");
const { CONTRACT_ADDRESS, CONTRACT_ABI } = require("../config/contract");

// Register a new student
const registerStudent = async (req, res) => {
  try {
    // Log incoming request
    console.log("RegisterStudent request received:", {
      body: req.body,
      file: req.file,
    });

    // Check for admission letter file
    if (!req.file) {
      console.error("Admission letter file missing");
      return res.status(400).json({
        success: false,
        error:
          "Admission letter is required. Please upload a PDF, JPG, or PNG file.",
      });
    }

    // Check for required fields
    const requiredFields = ["address", "schoolType", "standard", "campaignId"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Create student
    const student = await Student.create({
      ...req.body,
      admissionLetterUrl: req.file ? `memory://${req.file.originalname}` : null,
      admissionLetterPublicId: req.file ? req.file.originalname : null,
    });

    console.log("Student registered successfully:", student);
    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get student by address
const getStudent = async (req, res) => {
  try {
    const { address } = req.params;

    // Get student from database
    const student = await Student.findOne({ address: address.toLowerCase() });

    // Get student data from blockchain
    let blockchainData = null;
    try {
      // Use consistent environment variable name
      const rpcUrl =
        process.env.ETHEREUM_RPC_URL ||
        process.env.RPC_URL ||
        "http://localhost:8545";
      console.log("Connecting to blockchain with RPC URL:", rpcUrl);

      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Check if student is registered in any campaign
      const allCampaigns = await contract.getAllCampaigns();
      let foundStudent = null;
      let globalStudentId = null;

      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const students = await contract.getStudentsByCampaign(i);
          const studentInCampaign = students.find(
            (s) => s.studentAddress.toLowerCase() === address.toLowerCase()
          );

          if (studentInCampaign) {
            // Get the student's global ID
            const studentIndex = students.findIndex(
              (s) => s.studentAddress.toLowerCase() === address.toLowerCase()
            );
            if (studentIndex !== -1) {
              globalStudentId = await contract.studentIdsByCampaign(
                i,
                studentIndex
              );
              foundStudent = await contract.students(globalStudentId);
              break;
            }
          }
        } catch (error) {
          console.log(`Error checking campaign ${i}:`, error);
        }
      }

      if (foundStudent) {
        blockchainData = {
          address: foundStudent.studentAddress,
          schoolType: foundStudent.schoolType,
          standard: foundStudent.standard,
          approved: foundStudent.approved,
          nftId: foundStudent.nftId.toString(),
          campaignId: foundStudent.campaignId.toString(),
          admissionLetterHash: foundStudent.admissionLetterHash,
          globalStudentId: globalStudentId.toString(),
        };
      }
    } catch (error) {
      console.error("Connect your RPC_URL !");
      // Don't fail the entire request if blockchain data can't be fetched
      // Just log the error and continue with database data only
    }

    // Combine database and blockchain data
    const combinedData = {
      ...student?.toObject(),
      blockchain: blockchainData,
    };

    if (!student && !blockchainData) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    res.json({
      success: true,
      data: combinedData,
    });
  } catch (error) {
    console.error("Error getting student:", error);
    res.status(500).json({
      success: false,
      error: error.message,
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
        error: "Student not found",
      });
    }

    if (student.approved) {
      return res.status(400).json({
        success: false,
        error: "Student is already approved",
      });
    }

    // Connect to the contract with admin wallet
    // Use consistent environment variable name
    const rpcUrl =
      process.env.ETHEREUM_RPC_URL ||
      process.env.RPC_URL ||
      "http://localhost:8545";
    console.log("Connecting to blockchain for approval with RPC URL:", rpcUrl);

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      wallet
    );

    // Get student ID from the contract
    const students = await contract.getStudentsByCampaign(student.campaignId);
    const studentInContract = students.find(
      (s) => s.studentAddress.toLowerCase() === student.address.toLowerCase()
    );

    if (!studentInContract) {
      return res.status(400).json({
        success: false,
        error: "Student not found in campaign",
      });
    }

    // Approve student using the contract function
    const tx = await contract.approveStudent(studentInContract.id);
    await tx.wait();

    // Get the NFT ID from the StudentApproved event
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "StudentApproved");
    const nftId = event.args.nftId;

    // Update student record
    student.approved = true;
    student.nftMinted = true;
    student.nftTransactionHash = tx.hash;
    student.nftId = nftId.toNumber();
    await student.save();

    // Create NFT metadata
    const nftMetadata = await NFTMetadata.create({
      tokenId: nftId.toNumber(),
      name: `Campaign NFT #${nftId.toString()}`,
      description: `NFT for student ${student.address} in campaign ${student.campaignId}`,
      image: `https://via.placeholder.com/400x400/0066cc/ffffff?text=NFT+${nftId.toString()}`, // Default placeholder image
      attributes: [
        { trait_type: "Student Address", value: student.address },
        { trait_type: "Campaign ID", value: student.campaignId.toString() },
        { trait_type: "School Type", value: student.schoolType },
        { trait_type: "Standard", value: student.standard.toString() },
        { trait_type: "Approved Date", value: new Date().toISOString() },
      ],
      campaignId: student.campaignId,
      studentAddress: student.address,
      metadataUrl: `${
        process.env.BACKEND_URL || "http://localhost:3001"
      }/api/nft/metadata/${nftId.toString()}`,
    });

    res.json({
      success: true,
      data: {
        student,
        nftMetadata,
      },
    });
  } catch (error) {
    console.error("Error approving student:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  registerStudent,
  getStudent,
  approveStudent,
};
