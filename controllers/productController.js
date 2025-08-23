const productService = require('../services/productService');
const { generatePresignedUrl } = require('../services/s3/productImageService');

const createProduct = async (req, res) => {
  try {
     const sellerId = req.seller.sellerId;
    //  console.log(sellerId, "Seller ID from middleware");
    const data = req.body;
    const imageUrls = req.files.map(file => file.key);
    console.log(imageUrls, "Image URLs from S3:", req.files);

    // console.log(data)

    const result = await productService.createProduct(data, imageUrls, sellerId);
    res.status(201).json(result);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};


const getProductById = async (req, res) => {
  try {
    const productId = req.query.id; // Now getting from query instead of params
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });
    
    // Get userId from authenticated user (if available)
    const userId = req.user?.userId;
    
    // Use the new function that can add isLiked status
    const product = await productService.getProductByIdWithLikeStatus(productId, userId);
    if (!product) return res.status(404).json({ error: 'Not found' });

    if (Array.isArray(product.imageUrls)) {
      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );
      product.imageUrls = signedUrls;
    }

    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Error fetching product' });
  }
};



const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    
    const updatedProducts = await Promise.all(products.map(async (product) => {
      if (!Array.isArray(product.imageUrls)) return product;
      
      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );
      
      return {
        ...product,
        imageUrls: signedUrls
      };
    }));
    
    res.json(updatedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};



const searchProducts = async (req, res) => {
  try {
    const { productName } = req.query;
    const userId = req.user?.userId; // Get userId from authenticated user

    if (!productName) {
      return res.status(400).json({ error: 'Missing productName in query' });
    }
    
    const matchedProducts = await productService.searchProductsByName(productName, userId);
    
    const updated = await Promise.all(matchedProducts.map(async (product) => {
      if (!Array.isArray(product.imageUrls)) return product;
      
      const signedUrls = await Promise.all(
        product.imageUrls.map(key => generatePresignedUrl(key))
      );
      
      return {
        ...product,
        imageUrls: signedUrls
      };
    }));
    
    res.json(updated);
  } catch (err) {
    console.error("Search product error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
};



const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const sellerId = req.seller?.sellerId;
    const requestSellerId = req.body?.sellerId;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (requestSellerId !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized to delete this product' });
    }

    await productService.deleteProduct(productId, sellerId);
    return res.json({ success: true, message: 'Product deleted successfully' });

  } catch (err) {
    console.error('Delete Product Error:', err);
    return res.status(500).json({ error: 'Error deleting product' });
  }
};


module.exports = {
  createProduct,
  getProductById,
  deleteProduct,
  getAllProducts,
  searchProducts
};