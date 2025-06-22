const NFTMetadata = require('../models/NFTMetadata');

// Generate tokenURI for NFT (replaces IPFS URLs)
exports.generateTokenURI = async (tokenId) => {
  try {
    const nftMetadata = await NFTMetadata.findOne({ tokenId: parseInt(tokenId) });
    
    if (!nftMetadata) {
      // Return default metadata if not found
      return {
        name: `Campaign NFT #${tokenId}`,
        description: 'NFT metadata not found',
        image: 'https://via.placeholder.com/400x400/cccccc/666666?text=No+Image',
        attributes: []
      };
    }

    return {
      name: nftMetadata.name,
      description: nftMetadata.description,
      image: nftMetadata.image,
      attributes: nftMetadata.attributes
    };
  } catch (error) {
    console.error('Error generating tokenURI:', error);
    return {
      name: `Campaign NFT #${tokenId}`,
      description: 'Error loading metadata',
      image: 'https://via.placeholder.com/400x400/ff0000/ffffff?text=Error',
      attributes: []
    };
  }
};

// Get tokenURI as JSON string (for smart contract compatibility)
exports.getTokenURIAsJSON = async (tokenId) => {
  const metadata = await exports.generateTokenURI(tokenId);
  return JSON.stringify(metadata);
}; 