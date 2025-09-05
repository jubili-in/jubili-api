const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authenticateUser');
const { authenticateSeller } = require('../middlewares/authenticateSeller');
const orderController = require('../controllers/orderController');

// User routes
// router.post('/create', orderController.createOrder);
router.get('/user/:userId', authenticateUser, orderController.getUserOrders);
router.patch('/cancel/:orderId', authenticateUser, orderController.cancelUserOrder);

// Seller routes
router.get('/seller', authenticateSeller, orderController.getOrderBySeller);
router.patch('/status/:orderId', authenticateSeller, orderController.updateOrderStatus);

module.exports = router;
