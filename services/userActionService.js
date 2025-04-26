//File: services/userActionService.js

const { ddbDocClient } = require('../config/dynamoDB');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = 'userActions';
const USER_LIKE_TABLE = 'userLikedProducts';
const PRODUCT_TABLE = 'products';

/**
 * Save a user action (e.g., add to cart, favorite).
 */
const saveUserAction = async ({ userId, actionType, productId, quantity, payload }) => {
  const SK = `${actionType}#${productId}`;
  const item = {
    userId,
    SK,
    actionType,
    productId,
    quantity,
    payload,
    createdAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await ddbDocClient.send(command);
  return item;
};

/**
 * Get all actions of a user, optionally filtered by actionType.
 */
const getUserActions = async ({ userId, actionType }) => {    
    if (!userId) {
      throw new Error("Missing userId");
    }
  
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId,
      },
    };
  
    if (actionType) {
      params.KeyConditionExpression += ' AND begins_with(SK, :sk)'; 
      params.ExpressionAttributeValues[':sk'] = `${actionType}#`;
    }
  
    const command = new QueryCommand(params);
    const result = await ddbDocClient.send(command);
    return result.Items || [];
  };
  

/**
 * Delete a specific user action (by userId and productId + actionType).
 */
const deleteUserAction = async ({ userId, actionType, productId }) => {
    const SK = `${actionType}#${productId}`;
  
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        SK,
      },
      ReturnValues: 'ALL_OLD', // Returns the item that was deleted, or nothing if not found
    });
  
    const result = await ddbDocClient.send(command);
  
    if (!result.Attributes) {
      throw new Error('Item not found or already deleted');
    }
  
    // return { success: true, deletedItem: result.Attributes };
    return { success: true};
};
  
const handleToggleLike = async (userId, productId, productCategory) => {
  // Check if user already liked
  const existingLike = await ddbDocClient.send(new GetCommand({
    TableName: USER_LIKE_TABLE,
    Key: { userId, productId }
  }));

  if (existingLike.Item) {
    // User already liked -> REMOVE LIKE
    await ddbDocClient.send(new DeleteCommand({
      TableName: USER_LIKE_TABLE,
      Key: { userId, productId }
    }));

    await ddbDocClient.send(new UpdateCommand({
      TableName: PRODUCT_TABLE,
      Key: { productId, productCategory },
      UpdateExpression: 'ADD likeCount :dec',
      ExpressionAttributeValues: { ':dec': -1 }
    }));

    return { message: 'Unliked the product' };

  } else {
    // User has NOT liked -> ADD LIKE
    await ddbDocClient.send(new PutCommand({
      TableName: USER_LIKE_TABLE,
      Item: { userId, productId }
    }));

    await ddbDocClient.send(new UpdateCommand({
      TableName: PRODUCT_TABLE,
      Key: { productId, productCategory },
      UpdateExpression: 'ADD likeCount :inc',
      ExpressionAttributeValues: { ':inc': 1 }
    }));

    return { message: 'Liked the product' };
  }
};

module.exports = {
    addUserAction: saveUserAction,
    getUserActions: getUserActions,
    removeUserAction: deleteUserAction,
    handleToggleLike: handleToggleLike,
};