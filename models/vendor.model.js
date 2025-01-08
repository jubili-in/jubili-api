const mongoose = require('mongoose');
const Product = require("./product.model"); 

const vendorSchema = mongoose.Schema({
    name: String,
    phone: {
        type: String,
        uniwue: true
    },
    email: {
        type: String,
        uniwue: true
    },
    password: String,
    orders: {
        type: Array,
        default: []
    },
})

module.exports = mongoose.model('Vendor', vendorSchema);