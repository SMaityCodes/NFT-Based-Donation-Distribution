const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Role checking routes
router.get('/admin/check/:address', roleController.checkAdmin);
router.get('/students/check/:address', roleController.checkStudent);
router.get('/vendors/check/:address', roleController.checkVendor);
router.get('/donors/check/:address', roleController.checkDonor);

module.exports = router; 