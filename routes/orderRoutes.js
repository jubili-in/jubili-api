const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authenticateUser');
const orderController = require('../controllers/orderController');
const { authenticateSeller } = require('../middlewares/authenticateSeller');

router.post('/order-place', authenticateUser, orderController.placeOrder);
router.get('/user/:userId', authenticateUser, orderController.getUserOrders);
router.get('/seller/orders', authenticateSeller, orderController.getOrderBySeller);
router.patch('/seller/status/:orderId', authenticateSeller, orderController.updateOrderStatus);
router.patch('/user/cancel/:orderId', authenticateUser, orderController.cancelUserOrder);

module.exports = router;
