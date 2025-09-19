//services/userService.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Users";

// Check if any user exists with matching email OR phone
const getUserByEmailOrPhone = async (email, phone) => {
  const expressionValues = {};
  const filters = [];

  if (email) {
    filters.push("email = :email");
    expressionValues[":email"] = email;
  }

  if (phone) {
    filters.push("phone = :phone");
    expressionValues[":phone"] = phone;
  }

  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: filters.join(" OR "),
    ExpressionAttributeValues: expressionValues,
  });

  const response = await ddb.send(command);
  return response.Items;
};

const createUser = async (userData) => {
  const userId = uuidv4();
  const item = {
    userId,
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await ddb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  return item;
};

// Create user from Google OAuth data
const createGoogleUser = async (googleUserData) => {
  const userId = uuidv4();
  const item = {
    userId,
    name: googleUserData.name,
    email: googleUserData.email,
    googleId: googleUserData.googleId,
    picture: googleUserData.picture,
    authProvider: 'google',
    isEmailVerified: true, // Google emails are pre-verified
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await ddb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  return item;
};

module.exports = { getUserByEmailOrPhone, createUser, createGoogleUser };
