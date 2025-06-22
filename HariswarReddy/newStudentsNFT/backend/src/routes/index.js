const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const roleController = require('../controllers/roleController');
const studentController = require('../controllers/studentController');
const campaignController = require('../controllers/campaignController');

// Admin routes
router.post('/admin', roleController.createAdmin);
router.get('/admin/:address', roleController.getAdmin);

// Vendor routes
router.post('/vendor', roleController.createVendor);
router.get('/vendor/:address', roleController.getVendor);
router.put('/vendor/:address/approve', roleController.approveVendor);

// Student routes
router.post('/student', upload.single('admissionLetter'), studentController.registerStudent);
router.get('/student/:address', studentController.getStudent);
router.put('/student/:address/approve', studentController.approveStudent);

// Campaign routes
router.get('/campaigns', campaignController.getAllCampaigns);
router.get('/campaign/:id', campaignController.getCampaign);
router.post('/campaign', campaignController.createCampaign);
router.put('/campaign/:id', campaignController.updateCampaign);
router.delete('/campaign/:id', campaignController.deleteCampaign);
router.get('/campaign/:id/donors', campaignController.getDonorsForCampaign);
router.get('/donors', campaignController.getAllDonors);

// NFTs & Vendor Transactions
router.get('/nfts/:id', campaignController.getNFTDetails);
router.get('/vendor-transactions', campaignController.getAllVendorTransactions);

// Role checking routes
router.get('/admin/check/:address', roleController.checkAdmin);
router.get('/students/check/:address', roleController.checkStudent);
router.get('/vendors/check/:address', roleController.checkVendor);
router.get('/donors/check/:address', roleController.checkDonor);

module.exports = router;