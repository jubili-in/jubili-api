//File: controllers/sellerKycController.js

const { submitKYC, getKYC } = require('../services/sellerKycService');

const postKYC = async (req, res) => {
  try {
    const sellerId = req.seller.sellerId;
    const kycData = req.body;

    console.log(kycData); // Log sellerId and kycData for debugging
    
    const result = await submitKYC(sellerId, kycData);

    res.status(200).json({ message: 'KYC submitted successfully', data: result });
  } catch (error) { 
    console.error('KYC Submission Error:', error.message);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
};

const getKYCInfo = async (req, res) => {
  try {
    const sellerId = req.seller.sellerId;
    const data = await getKYC(sellerId);
    console.log(data);
    res.status(200).json(data);
  } catch (err) {
    console.log('Error fetching KYC:', err.message);
    res.status(500).json({ error: 'Failed to fetch KYC' });
  }
};

module.exports = {
  postKYC,
  getKYCInfo,
};
