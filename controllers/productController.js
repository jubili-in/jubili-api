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

module.exports = {
  createProduct,
};