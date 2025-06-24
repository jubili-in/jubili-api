const Razorpay = require("razorpay");
const razorpay = require("../config/razorpay"); // your existing config

const crypto = require("crypto");
const { updateOrderPaymentStatus } = require("../services/orderService");


const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        message: "Amount and receipt ID are required",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};




const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }

    // ✅ Signature valid → mark order as paid
    await updateOrderPaymentStatus(orderId, {
      paymentStatus: "paid",
      paymentMethod: "razorpay",
    });

    res.status(200).json({ success: true, message: "Payment verified & order updated" });
  } catch (err) {
    console.error("Payment verification failed", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


module.exports = {
  createRazorpayOrder,
    verifyPayment
};
