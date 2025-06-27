const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admissionLetterController = require('../controllers/admissionLetterController');
const { isAdmin, isAuthenticated } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.memoryStorage();

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

// Get all admission letters (admin only)
router.get('/', isAdmin, admissionLetterController.getAllAdmissionLetters);

// Get admission letter by student ID (requires authentication)
router.get('/:studentId', isAuthenticated, admissionLetterController.getAdmissionLetter);

// Update admission letter status (admin only)
router.patch('/:studentId/status', isAdmin, admissionLetterController.updateAdmissionLetterStatus);

// Download admission letter (requires authentication)
router.get('/:studentId/download', isAuthenticated, admissionLetterController.downloadAdmissionLetter);

module.exports = router; 