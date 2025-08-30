// services/addressService.js - Improved Version
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { ddbDocClient } = require('../config/dynamoDB');
const addressModel = require('../models/addressModel');

// Validation helpers
const validatePhone = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

const validatePostalCode = (postalCode, country) => {
    if (!postalCode) return false;
    // Add country-specific validation as needed
    const postalRegex = /^[A-Za-z0-9\s-]{3,10}$/;
    return postalRegex.test(postalCode);
};

const createAddress = async (data) => {
    const {
        ownerId,
        ownerType,
        addressType,
        name,
        phoneNumber,
        altPhoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        latitude,
        longitude,
        isDefault
    } = data;

    // Enhanced validation
    if (!ownerId || !addressLine1 || !city || !state || !postalCode || !country || !name || !phoneNumber) {
        throw new Error('Missing required fields: ownerId, name, phoneNumber, addressLine1, city, state, postalCode, country are required.');
    }

    if (!ownerType || !['USER', 'SELLER'].includes(ownerType.toUpperCase())) {
        throw new Error('Invalid ownerType. Must be either USER or SELLER.');
    }

    if (!validatePhone(phoneNumber)) {
        throw new Error('Invalid phone number format.');
    }

    if (altPhoneNumber && !validatePhone(altPhoneNumber)) {
        throw new Error('Invalid alternative phone number format.');
    }

    if (!validatePostalCode(postalCode, country)) {
        throw new Error('Invalid postal code format.');
    }

    const addressId = uuidv4();
    const timestamp = new Date().toISOString();

    // If this is marked as default, unset other default addresses first
    if (isDefault) {
        await unsetDefaultAddresses(ownerId);
    }

    const item = {
        ownerId,
        addressId,
        ownerType: ownerType.toUpperCase(),
        addressType: (addressType || 'HOME').toUpperCase(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        altPhoneNumber: altPhoneNumber ? altPhoneNumber.trim() : '',
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : '',
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        latitude: latitude || null,
        longitude: longitude || null,
        isDefault: Boolean(isDefault),
        createdAt: timestamp,
        updatedAt: timestamp
    };

    try {
        await ddbDocClient.send(new PutCommand({
            TableName: addressModel.tableName,
            Item: item
        }));

        return { 
            addressId, 
            createdAt: timestamp,
            message: `Address created successfully for ${ownerType.toLowerCase()}`
        };
    } catch (error) {
        console.error('Error creating address:', error);
        throw new Error('Failed to create address in database');
    }
};

const updateAddress = async (addressId, ownerId, updateData) => {
    // First verify ownership
    const existingAddress = await getAddress(addressId);
    if (existingAddress.ownerId !== ownerId) {
        throw new Error('Unauthorized: Cannot update address that does not belong to you');
    }

    const {
        addressType,
        name,
        phoneNumber,
        altPhoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        latitude,
        longitude,
        isDefault
    } = updateData;

    // Validate required fields if they're being updated
    if (name !== undefined && (!name || name.trim() === '')) {
        throw new Error('Name cannot be empty');
    }

    if (phoneNumber !== undefined && (!phoneNumber || !validatePhone(phoneNumber))) {
        throw new Error('Invalid or empty phone number format');
    }

    if (addressLine1 !== undefined && (!addressLine1 || addressLine1.trim() === '')) {
        throw new Error('Address line 1 cannot be empty');
    }

    if (city !== undefined && (!city || city.trim() === '')) {
        throw new Error('City cannot be empty');
    }

    if (state !== undefined && (!state || state.trim() === '')) {
        throw new Error('State cannot be empty');
    }

    if (postalCode !== undefined && (!postalCode || !validatePostalCode(postalCode, country || existingAddress.country))) {
        throw new Error('Invalid or empty postal code');
    }

    if (country !== undefined && (!country || country.trim() === '')) {
        throw new Error('Country cannot be empty');
    }

    // Validate optional phone number if provided
    if (altPhoneNumber && !validatePhone(altPhoneNumber)) {
        throw new Error('Invalid alternative phone number format');
    }

    // If setting as default, unset other defaults first
    if (isDefault === true) {
        await unsetDefaultAddresses(ownerId);
    }

    const timestamp = new Date().toISOString();
    
    // Build update expression dynamically
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Handle each field individually with proper validation
    const fieldsToUpdate = {
        addressType: addressType ? addressType.toUpperCase() : undefined,
        name: name ? name.trim() : undefined,
        phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
        altPhoneNumber: altPhoneNumber !== undefined ? (altPhoneNumber ? altPhoneNumber.trim() : '') : undefined,
        addressLine1: addressLine1 ? addressLine1.trim() : undefined,
        addressLine2: addressLine2 !== undefined ? (addressLine2 ? addressLine2.trim() : '') : undefined,
        city: city ? city.trim() : undefined,
        state: state ? state.trim() : undefined,
        postalCode: postalCode ? postalCode.trim() : undefined,
        country: country ? country.trim() : undefined,
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined
    };

    // Only add fields that are actually being updated (not undefined)
    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (value !== undefined) {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        }
    });

    // Check if there are actually fields to update
    if (updateExpression.length === 0) {
        throw new Error('No valid fields provided for update');
    }

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = timestamp;

    try {
        const updateResult = await ddbDocClient.send(new UpdateCommand({
            TableName: addressModel.tableName,
            Key: { ownerId, addressId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }));

        return {
            addressId,
            updatedAt: timestamp,
            updatedAddress: updateResult.Attributes,
            message: 'Address updated successfully'
        };
    } catch (error) {
        console.error('Error updating address:', error);
        
        // Handle specific DynamoDB errors
        if (error.name === 'ConditionalCheckFailedException') {
            throw new Error('Address not found or has been modified by another process');
        }
        
        if (error.name === 'ValidationException') {
            throw new Error('Invalid update parameters provided');
        }
        
        throw new Error('Failed to update address in database');
    }
};

