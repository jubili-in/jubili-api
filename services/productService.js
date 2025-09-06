const { ddbDocClient } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');

const USER_LIKE_TABLE = 'userLikedProducts';
const { PutCommand, GetCommand, ScanCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const productModel = require('../models/productModel');

function deepClean(value) {
  if (Array.isArray(value)) {
    return value.filter(v => v !== undefined && v !== null);
  }
  return value;
}

// Removes undefined/null fields from object and also deeply cleans arrays
function clean(item) {
  return Object.fromEntries(
    Object.entries(item)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, deepClean(v)])
  );
}

const createProduct = async (data, imageUrls, sellerId) => {
  // Handle dimensions object creation
  const dimensions = {};
  if (data.height) dimensions.height = Number(data.height);
  if (data.breadth) dimensions.breadth = Number(data.breadth);
  if (data.length) dimensions.length = Number(data.length);
  if (data.weight) dimensions.weight = Number(data.weight);

  const item = clean({
    productId: uuidv4(),
    sellerId,
    categoryId: data.categoryId,
    brand: data.brand,
    attributes: data.attributes || {},       // map
    specifications: data.specifications || {}, // map
    productName: data.productName,
    productDescription: data.productDescription,
    price: data.price ? Number(data.price) : 0,
    currentPrice: data.currentPrice ? Number(data.currentPrice) : 0, 
    stock: data.stock ? Number(data.stock) : 0,
    dimensions: Object.keys(dimensions).length > 0 ? dimensions : {},
    addressId: data.addressId,
    imageUrls: imageUrls || [],
    likeCount: 0,
    linkedItems: data.linkedItems ? data.linkedItems.map(item => item.productId) : [],
    createdAt: new Date().toISOString(),
  });

  await ddbDocClient.send(new PutCommand({
    TableName: productModel.tableName,
    Item: item,
    marshallOptions: {
      removeUndefinedValues: true
    }
  }));

  return item;
};


const getProductById = async (id) => {
  const result = await ddbDocClient.send(new GetCommand({
    TableName: productModel.tableName,
    Key: { productId: id },
  }));
  return result.Item || null;
};

const getProductByIdWithLikeStatus = async (id, userId = null) => {
  const product = await getProductById(id);
  
  // If no product found or no userId provided, return product as is
  if (!product || !userId) {
    return product;
  }
  
  // Get user's liked products
  const likedResult = await ddbDocClient.send(new QueryCommand({
    TableName: USER_LIKE_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));
  
  const likedProductIds = new Set(likedResult.Items?.map(item => item.productId) || []);
  
  // Add isLiked field to product
  return {
    ...product,
    isLiked: likedProductIds.has(product.productId)
  };
};



const getAllProducts = async () => {
  const result = await ddbDocClient.send(new ScanCommand({
    TableName: productModel.tableName,
  }));
  return result.Items || [];
};



const searchProductsByName = async (queryName, userId = null) => {
  try {
    const result = await ddbDocClient.send(
      new ScanCommand({ TableName: productModel.tableName })
    );

    const allProducts = result.Items || [];
    const lowerQuery = queryName.toLowerCase();

    // Case-insensitive filter
    const filtered = allProducts.filter(prod =>
      prod.productName && prod.productName.toLowerCase().includes(lowerQuery)
    );

    // If no userId provided, return products without isLiked field
    if (!userId) {
      console.log('No userId provided, returning without isLiked');
      return filtered;
    }

    console.log('Fetching liked products for user:', userId);
    // Get user's liked products
    const likedResult = await ddbDocClient.send(new QueryCommand({
      TableName: USER_LIKE_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const likedProductIds = new Set(likedResult.Items?.map(item => item.productId) || []);

    // Add isLiked field to each product
    return filtered.map(product => ({
      ...product,
      isLiked: likedProductIds.has(product.productId)
    }));
  } catch (error) {
    console.error('Error in searchProductsByName:', error);
    throw error;
  }
};


const deleteProduct = async (productId, sellerId) => {
  if (!sellerId) {
    throw new Error('Seller ID is required to delete a product');
  }

  if (!productId) {
    throw new Error('Product ID is required to delete a product');
  }

  await ddbDocClient.send(new DeleteCommand({
    TableName: productModel.tableName,
    Key: { productId },
    ConditionExpression: 'sellerId = :sellerId',
    ExpressionAttributeValues: {
      ':sellerId': sellerId,
    },
  }));
};

module.exports = {
  createProduct,
  getProductById,
  getProductByIdWithLikeStatus,
  deleteProduct,
  getAllProducts,
  searchProductsByName,
};
