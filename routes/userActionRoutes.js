// routes/userActionRoutes.js
const express = require('express');
const router = express.Router();
const userActionController = require('../controllers/userActionController');
const { authenticateUser } = require('../middlewares/authenticateUser'); // Add this line

router.post('/', userActionController.addUserAction);
router.get('/', userActionController.getUserActions);
router.delete('/', userActionController.removeUserAction);

//get user cart data
router.get('/cart', userActionController.getCart);

// Get liked products for authenticated user
router.get('/liked-products', authenticateUser, userActionController.getLikedProducts);
router.get('/get-fev', userActionController.getFavProducts);

module.exports = router;