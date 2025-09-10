const axios = require("axios");

const DELHIVERY_API_KEY = process.env.DELHIVARY_LIVE_API_TOKEN;


function calculateCGM(length, breadth, height, actualWeight) {
    if(actualWeight < 1000) return actualWeight;  
  const volumetricWeight = (length * breadth * height) / 5; // cm → kg
//   console.log(volumetricWeight, "VMW"); 
  return Math.max(actualWeight, volumetricWeight);
}

async function getShipmentCost(req, res) {
  const { origin, destination, length, breadth, height, weight } = req.body;

  try {
    const chargeableWeight = calculateCGM(length, breadth, height, weight);
    // console.log(chargeableWeight, "CW"); 

    const url = `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY}`,
      },
      params: {
        md: "S",                 // E = Express, S = Surface
        o_pin: origin,           // Origin Pincode
        d_pin: destination,      // Destination Pincode
        cgm: chargeableWeight,   // Chargeable Gross Weight
        ss: "Delivered",         // Shipment status (for pricing calc)
        pt: "Pre-paid",          // Payment type
      },
    });

    return res.status(200).json({
      data: response.data,
    });
  } catch (err) {
    console.error("Delhivery Shipment Cost Error:", err.message);
    return res.status(500).json({ message: err.message });
  }
}


module.exports = {getShipmentCost}; 
