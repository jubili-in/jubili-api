const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// Razorpay sends raw body, so use express.raw middleware
router.post('/razorpay', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

module.exports = router;
