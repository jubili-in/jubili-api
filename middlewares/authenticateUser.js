// File: middlewares/authenticateUser.js
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get the token part after "Bearer"

    if (!token) {
       return res.status(401).json({ error: 'Unauthorized! No token provided.' });
    }
    
    // Verify the token and extract sellerId
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.userId = decoded.user["id"]; // Assuming sellerId is in the token
        // console.log('Authenticated User:', req.userId); // Log the seller object
        next();
    });
};

module.exports = {authenticateUser};