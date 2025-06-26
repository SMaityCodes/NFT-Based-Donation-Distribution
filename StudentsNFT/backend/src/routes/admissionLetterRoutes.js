const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const admissionLetterController = require('../controllers/admissionLetterController');
const { isAdmin, isAuthenticated } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

// Upload admission letter (requires authentication)
router.post('/upload', isAuthenticated, upload.single('admissionLetter'), admissionLetterController.uploadAdmissionLetter);

// Get admission letter by student ID (requires authentication)
router.get('/:studentId', isAuthenticated, admissionLetterController.getAdmissionLetter);

// Get all admission letters (admin only)
router.get('/', isAdmin, admissionLetterController.getAllAdmissionLetters);

// Update admission letter status (admin only)
router.patch('/:studentId/status', isAdmin, admissionLetterController.updateAdmissionLetterStatus);

// Download admission letter (requires authentication)
router.get('/:studentId/download', isAuthenticated, admissionLetterController.downloadAdmissionLetter);

module.exports = router; 