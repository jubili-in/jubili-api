const express = require("express");
const router = express.Router();
const sseController = require('../controllers/sseController'); 

// SSE subscription endpoint
router.get("/orders/stream", sseController.subscribeToOrderEvents);

module.exports = router;
