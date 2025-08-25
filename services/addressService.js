// services/addressService.js
const { DynamoDBClient, PutItemCommand, QueryCommand  } = require('@aws-sdk/client-dynamodb');

// const {ddbDocClient} = require('../config/dynamoDB'); 
const { v4: uuidv4 } = require('uuid');


const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' }); // Change region if needed
const addressModel = require('../models/addressModel'); 

const createAddress = async (data) => {
    const {
        ownerId,
        ownerType, // 'USER' or 'SELLER'
        addressType, // HOME, WORK, WAREHOUSE.
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

    if (!ownerId || !addressLine1 || !city || !state || !postalCode || !country) {
        throw new Error('Missing required address fields.');
    }

    const addressId = uuidv4();
    const timestamp = new Date().toISOString();

    const params = {
        TableName: TABLE_NAME,
        Item: {
            ownerId: { S: ownerId },
            addressId: { S: addressId },
            ownerType: { S: (ownerType || 'USER').toUpperCase() },
            addressType: { S: addressType || 'HOME' },
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
            isDefault: { BOOL: Boolean(isDefault) },
            createdAt: { S: timestamp },
            updatedAt: { S: timestamp }
        }
    };

    await dynamoClient.send(new PutItemCommand(params));

    return { addressId, createdAt: timestamp };
};


// Get address from addressId (query GSI)
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

        const item = result.Items[0]; // Should only be one item since addressId is unique
        
        // Convert DynamoDB format to regular object
        return {
            postalCode: item.postalCode.S,
        };
    } catch (error) {
        console.error('Error getting address by addressId:', error);
        throw error;
    }
};



const getAddressUserId = async(ownerId) => { 
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
            throw new Error('Address not found');
        }

        const item = result.Items[0]; // Should only be one item since addressId is unique
        
        // Convert DynamoDB format to regular object
        return {
            postalCode: item.postalCode.S,
        };
    } catch (error) {
        console.error('Error getting address by addressId:', error);
        throw error;
    }
}

module.exports = {
    createAddress,
    getAddress, 
    getAddressUserId
};
