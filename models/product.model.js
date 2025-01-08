const mongoose = require('mongoose');
const Vendor = require("./vendor.model"); 

const productSchema = mongoose.Schema({
    image: String,
    name: String,
    price: Number,
    discount: {
        type: String,
        default: 0
    },
    bgColor: String,
    pannelcolor: String,
    textColor: String,
});

module.exports = mongoose.model('Product', productSchema);