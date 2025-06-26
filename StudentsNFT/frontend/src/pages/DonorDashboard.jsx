import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Container, Box, Card, CardContent, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green, blueGrey, red } from '@mui/material/colors';
import { CONTRACT_ADDRESS } from '../utils/constants';
// Removed: import { ethers } from 'ethers'; // ethers will be loaded via CDN globally

// Define a custom theme for a more appealing look
const theme = createTheme({
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  palette: {
    primary: {
      main: green[600],
    },
    secondary: {
      main: blueGrey[800],
    },
    error: {
      main: red[700],
    },
    background: {
      default: '#f0f2f5', // Light grey background
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '10px 20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  const [donationAmount, setDonationAmount] = useState('');
  const [campaignId, setCampaignId] = useState(''); // State for campaign ID
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false); // New state for connection loading

  // --- IMPORTANT: Replace with your deployed smart contract address ---
  const smartContractAddress = CONTRACT_ADDRESS;

  // --- IMPORTANT: Paste your compiled CampaignNFT ABI here ---
  // You can usually find this in your Remix IDE "Compile" tab or Hardhat/Truffle build artifacts.
  const contractABI = [
    // Example ABI entry for donateToCampaign, you need the full ABI
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "campaignId",
          "type": "uint256"
        }
      ],
      "name": "donateToCampaign",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "campaignId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "donor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "CampaignDonationReceived",
      "type": "event"
    },
    // ... add the rest of your CampaignNFT contract ABI here ...
  ];


  // Effect to check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    // Ensure window.ethers is available
    if (typeof window.ethereum !== 'undefined' && typeof window.ethers !== 'undefined') {
      try {
        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts(); // Get connected accounts
        if (accounts.length > 0) {
          setWalletConnected(true);
          setCurrentAccount(accounts[0].address);
          setMessage('Wallet already connected!');
        } else {
          setWalletConnected(false);
          setCurrentAccount(null);
          setMessage('Please connect your wallet.');
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setCurrentAccount(newAccounts[0]);
            setWalletConnected(true);
            setMessage('Wallet account changed.');
          } else {
            setCurrentAccount(null);
            setWalletConnected(false);
            setMessage('Wallet disconnected. Please connect.');
          }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
          setMessage(`Network changed to Chain ID: ${parseInt(chainId, 16)}. Please ensure it's the correct network for the contract.`);
          // Optionally, reload or re-initialize provider/signer here if needed
        });

      } catch (error) {
        console.error("Error checking wallet connection:", error);
        setMessage("Error checking wallet connection. Please ensure MetaMask is installed.");
        setWalletConnected(false);
      }
    } else {
      setMessage('MetaMask or ethers.js not detected. Please install MetaMask and ensure ethers.js is loaded via CDN.');
      setWalletConnected(false);
    }
  };


  const connectWallet = async () => {
    setIsConnecting(true);
    setMessage('');
    try {
      if (typeof window.ethereum === 'undefined') {
        setMessage('MetaMask or another Ethereum wallet not detected. Please install one.');
        setIsConnecting(false);
        return;
      }
      if (typeof window.ethers === 'undefined') {
        setMessage('ethers.js library not loaded. Please ensure the ethers.js CDN script is included in your index.html.');
        setIsConnecting(false);
        return;
      }
      // Request account access
      const provider = new window.ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []); // Request accounts
      if (accounts.length > 0) {
        setWalletConnected(true);
        setCurrentAccount(accounts[0]);
        setMessage('Wallet connected successfully!');
      } else {
        setMessage('No accounts found. Please connect an account in your wallet.');
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001) { // User rejected request
        setMessage('Wallet connection rejected by the user.');
      } else {
        setMessage(`Failed to connect wallet: ${error.message || 'An unexpected error occurred.'}`);
      }
      setWalletConnected(false);
      setCurrentAccount(null);
    } finally {
      setIsConnecting(false);
    }
  };


  // Function to handle donation
  const handleDonate = async () => {
    // Basic validation
    const amount = parseFloat(donationAmount);
    const id = parseInt(campaignId);

    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid donation amount (e.g., 0.1, 1.5).');
      return;
    }
    if (isNaN(id) || id <= 0) {
        setMessage('Please enter a valid Campaign ID (e.g., 1, 2).');
        return;
    }
    if (smartContractAddress === 'YOUR_SMART_CONTRACT_ADDRESS_HERE' || contractABI.length === 0) {
        setMessage('Error: Please update the smart contract address and ABI in the code.');
        return;
    }
    if (!walletConnected || !currentAccount) {
        setMessage('Please connect your wallet first.');
        return;
    }
    if (typeof window.ethereum === 'undefined' || typeof window.ethers === 'undefined') {
        setMessage('Ethereum wallet or ethers.js library not detected. Cannot proceed with donation.');
        return;
    }

    setLoading(true);
    setMessage('Initiating donation...');

    try {
      // Initialize provider and signer using window.ethers
      const provider = new window.ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // Get the signer for sending transactions

      // Create a contract instance
      const contract = new window.ethers.Contract(smartContractAddress, contractABI, signer);

      // Convert donation amount to Wei (smallest unit of Ether)
      const amountInWei = window.ethers.parseEther(amount.toString());

      setMessage(`Sending ${amount} ETH to Campaign ID ${id}...`);
      // Call the donateToCampaign function on your smart contract
      const tx = await contract.donateToCampaign(id, { value: amountInWei });

      setMessage(`Transaction sent! Waiting for confirmation... (Tx Hash: ${tx.hash})`);
      // Wait for the transaction to be mined
      await tx.wait();

      setMessage(`🎉 Successfully donated ${amount} ETH to Campaign ID ${id}! Transaction confirmed.`);
      setDonationAmount(''); // Clear the input field
      // setCampaignId(''); // Optionally clear campaign ID too

    } catch (error) {
      console.error('Donation error:', error);
      if (error.code === 4001) {
        setMessage('Transaction rejected by the user.');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || error.code === 'BAD_DATA') {
        setMessage('Transaction failed: Insufficient funds or invalid transaction parameters. Check console for details.');
      }
      else {
        setMessage(`Donation failed: ${error.reason || error.message || 'An unexpected error occurred.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.default,
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                Support Our Campaign
              </Typography>
              <Typography variant="body1" align="center" paragraph sx={{ mb: 3 }}>
                Enter the campaign ID and amount you wish to donate to our smart contract. Your contributions help us continue building amazing things!
              </Typography>

              {/* Wallet Connection Status */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: blueGrey[50], borderRadius: 2, border: `1px solid ${blueGrey[200]}` }}>
                <Typography variant="caption" display="block" sx={{ color: blueGrey[600] }}>
                  Wallet Status:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: walletConnected ? green[700] : red[700] }}>
                  {walletConnected ? `Connected: ${currentAccount?.substring(0, 6)}...${currentAccount?.slice(-4)}` : 'Not Connected'}
                </Typography>
                {!walletConnected && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={connectWallet}
                        disabled={isConnecting || loading}
                        size="small"
                        sx={{ mt: 1, textTransform: 'none' }}
                    >
                        {isConnecting ? <CircularProgress size={20} /> : 'Connect Wallet'}
                    </Button>
                )}
              </Box>

              {/* Smart Contract Address Display */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: blueGrey[50], borderRadius: 2, border: `1px solid ${blueGrey[200]}` }}>
                <Typography variant="caption" display="block" sx={{ color: blueGrey[600] }}>
                  Smart Contract Address:
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 'medium' }}>
                  {smartContractAddress === 'YOUR_SMART_CONTRACT_ADDRESS_HERE' ? (
                    <span style={{ color: red[600], fontStyle: 'italic' }}>Please update `YOUR_SMART_CONTRACT_ADDRESS_HERE` in the code!</span>
                  ) : (
                    smartContractAddress
                  )}
                </Typography>
              </Box>

              <TextField
                label="Campaign ID"
                variant="outlined"
                fullWidth
                type="number"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                margin="normal"
                inputProps={{ min: "1", step: "1" }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Donation Amount (e.g., ETH, MATIC)"
                variant="outlined"
                fullWidth
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                margin="normal"
                inputProps={{ min: "0.0001", step: "0.0001" }}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleDonate}
                disabled={loading || !walletConnected || isConnecting || smartContractAddress === 'YOUR_SMART_CONTRACT_ADDRESS_HERE' || contractABI.length === 0}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Donate Now'}
              </Button>

              {loading && <LinearProgress sx={{ mt: 2 }} />}

              {message && (
                <Alert
                  severity={message.includes('Successfully') || message.includes('connected') ? 'success' : 'info'}
                  sx={{ mt: 3 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {message}
                  </Typography>
                </Alert>
              )}

              {/* Error message for missing ABI/Address */}
              {(smartContractAddress === 'YOUR_SMART_CONTRACT_ADDRESS_HERE' || contractABI.length === 0) && (
                 <Alert severity="error" sx={{ mt: 2 }}>
                    Please update the `smartContractAddress` and `contractABI` constants in the code.
                 </Alert>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
