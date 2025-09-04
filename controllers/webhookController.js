const crypto = require('crypto');
const { ddbDocClient } = require('../config/dynamoDB');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');


const ORDERS_TABLE = process.env.ORDERS_TABLE || 'Orders';


exports.handleRazorpayWebhook = async (req, res) => {
  
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
        
        if (signature === expectedSignature) {
          console.log("✅ Webhook signature verified!");
          
          // Parse the body to JSON for processing
          const eventData = JSON.parse(body.toString());
          // console.log("Event payload:", eventData);
          
          
          const paymentData = eventData.payload?.payment?.entity; 
          const orderData = eventData.payload?.order?.entity; 
          console.log("Payment payload:", paymentData);
          console.log("Order payload:", orderData);
          
          // Process your webhook logic here
          // Example: Update order status, send notifications, etc.
          
          res.status(200).send("OK");
        } else {
          console.log("❌ Invalid signature");
          console.log("Expected:", expectedSignature);
          console.log("Received:", signature);
          res.status(400).send("Invalid signature");
        }
      } catch (error) {
        console.error("❌ Webhook processing error:", error);
        res.status(500).send("Internal server error");
      }
    
  


};
