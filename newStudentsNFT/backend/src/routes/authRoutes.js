const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Login route
router.post('/login', authController.login);

// Get user profile - UNUSED
// router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router; 