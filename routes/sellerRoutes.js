//File: routes/sellerRoutes.js

const express = require('express');
const router = express.Router();
const { signupSeller, loginSeller } = require('../controllers/sellerController');
const { postKYC, getKYCInfo } = require('../controllers/sellerKycController');
const {authenticateSeller} = require('../middlewares/authenticateSeller');

// Auth routes
router.post('/signup', signupSeller);
router.post('/login', loginSeller);

// KYC routes
router.post('/upload-kyc', authenticateSeller, postKYC);
router.get('/get-kyc', authenticateSeller, getKYCInfo);

module.exports = router; 