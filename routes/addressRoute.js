//routes/addressRoute.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.get('/', (req, res) => {
    res.send('Address API is live!');
});

router.post('/create-address', addressController.createAddress);

module.exports = router;