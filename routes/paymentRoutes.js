const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authenticateUser');
const {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  handleWebhook
} = require('../controllers/paymentController');

// Create Razorpay order
router.post('/razorpay/order', authenticateUser, createRazorpayOrder);

// Verify payment
router.post('/razorpay/verify', authenticateUser, verifyPayment);

// Get payment status
router.get('/status/:orderId', authenticateUser, getPaymentStatus);

// Razorpay webhook (no authentication)
router.post('/webhook', handleWebhook);

module.exports = router;