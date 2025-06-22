// Utility functions for NFT operations (replacing IPFS functionality)

export function getNFTMetadataUrl(tokenId) {
  return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/nft/metadata/${tokenId}`;
}

export async function fetchNFTMetadata(tokenId) {
  try {
    const response = await fetch(getNFTMetadataUrl(tokenId));
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

export function formatNFTMetadata(nftData) {
  return {
    name: nftData.name || `NFT #${nftData.tokenId}`,
    description: nftData.description || 'No description available',
    image: nftData.image || 'https://via.placeholder.com/400x400/cccccc/666666?text=No+Image',
    attributes: nftData.attributes || []
  };
} 