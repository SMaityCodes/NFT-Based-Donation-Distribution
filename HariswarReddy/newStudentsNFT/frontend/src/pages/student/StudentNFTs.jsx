import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Chip
} from '@mui/material';
import useWeb3Store from '../../store/web3Store';
import { toast } from 'react-hot-toast';

const StudentNFTs = () => {
  const { contract, account } = useWeb3Store();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get all NFTs owned by the student
        const balance = await contract.balanceOf(account);
        const nftPromises = [];

        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          nftPromises.push(contract.tokenURI(tokenId));
        }

        const nftResults = await Promise.all(nftPromises);
        const formattedNFTs = nftResults.map((uri, index) => {
          // Parse the token URI to get metadata
          const metadata = JSON.parse(atob(uri.split(',')[1]));
          return {
            id: index,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            attributes: metadata.attributes
          };
        });

        setNfts(formattedNFTs);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        toast.error('Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [contract, account]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My NFTs
      </Typography>

      {nfts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            You don't have any NFTs yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {nfts.map((nft) => (
            <Grid item xs={12} sm={6} md={4} key={nft.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={nft.image}
                  alt={nft.name}
                  sx={{ objectFit: 'contain', bgcolor: 'black' }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {nft.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {nft.description}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {nft.attributes?.map((attr, index) => (
                      <Chip
                        key={index}
                        label={`${attr.trait_type}: ${attr.value}`}
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StudentNFTs; 