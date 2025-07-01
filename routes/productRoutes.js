//File: routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const userActionController = require('../controllers/userActionController');
const { authenticateSeller } = require('../middlewares/authenticateSeller');
const { authenticateUser } = require('../middlewares/authenticateUser');
const multer = require('multer');
const upload = multer();

router.post('/create-product', authenticateSeller, upload.array('productImages'), productController.createProduct);
router.get('/search-products', authenticateUser ,productController.getProducts);
router.post('/like', authenticateUser, userActionController.toggleLike);
router.get('/products/:id', productController.getProductById);

module.exports = router;