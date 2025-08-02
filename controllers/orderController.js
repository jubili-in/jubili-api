const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { getProductById } = require('../services/productService');
const { generateTransactionId } = require('../models/paymentModel');

const createOrder = async (req, res) => {
    try {
        const { userId, address, items } = req.body;

        // Validate request body
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing userId' 
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Items must be a non-empty array' 
            });
        }

        // Validate address structure
        if (!address || typeof address !== 'object' || Array.isArray(address)) {
            return res.status(400).json({
                success: false,
                message: 'Address must be a valid object'
            });
        }

        // Required address fields
        const requiredAddressFields = ['street', 'city', 'state', 'pincode', 'country'];
        const missingFields = requiredAddressFields.filter(field => !address[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required address fields: ${missingFields.join(', ')}`
            });
        }

        // Process order items
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of items) {
            if (!item.productId || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have productId and quantity'
                });
            }

            const product = await getProductById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }

            // Validate product has required fields
            if (!product.price || !product.sellerId) {
                return res.status(400).json({
                    success: false,
                    message: `Product data incomplete for: ${item.productId}`
                });
            }

            const price = parseFloat(product.price);
            const quantity = parseInt(item.quantity);
            const gst = parseFloat(product.gst || 0);
            const delivery = parseFloat(product.deliveryCharge || 0);
            
            if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid price or quantity'
                });
            }

            const subTotal = price * quantity;
            const gstAmount = subTotal * (gst / 100);
            const itemTotal = subTotal + gstAmount + delivery;
            
            totalAmount += itemTotal;

            orderItems.push({
                productId: product.productId,
                productName: product.productName,
                sellerId: product.sellerId,
                price,
                quantity,
                gst,
                deliveryCharge: delivery,
                subTotal,
                gstAmount,
                totalAmount: itemTotal
            });
        }

        // Create order in database
        const transactionId = generateTransactionId();
        const orderData = {
            userId,
            transactionId,
            items: orderItems,
            totalAmount,
            address,
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Remove any undefined values before saving
        const cleanOrderData = JSON.parse(JSON.stringify(orderData));

        const createdOrder = await orderService.createOrder(cleanOrderData);
        
        // Prepare response without GSI fields
        const response = {
            success: true,
            message: 'Order created successfully',
            order: {
                orderId: createdOrder.orderId,
                transactionId: createdOrder.transactionId,
                userId: createdOrder.userId,
                items: createdOrder.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    sellerId: item.sellerId,
                    price: item.price,
                    quantity: item.quantity,
                    subTotal: item.subTotal,
                    gstAmount: item.gstAmount,
                    deliveryCharge: item.deliveryCharge,
                    totalAmount: item.totalAmount
                })),
                totalAmount: createdOrder.totalAmount,
                address: createdOrder.address,
                status: createdOrder.status,
                paymentStatus: createdOrder.paymentStatus,
                createdAt: createdOrder.createdAt
            },
            transactionId: createdOrder.transactionId
        };

        res.status(201).json(response);

    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};


// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const orders = await orderService.getOrdersByUser(userId);

    const simplifiedOrders = orders.map(order => ({
      orderId: order.orderId,
      productName: order.productName,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      trackingUrl: order.trackingUrl
    }));

    res.status(200).json({
      success: true,
      count: simplifiedOrders.length,
      orders: simplifiedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get orders for seller
const getOrderBySeller = async (req, res) => {
  try {
    const sellerId = req.seller?.sellerId;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller authentication required' });
    }

    const orders = await orderService.getOrdersBySeller(sellerId);

    const sellerOrders = orders.map(order => ({
      orderId: order.orderId,
      userId: order.userId,
      productName: order.productName,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      trackingUrl: order.trackingUrl,
      address: order.address
    }));

    res.status(200).json({
      success: true,
      count: sellerOrders.length,
      orders: sellerOrders
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    let { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.seller?.sellerId;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ success: false, message: 'Order ID is required and must be a string' });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');

    if (!sellerId) {
      return res.status(403).json({ success: false, message: 'Seller authentication required' });
    }

    if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const updatedOrder = await orderService.updateOrderStatus(cleanOrderId, sellerId, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('Controller error:', error);
    const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update order status',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          error: error.message,
          stack: error.stack
        }
      })
    });
  }
};

// Cancel user order
const cancelUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!orderId || !userId) {
      return res.status(400).json({ success: false, message: 'Order ID and user authentication required' });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    const updatedOrder = await orderService.cancelUserOrder(cleanOrderId, userId);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
        error.message.includes('Unauthorized') ? 403 :
            error.message.includes('Cannot cancel') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderBySeller,
  updateOrderStatus,
  cancelUserOrder
};
