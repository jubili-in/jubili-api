// services/addressService.js
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');
const addressModel = require('../models/addressModel');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const createAddress = async (data) => {
    const {
        ownerId,
        ownerType, // 'USER' or 'SELLER'
        addressType, // HOME, WORK, WAREHOUSE
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
        longitude
    } = data;

    // Validation
    if (!ownerId || !addressLine1 || !city || !state || !postalCode || !country) {
        throw new Error('Missing required address fields: ownerId, addressLine1, city, state, postalCode, country are required.');
    }

    if (!ownerType || !['USER', 'SELLER'].includes(ownerType.toUpperCase())) {
        throw new Error('Invalid ownerType. Must be either USER or SELLER.');
    }

    const addressId = uuidv4();
    const timestamp = new Date().toISOString();

    const params = {
        TableName: addressModel.tableName,
        Item: {
            ownerId: { S: ownerId },
            addressId: { S: addressId },
            ownerType: { S: ownerType.toUpperCase() },
            addressType: { S: (addressType || 'HOME').toUpperCase() },
            name: { S: name || '' },
            phoneNumber: { S: phoneNumber || '' },
            altPhoneNumber: { S: altPhoneNumber || '' },
            addressLine1: { S: addressLine1 },
            addressLine2: { S: addressLine2 || '' },
            city: { S: city },
            state: { S: state },
            postalCode: { S: postalCode },
            country: { S: country },
            latitude: latitude ? { N: latitude.toString() } : { NULL: true },
            longitude: longitude ? { N: longitude.toString() } : { NULL: true },
            createdAt: { S: timestamp },
            updatedAt: { S: timestamp }
        }
    };

    try {
        await dynamoClient.send(new PutItemCommand(params));
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

// Get address by addressId (using GSI)
const getAddress = async (addressId) => {
    const params = {
        TableName: addressModel.tableName,
        IndexName: 'AddressIdIndex',
        KeyConditionExpression: 'addressId = :addressId',
        ExpressionAttributeValues: {
            ':addressId': { S: addressId }
        }
    };

    try {
        const result = await dynamoClient.send(new QueryCommand(params));
        
        if (!result.Items || result.Items.length === 0) {
            throw new Error('Address not found');
        }

        const item = result.Items[0];
        return convertDynamoToObject(item);
    } catch (error) {
        console.error('Error getting address by addressId:', error);
        throw error;
    }
};

// Get all addresses for a specific owner
const getAddressesByOwner = async (ownerId) => {
    const params = {
        TableName: addressModel.tableName,
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
            ':ownerId': { S: ownerId }
        }
    };

    try {
        const result = await dynamoClient.send(new QueryCommand(params));
        
        if (!result.Items || result.Items.length === 0) {
            return []; // Return empty array instead of throwing error
        }

        // Convert all items and sort by creation date
        return result.Items
            .map(item => convertDynamoToObject(item))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error('Error getting addresses by ownerId:', error);
        throw new Error('Failed to fetch addresses from database');
    }
};

// Helper function to convert DynamoDB format to regular object
const convertDynamoToObject = (item) => {
    return {
        ownerId: item.ownerId?.S || '',
        addressId: item.addressId?.S || '',
        ownerType: item.ownerType?.S || '',
        addressType: item.addressType?.S || '',
        name: item.name?.S || '',
        phoneNumber: item.phoneNumber?.S || '',
        altPhoneNumber: item.altPhoneNumber?.S || '',
        addressLine1: item.addressLine1?.S || '',
        addressLine2: item.addressLine2?.S || '',
        city: item.city?.S || '',
        state: item.state?.S || '',
        postalCode: item.postalCode?.S || '',
        country: item.country?.S || '',
        latitude: item.latitude?.N ? parseFloat(item.latitude.N) : null,
        longitude: item.longitude?.N ? parseFloat(item.longitude.N) : null,
        createdAt: item.createdAt?.S || '',
        updatedAt: item.updatedAt?.S || ''
    };
};

module.exports = {
    createAddress,
    getAddress,
    getAddressesByOwner
};