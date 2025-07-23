const express = require('express');
const router = express.Router();
const delhiveryController = require('../controllers/delhiveryController');

// Create new shipment
router.post('/create', delhiveryController.createShipment);

// Track shipment
router.get('/track/:awb', delhiveryController.trackShipment);

// Generate shipping label (PDF)
router.get('/label/:awb', delhiveryController.generateLabel);

// Schedule pickup
router.post('/pickup', delhiveryController.schedulePickup);

module.exports = router;