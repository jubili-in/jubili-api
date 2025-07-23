const axios = require('axios');
const { API_KEY, WAREHOUSE, BASE_URL } = require('../config/delhivery')

// 1. Create Order (Shipment)

// import qs from 'qs';
const qs = require('qs');
async function createNewShipment(orderDetails) {
    try {
        const payload = {
            format: 'json',
            data: JSON.stringify({
                shipments: [
                    {
                        name: orderDetails.address.name,
                        add: orderDetails.address.street,
                        pin: orderDetails.address.pincode,
                        city: orderDetails.address.city,
                        state: orderDetails.address.state,
                        country: 'India',
                        phone: orderDetails.address.phone,
                        order: orderDetails.orderId,
                        payment_mode: orderDetails.paymentMethod === 'cod' ? 'COD' : (orderDetails.paymentMode || 'Prepaid'),
                        return_pin: orderDetails.return_pin || '',
                        return_city: orderDetails.return_city || '',
                        return_phone: orderDetails.return_phone || '',
                        return_add: orderDetails.return_add || '',
                        return_state: orderDetails.return_state || '',
                        return_country: orderDetails.return_country || '',
                        products_desc: orderDetails.products_desc || 'General Merchandise',
                        hsn_code: orderDetails.hsn_code || '6109',
                        cod_amount: orderDetails.paymentMethod === 'cod' ? orderDetails.totalAmount : '',
                        order_date: orderDetails.order_date === undefined ? null : orderDetails.order_date,
                        total_amount: orderDetails.totalAmount ? orderDetails.totalAmount.toString() : '',
                        seller_add: orderDetails.seller_add || 'lal-bazar',
                        seller_name: orderDetails.seller_name || 'subhankar',
                        seller_inv: orderDetails.seller_inv || '',
                        quantity: orderDetails.quantity || '1',
                        waybill: orderDetails.waybill || '',
                        shipment_width: orderDetails.shipment_width || '100',
                        shipment_height: orderDetails.shipment_height || '100',
                        shipment_length: orderDetails.shipment_length || '',
                        weight: orderDetails.weight?.toString() || '0.5',
                        shipping_mode: orderDetails.shipping_mode || 'Surface',
                        address_type: orderDetails.address_type || ''
                    }
                ],
                pickup_location: {
                    name: orderDetails.pickup_location || WAREHOUSE
                }
            })
        };

        const response = await axios.post(
            `${BASE_URL}/api/cmu/create.json`,
            qs.stringify(payload),
            {
                headers: {
                    'Authorization': `Token ${API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('Delhivery create shipment response:', JSON.stringify(response.data, null, 2));

        // User-friendly error for warehouse mismatch
        if (response.data.rmk && response.data.rmk.includes('ClientWarehouse matching query does not exist')) {
            return {
                success: false,
                message: 'Delhivery warehouse name does not match any registered warehouse. Please check DELHIVERY_WAREHOUSE in your environment variables and ensure it matches exactly as registered in Delhivery.',
                details: response.data
            };
        }

        // Check for errors in the response
        if (!response.data || !response.data.packages || !response.data.packages[0] || !response.data.packages[0].waybill) {
            return {
                success: false,
                message: 'No waybill returned from Delhivery',
                details: response.data
            };
        }

        const awb = response.data.packages[0].waybill;
        return {
            success: true,
            awb,
            trackingUrl: `https://www.delhivery.com/track/${awb}`
        };
    } catch (error) {
        console.error('Delhivery API error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.message,
            details: error.response?.data
        };
    }
}

// 2. Generate Label (PDF)
async function generateLabel(awb) {
    try {
        const url = `${BASE_URL}/api/p/packing_slip?wbns=${awb}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Token ${API_KEY}` },
            responseType: 'arraybuffer'
        });
        return { success: true, pdfBuffer: response.data };
    } catch (error) {
        return { success: false, message: error.message, details: error.response?.data };
    }
}

// 3. Schedule Pickup
async function schedulePickup(pickupDetails) {
    try {
        const payload = {
            format: 'json',
            data: JSON.stringify({
                pickup_location: WAREHOUSE,
                pickups: [pickupDetails]
            })
        };
        const response = await axios.post(
            `${BASE_URL}/api/p/edit`,
            qs.stringify(payload),
            {
                headers: {
                    'Authorization': `Token ${API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.message, details: error.response?.data };
    }
}

// 4. Track Shipment
async function getTrackingStatus(awb) {
    try {
        const url = `${BASE_URL}/api/v1/packages/json/?waybill=${awb}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Token ${API_KEY}` }
        });
        return { success: true, data: response.data }; 
    } catch (error) {
        return { success: false, message: error.message, details: error.response?.data };
    }
}

module.exports = {
    createNewShipment,
    generateLabel,
    schedulePickup,
    getTrackingStatus
};