const deleteAddress = async (addressId, ownerId) => {
    // First verify ownership
    const existingAddress = await getAddress(addressId);
    if (existingAddress.ownerId !== ownerId) {
        throw new Error('Unauthorized: Cannot delete address that does not belong to you');
    }

    try {
        await ddbDocClient.send(new DeleteCommand({
            TableName: addressModel.tableName,
            Key: { ownerId, addressId }
        }));

        return {
            addressId,
            message: 'Address deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting address:', error);
        throw new Error('Failed to delete address from database');
    }
};

const setDefaultAddress = async (addressId, ownerId) => {
    // First verify ownership
    const existingAddress = await getAddress(addressId);
    if (existingAddress.ownerId !== ownerId) {
        throw new Error('Unauthorized: Cannot modify address that does not belong to you');
    }

    // Unset all default addresses for this owner
    await unsetDefaultAddresses(ownerId);

    // Set this address as default
    const timestamp = new Date().toISOString();
    
    try {
        await ddbDocClient.send(new UpdateCommand({
            TableName: addressModel.tableName,
            Key: { ownerId, addressId },
            UpdateExpression: 'SET isDefault = :isDefault, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':isDefault': true,
                ':updatedAt': timestamp
            }
        }));

        return {
            addressId,
            message: 'Default address updated successfully'
        };
    } catch (error) {
        console.error('Error setting default address:', error);
        throw new Error('Failed to set default address');
    }
};

const unsetDefaultAddresses = async (ownerId) => {
    try {
        // Get all addresses for the owner
        const addresses = await getAddressesByOwner(ownerId);
        const defaultAddresses = addresses.filter(addr => addr.isDefault);

        // Update each default address to not be default
        const updatePromises = defaultAddresses.map(addr =>
            ddbDocClient.send(new UpdateCommand({
                TableName: addressModel.tableName,
                Key: { ownerId, addressId: addr.addressId },
                UpdateExpression: 'SET isDefault = :isDefault, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':isDefault': false,
                    ':updatedAt': new Date().toISOString()
                }
            }))
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error unsetting default addresses:', error);
        throw new Error('Failed to unset default addresses');
    }
};

const getAddress = async (addressId, requesterId = null) => {
    try {
        const result = await ddbDocClient.send(new QueryCommand({
            TableName: addressModel.tableName,
            IndexName: 'AddressIdIndex',
            KeyConditionExpression: 'addressId = :addressId',
            ExpressionAttributeValues: {
                ':addressId': addressId
            }
        }));
        
        if (!result.Items || result.Items.length === 0) {
            throw new Error('Address not found');
        }

        const address = result.Items[0];

        // If requesterId is provided, verify ownership
        if (requesterId && address.ownerId !== requesterId) {
            throw new Error('Unauthorized: Cannot access address that does not belong to you');
        }

        return address;
    } catch (error) {
        console.error('Error getting address by addressId:', error);
        throw error;
    }
};

const getAddressesByOwner = async (ownerId) => {
    try {
        const result = await ddbDocClient.send(new QueryCommand({
            TableName: addressModel.tableName,
            KeyConditionExpression: 'ownerId = :ownerId',
            ExpressionAttributeValues: {
                ':ownerId': ownerId
            }
        }));
        
        if (!result.Items || result.Items.length === 0) {
            return [];
        }

        // Sort by default first, then by creation date
        return result.Items.sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    } catch (error) {
        console.error('Error getting addresses by ownerId:', error);
        throw new Error('Failed to fetch addresses from database');
    }
};

module.exports = {
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddress,
    getAddressesByOwner
};