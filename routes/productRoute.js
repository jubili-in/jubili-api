const express = require("express");
const router = express.Router();
const {createProduct, updateProduct} = require("../controllers/productController");

router.post("/createproduct", createProduct);
router.put("/updateproduct/:id", updateProduct);

module.exports = router;