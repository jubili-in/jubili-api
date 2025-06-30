const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        message: "Amount and receipt ID are required"
      });
    }

    const options = {
      amount: Math.round(amount), // amount in paise
      currency: "INR",
      receipt,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
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

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

    // Generate expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // Update order status in DynamoDB
    const params = {
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET paymentStatus = :status, paymentId = :pid, paymentMethod = :method, paymentSignature = :sig, paymentDate = :date',
      ExpressionAttributeValues: {
        ':status': 'paid',
        ':pid': razorpay_payment_id,
        ':method': 'razorpay',
        ':sig': razorpay_signature,
        ':date': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const { Attributes: updatedOrder } = await ddbDocClient.send(new UpdateCommand(params));

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found or update failed"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
      error: error.message
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
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