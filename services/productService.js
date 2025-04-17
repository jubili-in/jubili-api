// File: services/productService.js

const { ddbDocClient } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const PRODUCT_TABLE = 'products';

const createProduct = async (sellerId, productData, imageUrls) => {
  const productId = uuidv4();
  const item = {
    productId,
    sellerId,
    ...productData,
    imageUrls,
    createdAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName: PRODUCT_TABLE,
    Item: item,
  }));

  return item;
};

module.exports = {
  createProduct,
};