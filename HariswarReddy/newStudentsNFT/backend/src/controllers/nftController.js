const NFTMetadata = require('../models/NFTMetadata');
const nftService = require('../services/nftService');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Store NFT metadata
exports.storeNFTMetadata = async (req, res) => {
  try {
    const { tokenId, name, description, image, attributes, campaignId, studentAddress } = req.body;

    if (!tokenId || !name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tokenId, name, and description are required'
      });
    }

    // Upload image to Cloudinary if provided
    let imageUrl = image;
    if (req.file) {
      try {
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'nft-images',
          resource_type: 'auto'
        });
        imageUrl = cloudinaryResult.secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage'
        });
      }
    }

    // Create or update NFT metadata
    const nftMetadata = await NFTMetadata.findOneAndUpdate(
      { tokenId: parseInt(tokenId) },
      {
        tokenId: parseInt(tokenId),
        name,
        description,
        image: imageUrl,
        attributes: attributes || [],
        campaignId: parseInt(campaignId),
        studentAddress: studentAddress?.toLowerCase(),
        metadataUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/nft/metadata/${tokenId}`
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: nftMetadata
    });
  } catch (error) {
    console.error('Error storing NFT metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing NFT metadata',
      error: error.message
    });
  }
};

// Get NFT metadata by token ID
exports.getNFTMetadata = async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const nftMetadata = await NFTMetadata.findOne({ tokenId: parseInt(tokenId) });
    
    if (!nftMetadata) {
      return res.status(404).json({
        success: false,
        message: 'NFT metadata not found'
      });
    }

    res.json({
      success: true,
      data: nftMetadata
    });
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NFT metadata'
    });
  }
};

// Get all NFT metadata
exports.getAllNFTMetadata = async (req, res) => {
  try {
    const nftMetadata = await NFTMetadata.find().sort({ tokenId: 1 });
    
    res.json({
      success: true,
      data: nftMetadata
    });
  } catch (error) {
    console.error('Error fetching all NFT metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NFT metadata'
    });
  }
};

// Update NFT metadata
exports.updateNFTMetadata = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const updateData = req.body;

    const nftMetadata = await NFTMetadata.findOneAndUpdate(
      { tokenId: parseInt(tokenId) },
      updateData,
      { new: true }
    );

    if (!nftMetadata) {
      return res.status(404).json({
        success: false,
        message: 'NFT metadata not found'
      });
    }

    res.json({
      success: true,
      data: nftMetadata
    });
  } catch (error) {
    console.error('Error updating NFT metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating NFT metadata'
    });
  }
};

// Get tokenURI for smart contract compatibility
exports.getTokenURI = async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const metadata = await nftService.generateTokenURI(parseInt(tokenId));
    
    res.json(metadata);
  } catch (error) {
    console.error('Error getting tokenURI:', error);
    res.status(500).json({
      name: `Campaign NFT #${req.params.tokenId}`,
      description: 'Error loading metadata',
      image: 'https://via.placeholder.com/400x400/ff0000/ffffff?text=Error',
      attributes: []
    });
  }
}; 