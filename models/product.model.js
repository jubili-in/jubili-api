const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: [] 
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    ratings: {
        type: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User '
                },
                rating: {
                    type: Number,
                    min: 1,
                    max: 5
                },
                comment: String
            }
        ],
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);