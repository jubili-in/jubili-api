// models/orderModel.js
const { v4: uuidv4 } = require('uuid');

function generateOrderId() {
    return `oid_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

function buildOrderItem({ userId, transactionId, product, quantity, address }) {
    const orderId = generateOrderId();
    const currentTime = new Date().toISOString();

    const price = parseFloat(product.price);
    const gst = parseFloat(product.gst || 0);
    const delivery = parseFloat(product.deliveryCharge || 0);

    const subTotal = price * quantity;
    const gstAmount = subTotal * (gst / 100);
    const totalAmount = subTotal + gstAmount + delivery;

    return {
        PK: `ORDER#${orderId}`,
        SK: `ORDER#${orderId}`,
        orderId,
        transactionId,
        userId,
        sellerId: product.sellerId,
        productId: product.productId,
        quantity,
        subTotal,
        gstAmount,
        deliveryCharge: delivery,
        totalAmount,
        address,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: currentTime,
        updatedAt: currentTime
    };
}

module.exports = { buildOrderItem };
