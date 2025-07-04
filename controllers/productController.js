// File: controllers/productController.js
const multer = require('multer');
const upload = multer();
const productModel = require('../services/productService');
const { uploadProductImage } = require('../services/s3/productImageService');
const { generatePresignedUrl } = require('../services/s3/productImageService');

const { ddbDocClient } = require('../config/dynamoDB');
const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');





const productService = require('../services/productService');



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
    const userId = req.user.userId;
    const { productName } = req.query;
    console.log(req.user);
    
    if (userId==null || userId == undefined) {
      return res.status(500).json({ message: 'Illeh !!' });  
    }

    // Step 1: Fetch all products
    const productsResult = await ddbDocClient.send(new ScanCommand({
      TableName: 'products',
    }));
    let products = productsResult.Items;
    
    console.log(products.length);


    // Step 2: Optional in-memory filter by productName
    if (productName) {
      const lowerSearch = productName.toLowerCase();
      products = products.filter(p =>
        p.productName?.toLowerCase().includes(lowerSearch)
      );
    }

    // Step 3: Fetch user liked product IDs
    const likedResult = await ddbDocClient.send(new QueryCommand({
      TableName: 'userLikedProducts',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId,
      },
    }));
    const likedProductIds = new Set(likedResult.Items.map(item => item.productId));

    // Step 4: Add liked flag and signed image URLs
    const finalProducts = await Promise.all(products
      .filter(p => Array.isArray(p.imageUrls))
      .map(async (product) => {
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






const getProductDetails = async (req, res) => {
  const { productId, productCategory } = req.params;

  // console.log("productId:", productId);
  // console.log("productCategory:", productCategory);

  try {
    const product = await productService.getProductById(productId, productCategory);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports = {
  createProduct,
  getProducts,
  getProductDetails
};