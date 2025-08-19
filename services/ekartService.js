// services/ekartService.js
const axios = require('axios');
const { CLIENT_ID, USERNAME, PASSWORD, BASE_URL, TOKEN_EXPIRY_HOURS } = require('../config/ekart');

/**
 * In-memory token storage for Ekart
 * In production, consider using Redis or database for multi-instance deployments
 */
let ekartTokenStore = {
    token: null,
    expiresAt: null
};

/**
 * Authenticate with Ekart and get access token
 * @returns {Promise<string>} Access token
 */
const authenticateEkart = async () => {
    try {
        if (!CLIENT_ID || !USERNAME || !PASSWORD) {
            throw new Error('Ekart client_id, username and password must be configured in environment variables');
        }

        const response = await axios.post(`${BASE_URL}/integrations/v2/auth/token/${CLIENT_ID}`, {
            username: USERNAME,
            password: PASSWORD
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`🚚 📦 Ekart authentication response:`, response.data);

        if (!response.data || !response.data.access_token) {
            throw new Error('Invalid response from Ekart auth API');
        }

        // Store token with expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

        ekartTokenStore = {
            token: response.data.access_token,
            expiresAt: expiresAt.getTime()
        };

        console.log('🚚 ✅ Ekart authentication successful');
        console.log(`🚚 🕒 Token expires at: ${new Date(ekartTokenStore.expiresAt).toISOString()}`);
        console.log(`🚚 📄 Access Token: ${response.data.access_token.substring(0, 20)}...`);

        return response.data.access_token;
    } catch (error) {
        console.error('🚚 ❌ Ekart authentication failed:', error.response?.data || error.message);
        throw new Error(`Ekart authentication failed: ${error.message}`);
    }
};

/**
 * Get valid Ekart token (authenticate if needed)
 * @returns {Promise<string>} Valid access token
 */
const getValidEkartToken = async () => {
    const now = Date.now();

    // Check if we have a valid token
    if (ekartTokenStore.token && ekartTokenStore.expiresAt && now < ekartTokenStore.expiresAt) {
        console.log('🚚 Using existing valid token');
        return ekartTokenStore.token;
    }

    // Token expired or doesn't exist, get new one
    console.log('🚚 🔄 Ekart token expired or missing, refreshing...');
    return await authenticateEkart();
};

/**
 * Make authenticated API request to Ekart
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request payload
 * @returns {Promise<Object>} API response data
 */
const makeEkartAuthenticatedRequest = async (method, endpoint, data = null) => {
    try {
        const token = await getValidEkartToken();

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

        console.log(`🚚 Making ${method} request to: ${endpoint}`);
        const response = await axios(config);
        return response.data;
    } catch (error) {
        // If 401, token might be invalid, try once more with fresh token
        if (error.response?.status === 401) {
            console.log('🚚 🔄 Token invalid, refreshing and retrying...');
            ekartTokenStore.token = null; // Clear invalid token

            const newToken = await getValidEkartToken();

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

        console.error('🚚 ❌ Ekart API error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get shipping cost estimate from Ekart
 * @param {Object} params - Shipping parameters
 * @param {string} params.origin_pincode - Origin pincode
 * @param {string} params.destination_pincode - Destination pincode
 * @param {number} params.weight - Package weight in kg
 * @param {string} params.mode - Shipping mode (Surface/Air)
 * @returns {Promise<Object>} Shipping cost estimates
 */
const getEkartShippingEstimate = async ({ origin_pincode, destination_pincode, weight, mode = 'Surface' }) => {
    try {
        const queryParams = new URLSearchParams({
            origin_pincode: origin_pincode.toString(),
            destination_pincode: destination_pincode.toString(),
            weight: parseFloat(weight).toString(),
            mode: mode
        });

        console.log('🚚 📦 Fetching Ekart estimate with params:', queryParams.toString());

        const response = await makeEkartAuthenticatedRequest(
            'GET',
            `/v2/rates?${queryParams}`
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('🚚 ❌ Error getting Ekart shipping estimate:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Create shipment order with Ekart
 * @param {Object} orderData - Complete order data
 * @returns {Promise<Object>} Shipment creation response
 */
const createEkartShipment = async (orderData) => {
    try {
        console.log('🚚 📦 Creating Ekart shipment:', orderData.order_number);

        const response = await makeEkartAuthenticatedRequest(
            'POST',
            '/v2/shipments',
            orderData
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('🚚 ❌ Error creating Ekart shipment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Track shipment by tracking number
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<Object>} Tracking information
 */
const trackEkartShipment = async (trackingNumber) => {
    try {
        console.log(`🚚 📍 Tracking Ekart shipment: ${trackingNumber}`);

        const response = await makeEkartAuthenticatedRequest(
            'GET',
            `/v2/shipments/${trackingNumber}/track`
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('🚚 ❌ Error tracking Ekart shipment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Get serviceability check
 * @param {string} pincode - Pincode to check
 * @returns {Promise<Object>} Serviceability information
 */
const checkEkartServiceability = async (pincode) => {
    try {
        console.log(`🚚 🔍 Checking Ekart serviceability for pincode: ${pincode}`);

        const response = await makeEkartAuthenticatedRequest(
            'GET',
            `/v2/pincodes/${pincode}/serviceability`
        );

        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('🚚 ❌ Error checking Ekart serviceability:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Initialize Ekart token on server start
 */
const initializeEkart = async () => {
    try {
        console.log('🚚 🚀 Initializing Ekart...');
        await getValidEkartToken();
        console.log('🚚 ✅ Ekart initialization complete');
    } catch (error) {
        console.error('🚚 ❌ Ekart initialization failed:', error.message);
        // Don't throw error to prevent server from crashing
        // Token will be fetched on first API call
    }
};

/**
 * Health check for Ekart integration
 */
const ekartHealthCheck = async () => {
    try {
        // Try to get a valid token to verify connection
        await getValidEkartToken();
        return {
            success: true,
            message: 'Ekart integration is healthy',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('🚚 ❌ Ekart health check failed:', error);
        return {
            success: false,
            message: 'Ekart integration is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = {
    getEkartShippingEstimate,
    createEkartShipment,
    trackEkartShipment,
    checkEkartServiceability,
    initializeEkart,
    ekartHealthCheck,
    getValidEkartToken // Export for testing purposes
};