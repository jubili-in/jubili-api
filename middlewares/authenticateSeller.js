// File: middlewares/authenticateSeller.js
const jwt = require('jsonwebtoken');

const authenticateSeller = (req, res, next) => {
    console.log("middleware called authenticateSeller");

    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get the token part after "Bearer"

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Unauthorized! No token provided.' });
    }
    console.log("token: ", token); // Log the token for debugging
    

    // Verify the token and extract sellerId
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Forbidden' });
        }
       if (decoded.seller?.sellerId === undefined) {
    console.error('sellerId not found in token:', decoded);
    return res.status(403).json({ error: 'Forbidden' });
}
req.seller = { sellerId: decoded.seller.sellerId };
console.log('Authenticated Seller:', req.seller);

        next();
    });
};

module.exports = {authenticateSeller};