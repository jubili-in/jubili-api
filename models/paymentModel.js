// models/paymentModel.js
const { v4: uuidv4 } = require('uuid');

function generateTransactionId() {
    return `txn_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

function buildPaymentItem({ userId, transactionId, totalAmount, paymentMethod = 'razorpay' }) {
    const currentTime = new Date().toISOString();

    return {
        PK: transactionId,
        SK: userId,
        // transactionId,
        // userId,
        status: 'initiated',
        totalAmount,
        paymentMethod,
        createdAt: currentTime,
        updatedAt: currentTime
    };
}

module.exports = { generateTransactionId, buildPaymentItem };
