const express = require('express');
const { getUserFromToken } = require('../middlewares/getUserFromToken');
const router = express.Router();

router.get('/', getUserFromToken, (req, res) => {
  const response = {
    success: true,
    message: "Authentication data retrieved successfully",
    userType: req.userType || 'unauthenticated',
    user: req.user || null,
    seller: req.seller || null,
  };

  // Add specific success message based on user type
  if (req.userType === 'seller') {
    response.message = "Seller authenticated successfully";
  } else if (req.userType === 'user') {
    response.message = "User authenticated successfully";
  } else {
    response.message = "No authentication found";
  }

  res.json(response);
});

module.exports = router;