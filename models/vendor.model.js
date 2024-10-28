const mongoose = require('mongoose');

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

module.exports = mongoose.model("vendor", vendorSchema);