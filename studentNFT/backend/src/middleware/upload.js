const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure memory storage instead of disk storage
// This prevents files from being saved locally
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage, // Use memory storage instead of disk storage
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'), false);
    }
  }
});

module.exports = { upload }; 