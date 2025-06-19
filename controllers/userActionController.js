// controllers/userActionController.js
const userActionService = require('../services/userActionService');

exports.addUserAction = async (req, res) => {
  try {
    const { userId, productId, actionType, quantity } = req.body;
    const result = await userActionService.addUserAction({ userId, productId, quantity, actionType });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserActions = async (req, res) => {
  try {
    const { userId, actionType } = req.query;
    
    const result = await userActionService.getUserActions({userId, actionType});
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeUserAction = async (req, res) => {
  try {
    const { userId, productId, actionType } = req.body;
    const result = await userActionService.removeUserAction({ userId, productId, actionType });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, productCategory } = req.body;

    if (!productId || !productCategory) {
      return res.status(400).json({ message: 'Missing productId or productCategory' });
    }

    const result = await userActionService.handleToggleLike(userId, productId, productCategory);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error handling like toggle:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getCart = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Get complete cart data from service
    const cartData = await userActionService.getCartWithProducts(userId);
    res.status(200).json(cartData);
    
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to retrieve cart data' 
    });
  }
};