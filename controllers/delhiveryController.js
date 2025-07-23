const delhiveryService = require('../services/delhiveryService');

// New shipment create
async function createShipment(req, res) {
  try {
    const orderDetails = req.body;
    console.log(orderDetails);
    if (!orderDetails.orderId || !orderDetails.address) {
      return res.status(400).json({ success: false, message: "Order ID required and address details must be provided" });
    }
    const result = await delhiveryService.createNewShipment(orderDetails);
    if (!result.success) {
      return res.status(502).json({ success: false, message: result.error || "Delhivery API error", details: result.details });
    }
    res.status(200).json({ success: true, message: "Shipment created successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Tracking status check 
async function trackShipment(req, res) {
  try {
    const { awb } = req.params;
    
    if (!awb) {
      return res.status(400).json({
        success: false,
        message: "AWB number is required for tracking"
      });
    }

    const trackingInfo = await delhiveryService.getTrackingStatus(awb);
    
    res.status(200).json({
      success: true,
      data: trackingInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Generate shipping label (PDF)
async function generateLabel(req, res) {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'AWB is required' });
    }
    const result = await delhiveryService.generateLabel(awb);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error, details: result.details });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=label_${awb}.pdf`);
    res.send(result.pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Schedule pickup
async function schedulePickup(req, res) {
  try {
    const pickupDetails = req.body;
    const result = await delhiveryService.schedulePickup(pickupDetails);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error, details: result.details });
    }
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createShipment,
  trackShipment,
  generateLabel,
  schedulePickup
};