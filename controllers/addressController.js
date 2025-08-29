// controllers/addressController.js
const addressService = require('../services/addressService');

const createAddress = async (req, res) => {
    try {
        // Extract owner ID and type from the authenticated user
        let ownerId, ownerType;
        
        if (req.user && req.user.userId) {
            ownerId = req.user.userId;
            ownerType = 'USER';
        } else if (req.seller && req.seller.sellerId) {
            ownerId = req.seller.sellerId;
            ownerType = 'SELLER';
        } else {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        // Add owner info to request body
        const addressData = {
            ...req.body,
            ownerId,
            ownerType
        };

        const result = await addressService.createAddress(addressData);
        
        console.log(`${ownerType} ${ownerId} created address:`, result);
        
        res.status(201).json({
            success: true,
            message: 'Address created successfully!',
            data: {
                ...result,
                ownerId,
                ownerType
            }
        });
    } catch (error) { 
        console.error('Error creating address:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create address'
        });
    }
};

const getAddresses = async (req, res) => {
    try {
        // Extract owner ID and type from the authenticated user
        let ownerId, ownerType;
        
        if (req.user && req.user.userId) {
            ownerId = req.user.userId;
            ownerType = 'USER';
        } else if (req.seller && req.seller.sellerId) {
            ownerId = req.seller.sellerId;
            ownerType = 'SELLER';
        } else {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        const addresses = await addressService.getAddressesByOwner(ownerId);
        
        res.status(200).json({
            success: true,
            message: 'Addresses retrieved successfully!',
            data: addresses,
            count: addresses.length
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch addresses'
        });
    }
};

const getAddressById = async (req, res) => {
    try {
        const { addressId } = req.params;
        
        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        const address = await addressService.getAddress(addressId);
        
        res.status(200).json({
            success: true,
            message: 'Address retrieved successfully!',
            data: address
        });
    } catch (error) {
        console.error('Error fetching address:', error);
        
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch address'
        });
    }
};

module.exports = {
    createAddress,
    getAddresses,
    getAddressById
};