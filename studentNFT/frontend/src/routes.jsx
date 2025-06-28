import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";

// Admin Pages
import AdminDashboardMUI from "./pages/AdminDashboardMUI";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminVendors from "./pages/admin/AdminVendors";

// Student Pages

import StudentCampaigns from "./pages/student/StudentCampaigns";
import StudentProfile from "./pages/student/StudentProfile";
import StudentNFTs from "./pages/student/StudentNFTs";
import RegisterStudentMUI from "./pages/RegisterStudentMUI";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";

// Public Pages
import CampaignDetailMUI from "./pages/CampaignDetailMUI";
import MyNFTsMUI from "./pages/MyNFTsMUI";
import VendorCampaigns from "./pages/vendor/VendorCampaigns";
import StandardTokenURI from "./pages/StandardTokenURI";
import DonorDashboard from "./pages/DonorDashboard";

const Home = () => (
  <Box sx={{ textAlign: "center", mt: 8 }}>
    <Typography variant="h3" component="h1" gutterBottom>
      Welcome to NFT Donation!
    </Typography>

    <Typography variant="h6" color="text.secondary">
      Revolutionizing education funding through transparent blockchain donations
      and meaningful NFTs.
    </Typography>

    <Typography variant="body1" sx={{ mt: 4 }}>
      NFT Donation is a decentralized platform that connects donors,
      students,vendors and educational foundations to create a transparent and
      impactful giving experience. Every donation is traceable on the blockchain
      and student on approval is rewarded with a unique NFT — a digital badge
      that helps to buy your needs.
    </Typography>

    <Typography variant="body1" sx={{ mt: 2 }}>
      Use the navigation menu above to explore active campaigns, make donations
      with purpose, register as a student seeking support, or log in as a
      foundation or vendor to manage campaigns and disbursements.
    </Typography>

    <Typography variant="body1" sx={{ mt: 2 }}>
      Together, we're building a future where educational support is accessible,
      transparent, and driven by community trust.
    </Typography>
  </Box>
);

const Footer = () => (
  <Box
    sx={{
      mt: "auto",
      py: 3,
      bgcolor: "primary.main",
      color: "black",
      textAlign: "center",
    }}
  >
    <Typography variant="body2">
      © {new Date().getFullYear()} NFT Donation. All rights reserved.
    </Typography>
  </Box>
);

const AppRoutes = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterStudentMUI />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboardMUI />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetailMUI />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/vendors" element={<AdminVendors />} />

          <Route path="/donate" element={<DonorDashboard />} />

          {/* Student Routes */}
          <Route path="/student/campaigns" element={<StudentCampaigns />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/nfts" element={<StudentNFTs />} />

          {/* Vendor Routes */}
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/campaigns" element={<VendorCampaigns />} />

          {/* NFT Routes */}
          <Route path="/my-nfts" element={<MyNFTsMUI />} />

          {/* Token URI by Standard Route */}
          <Route path="/token-uri/:standard" element={<StandardTokenURI />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
};

export default AppRoutes;
