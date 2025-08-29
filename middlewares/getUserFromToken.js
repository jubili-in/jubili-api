const jwt = require('jsonwebtoken');

const getUserFromToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('Decoded token:', decoded); // Debug log

          // Check if it's a seller token (seller data directly in decoded)
          if (decoded?.seller?.sellerId) {
            req.seller = {
              sellerId: decoded.seller.sellerId,
              email: decoded.seller.email,
              isVerified: decoded.seller.isVerified,
              phone: decoded.seller.phone
            };
            req.userType = 'SELLER';
            console.log('Seller authenticated:', req.seller);
          }
          // Check if it's a user token (user data in decoded.user)
          else if (decoded?.user?.id) {
            req.user = {
              userId: decoded.user.id
            };
            req.userType = 'USER';
            console.log('User authenticated:', req.user);
          }
          // Check for seller data nested under user (legacy support)
          else if (decoded?.user?.seller?.sellerId) {
            req.seller = {
              sellerId: decoded.user.seller.sellerId
            };
            req.userType = 'seller';
            console.log('Legacy seller authenticated:', req.seller);
          }

          console.log('User type detected:', req.userType); // Debug log
        } catch (err) {
          console.log('Invalid token:', err.message);
        }
      }
    }
    console.log('Final req.user:', req.user); // Debug log
    console.log('Final req.seller:', req.seller); // Debug log
    next();
  } catch (error) {
    // If any error occurs, continue without user data
    console.log('Error in getUserFromToken:', error.message);
    next();
  }
};

module.exports = { getUserFromToken };
