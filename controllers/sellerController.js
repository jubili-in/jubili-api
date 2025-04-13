//File: controllers/sellerController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createSeller, getSellerByEmail } = require('../services/sellerService');

const signupSeller = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    const existing = await getSellerByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const seller = await createSeller({ email, passwordHash, phone });
    res.status(201).json({ seller });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
 
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await getSellerByEmail(email);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const isMatch = await bcrypt.compare(password, seller.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ sellerId: seller.sellerId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, seller });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signupSeller, loginSeller };