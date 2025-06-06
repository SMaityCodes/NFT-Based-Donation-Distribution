import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useWeb3Store from '../store/web3Store';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3Store();

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            CampaignNFT
          </RouterLink>
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin">
            Admin
          </Button>
          <Button color="inherit" component={RouterLink} to="/register">
            Register Student
          </Button>
          <Button color="inherit" component={RouterLink} to="/my-nfts">
            My NFTs
          </Button>
        </Box>
        <Box sx={{ ml: 2 }}>
          {isConnected ? (
            <Button color="inherit" onClick={disconnectWallet}>
              {account.substring(0, 6)}...{account.substring(account.length - 4)} (Disconnect)
            </Button>
          ) : (
            <Button color="inherit" onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;