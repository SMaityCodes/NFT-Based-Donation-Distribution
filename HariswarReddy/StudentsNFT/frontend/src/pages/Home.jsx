import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Card, CardHeader, CardBody, Button, Spinner, Center, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import useWeb3Store from '../store/web3Store';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers'; // For formatting Eth

const Home = () => {
  const { contract, getReadOnlyContract } = useWeb3Store();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const contractInstance = contract || getReadOnlyContract(); // Use signer contract if connected, else read-only
        if (!contractInstance) {
          setError("Contract not loaded. Please connect your wallet or ensure RPC URL is set.");
          setLoading(false);
          return;
        }
        const fetchedCampaigns = await contractInstance.getAllCampaigns();
        setCampaigns(fetchedCampaigns);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError("Failed to load campaigns. " + err.message);
        toast.error("Failed to load campaigns.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [contract, getReadOnlyContract]);

  if (loading) {
    return (
      <Center height="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="red.500" mt={8}>
        <Text fontSize="xl">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        Available Campaigns
      </Heading>
      {campaigns.length === 0 ? (
        <Text textAlign="center" fontSize="lg">No campaigns available yet. Check back later!</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {campaigns.map((campaign) => (
            <Card key={campaign.id} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader bg="brand.700" color="white" py={3} px={4}>
                <Heading size="md">{campaign.name}</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={2}>
                  **Allowed School Types:** {campaign.allowedSchoolTypes.join(', ')}
                </Text>
                <Text mb={4}>
                  **Allowed Standards:** {campaign.allowedStandards.map(s => STANDARDS[s]).join(', ')}
                </Text>
                <Button as={RouterLink} to={`/campaigns/${campaign.id}`} colorScheme="teal" size="sm">
                  View Details & Donate
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Home;