//routes/addressRoute.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { getUserFromToken } = require('../middlewares/getUserFromToken');

router.get('/', (req, res) => {
    res.send('Address API is live!');
});

// Create address (for both USER and SELLER)
router.post('/create', getUserFromToken, addressController.createAddress);

// Get all addresses for authenticated user/seller
router.get('/my-addresses', getUserFromToken, addressController.getAddresses);

// Get specific address by ID
router.get('/:addressId', getUserFromToken, addressController.getAddressById);

// Update address
router.put('/update/:addressId', getUserFromToken, addressController.updateAddress);

// Delete address
router.delete('/delete/:addressId', getUserFromToken, addressController.deleteAddress);

// Set default address
router.patch('/set-default/:addressId', getUserFromToken, addressController.setDefaultAddress);

module.exports = router;