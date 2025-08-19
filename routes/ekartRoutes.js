// routes/ekartRoutes.js
const express = require('express');
const router = express.Router();
const ekartController = require('../controllers/ekartController');

// Shipping cost estimate
router.post('/estimate-cost', ekartController.getEkartShippingEstimate);

// Create new shipment
router.post('/create-shipment', ekartController.createEkartShipment);

// Track shipment by tracking number
router.get('/track/:trackingNumber', ekartController.trackEkartShipment);

// Check serviceability for pincode
router.get('/serviceability/:pincode', ekartController.checkEkartServiceability);

// Health check endpoint
router.get('/health', ekartController.ekartHealthCheck);

module.exports = router;