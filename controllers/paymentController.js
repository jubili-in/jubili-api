const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const orderService = require('../services/orderService');
const { buildPaymentItem } = require('../models/paymentModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});

const ORDERS_TABLE = 'Orders';
const PAYMENTS_TABLE = 'Payments';

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt, orderId, items, userId, address } = req.body;

    if (!amount || !receipt || !orderId || !items || !Array.isArray(items) || items.length === 0 || !userId || !address) {
      return res.status(400).json({
        success: false,
        message: "Amount, receipt ID and order ID are required"
      });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        orderId, 
        userId,
        address: JSON.stringify(address),
        items: JSON.stringify(items)
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message
    });
  }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters"
            });
        }

        // Verify signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Update order status
        const updatedOrder = await orderService.updateOrderPaymentStatus(orderId, {
            paymentStatus: 'paid',
            paymentId: razorpay_payment_id,
            paymentMethod: 'razorpay',
            status: 'confirmed'
        });

        // Create payment record
        const paymentItem = buildPaymentItem({
            userId: updatedOrder.userId,
            transactionId: updatedOrder.transactionId,
            totalAmount: updatedOrder.totalAmount,
            paymentMethod: 'razorpay',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            status: 'completed'
        });

        await ddbDocClient.send(new PutCommand({
            TableName: PAYMENTS_TABLE,
            Item: paymentItem
        }));

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: error.message
        });
    }
};


const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const params = {
      TableName: ORDERS_TABLE,
      Key: { orderId },
      ProjectionExpression: 'paymentStatus, paymentMethod, orderStatus'
    };

    const { Item: order } = await ddbDocClient.send(new GetCommand(params));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus
    });

  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment status",
      error: error.message
    });
  }
};


const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = req.body;
        
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(webhookBody))
            .digest('hex');
            
        if (expectedSignature !== webhookSignature) {
            return res.status(400).send('Invalid signature');
        }
        
        // Handle different webhook events
        switch (webhookBody.event) {
            case 'payment.captured':
                // Update payment status
                await updatePaymentStatus(webhookBody.payload.payment.entity);
                break;
            case 'payment.failed':
                // Handle failed payment
                await handleFailedPayment(webhookBody.payload.payment.entity);
                break;
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
}


module.exports = {
  verifyPayment,
  createRazorpayOrder,
  getPaymentStatus,
  handleWebhook
};