const jwt = require('jsonwebtoken');

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
