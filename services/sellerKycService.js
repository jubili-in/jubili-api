//services/sellerKycService.js

const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient } = require('../config/dynamoDB');
const KYC_TABLE = 'seller_kyc';

const submitKYC = async (sellerId, kycData) => {
  const item = {
    sellerId,
    ...kycData,
    kycSubmittedAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName: KYC_TABLE,
    Item: item,
  }));

  return item;
};

const getKYC = async (sellerId) => {
  const result = await ddbDocClient.send(new GetCommand({
    TableName: KYC_TABLE,
    Key: { sellerId },
  }));

  return result.Item;
};

module.exports = {
  submitKYC,
  getKYC,
};  