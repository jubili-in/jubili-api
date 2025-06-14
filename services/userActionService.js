//File: services/userActionService.js
const { ddbDocClient } = require('../config/dynamoDB');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand ,BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const productImageService = require('./s3/productImageService');

const TABLE_NAME = 'userActions';
const USER_LIKE_TABLE = 'userLikedProducts';
const PRODUCT_TABLE = 'products';
const SELLER_TABLE = 'sellers';

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





const getCartWithProducts = async (userId) => {
  try {
    // 1. Get cart items
    const cartItems = await getUserActions({ userId, actionType: 'CART' });
    if (!cartItems.length) {
      return { items: [], price: 0, discount: 0, subtotal: 0, shippingCharge: 0, savingAmount: 0 };
    }

    // 2. Create unique product keys map to avoid duplicates
    const productKeysMap = new Map();
    cartItems.forEach(item => {
      productKeysMap.set(item.productId, {
        productId: item.productId,
        productCategory: item.payload?.productCategory || 'Garments'
      });
    });

    const productKeys = Array.from(productKeysMap.values());

    // 3. Get product details (without duplicates)
    const { Responses } = await ddbDocClient.send(new BatchGetCommand({
      RequestItems: {
        [PRODUCT_TABLE]: {
          Keys: productKeys,
          ProjectionExpression: 'productId, productName, price, discount, imageUrls, color, size, sellerId'
        }
      }
    }));

    const products = Responses[PRODUCT_TABLE] || [];

    // 4. Get unique seller IDs
    const sellerIds = [...new Set(products.map(p => p.sellerId).filter(Boolean))];
    let sellers = [];

    if (sellerIds.length > 0) {
      const sellerResponse = await ddbDocClient.send(new BatchGetCommand({
        RequestItems: {
          [SELLER_TABLE]: {
            Keys: sellerIds.map(sellerId => ({ sellerId })),
            ProjectionExpression: 'sellerId, sellerName'
          }
        }
      }));
      sellers = sellerResponse.Responses[SELLER_TABLE] || [];
    }

    // 5. Build items array and calculate totals
    let priceTotal = 0;
    let discountTotal = 0;
    let items = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.productId === cartItem.productId);
      if (!product) continue;

      const seller = sellers.find(s => s.sellerId === product.sellerId);

      const quantity = Number(cartItem.quantity) || 1;
      const price = Number(product.price) || 0;
      // Use discount percent (default 5%)
      const discountOnProduct = (typeof product.discount === 'number' && product.discount > 0)
        ? product.discount
        : 5;
      const discountDecimal = discountOnProduct / 100;
      const discountAmount = Number((price * discountDecimal).toFixed(2)); // e.g., 29.95
      const discountedPrice = Number((price - discountAmount).toFixed(2)); // e.g., 569.05

      priceTotal += price * quantity;
      discountTotal += discountAmount * quantity;

      items.push({
        productId: product.productId,
        productName: product.productName,
        imageUrl: Array.isArray(product.imageUrls) ? product.imageUrls[0] : product.imageUrls,
        color: product.color,
        size: product.size,
        sellerId: product.sellerId,
        sellerName: seller ? seller.sellerName : undefined,
        price,
        discountOnProduct,   // e.g., 5 for 5%
        discountAmount,      // e.g., 29.95
        quantity,
        discountedPrice,     // e.g., 569.05
      });
    }

    const subtotal = priceTotal - discountTotal;
    const shippingCharge = subtotal < 2399 && subtotal > 0 ? 49 : 0; // Free shipping for orders above 2399

    return {
      items,
      price: parseFloat(priceTotal.toFixed(2)),
      discount: parseFloat(discountTotal.toFixed(2)),
      "shipping-charge": shippingCharge,
      subtotal: parseFloat((subtotal + shippingCharge).toFixed(2)),
    };

  } catch (error) {
    console.error('Cart service error:', error);
    throw error;
  }
};












module.exports = {
    addUserAction: saveUserAction,
    getUserActions: getUserActions,
    removeUserAction: deleteUserAction,
    handleToggleLike: handleToggleLike,
    getCartWithProducts: getCartWithProducts
};