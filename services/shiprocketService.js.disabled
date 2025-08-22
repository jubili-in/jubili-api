const axios = require('axios');
const { EMAIL, PASSWORD, BASE_URL, TOKEN_EXPIRY_DAYS } = require('../config/shiprocket');

/**
 * In-memory token storage
 * In production, consider using Redis or database for multi-instance deployments
 */
let tokenStore = {
    token: null,
    expiresAt: null
};

/**
 * Authenticate with Shiprocket and get access token
 * @returns {Promise<string>} Access token
 */
const authenticateShiprocket = async () => {
    try {
        if (!EMAIL || !PASSWORD) {
            throw new Error('Shiprocket email and password must be configured in environment variables');
        }

        const response = await axios.post(`${BASE_URL}/v1/external/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || !response.data.token) {
            throw new Error('Invalid response from Shiprocket auth API');
        }

        // Store token with expiration (10 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        tokenStore = {
            token: response.data.token,
            expiresAt: expiresAt.getTime()
        };

        console.log('🚀 Shiprocket authentication successful');
        console.log(`🕒 Token expires at: ${new Date(tokenStore.expiresAt).toISOString()}`);

        return response.data.token;
    } catch (error) {
        console.error('❌ Shiprocket authentication failed:', error.response?.data || error.message);
        throw new Error(`Shiprocket authentication failed: ${error.message}`);
    }
};

/**
 * Get valid token (authenticate if needed)
 * @returns {Promise<string>} Valid access token
 */
const getValidToken = async () => {
    const now = Date.now();

    // Check if we have a valid token
    if (tokenStore.token && tokenStore.expiresAt && now < tokenStore.expiresAt) {
        return tokenStore.token;
    }

    // Token expired or doesn't exist, get new one
    console.log('🔄 Shiprocket token expired or missing, refreshing...');
    return await authenticateShiprocket();
};

/**
 * Make authenticated API request to Shiprocket
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request payload
 * @returns {Promise<Object>} API response data
 */
const makeAuthenticatedRequest = async (method, endpoint, data = null) => {
    try {
        const token = await getValidToken();

        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        // If 401, token might be invalid, try once more with fresh token
        if (error.response?.status === 401) {
            console.log('🔄 Token invalid, refreshing and retrying...');
            tokenStore.token = null; // Clear invalid token

            const newToken = await getValidToken();

            const retryConfig = {
                method,
                url: `${BASE_URL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newToken}`
                }
            };

            if (data) {
                retryConfig.data = data;
            }

            const retryResponse = await axios(retryConfig);
            return retryResponse.data;
        }

        console.error('❌ Shiprocket API error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get shipping cost estimate from Shiprocket
 * @param {Object} params - Shipping parameters
 * @param {string} params.pickup_postcode - Pickup pincode
 * @param {string} params.delivery_postcode - Delivery pincode
 * @param {number} params.cod - COD flag (0 or 1)
 * @param {number} params.weight - Package weight in kg
 * @returns {Promise<Object>} Shipping cost estimates
 */
const getShippingEstimate = async ({ pickup_postcode, delivery_postcode, cod, weight }) => {
    try {
        const queryParams = new URLSearchParams({
            pickup_postcode: pickup_postcode.toString(),
            delivery_postcode: delivery_postcode.toString(),
            cod: parseInt(cod).toString(),
            weight: parseFloat(weight).toString()
        });

        console.log('📦 Fetching Shiprocket estimate with params:', queryParams.toString());

        const response = await makeAuthenticatedRequest(
            'GET',
            `/v1/external/courier/serviceability/?${queryParams}`
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('❌ Error getting shipping estimate:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Create shipment order with Shiprocket
 * @param {Object} orderData - Complete order data
 * @returns {Promise<Object>} Shipment creation response
 */
const createShipment = async (orderData) => {
    try {
        // Format the order data according to Shiprocket API requirements
        const formattedOrderData = {
            order_id: orderData.order_id,
            order_date: orderData.order_date,
            pickup_location: orderData.pickup_location || 'Primary',
            channel_id: "",
            comment: orderData.comment || "Order from Edens",
            billing_customer_name: orderData.billing_customer_name,
            billing_last_name: orderData.billing_last_name || "",
            billing_address: orderData.billing_address,
            billing_address_2: orderData.billing_address_2 || "",
            billing_city: orderData.billing_city,
            billing_pincode: orderData.billing_pincode,
            billing_state: orderData.billing_state,
            billing_country: orderData.billing_country || "India",
            billing_email: orderData.billing_email,
            billing_phone: orderData.billing_phone,
            shipping_is_billing: orderData.shipping_is_billing !== false, // Default to true
            shipping_customer_name: orderData.shipping_is_billing ? orderData.billing_customer_name : orderData.shipping_customer_name,
            shipping_last_name: orderData.shipping_is_billing ? (orderData.billing_last_name || "") : (orderData.shipping_last_name || ""),
            shipping_address: orderData.shipping_is_billing ? orderData.billing_address : orderData.shipping_address,
            shipping_address_2: orderData.shipping_is_billing ? (orderData.billing_address_2 || "") : (orderData.shipping_address_2 || ""),
            shipping_city: orderData.shipping_is_billing ? orderData.billing_city : orderData.shipping_city,
            shipping_pincode: orderData.shipping_is_billing ? orderData.billing_pincode : orderData.shipping_pincode,
            shipping_country: orderData.shipping_is_billing ? (orderData.billing_country || "India") : (orderData.shipping_country || "India"),
            shipping_state: orderData.shipping_is_billing ? orderData.billing_state : orderData.shipping_state,
            shipping_email: orderData.shipping_is_billing ? orderData.billing_email : orderData.shipping_email,
            shipping_phone: orderData.shipping_is_billing ? orderData.billing_phone : orderData.shipping_phone,
            order_items: orderData.order_items,
            payment_method: orderData.payment_method || "Prepaid",
            shipping_charges: orderData.shipping_charges || 0,
            giftwrap_charges: orderData.giftwrap_charges || 0,
            transaction_charges: orderData.transaction_charges || 0,
            total_discount: orderData.total_discount || 0,
            sub_total: orderData.sub_total,
            length: orderData.length || 10,
            breadth: orderData.breadth || 10,
            height: orderData.height || 10,
            weight: orderData.weight || 0.5
        };

        console.log('📦 Creating Shiprocket shipment:', formattedOrderData);

        const response = await makeAuthenticatedRequest(
            'POST',
            '/v1/external/orders/create/adhoc',
            formattedOrderData
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('❌ Error creating shipment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Track shipment by AWB
 * @param {string} awb - Air Waybill number
 * @returns {Promise<Object>} Tracking information
 */
const trackShipment = async (awb) => {
    try {
        console.log(`📍 Tracking shipment: ${awb}`);

        const response = await makeAuthenticatedRequest(
            'GET',
            `/v1/external/courier/track/awb/${awb}`
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('❌ Error tracking shipment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Initialize token on server start
 */
const initializeShiprocket = async () => {
    try {
        console.log('🚀 Initializing Shiprocket...');
        await getValidToken();
        console.log('✅ Shiprocket initialization complete');
    } catch (error) {
        console.error('❌ Shiprocket initialization failed:', error.message);
        // Don't throw error to prevent server from crashing
        // Token will be fetched on first API call
    }
};

module.exports = {
    getShippingEstimate,
    createShipment,
    trackShipment,
    initializeShiprocket,
    getValidToken // Export for testing purposes
};