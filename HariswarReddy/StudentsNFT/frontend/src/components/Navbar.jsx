import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3Store } from '../store/web3Store';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  People,
  Store,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
  School as SchoolIcon,
  VolunteerActivism as DonateIcon,
  HowToReg as RegisterIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { ethers } from 'ethers';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)'
    : 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.1)',
}));

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    contract, 
    account, 
    connectWallet, 
    disconnectWallet, 
    isAdmin, 
    isStudent, 
    isVendor 
  } = useWeb3Store();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) return;
      try {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(account);
          setWalletBalance(ethers.formatEther(balance).slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, [account]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
    setMobileOpen(false);
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    handleMenuClose();
  };

  const renderWalletButton = () => {
    if (!account) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<WalletIcon />}
          onClick={handleConnectWallet}
          sx={{ ml: 2 }}
        >
          Connect Wallet
        </Button>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={<WalletIcon />}
          label={`${walletBalance} ETH`}
          color="primary"
          variant="outlined"
        />
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleDisconnectWallet}
          startIcon={<LogoutIcon />}
        >
          Disconnect
        </Button>
      </Box>
    );
  };

  const renderNavigationItems = () => {
    if (!account) {
      return (
        <>
          <Button
            color="inherit"
            startIcon={<RegisterIcon />}
            onClick={() => handleNavigation('/register')}
          >
            Register as Student
          </Button>
          <Button
            color="inherit"
            startIcon={<DonateIcon />}
            onClick={() => handleNavigation('/donate')}
          >
            Donate
          </Button>
        </>
      );
    }

    if (isAdmin) {
      return (
        <>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigation('/admin/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<SchoolIcon />}
            onClick={() => handleNavigation('/admin/students')}
          >
            Students
          </Button>
          <Button
            color="inherit"
            startIcon={<CampaignIcon />}
            onClick={() => handleNavigation('/admin/campaigns')}
          >
            Campaigns
          </Button>
          <Button
            color="inherit"
            startIcon={<Store />}
            onClick={() => handleNavigation('/admin/vendors')}
          >
            Vendors
          </Button>
        </>
      );
    }

    if (isStudent) {
      return (
        <>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigation('/student/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<CampaignIcon />}
            onClick={() => handleNavigation('/student/campaigns')}
          >
            Campaigns
          </Button>
          <Button
            color="inherit"
            startIcon={<PersonIcon />}
            onClick={() => handleNavigation('/student/profile')}
          >
            Profile
          </Button>
        </>
      );
    }

    if (isVendor) {
      return (
        <>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigation('/vendor/dashboard')}
          >
            Dashboard
          </Button>
        </>
      );
    }

    return (
      <Button
        color="inherit"
        startIcon={<DonateIcon />}
        onClick={() => handleNavigation('/donate')}
      >
        Donate
      </Button>
    );
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          NFT Donation
        </Typography>
      </Box>
      <Divider />
      <List>
        {!account ? (
          <>
            <ListItem button onClick={() => handleNavigation('/register')}>
              <ListItemIcon><RegisterIcon /></ListItemIcon>
              <ListItemText primary="Register as Student" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/donate')}>
              <ListItemIcon><DonateIcon /></ListItemIcon>
              <ListItemText primary="Donate" />
            </ListItem>
          </>
        ) : (
          <>
            {isAdmin && (
              <>
                <ListItem button onClick={() => handleNavigation('/admin/dashboard')}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/students')}>
                  <ListItemIcon><SchoolIcon /></ListItemIcon>
                  <ListItemText primary="Students" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/campaigns')}>
                  <ListItemIcon><CampaignIcon /></ListItemIcon>
                  <ListItemText primary="Campaigns" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/vendors')}>
                  <ListItemIcon><Store /></ListItemIcon>
                  <ListItemText primary="Vendors" />
                </ListItem>
              </>
            )}
            {isStudent && (
              <>
                <ListItem button onClick={() => handleNavigation('/student/dashboard')}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/student/campaigns')}>
                  <ListItemIcon><CampaignIcon /></ListItemIcon>
                  <ListItemText primary="Campaigns" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/student/profile')}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
              </>
            )}
            {isVendor && (
              <>
                <ListItem button onClick={() => handleNavigation('/vendor/dashboard')}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
              </>
            )}
            <Divider />
            <ListItem button onClick={handleDisconnectWallet}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Disconnect Wallet" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <StyledAppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            NFT Donation
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
              {renderNavigationItems()}
              {renderWalletButton()}
            </Box>
          )}
        </Toolbar>
      </Container>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </StyledAppBar>
  );
};

export default Navbar;