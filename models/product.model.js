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
    colors:{
        type: [{
            label: String,
            size: String,
        }],
    },
    sizes:{
        type: [String],
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount:{
        type: Number,
        default: 0,
        min: 0,
        max: 100
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
    likes: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        default: [],
    },
    dislikes: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        default: [],
    },
    comments: {
        type: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                name: String,
                comment: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        default: [],
    },
    tags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);