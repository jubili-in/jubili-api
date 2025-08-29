//routes/addressRoute.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { getUserFromToken } = require('../middlewares/getUserFromToken');

router.get('/', (req, res) => {
    res.send('Address API is live!');
});

router.post('/create-address', getUserFromToken, addressController.createAddress);

module.exports = router;