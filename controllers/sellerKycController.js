//File: controllers/sellerKycController.js

const { submitKYC, getKYC } = require('../services/sellerKycService');

const postKYC = async (req, res) => {
  try {
    const sellerId = req.seller.sellerId; // assuming auth middleware adds this
    const kycData = req.body;

    const result = await submitKYC(sellerId, kycData);
    res.status(200).json({ message: 'KYC submitted', data: result });
  } catch (err) {
    console.error('KYC Submission Error:', err);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
};

const getKYCInfo = async (req, res) => {
  try {
    const sellerId = req.seller.sellerId;
    const data = await getKYC(sellerId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC' });
  }
};

module.exports = {
  postKYC,
  getKYCInfo,
};
