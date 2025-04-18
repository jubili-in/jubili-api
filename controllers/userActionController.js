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
