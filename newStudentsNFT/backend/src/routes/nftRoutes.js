const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const nftController = require('../controllers/nftController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Configure memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed.'));
    }
  }
});

// Get NFT metadata by token ID
router.get('/metadata/:tokenId', nftController.getNFTMetadata);

module.exports = router; 