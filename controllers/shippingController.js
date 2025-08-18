const shiprocketService = require('../services/shiprocketService');

/**
 * Get shipping cost estimate from Shiprocket
 * POST /api/shipping/estimate-cost
 *
 * Expected body:
 * {
 *   "pickup_postcode": "110030",
 *   "delivery_postcode": "560001",
 *   "cod": 1,
 *   "weight": 1
 * }
 */
const getShippingEstimate = async (req, res) => {
    try {
        const { pickup_postcode, delivery_postcode, cod, weight } = req.body;

        // Validate required fields
        if (!pickup_postcode || !delivery_postcode) {
            return res.status(400).json({
                success: false,
                message: 'pickup_postcode and delivery_postcode are required'
            });
        }

        // Validate postcode format (6 digits)
        const postcodeRegex = /^\d{6}$/;
        if (!postcodeRegex.test(pickup_postcode) || !postcodeRegex.test(delivery_postcode)) {
            return res.status(400).json({
                success: false,
                message: 'Postcodes must be 6-digit numbers'
            });
        }

        // Set defaults and validate
        const estimateParams = {
            pickup_postcode,
            delivery_postcode,
            cod: cod !== undefined ? parseInt(cod) : 0, // Default to prepaid
            weight: weight ? parseFloat(weight) : 0.5 // Default weight 0.5kg
        };

        // Validate COD value
        if (![0, 1].includes(estimateParams.cod)) {
            return res.status(400).json({
                success: false,
                message: 'cod must be 0 (prepaid) or 1 (COD)'
            });
        }

        // Validate weight
        if (estimateParams.weight <= 0 || estimateParams.weight > 50) {
            return res.status(400).json({
                success: false,
                message: 'weight must be between 0.1 and 50 kg'
            });
        }

        console.log('📦 Processing shipping estimate request:', estimateParams);

        const result = await shiprocketService.getShippingEstimate(estimateParams);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to get shipping estimate from Shiprocket',
                error: result.error,
                details: result.details
            });
        }

        // Process and format the response for better readability
        const estimateData = result.data;

        // Extract courier companies and their rates
        const courierEstimates = estimateData.data?.available_courier_companies?.map(courier => ({
            courier_name: courier.courier_name,
            courier_company_id: courier.courier_company_id,
            rate: courier.rate,
            estimated_delivery_days: courier.estimated_delivery_days,
            cod_charges: courier.cod_charges,
            cod_multiplier: courier.cod_multiplier,
            pickup_performance: courier.pickup_performance,
            delivery_performance: courier.delivery_performance,
            rating: courier.rating,
            suppression_dates: courier.suppression_dates,
            freight_charge: courier.freight_charge,
            other_charges: courier.other_charges
        })) || [];

        // Calculate summary statistics
        const rates = courierEstimates.map(c => c.rate).filter(rate => rate > 0);
        const deliveryDays = courierEstimates.map(c => c.estimated_delivery_days).filter(days => days > 0);

        return res.status(200).json({
            success: true,
            message: 'Shipping estimate retrieved successfully',
            request_params: estimateParams,
            summary: {
                total_couriers_available: courierEstimates.length,
                cheapest_rate: rates.length > 0 ? Math.min(...rates) : null,
                most_expensive_rate: rates.length > 0 ? Math.max(...rates) : null,
                fastest_delivery_days: deliveryDays.length > 0 ? Math.min(...deliveryDays) : null,
                slowest_delivery_days: deliveryDays.length > 0 ? Math.max(...deliveryDays) : null,
                average_rate: rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
            },
            courier_options: courierEstimates,
            raw_response: estimateData
        });

    } catch (error) {
        console.error('❌ Error in getShippingEstimate controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while getting shipping estimate',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Create shipment with Shiprocket
 * POST /api/shipping/create-shipment
 */
const createShipment = async (req, res) => {
    try {
        const shipmentData = req.body;

        // Basic validation
        if (!shipmentData.order_id || !shipmentData.order_date) {
            return res.status(400).json({
                success: false,
                message: 'order_id and order_date are required'
            });
        }

        console.log('📦 Processing shipment creation request:', shipmentData.order_id);

        const result = await shiprocketService.createShipment(shipmentData);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to create shipment with Shiprocket',
                error: result.error,
                details: result.details
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Shipment created successfully',
            data: result.data
        });

    } catch (error) {
        console.error('❌ Error in createShipment controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating shipment',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Track shipment by AWB
 * GET /api/shipping/track/:awb
 */
const trackShipment = async (req, res) => {
    try {
        const { awb } = req.params;

        if (!awb) {
            return res.status(400).json({
                success: false,
                message: 'AWB number is required'
            });
        }

        console.log(`📍 Processing tracking request for AWB: ${awb}`);

        const result = await shiprocketService.trackShipment(awb);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Failed to track shipment with Shiprocket',
                error: result.error,
                details: result.details
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tracking information retrieved successfully',
            awb,
            data: result.data
        });

    } catch (error) {
        console.error('❌ Error in trackShipment controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while tracking shipment',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

/**
 * Health check for Shiprocket integration
 * GET /api/shipping/health
 */
const healthCheck = async (req, res) => {
    try {
        // Try to get a valid token to verify connection
        await shiprocketService.getValidToken();

        return res.status(200).json({
            success: true,
            message: 'Shiprocket integration is healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Shiprocket health check failed:', error);
        return res.status(503).json({
            success: false,
            message: 'Shiprocket integration is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    getShippingEstimate,
    createShipment,
    trackShipment,
    healthCheck
};