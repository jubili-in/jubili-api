// services/addressService.js
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' }); // Change region if needed
const TABLE_NAME = 'Addresses';

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

module.exports = {
    createAddress
};
