const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateSeller } = require('../middlewares/authenticateSeller');
const multer = require('multer');
const upload = multer();

router.post('/', authenticateSeller, upload.array('productImages'), productController.createProduct);

module.exports = router;