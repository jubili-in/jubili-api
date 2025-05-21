// File: controllers/productController.js
const multer = require('multer');
const upload = multer();
const productModel = require('../services/productService');
const { uploadProductImage } = require('../services/s3/productImageService');
const { generatePresignedUrl } = require('../services/s3/productImageService');

const { ddbDocClient } = require('../config/dynamoDB');
const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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


const getProducts = async (req, res) => {
  try {
    const userId = req.userId;

    const productsResult = await ddbDocClient.send(new ScanCommand({
      TableName: 'products',
    }));
    const products = productsResult.Items;

    const likedResult = await ddbDocClient.send(new QueryCommand({
      TableName: 'userLikedProducts',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId
      }
    }));
    const likedProductIds = new Set(likedResult.Items.map(item => item.productId));

    // Replace image keys with signed URLs
    const finalProducts = await Promise.all(products.map(async (product) => {
      const signedImageUrls = await Promise.all(
        product.imageUrls.map(async (key) => await generatePresignedUrl(key))
      );

      return {
        ...product,
        imageUrls: signedImageUrls,
        likedByUser: likedProductIds.has(product.productId),
      };
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