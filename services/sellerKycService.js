//services/sellerKycService.js

const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient } = require('../config/dynamoDB');
const KYC_TABLE = 'sellerKycDetails';

const submitKYC = async (sellerId, kycData) => {
  try {
    const item = {
      sellerId,
      ...kycData,
      kycSubmittedAt: new Date().toISOString(),
    };

    console.log("Submitting item to DynamoDB:", item);

    await ddbDocClient.send(new PutCommand({
      TableName: KYC_TABLE,
      Item: item,
    }));

    return item;
  } catch (err) {
    console.error("Error in DynamoDB PutCommand:", err);
    throw err; // Don't call res.send() here!
  }
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