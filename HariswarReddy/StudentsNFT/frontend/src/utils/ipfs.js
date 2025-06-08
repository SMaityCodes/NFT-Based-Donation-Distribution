import { Web3Storage } from 'web3.storage';

// Get your Web3.Storage API token from .env.local
// Add VITE_WEB3_STORAGE_TOKEN="your_token_here" to your .env.local file
const WEB3_STORAGE_TOKEN = import.meta.env.VITE_WEB3_STORAGE_TOKEN;

function getStorageClient() {
  if (!WEB3_STORAGE_TOKEN) {
    console.error("Web3.Storage API token not found. Please set VITE_WEB3_STORAGE_TOKEN in your .env file.");
    throw new Error("Web3.Storage API token is missing.");
  }
  return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
}

export async function uploadFileToIPFS(file) {
  try {
    const client = getStorageClient();
    const cid = await client.put([file], {
      name: file.name,
      maxRetries: 3
    });
    console.log('Uploaded to IPFS with CID:', cid);
    // The hash expected by your contract is bytes32.
    // The CID is typically a multibase string. You'll need to convert it.
    // For simplicity, we'll return the string CID.
    // In a real DApp, you might want a backend service to parse CID to bytes32 or use a specific encoding.
    // If your smart contract expects the raw 32-byte hash of the content, you'll need to calculate that off-chain.
    // For now, let's assume the contract can take the string representation or that you'll hash it before sending.
    // Given 'bytes32 admissionLetterHash', it's likely expecting the 32-byte hash of the file content, not the CID.
    // You'd calculate this with a crypto library like 'js-sha3' or Node's 'crypto'.
    // For now, we'll return the string CID and make a note.

    // A simpler approach for the contract if it expects a hash: hash the file content locally
    const buffer = await file.arrayBuffer();
    const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)));
    const sha256Hash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('SHA-256 Hash of file content:', sha256Hash);

    // You might choose to store the CID and hash on-chain, or just the hash.
    // Your contract uses bytes32, so we'll assume the SHA-256 hash.
    return { cid, sha256Hash };

  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
}

export function getIPFSGatewayUrl(cid) {
  return `https://${cid}.ipfs.dweb.link`; // Web3.Storage default gateway
  // Or use other gateways:
  // return `https://ipfs.io/ipfs/${cid}`;
  // return `https://cloudflare-ipfs.com/ipfs/${cid}`;
}