const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const jwt = require('jsonwebtoken');

// Create a new order
async function createOrder(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.user.id;

        const { 
            vendorId, 
            items, 
            totalAmount, 
            paymentMethod,
            transactionId,
            orderAddress
        } = req.body;

        if (!items || !items.length || !totalAmount || !paymentMethod || !orderAddress) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newOrder = new Order({
            user: req.userId,
            vendor: vendorId,
            items: items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount,
            paymentInfo: {
                method: paymentMethod,
                transactionId: transactionId || ''
            },
            orderAddress
        });

        const savedOrder = await newOrder.save();
        
        // Clear cart after successful order if needed
        // await Cart.findOneAndUpdate({ userId: req.userId }, { products: [], cartTotal: 0, discount: 0, finalTotal: 0 });

        return res.status(201).json({
            message: "Order created successfully",
            order: savedOrder
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Fetch all orders for a user
async function fetchUserOrders(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.user.id;

        const orders = await Order.find({ user: req.userId })
            .populate('items.product')
            .populate('vendor', 'name email')
            .sort({ orderDate: -1 });

        return res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Fetch a specific order by ID
async function fetchOrderById(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.user.id;

        const { orderId } = req.params;
        
        const order = await Order.findOne({ _id: orderId, user: req.userId })
            .populate('items.product')
            .populate('vendor', 'name email');
            
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order fetched successfully",
            order
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

module.exports = { createOrder, fetchUserOrders, fetchOrderById }; 