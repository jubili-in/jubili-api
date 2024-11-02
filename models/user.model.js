const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: { type: String, required: true },
    phone: {
        type: String,
        unique: true,
        required: true,
    },
    cart: {
        type: Array,
        default: [],
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    picture: String,
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],  // Reference to Address schema
    myOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],  // Reference to Order schema
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
