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
router.get('/search-products', getUserFromToken, productController.searchProducts);
router.get('/',getUserFromToken, productController.getProductById);
router.delete('/:id',authenticateSeller, productController.deleteProduct);
router.post('/like', authenticateUser, userActionController.toggleLike);

// Category Routes
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);

module.exports = router;
// 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
