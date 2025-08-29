// controllers/addressController.js
const addressService = require('../services/addressService');

const createAddress = async (req, res) => {
    try {
        const result = await addressService.createAddress(req.body);
        console.log(req.user);
        
        res.status(201).json({
            success: true,
            message: 'Address created successfully!',
            data: result
        });
    } catch (error) { 
        console.error('Error creating address:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create address'
        });
    }
};

module.exports = {
    createAddress
};
