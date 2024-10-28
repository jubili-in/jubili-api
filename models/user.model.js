const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    phone: {
        type: String,
        unique: true,
    },
    cart:{
        type: Array,
        default: [],
    },
    orders: {
        type: Array,
        default: [],
    },
    picture: String,
});

module.exports = mongoose.model("user", userSchema);