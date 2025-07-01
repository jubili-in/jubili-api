const orderService = require('../services/orderService');

const createOrder = async (req, res) => {
  try {
    const { 
      userId,
      sellerId,
      productId,
      productName,
      quantity,
      productPrice,
      GST,
      deliveryCharges,
      otherCharges
    } = req.body;

    if (!userId || !sellerId || !productId || !productName || !quantity || !productPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const orderData = {
      userId,
      sellerId,
      productId,
      productName,
      quantity: parseInt(quantity),
      productPrice: parseInt(productPrice),
      GST: GST ? parseInt(GST) : 0,
      deliveryCharges: deliveryCharges ? parseInt(deliveryCharges) : 0,
      otherCharges: otherCharges ? parseInt(otherCharges) : 0,
      address: req.body.address || 'Not specified'
    };

    const orderDetails = await orderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: orderDetails
    });
  } catch (error) {
    console.error('Order Placement Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};





const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const orders = await orderService.getOrdersByUser(userId);

    // Transform the response to include only necessary fields
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




const getOrderBySeller = async (req, res) => {
  try {
    const sellerId = req.seller?.sellerId;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller authentication required'
      });
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




const updateOrderStatus = async (req, res) => {
  console.log('Update status request received:', {
    params: req.params,
    body: req.body,
    seller: req.seller
  });

  try {
    let { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.seller?.sellerId;

    console.log('Raw inputs:', { orderId, status, sellerId });

    if (!orderId || typeof orderId !== 'string') {
      console.log('Invalid orderId format');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required and must be a string'
      });
    }

    // Clean the order ID
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    console.log('Cleaned orderId:', cleanOrderId);

    if (!sellerId) {
      console.log('Missing seller authentication');
      return res.status(403).json({
        success: false,
        message: 'Seller authentication required'
      });
    }

    if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      console.log('Invalid status provided');
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    console.log('Calling orderService.updateOrderStatus with:', {
      cleanOrderId,
      sellerId,
      status
    });

    const updatedOrder = await orderService.updateOrderStatus(cleanOrderId, sellerId, status);

    console.log('Update successful, responding with:', updatedOrder);
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
    console.error('Controller error:', {
      error: error.message,
      stack: error.stack,
      fullError: error
    });
    
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



const cancelUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId; // Assumes authenticateUser middleware sets req.user

    if (!orderId || !userId) {
      return res.status(400).json({ success: false, message: 'Order ID and user authentication required' });
    }

    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    const updatedOrder = await orderService.cancelUserOrder(cleanOrderId, userId);
console.log('Received user:', req.user);
console.log('Order ID param:', req.params.orderId);
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