const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const studentController = require('../controllers/studentController');




// Student routes
router.post('/student', upload.single('admissionLetter'), studentController.registerStudent);
router.get('/student/:address', studentController.getStudent);
// router.put('/student/:address/approve', studentController.approveStudent); // UNUSED - approval done via blockchain



module.exports = router;