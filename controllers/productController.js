const Product = require('../models/product.model');
const Vendor = require('../models/vendor.model');

//creating a product
const createProduct  = async (req, res) =>{
    const {productname, description, price, category, vendor} = req.query;

    try {
        const newProduct = new Product({productname, description, price, category, vendor})
        //saving new product in db
        await newProduct.save();
        //updates vendor
        await Vendor.findByIdAndUpdate(vendor, {
            $push: { products: newProduct._id }
        });

        return res.status(200).json({
            message: "success",
            product: newProduct,
        });
    } catch (e) {
         
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
         
        return res.status(400).json({
            message: e.message,
        });
    }
}

const deleteProduct = async (req, res) => {
    const { id } = req.params; // Product ID from URL
    const vendorIdFromToken = req.vendorId; // Vendor ID extracted from the token

    try {
        // Find the product to delete
        const productToDelete = await Product.findById(id);

        if (!productToDelete) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Validate vendor ID from token with vendor ID from product
        if (productToDelete.vendor.toString() !== vendorIdFromToken) {
            return res.status(403).json({ message: "Access denied. You can only delete your own products." });
        }

        // Delete the product
        await Product.findByIdAndDelete(id);

        // Remove the product from the vendor's products list
        await Vendor.findByIdAndUpdate(vendorIdFromToken, { $pull: { products: id } });

        return res.status(200).json({ message: "Product deleted successfully" });
    } catch (e) {
         
        return res.status(400).json({ message: e.message });
    }
};

const searchProducts = async (req, res) => {
    const { productname, categories, minPrice, maxPrice, minRating, sortBy, page = 1, limit = 10 } = req.query;

    // Build a dynamic filter object
    let filter = {};

    if (productname) {
        filter.productname = { $regex: productname, $options: "i" }; // Case-insensitive regex search
    }

    if (categories) {
        // Assuming categories is a comma-separated string (e.g., "electronics,books")
        filter.category = { $in: categories.split(",") };
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (minRating) {
        // Filter products by minimum average rating
        filter["ratings.rating"] = { $gte: parseFloat(minRating) };
    }

    // Set up sorting based on query parameter
    let sortOptions = {};
    if (sortBy === "priceLowToHigh") {
        sortOptions.price = 1;
    } else if (sortBy === "priceHighToLow") {
        sortOptions.price = -1;
    } else if (sortBy === "newest") {
        sortOptions.createdAt = -1;
    } else {
        // Default to relevance or another criteria if necessary
        sortOptions.relevance = -1;
    }

    // Pagination
    const skip = (page - 1) * limit;

    try {
        // Query with filters, sorting, and pagination
        const products = await Product.find(filter).populate("vendor", "name")
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // changing the format of the response obj
        const transformedProducts = products.map(product => { 
            // deserializing the product object to remove catagories and make the image array to send only the first image
            const {images, category, tags, ...rest} = product.toObject(); 
            return { 
                ...rest, 
                image: images[0] ? images[0] : null
            }

        }); 


        // Optionally, you could count the total results for pagination metadata
        const totalResults = await Product.countDocuments(filter);

        return res.status(200).json({
            message: "Search results",
            products: transformedProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResults / limit),
                totalResults,
            },
        });
    } catch (e) {
         
        return res.status(400).json({
            message: e.message,
        });
    }
};


const productById = async(req, res) => { 
    const {id }= req.params; 
    try{ 
        const product = await Product.findById(id).populate({ 
            path: 'vendor',
            select: 'name email phone products', 
            populate: { 
                path: 'products',
                select: 'productname decrption price stock images'
            }
        })
        if(!product){ 
            return res.status(404).json({message: "Product Not Found"}); 
        }




        // if (product.vendor && product.vendor.products) {
        //     product.vendor.products = product.vendor.products.map(prod => { 
        //         const {images, ...rest} = prod.toObject();
        //         return { 
        //             ...rest, 
        //             image: images[0] ? images[0] : null
        //         } 
        //     }); 
        // }

        return res.status(200).json({message: "Product", data: product}); 
    }catch(e){ 
        return res.status(500).json({message: e.message}); 
    }
}

// Fetch products by seller ID
const getProductsBySeller = async (req, res) => {
    const vendorId = req.headers['vendor-id']; // Extract vendor ID from headers

    if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required in headers" });
    }

    try {
        const products = await Product.find({ vendor: vendorId });

        if (!products.length) {
            return res.status(404).json({ message: "No products found for this vendor" });
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            products,
        });
    } catch (e) {
        return res.status(400).json({
            message: e.message,
        });
    }
};
// related items => 

module.exports = {createProduct, updateProduct, deleteProduct, searchProducts, getProductsBySeller, productById}