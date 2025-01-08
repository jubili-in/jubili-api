const jwt = require('jsonwebtoken');
require("dotenv").config();


const vendorAuth = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if the token's type is "vendor"
        if (decoded.type !== "vendor") {
            return res.status(403).json({ message: "Access restricted to vendors only" });
        }

        // Allow access
        req.user = decoded.user;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(" ")[1]; // Assuming token is sent as "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        // Verify the token and extract payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.vendorId = decoded.user.id; // Store the vendor ID in req for access in deleteProduct
        next();
    } catch (e) {
        return res.status(400).json({ message: "Invalid token" });
    }
};


module.exports = {vendorAuth, authMiddleware};