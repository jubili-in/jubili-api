//File: routes/sellerRoutes.js

const express = require('express');
const router = express.Router();
const { signupSeller, loginSeller } = require('../controllers/sellerController');
const { postKYC, getKYCInfo } = require('../controllers/sellerKycController');
const {authenticateSeller} = require('../middlewares/authenticateSeller');
const {verifySeller} = require('../auth/verify.seller'); 

// Auth routes
router.post('/signup', signupSeller);
router.post('/login', loginSeller);

// Auth Verify 
router.get('/verify-seller', verifySeller); 

// KYC routes
router.post('/upload-kyc', authenticateSeller, postKYC);
router.get('/get-kyc', authenticateSeller, getKYCInfo);

module.exports = router; 