const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json

app.use('/api', routes); // Mount routes under /api

// Simple health check route
app.get('/', (req, res) => {
  res.send('CampaignNFT Backend is running!');
});

module.exports = app;