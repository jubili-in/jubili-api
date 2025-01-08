const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const jwt = require('jsonwebtoken');

async function fetchAllCartItems(req, res){ 
    try {
        const cartItems = await Cart.find({userId: req.userId}).populate('products.productId');
        return res.status(200).json({
            message: "success",
            cartItems,
        });
    } catch (e) {
        return res.status(400).json({
            message: e.message,
        });
    }
}

async function addToCart(req, res){ 
    try{ 

    }catch(e){ 
        return res.status(500).json({message: e.message}); 
    }
}

module.exports = {fetchAllCartItems, addToCart};

