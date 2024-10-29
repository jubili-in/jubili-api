const Product = require('../models/product.model');

//creating a product
const createProduct  = async (req, res) =>{
    const {productname, description, price, category, vendor} = req.query;

    try {
        const newProduct = new Product({productname, description, price, category, vendor})
        //saving new product in db
        await newProduct.save();

        return res.status(200).json({
            message: "success",
            product: newProduct,
        });
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            message: e.message,
        })
    }
}


// updating a product
const updateProduct = async (req, res) => {
    const { id } = req.params; // Assuming you are passing the product ID in the URL
    const updates = req.body; // Get the updated fields from the request body

    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            message: e.message,
        });
    }
}



module.exports = {createProduct, updateProduct}