const express = require('express'); 
const router = express.Router(); 
const delhivaryController = require('../controllers/delhivaryController'); 


router.post('/shipment/coast', delhivaryController.getShipmentCost); 

module.exports = router; 