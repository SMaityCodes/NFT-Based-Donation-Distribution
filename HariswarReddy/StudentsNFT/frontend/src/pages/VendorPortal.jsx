import React, { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Input, Button,
  Spinner, Center, Text, List, ListItem, useToast, Link, Flex, Badge
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react'; // Import Field component
import useWeb3Store from '../store/web3Store';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { STANDARDS } from '../utils/constants';

const VendorPortal = () => {
  const { contract, isConnected, account, signer } = useWeb3Store();
  const [nftId, setNftId] = useState('');
  const [itemProvided, setItemProvided] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [vendorTransactions, setVendorTransactions] = useState([]); // This would ideally come from a backend/indexer
  const [formErrors, setFormErrors] = useState({});

  const checkVendorStatus = async () => {
    if (contract && account) {
      try {
        const vendor = await contract.vendors(account);
        setIsApprovedVendor(vendor.approved);
      } catch (err) {
        console.error("Error checking vendor status:", err);
        setIsApprovedVendor(false); // Assume not approved on error
      }
    }
  };

  // Note: For vendorTransactions, iterating all NFTs to find transactions is not scalable.
  // This part would *ideally* use a backend/Subgraph to query past events (`NFTUsed`).
  // For demonstration, we'll keep it simple, but be aware of this limitation.
  const fetchVendorTransactions = async () => {
    if (!contract || !isConnected || !isApprovedVendor) {
        setVendorTransactions([]);
        return;
    }
    // This is a placeholder. To get transactions specific to THIS vendor,
    // you would need to iterate through event logs off-chain, or add a mapping in contract
    // to store transactions by vendor address.
    // Example: contract.queryFilter("NFTUsed", fromBlock, toBlock).filter(event => event.args.vendorAddress === account)
    // This is where a backend/TheGraph is critical.
    // For now, let's just say "No transactions" or fetch a dummy.
    setVendorTransactions([]); // Placeholder
  };


  useEffect(() => {
    checkVendorStatus();
    fetchVendorTransactions(); // Fetch transactions specific to this vendor
  }, [isConnected, account, contract, isApprovedVendor]);

  const handleVerifyAndUseNFT = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!isConnected || !signer || !contract) {
      toast.error("Please connect your wallet.");
      return;
    }
    if (!isApprovedVendor) {
      toast.error("You are not an approved vendor.");
      return;
    }
    if (!nftId) {
        newErrors.nftId = "NFT ID is required.";
    }
    if (!itemProvided) {
        newErrors.itemProvided = "Item provided is required.";
    }

    if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        return;
    }

    setFormErrors({}); // Clear errors
    setIsVerifying(true);
    try {
      // Optional: Get NFT details before using to show to vendor
      const [standard, amount, isUsed, currentOwner] = await contract.getNFTDetails(parseInt(nftId));
      if (isUsed) {
        toast.error("This NFT has already been used!");
        setIsVerifying(false);
        return;
      }
      if (currentOwner.toLowerCase() !== account.toLowerCase()) {
        toast.error("You are not the current owner of this NFT (or it has no owner).");
        setIsVerifying(false);
        return;
      }

      const tx = await contract.verifyAndUseNFT(parseInt(nftId), itemProvided);
      toast.loading("Transaction pending...", { id: 'useNFTTx' });
      await tx.wait();
      toast.success("NFT verified and used successfully!", { id: 'useNFTTx' });
      setNftId('');
      setItemProvided('');
      fetchVendorTransactions(); // Refresh
    } catch (err) {
      console.error("Verify and use NFT failed:", err);
      toast.error(`Operation failed: ${err.reason || err.message}`, { id: 'useNFTTx' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isConnected) {
    return (
      <Center p={8} mt={8} flexDirection="column">
        <Text fontSize="xl" mb={4}>Please connect your wallet to access the Vendor Portal.</Text>
        <Button colorScheme="teal" onClick={useWeb3Store.getState().connectWallet}>Connect Wallet</Button>
      </Center>
    );
  }

  if (!isApprovedVendor) {
    return (
      <Center p={8} mt={8} flexDirection="column" color="red.600">
        <Text fontSize="2xl" fontWeight="bold">Access Denied!</Text>
        <Text fontSize="md" mt={2}>You are not an approved vendor.</Text>
        <Text fontSize="md" mt={2}>Please contact the administrator to get approved.</Text>
      </Center>
    );
  }

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Vendor Portal
      </Heading>

      <VStack as="form" onSubmit={handleVerifyAndUseNFT} spacing={4} maxWidth="600px" mx="auto">
        <Heading size="md" mb={2}>Verify & Use Student NFT</Heading>
        <Field.Root invalid={!!formErrors.nftId} required>
          <Field.Label>NFT ID</Field.Label>
          <Field.Control asChild>
            <Input
              type="number"
              placeholder="Enter NFT ID"
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
            />
          </Field.Control>
          {formErrors.nftId && <Field.ErrorText>{formErrors.nftId}</Field.ErrorText>}
        </Field.Root>

        <Field.Root invalid={!!formErrors.itemProvided} required>
          <Field.Label>Item Provided</Field.Label>
          <Field.Control asChild>
            <Input
              type="text"
              placeholder="e.g., Books, Uniform, Tuition Fee"
              value={itemProvided}
              onChange={(e) => setItemProvided(e.target.value)}
            />
          </Field.Control>
          {formErrors.itemProvided && <Field.ErrorText>{formErrors.itemProvided}</Field.ErrorText>}
        </Field.Root>

        <Button
          colorScheme="blue"
          type="submit"
          isLoading={isVerifying}
          disabled={isVerifying}
          width="full"
        >
          Verify and Use NFT
        </Button>
      </VStack>

      <Box mt={10}>
        <Heading size="md" mb={4}>My Recent Transactions (NFT Usage)</Heading>
        {vendorTransactions.length === 0 ? (
          <Text>No recent transactions. (Note: This list would be powered by an off-chain indexer for comprehensive history.)</Text>
        ) : (
          <List spacing={3}>
            {/* Example of how a transaction might look if fetched from an indexer */}
            {vendorTransactions.map((tx, index) => (
              <ListItem key={index} p={3} borderWidth="1px" borderRadius="md">
                <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">NFT ID: {tx.nftId}</Text>
                    <Badge colorScheme="purple">{tx.itemProvided}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600">Student: {tx.studentAddress}</Text>
                <Text fontSize="sm" color="gray.600">Timestamp: {new Date(tx.timestamp * 1000).toLocaleString()}</Text>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default VendorPortal;