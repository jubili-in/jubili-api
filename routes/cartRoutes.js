const express = require('express');
const router = express.Router();
const {fetchAllCartItems, addToCart} = require('../controllers/cartController');   

router.get('/fetch-all', fetchAllCartItems);
router.post('/add-to-cart', addToCart);

module.exports = router;