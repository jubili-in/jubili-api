const mongoose = require('mongoose');
const Vendor = require("./vendor.model"); 

const productSchema = mongoose.Schema({
    image: [{type: String}],
    name: {type: String, required: true},
    price: {type: Number, required: true},
    discount: {
        type: Number,
        default: 0
    },
    bgColor: [],
    stock: {type: Number, required: true}, 
    vendor: {type: mongoose.Schema.Types.ObjectId, ref: 'vendor', required: true}, 
    pannelcolor: {type: String},  //pannel color tar kaj ki ? 
    textColor: {type: String},
});

module.exports = mongoose.model("product", productSchema);