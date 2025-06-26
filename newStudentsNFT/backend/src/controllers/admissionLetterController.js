const AdmissionLetter = require('../models/AdmissionLetter');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const { ethers } = require('ethers');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

exports.uploadAdmissionLetter = async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file,
      body: req.body,
      headers: req.headers
    });

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        error: 'FILE_MISSING'
      });
    }

    const { studentId, campaignId } = req.body;
    if (!studentId || !campaignId) {
      console.error('Missing required fields:', { studentId, campaignId });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: studentId and campaignId are required',
        error: 'MISSING_FIELDS'
      });
    }
    
    // Convert studentId to lowercase
    const studentAddress = studentId.toLowerCase();

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'admission-letters',
        resource_type: 'auto'
      });
      console.log('File uploaded to Cloudinary:', cloudinaryResult);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to cloud storage',
        error: cloudinaryError.message
      });
    }

    // Create a hash for the smart contract using ethers v5 syntax
    // We'll use the Cloudinary URL and some metadata to create a unique hash
    const hashData = `${studentAddress}-${campaignId}-${cloudinaryResult.public_id}-${Date.now()}`;
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(hashData));
    
    console.log('Creating/updating admission letter with data:', {
      studentId: studentAddress,
      campaignId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      hash: hash
    });

    try {
      // Try to find existing admission letter
      let admissionLetter = await AdmissionLetter.findOne({ studentId: studentAddress });

      if (admissionLetter) {
        // If exists, update it
        console.log('Updating existing admission letter');
        admissionLetter = await AdmissionLetter.findOneAndUpdate(
          { studentId: studentAddress },
          {
            campaignId,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            hash: hash,
            status: 'pending', // Reset status when updating
            adminNotes: '' // Clear admin notes when updating
          },
          { new: true }
        );
      } else {
        // If doesn't exist, create new one
        console.log('Creating new admission letter');
        admissionLetter = new AdmissionLetter({
          studentId: studentAddress,
          campaignId,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          hash: hash
        });
        await admissionLetter.save();
      }

      console.log('Admission letter saved successfully:', admissionLetter);
      res.status(201).json({
        success: true,
        data: {
          ...admissionLetter.toObject(),
          hash: hash // Include the hash for the smart contract
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If there's a database error, try to clean up the uploaded file
      try {
        await fs.unlink(req.file.path);
        // Also delete from Cloudinary
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      } catch (unlinkError) {
        console.error('Error deleting file after database error:', unlinkError);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error uploading admission letter:', error);
    // Send more detailed error information
    res.status(500).json({ 
      success: false,
      message: 'Error uploading admission letter',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getAdmissionLetter = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Convert the studentId to lowercase to match the database
    const studentAddress = studentId.toLowerCase();
    console.log('Fetching admission letter for student:', studentAddress);
    
    const admissionLetter = await AdmissionLetter.findOne({ studentId: studentAddress });
    
    if (!admissionLetter) {
      console.log('No admission letter found for student:', studentAddress);
      return res.status(404).json({ message: 'Admission letter not found' });
    }

    console.log('Found admission letter:', admissionLetter);
    res.json(admissionLetter);
  } catch (error) {
    console.error('Error fetching admission letter:', error);
    res.status(500).json({ message: 'Error fetching admission letter' });
  }
};

exports.getAllAdmissionLetters = async (req, res) => {
  try {
    const admissionLetters = await AdmissionLetter.find();
    res.json(admissionLetters);
  } catch (error) {
    console.error('Error fetching admission letters:', error);
    res.status(500).json({ message: 'Error fetching admission letters' });
  }
};

exports.updateAdmissionLetterStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, adminNotes } = req.body;

    const admissionLetter = await AdmissionLetter.findOneAndUpdate(
      { studentId },
      { status, adminNotes },
      { new: true }
    );

    if (!admissionLetter) {
      return res.status(404).json({ message: 'Admission letter not found' });
    }

    res.json(admissionLetter);
  } catch (error) {
    console.error('Error updating admission letter status:', error);
    res.status(500).json({ message: 'Error updating admission letter status' });
  }
};

exports.downloadAdmissionLetter = async (req, res) => {
  try {
    const { studentId } = req.params;
    const admissionLetter = await AdmissionLetter.findOne({ studentId });

    if (!admissionLetter) {
      return res.status(404).json({ message: 'Admission letter not found' });
    }

    res.download(admissionLetter.filePath);
  } catch (error) {
    console.error('Error downloading admission letter:', error);
    res.status(500).json({ message: 'Error downloading admission letter' });
  }
}; 