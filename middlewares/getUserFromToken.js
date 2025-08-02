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
          if (decoded?.user?.id) {
            req.user = {
              userId: decoded.user.id
            };
          }
          console.log('Decoded user:', decoded); // Debug log
        } catch (err) {
          // If token is invalid, continue without user data
          console.log('Invalid token:', err.message);
        }
      }
    }
    console.log('Final req.user:', req.user); // Debug log
    next();
  } catch (error) {
    // If any error occurs, continue without user data
    console.log('Error in getUserFromToken:', error.message);
    next();
  }
};

module.exports = { getUserFromToken };
