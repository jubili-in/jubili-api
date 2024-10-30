const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname: String,
    email: {
        type: String,
        unique: true,
    },
    password: String,
    phone: {
        type: String,
        unique: true,
    },
    cart:{
        type: Array,
        default: [],
    },
    myorders: {
        type: Array,
        default: [],
    },
    wishlist:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
    },
    picture: String,
});

module.exports = mongoose.model("user", userSchema);