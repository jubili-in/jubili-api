const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const userActionController = require('../controllers/userActionController');
const upload = require('../middlewares/uploadS3');
const { authenticateUser } = require('../middlewares/authenticateUser');

// 📦 Product Routes
router.post('/create-product', upload.array('images', 5), productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/search-products', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);
router.post('/like', authenticateUser, userActionController.toggleLike); // only logged-in users

// 📁 Category Routes
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);

module.exports = router;
