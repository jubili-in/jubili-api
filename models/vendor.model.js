const mongoose = require('mongoose');
const Product = require("./product.model"); 

const vendorSchema = mongoose.Schema({
    name: {type: String, required: true},
    phone: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password:{type: String, required: true},
    orders: {
        type: Array,
        default: []
    },
    products: {type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true}
})

module.exports = mongoose.model("vendor", vendorSchema);