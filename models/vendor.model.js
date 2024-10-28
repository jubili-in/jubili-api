const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: String,
    phone: Number,
    email: String,
    password: String,
    orders: {
        type: Array,
        default: []
    },
    
})

module.exports = mongoose.model("vendor", vendorSchema);