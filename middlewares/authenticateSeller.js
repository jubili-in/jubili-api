// File: middlewares/authenticateSeller.js
const jwt = require('jsonwebtoken');

const authenticateSeller = (req, res, next) => {
    console.log("middleware called authenticateSeller");

    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get the token part after "Bearer"

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log("token: ", token); // Log the token for debugging
    

    // Verify the token and extract sellerId
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.seller = { sellerId: decoded.sellerId }; // Assuming sellerId is in the token
        console.log('Authenticated Seller:', req.seller); // Log the seller object
        next();
    });
};

module.exports = {authenticateSeller};