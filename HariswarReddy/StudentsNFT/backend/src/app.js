const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const routes = require('./routes');
const admissionLetterRoutes = require('./routes/admissionLetterRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes); // Mount routes under /api
app.use('/api/admission-letters', admissionLetterRoutes);

// Simple health check route
app.get('/', (req, res) => {
  res.send('CampaignNFT Backend is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;