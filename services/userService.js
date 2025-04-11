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

const getUserByEmail = async (email) => {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email
    }
  });

  const response = await ddb.send(command);
  return response.Items[0]; // Assuming emails are unique
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

module.exports = { getUserByEmail, createUser };
