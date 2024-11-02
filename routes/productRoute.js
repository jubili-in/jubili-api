const express = require("express");
const router = express.Router();
const {createProduct, updateProduct, searchProducts, deleteProduct} = require("../controllers/productController");
const {vendorAuth, authMiddleware} = require("../middlewares/vendorAuthMiddleware");

router.post("/createproduct", createProduct);
router.put("/updateproduct/:id", updateProduct);
router.get("/search", searchProducts);
router.delete('/delete/:id', authMiddleware, deleteProduct);

module.exports = router;