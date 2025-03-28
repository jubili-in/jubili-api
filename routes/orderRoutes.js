const express = require('express');
const router = express.Router();
const { createOrder, fetchUserOrders, fetchOrderById } = require('../controllers/orderController');

// Create a new order
router.post('/create', createOrder);

// Fetch all orders for the logged-in user
router.get('/user-orders', fetchUserOrders);

// Fetch a specific order by ID
router.get('/:orderId', fetchOrderById);

module.exports = router; 