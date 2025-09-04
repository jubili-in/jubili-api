const express = require('express');
const bodyParser = require('body-parser'); 
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// Razorpay sends raw body, so use express.raw middleware
router.post('/razorpay', bodyParser.raw({ type: 'application/json' }), handleRazorpayWebhook);

module.exports = router;
