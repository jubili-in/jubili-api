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
                    ref: 'User'
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
    // Add an average rating to make searching by rating more efficient
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    // Add relevance or a tag system if relevant to your search functionality
    tags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
});

// Middleware to calculate average rating before saving
productSchema.pre('save', function(next) {
    if (this.ratings.length > 0) {
        const totalRating = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
        this.averageRating = totalRating / this.ratings.length;
    } else {
        this.averageRating = 0;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
