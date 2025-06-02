// File: services/sellerService.js

const { ddbDocClient } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const SELLER_TABLE = 'sellers';

const createSeller = async ({ email, passwordHash, phone, businessName }) => {
  const sellerId = uuidv4();
  const item = {
    sellerId,
    email,
    businessName,
    passwordHash,
    phone: phone || null,
    createdAt: new Date().toISOString(),
    isVerified: false,
  };
  await ddbDocClient.send(new PutCommand({
    TableName: SELLER_TABLE,
    Item: item,
  })); 
  return item;
}; 

const getSellerByEmail = async (email) => {
  const result = await ddbDocClient.send(new QueryCommand({
    TableName: SELLER_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  }));
  return result.Items[0];
};

module.exports = {
  createSeller,
  getSellerByEmail,
};
