import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Grid, Card, CardContent, CardActions, Button, Link
} from '@mui/material';
import useWeb3Store from '../store/web3Store';
import { toast } from 'react-hot-toast';
import { STANDARDS } from '../utils/constants';
import { getIPFSGatewayUrl } from '../utils/ipfs'; // Assuming NFT URI points to IPFS metadata

const MyNFTsMUI = () => {
  const { contract, account, isConnected } = useWeb3Store();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyNFTs = async () => {
    if (!isConnected || !contract || !account) {
      setNfts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const balance = await contract.balanceOf(account);
      const fetchedNFTs = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(account, i);
        const nftDetails = await contract.getNFTDetails(tokenId); // Assuming getNFTDetails is public
        const tokenURI = await contract.tokenURI(tokenId); // Fetch token URI for metadata

        fetchedNFTs.push({
          tokenId: tokenId.toString(),
          standard: STANDARDS[nftDetails.standard],
          amount: nftDetails.amount.toString(),
          isUsed: nftDetails.isUsed,
          currentOwner: nftDetails.currentOwner,
          tokenURI: tokenURI,
        });
      }
      setNfts(fetchedNFTs);
    } catch (err) {
      console.error("Failed to fetch NFTs:", err);
      setError(`Failed to fetch your NFTs: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyNFTs();
  }, [isConnected, account, contract]);

  if (!isConnected) {
    return (
      <Box sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" mb={3}>Please connect your wallet to view your NFTs.</Typography>
        <Button variant="contained" color="primary" onClick={useWeb3Store.getState().connectWallet}>
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'error.main', mt: 4 }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        My NFTs
      </Typography>
      {nfts.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          You don't own any Campaign NFTs yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {nfts.map((nft) => (
            <Grid item xs={12} sm={6} md={4} key={nft.tokenId}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    NFT ID: {nft.tokenId}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Standard: {nft.standard}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Amount: {ethers.formatEther(nft.amount)} ETH
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Status: {nft.isUsed ? 'Used' : 'Available'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Current Owner: {nft.currentOwner === account ? 'You' : nft.currentOwner.substring(0, 6) + '...' + nft.currentOwner.substring(nft.currentOwner.length - 4)}
                  </Typography>
                </CardContent>
                <CardActions>
                  {nft.tokenURI && (
                    <Button
                      size="small"
                      color="primary"
                      component={Link}
                      href={getIPFSGatewayUrl(nft.tokenURI.replace("ipfs://", ""))} // Assuming tokenURI is ipfs://CID
                      target="_blank"
                      rel="noopener"
                    >
                      View Metadata
                    </Button>
                  )}
                  {/* Potentially add "Use NFT" button for vendors if applicable here, or in a separate vendor UI */}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyNFTsMUI;