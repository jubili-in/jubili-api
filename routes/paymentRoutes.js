const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, getPaymentStatus } = require('../controllers/paymentController');

// Create Razorpay order
router.post('/razorpay/order', createRazorpayOrder);

// Verify payment
router.post('/razorpay/verify', verifyPayment);

// Get payment status
router.get('/status/:orderId', getPaymentStatus);

module.exports = router;