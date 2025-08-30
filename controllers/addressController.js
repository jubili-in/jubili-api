// controllers/addressController.js - Improved Version
const addressService = require('../services/addressService');

const extractOwnerInfo = (req) => {
    if (req.user && req.user.userId) {
        return {
            ownerId: req.user.userId,
            ownerType: 'USER'
        };
    } else if (req.seller && req.seller.sellerId) {
        return {
            ownerId: req.seller.sellerId,
            ownerType: 'SELLER'
        };
    }
    return null;
};

const createAddress = async (req, res) => {
    try {
        const ownerInfo = extractOwnerInfo(req);
        
        if (!ownerInfo) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        const addressData = {
            ...req.body,
            ...ownerInfo
        };

        const result = await addressService.createAddress(addressData);
        
        console.log(`${ownerInfo.ownerType} ${ownerInfo.ownerId} created address:`, result);
        
        res.status(201).json({
            success: true,
            message: 'Address created successfully!',
            data: {
                ...result,
                ...ownerInfo
            }
        });
    } catch (error) { 
        console.error('Error creating address:', error);
        
        // Handle validation errors specifically
        if (error.message.includes('Missing required fields') || 
            error.message.includes('Invalid') || 
            error.message.includes('format')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create address'
        });
    }
};

const updateAddress = async (req, res) => {
    try {
        const ownerInfo = extractOwnerInfo(req);
        const { addressId } = req.params;
        
        if (!ownerInfo) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        const result = await addressService.updateAddress(addressId, ownerInfo.ownerId, req.body);
        
        res.status(200).json({
            success: true,
            message: 'Address updated successfully!',
            data: result
        });
    } catch (error) {
        console.error('Error updating address:', error);
        
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Invalid') || error.message.includes('format')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update address'
        });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const ownerInfo = extractOwnerInfo(req);
        const { addressId } = req.params;
        
        if (!ownerInfo) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        const result = await addressService.deleteAddress(addressId, ownerInfo.ownerId);
        
        res.status(200).json({
            success: true,
            message: 'Address deleted successfully!',
            data: result
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete address'
        });
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const ownerInfo = extractOwnerInfo(req);
        const { addressId } = req.params;
        
        if (!ownerInfo) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        const result = await addressService.setDefaultAddress(addressId, ownerInfo.ownerId);
        
        res.status(200).json({
            success: true,
            message: 'Default address set successfully!',
            data: result
        });
    } catch (error) {
        console.error('Error setting default address:', error);
        
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to set default address'
        });
    }
};

const getAddresses = async (req, res) => {
    try {
        const ownerInfo = extractOwnerInfo(req);
        
        if (!ownerInfo) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide valid user or seller token.'
            });
        }

        const addresses = await addressService.getAddressesByOwner(ownerInfo.ownerId);
        
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
        const ownerInfo = extractOwnerInfo(req);
        const { addressId } = req.params;
        
        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        // Pass owner ID for ownership verification if authenticated
        const requesterId = ownerInfo ? ownerInfo.ownerId : null;
        const address = await addressService.getAddress(addressId, requesterId);
        
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
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
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
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddresses,
    getAddressById
};