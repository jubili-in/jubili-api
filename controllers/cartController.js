const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const jwt = require('jsonwebtoken');

async function fetchAllCartItems(req, res){ 
    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token) { 
            return res.status(401).json({message: "Unauthorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.user.id;
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
        const token = req.headers.authorization.split(' ')[1];
        if(!token) { 
            return res.status(401).json({message: "Unauthorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.user.id;
        const {productId, quantity} = req.body;
        const product = await Product.findById(productId);
        if(!product) { 
            return res.status(404).json({message: "Product not found"});
        }
        const cart = await Cart.findOne({userId: req.userId});
        if(cart){ 
            // calculating quantity and total and cart total
            let productIndex = cart.products.findIndex(p => p.productId == productId);
            if(productIndex > -1){ 
                cart.products[productIndex].quantity += quantity;
                cart.products[productIndex].total = cart.products[productIndex].quantity * cart.products[productIndex].price;
            }else{ 
                cart.products.push({
                    productId: productId,
                    quantity: quantity,
                    price: product.price,
                    total: product.price * quantity,
                });
            }
            cart.cartTotal += product.price * quantity;
            cart.finalTotal = cart.cartTotal - cart.discount;
            await cart.save();
        }
        else{ 
            const newCart = new Cart({
                userId: req.userId,
                products: [{
                    productId: productId,
                    quantity: quantity,
                    price: product.price,
                    total: product.price * quantity,
                }],
                cartTotal: product.price * quantity,
                finalTotal: product.price * quantity,
            });
            await newCart.save();
        }
        return res.status(200).json({message: "Product added to cart"});
        
    }catch(e){ 
        return res.status(500).json({message: e.message}); 
    }
}

module.exports = {fetchAllCartItems, addToCart};

