const express = require("express");
const router = express.Router();
const {createProduct, updateProduct, searchProducts, deleteProduct, getProductsBySeller} = require("../controllers/productController");
const {vendorAuth, authMiddleware} = require("../middlewares/vendorAuthMiddleware");

router.post("/createproduct", createProduct);
router.put("/updateproduct/:id", updateProduct);
router.get("/search", searchProducts);
router.delete('/delete/:id', authMiddleware, deleteProduct);
router.get('/my-products',getProductsBySeller);

module.exports = router;