const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const userActionController = require('../controllers/userActionController');
const upload = require('../middlewares/uploadS3');
const { authenticateUser } = require('../middlewares/authenticateUser');
const { authenticateSeller } = require('../middlewares/authenticateSeller');
const { getUserFromToken } = require('../middlewares/getUserFromToken');

// Product Routes
router.post('/create-product',authenticateSeller, upload.array('images', 5), productController.createProduct);
// router.get('/', authenticateUser, productController.getAllProducts);
router.get('/search-products', productController.searchProducts);
router.get('/', productController.getProductById);
router.delete('/:id',authenticateSeller, productController.deleteProduct);
router.post('/like', authenticateUser, userActionController.toggleLike);

// Category Routes
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);

module.exports = router;
