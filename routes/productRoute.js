const express = require("express");
const router = express.Router();
const {createProduct, updateProduct, searchProducts} = require("../controllers/productController");

router.post("/createproduct", createProduct);
router.put("/updateproduct/:id", updateProduct);
router.get("/search", searchProducts);

module.exports = router;