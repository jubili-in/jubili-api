//File: services/userActionService.js
const { ddbDocClient } = require('../config/dynamoDB');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand ,BatchGetCommand,ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generatePresignedUrl } = require('./s3/productImageService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'userActions';
const USER_LIKE_TABLE = 'userLikedProducts';
const PRODUCT_TABLE = 'products';
const SELLER_TABLE = 'sellers';

// Platform charge constants
const PLATFORM_CHARGE_PER_PRODUCT = 12; // ₹12 per product
const GST_RATE = 0.18; // 18% GST
const PLATFORM_CHARGE_WITH_GST = PLATFORM_CHARGE_PER_PRODUCT * (1 + GST_RATE); // ₹14.16 per product

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
  
const handleToggleLike = async (userId, productId) => {
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
      Key: { productId },
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
      Key: { productId },
      UpdateExpression: 'ADD likeCount :inc',
      ExpressionAttributeValues: { ':inc': 1 }
    }));

    return { message: 'Liked the product' };
  }
};

/**
 * Get the user's cart with product details, flat delivery charges and platform charges.
 */
const getCartWithProducts = async (userId) => {
  try {
    const cartItems = await getUserActions({ userId, actionType: 'CART' });
    if (!cartItems.length) {
      return { 
        items: [], 
        totalOriginalPrice: 0,
        totalCurrentPrice: 0,
        totalDeliveryCharges: 0,
        totalPlatformCharges: 0,
        subtotal: 0,
        finalTotal: 0,
        message: "Cart is empty"
      };
    }

    // Get all product IDs from cart
    const productIds = cartItems.map(item => item.productId);

    // Find all products in cart
    const { Items: products = [] } = await ddbDocClient.send(new ScanCommand({
      TableName: PRODUCT_TABLE,
      FilterExpression: 'contains(:productIds, productId)',
      ExpressionAttributeValues: {
        ':productIds': productIds
      }
    }));

    // Get seller information
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

    // Process cart items and calculate totals
    let totalOriginalPrice = 0;
    let totalCurrentPrice = 0;
    let totalPlatformCharges = 0;
    const items = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.productId === cartItem.productId);
      if (!product) continue;

      const seller = sellers.find(s => s.sellerId === product.sellerId);
      const quantity = Number(cartItem.quantity) || 1;
      const originalPrice = Number(product.price) || 0;
      const currentPrice = Number(product.currentPrice) || 0;

      // Calculate item totals
      const itemOriginalPrice = originalPrice * quantity;
      const itemCurrentPrice = currentPrice * quantity;

      // Flat delivery charge of ₹49 per item
      const delCharges = 45;

      // Platform charges per item (₹14.16 per product including GST)
      const platformCharges = PLATFORM_CHARGE_WITH_GST * quantity;

      // Update cart totals
      totalOriginalPrice += itemOriginalPrice;
      totalCurrentPrice += itemCurrentPrice;
      totalPlatformCharges += platformCharges;

      // Generate image URL
      let imageUrl = null;
      if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
        imageUrl = await generatePresignedUrl(product.imageUrls[0]);
      } else if (typeof product.imageUrls === 'string' && product.imageUrls) {
        imageUrl = await generatePresignedUrl(product.imageUrls);
      }

      // conNPM 
      items.push({
        productId: product.productId,
        addressId: product.addressId,
        productName: product.productName,
        imageUrl,
        // addid
        dimensions: product.dimensions,
        brand: product.brand,
        sellerId: product.sellerId,
        sellerName: seller?.sellerName,
        price: originalPrice,          // Original price per unit
        currentPrice: currentPrice,    // Current price per unit
        quantity,
        totalCurrentPrice: itemCurrentPrice,  // Total current price for this item
        deliveryCharges: delCharges * quantity,              // Delivery charges for this item
        // deliveryCharges: function(pincode user + pincode seller + weight),              // Delivery charges for this item
        platformCharges,               // Platform charges for this item
        category: product.categoryId,
        description: product.productDescription, 
      });
    }

    // Calculate total delivery charges (₹49 per item)
    const totalDeliveryCharges = (items.length * 45); //for the user

    // Calculate final totals
    const subtotal = totalCurrentPrice;
    const finalTotal = subtotal + totalDeliveryCharges + totalPlatformCharges;

    return {
      totalItems: items.length,
      items,
      totalOriginalPrice: parseFloat(totalOriginalPrice.toFixed(2)),
      totalCurrentPrice: parseFloat(totalCurrentPrice.toFixed(2)),
      totalDeliveryCharges: parseFloat(totalDeliveryCharges.toFixed(2)),
      totalPlatformCharges: parseFloat(totalPlatformCharges.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      message: "Cart retrieved successfully"
    };

  } catch (error) {
    console.error('Cart service error:', error);
    throw error;
  }
};

/**
 * Get liked products of a user with product details and presigned image URL.
 */
async function getLikedProducts(userId) {
  // 1. Get liked product IDs
  const likedResult = await ddbDocClient.send(new QueryCommand({
    TableName: USER_LIKE_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  const likedItems = likedResult.Items || [];
  if (!likedItems.length) return [];

  // 2. Remove duplicate productIds
  const productIdSet = new Set(likedItems.map(item => item.productId));
  const productIds = Array.from(productIdSet);

  // 3. Fetch product details using Scan (since we only have productId)
  let products = [];
  if (productIds.length > 0) {
    // DynamoDB Scan with FilterExpression for productIds
    const scanResult = await ddbDocClient.send(new ScanCommand({
      TableName: PRODUCT_TABLE,
      FilterExpression: 'contains(:productIds, productId)',
      ExpressionAttributeValues: {
        ':productIds': productIds
      }
    }));
    products = scanResult.Items || [];
  }

  // 4. Map and generate presigned URL for first image
  const result = [];
  for (const product of products) {
    let imageUrl = null;
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      imageUrl = await generatePresignedUrl(product.imageUrls[0]);
    } else if (typeof product.imageUrls === 'string' && product.imageUrls) {
      imageUrl = await generatePresignedUrl(product.imageUrls);
    }
    result.push({
      productId: product.productId,
      productName: product.productName,
      productDescription: product.productDescription,
      productCategory: product.productCategory, // Add productCategory
      imageUrl
    });
  }
  return result;
}

module.exports = {
    addUserAction: saveUserAction,
    getUserActions: getUserActions,
    removeUserAction: deleteUserAction,
    handleToggleLike: handleToggleLike,
    getCartWithProducts,
    getLikedProducts
};