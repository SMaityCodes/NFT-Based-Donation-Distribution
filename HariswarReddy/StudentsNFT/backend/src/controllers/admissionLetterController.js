const AdmissionLetter = require('../models/AdmissionLetter');
const path = require('path');
const fs = require('fs').promises;

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
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { studentId, campaignId } = req.body;
    if (!studentId || !campaignId) {
      console.error('Missing required fields:', { studentId, campaignId });
      return res.status(400).json({ message: 'Missing required fields: studentId and campaignId are required' });
    }
    
    // Convert studentId to lowercase
    const studentAddress = studentId.toLowerCase();
    const fileUrl = `/uploads/${path.basename(req.file.path)}`;
    console.log('Creating/updating admission letter with data:', {
      studentId: studentAddress,
      campaignId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl
    });

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
          fileUrl,
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
        fileUrl
      });
      await admissionLetter.save();
    }

    console.log('Admission letter saved successfully:', admissionLetter);
    res.status(201).json(admissionLetter);
  } catch (error) {
    console.error('Error uploading admission letter:', error);
    // Send more detailed error information
    res.status(500).json({ 
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