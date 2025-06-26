const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nftController = require('../controllers/nftController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'nft-image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

// Store NFT metadata (with optional image upload)
router.post('/metadata', isAuthenticated, upload.single('image'), nftController.storeNFTMetadata);

// Get NFT metadata by token ID
router.get('/metadata/:tokenId', nftController.getNFTMetadata);

// Get tokenURI for smart contract compatibility
router.get('/tokenURI/:tokenId', nftController.getTokenURI);

// Get all NFT metadata
router.get('/metadata', nftController.getAllNFTMetadata);

// Update NFT metadata (admin only)
router.put('/metadata/:tokenId', isAdmin, nftController.updateNFTMetadata);

module.exports = router; 