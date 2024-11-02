const orderSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: {type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true,},
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String, 
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending'
    },
    trackingid:{
        type: String,
        default: '',
    },
    paymentInfo: {
        method: { type: String, required: true },
        transactionId: String,
    },
    orderAddress:{
        type: String,
        required: true,
    },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);