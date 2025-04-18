// routes/userActionRoutes.js
const express = require('express');
const router = express.Router();
const userActionController = require('../controllers/userActionController');

router.post('/', userActionController.addUserAction);
router.get('/', userActionController.getUserActions);
router.delete('/', userActionController.removeUserAction);

module.exports = router;