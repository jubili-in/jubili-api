// File: controllers/productController.js
const multer = require('multer');
const upload = multer();
const productModel = require('../services/productService');
const { uploadProductImage } = require('../services/s3/productImageService');

const createProduct = async (req, res) => {
  try {
    const sellerId = req.seller.sellerId;
    const productData = req.body;
    const productImages = req.files;

    const imageUrls = await Promise.all(productImages.map(async (image) => {
      const fileType = image.originalname.split('.').pop();
      return await uploadProductImage(image.buffer, fileType);
    }));

    const product = await productModel.createProduct(sellerId, productData, imageUrls);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
};


const { ddbDocClient } = require('../config/dynamoDB');
const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const getProducts = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Fetch all products (replace this with your actual search logic later)
    const productsResult = await ddbDocClient.send(new ScanCommand({
      TableName: 'products',
    }));
    const products = productsResult.Items;

    // 2. Fetch products liked by the user
    const likedResult = await ddbDocClient.send(new QueryCommand({
      TableName: 'userLikedProducts',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId
      }
    }));
    const likedProductIds = new Set(likedResult.Items.map(item => item.productId));

    // 3. Attach likedByUser to each product
    const finalProducts = products.map(product => ({
      ...product,
      likedByUser: likedProductIds.has(product.productId)
    }));

    res.status(200).json(finalProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

module.exports = {
  createProduct,
  getProducts
};