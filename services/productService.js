// File: services/productService.js

const { ddbDocClient } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const PRODUCT_TABLE = 'products';



const createProduct = async (sellerId, productData, imageUrls) => {
  const productId = uuidv4();
  const item = {
    productId,
    sellerId,
    productName: productData.productName,
    price: productData.price,
    discount: productData.discount || 0,
    color: productData.color,
    size: productData.size,
    description: productData.description,
    imageUrls,
    productCategory: productData.productCategory || productData.category,
    brand: productData.brand,
    material: productData.material,
    gender: productData.gender,
    stock: productData.stock,
    createdAt: new Date().toISOString(),
    likeCount: 0
  };

  await ddbDocClient.send(new PutCommand({
    TableName: PRODUCT_TABLE,
    Item: item,
  }));

  return item;
};


const getProductById = async (productId, productCategory) => {
  const params = {
    TableName: PRODUCT_TABLE,
    Key: {
      productId,
      productCategory
    }
  };

  const result = await ddbDocClient.send(new GetCommand(params));
  return result.Item || null;
};

module.exports = {
  createProduct,
  getProductById,
};