// controllers/ekartController.js
const ekartService = require('../services/ekartService');
const productService = require('../services/productService'); 
const addressService = require('../services/addressService'); 
const axios = require('axios'); 
const {getValidEkartToken} = require('../services/ekartService'); 

/**
 * Get shipping cost estimate from Ekart
 * POST /api/ekart/estimate-cost
 *
 * Expected body:
 * {
 *   "origin_pincode": "110030",
 *   "destination_pincode": "560001",
 *   "weight": 1,
 *   "mode": "Surface"
 * }
 */
const getEkartShippingEstimate = async (req, res) => {
    // reuquired fields: 
    // pickupPincode, dropPincode, weight, length, height,width, serviceType (Enum: "SURFACE" "EXPRESS"), invoiceAmount, 
    // id => products
    // https://app.elite.ekartlogistics.in/data/pricing/estimate
    try {
        // request body
        const {productPrice, productWidth, productLength, productWeight, productHeight, addressId, userId} = req.body; 

      

        // pickup address
        const pickupaddress = await addressService.getAddress(addressId); 
        if(!pickupaddress) { 
            return res.status(404).json({message: "Pickup location not found"}); 
        }


        // dropout address
        const dropoutAddress = await addressService.getAddressUserId(userId); 
        if(!dropoutAddress) { 
            return res.status(404).json({message: "Drop location is not found"}); 
        }


        // ekart payload
        const ekartPayload = { 
            pickupPincode: pickupaddress.postalCode, 
            dropPincode: dropoutAddress.postalCode,
            weight: productWeight, 
            length: productLength, 
            width: productWidth, 
            height: productHeight,
            serviceType: "SURFACE",
            shippingDirection: "FORWARD",
            codAmount: 0,
            invoiceAmount: productPrice
        }

        // console.log(ekartPayload); 

       const token =  await getValidEkartToken(); 
        // console.log(token); 
        // ekart api call 
          const ekartResponse = await axios.post('https://app.elite.ekartlogistics.in/data/pricing/estimate', ekartPayload, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }); 

        // const ekartData = ekartR

        return res.status(200).json({ 
            message: "Ekart shipping estimate request received",
            data:{
                
                pickupaddress, 
                dropoutAddress, 
                ekartResponse : ekartResponse.data
            }
        })

    } catch (error) {
        // console.error('🚚 ❌ Error in getEkartShippingEstimate controller:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Create shipment with Ekart
 * POST /api/ekart/create-shipment
 */
const createEkartShipment = async (req, res) => {
    try {
        const shipmentData = req.body;

        // Basic validation
        if (!shipmentData.order_number || !shipmentData.pickup_address) {
            return res.status(400).json({
                success: false,
                message: 'order_number and pickup_address are required'
            });
        }

        console.log('🚚 📦 Processing Ekart shipment creation request:', shipmentData.order_number);

        const result = await ekartService.createEkartShipment(shipmentData);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to create shipment with Ekart',
                error: result.error,
                details: result.details
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Ekart shipment created successfully',
            data: result.data
        });

    } catch (error) {
        console.error('🚚 ❌ Error in createEkartShipment controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating Ekart shipment',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Track shipment by tracking number
 * GET /api/ekart/track/:trackingNumber
 */
const trackEkartShipment = async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number is required'
            });
        }

        console.log(`🚚 📍 Processing Ekart tracking request for: ${trackingNumber}`);

        const result = await ekartService.trackEkartShipment(trackingNumber);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to track shipment with Ekart',
                error: result.error,
                details: result.details
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ekart tracking information retrieved successfully',
            trackingNumber,
            data: result.data
        });

    } catch (error) {
        console.error('🚚 ❌ Error in trackEkartShipment controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while tracking Ekart shipment',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Check serviceability for a pincode
 * GET /api/ekart/serviceability/:pincode
 */
const checkEkartServiceability = async (req, res) => {
    try {
        const { pincode } = req.params;

        if (!pincode) {
            return res.status(400).json({
                success: false,
                message: 'Pincode is required'
            });
        }

        // Validate postcode format (6 digits)
        const postcodeRegex = /^\d{6}$/;
        if (!postcodeRegex.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: 'Pincode must be a 6-digit number'
            });
        }

        console.log(`🚚 🔍 Processing Ekart serviceability check for pincode: ${pincode}`);

        const result = await ekartService.checkEkartServiceability(pincode);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to check serviceability with Ekart',
                error: result.error,
                details: result.details
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ekart serviceability check completed successfully',
            pincode,
            data: result.data
        });

    } catch (error) {
        console.error('🚚 ❌ Error in checkEkartServiceability controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while checking Ekart serviceability',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Health check for Ekart integration
 * GET /api/ekart/health
 */
const ekartHealthCheck = async (req, res) => {
    try {
        const healthStatus = await ekartService.ekartHealthCheck();

        if (!healthStatus.success) {
            return res.status(503).json(healthStatus);
        }

        return res.status(200).json(healthStatus);
    } catch (error) {
        console.error('🚚 ❌ Ekart health check failed:', error);
        return res.status(503).json({
            success: false,
            message: 'Ekart integration is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getEkartShippingEstimate,
    createEkartShipment,
    trackEkartShipment,
    checkEkartServiceability,
    ekartHealthCheck
};