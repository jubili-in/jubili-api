const crypto = require('crypto');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';

exports.handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const receivedSignature = req.headers['x-razorpay-signature'];
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (receivedSignature !== generatedSignature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  const payment = req.body.payload.payment?.entity;

  if (event === 'payment.captured') {
    const orderId = payment.notes?.orderId;

    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId in payment notes' });
    }

    try {
      const updateParams = {
        TableName: ORDERS_TABLE,
        Key: { orderId },
        UpdateExpression: 'SET paymentStatus = :status, paymentId = :pid, paymentMethod = :method, paymentDate = :date',
        ExpressionAttributeValues: {
          ':status': 'paid',
          ':pid': payment.id,
          ':method': 'razorpay',
          ':date': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await ddbDocClient.send(new UpdateCommand(updateParams));

      console.log('✅ Order updated via webhook:', result.Attributes);
    } catch (err) {
      console.error(' Error updating order from webhook:', err);
    }
  }

  res.status(200).json({ message: 'Webhook received' });
};
