const crypto = require('crypto');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const orderService = require('../services/orderService');
const sseController = require('./sseController');


const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';


async function handleRazorpayWebhook(req, res) {

  console.log("Webhook initiated");

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body; // This is now a Buffer

    if (!secret) {
      console.log("❌ Webhook secret not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    if (!signature) {
      console.log("❌ No signature provided");
      return res.status(400).send("No signature provided");
    }

    if (!body) {
      console.log("❌ No body provided");
      return res.status(400).send("No body provided");
    }

    // Generate expected signature using raw body
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body) // body is now a Buffer, which is correct
      .digest("hex");


    if (signature !== expectedSignature) return res.status(400).send("Invalid signature");


    // Parse the body to JSON for processing
    const eventData = JSON.parse(body.toString());
    const eventType = eventData.event;



    const allowedEvent = 'payment.captured';
    if (eventType !== allowedEvent) {
      console.log(`Ignored event: ${eventType}`);
      return res.status(200).send(`Ignored event: ${eventType}`);
    }
    // console.log("Event payload:", eventData);
    // const paymentData = eventData.payload?.payment?.entity;
    // console.log("Payment payload:", paymentData);
    // console.log(eventData)

    if (eventType === 'payment.captured') {
      const paymentData = eventData.payload?.payment?.entity;
      const razorpayOrderData = eventData.payload?.order?.entity;
      const userId = eventData.payload?.payment?.entity?.notes?.userId;
      // console.log("Payment payload:", paymentData);
      // console.log("Order payload:", razorpayOrderData);
      // Notify frontend order creation started
      sseController.sendOrderEvent(userId, { type: "ORDER_CREATING" });

      const amount = paymentData.amount / 100;
      try {
        const createdOrder = await orderService.createOrder(paymentData); //row 


        // Notify frontend of success
        sseController.sendOrderEvent(userId, {
          type: "ORDER_CREATED",
          orderId: createdOrder.orderId,
          totalAmount: createdOrder.totalAmount,
        });
      } catch (e) {
        sseController.sendOrderEvent(userId, {
          type: "ORDER_FAILED",
          message: e.message,
        });
        console.error("Order creation failed:", e);
      }

    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).send("Internal server error");
  }
};


module.exports = { handleRazorpayWebhook };
