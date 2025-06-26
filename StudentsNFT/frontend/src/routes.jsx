import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';

// Admin Pages
import AdminDashboardMUI from './pages/AdminDashboardMUI';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminStudents from './pages/admin/AdminStudents';
import AdminVendors from './pages/admin/AdminVendors';

// Donor Pages
import DonorDashboard from './pages/DonorDashboard';
import DonorDonations from './pages/DonorDonations';
import DonorCampaigns from './pages/donor/DonorCampaigns';
import DonorNFTs from './pages/donor/DonorNFTs';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCampaigns from './pages/student/StudentCampaigns';
import StudentProfile from './pages/student/StudentProfile';
import StudentNFTs from './pages/student/StudentNFTs';
import RegisterStudentMUI from './pages/RegisterStudentMUI';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorTransactions from './pages/vendor/VendorTransactions';
import VendorProfile from './pages/vendor/VendorProfile';

// Public Pages
import CampaignDetailMUI from './pages/CampaignDetailMUI';
import MyNFTsMUI from './pages/MyNFTsMUI';

const Home = () => (
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <Typography variant="h3" component="h1" gutterBottom>
      Welcome to NFT Donation!
    </Typography>
    <Typography variant="h6" color="text.secondary">
      Empowering education through blockchain donations and NFTs.
    </Typography>
    <Typography variant="body1" sx={{ mt: 4 }}>
      Navigate using the menu above to explore campaigns, donate, register as a student, or manage as an admin.
    </Typography>
  </Box>
);

const Footer = () => (
  <Box sx={{ mt: 'auto', py: 3, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
    <Typography variant="body2">
      © {new Date().getFullYear()} NFT Donation. All rights reserved.
    </Typography>
  </Box>
);

const AppRoutes = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterStudentMUI />} />
          <Route path="/register-student" element={<RegisterStudentMUI />} />
          <Route path="/campaigns" element={<CampaignDetailMUI />} />
          <Route path="/campaign/:id" element={<CampaignDetailMUI />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboardMUI />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/admin/campaigns/:id" element={<CampaignDetailMUI />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/vendors" element={<AdminVendors />} />

          {/* Donor Routes */}
          <Route path="/donor/campaigns" element={<DonorCampaigns />} />
          <Route path="/donor/donations" element={<DonorDonations />} />
          <Route path="/donor/nfts" element={<DonorNFTs />} />
          <Route path="/donate" element={<DonorDashboard />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/campaigns" element={<StudentCampaigns />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/nfts" element={<StudentNFTs />} />

          {/* Vendor Routes */}
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/transactions" element={<VendorTransactions />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />

          {/* NFT Routes */}
          <Route path="/my-nfts" element={<MyNFTsMUI />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
};

export default AppRoutes; 