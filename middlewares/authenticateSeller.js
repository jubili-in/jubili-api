// File: middleware/authenticateSeller.js

const jwt = require('jsonwebtoken');

const authenticateSeller = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'seller') {
      return res.status(403).json({ error: 'Access denied. Invalid role.' , message: 'Role: ' + decoded.role});
    }

    req.seller = {
      sellerId: decoded.sellerId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticateSeller;