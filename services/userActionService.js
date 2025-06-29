//File: services/userActionService.js
const { ddbDocClient } = require('../config/dynamoDB');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand ,BatchGetCommand,ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generatePresignedUrl } = require('./s3/productImageService');
const { v4: uuidv4 } = require('uuid');

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




/**
 * Get the user's cart with product details.
 */

const getCartWithProducts = async (userId) => {
  try {
    const cartItems = await getUserActions({ userId, actionType: 'CART' });
    if (!cartItems.length) {
      return { 
        items: [], 
        totalOriginalPrice: 0, 
        totalDiscount: 0, 
        subtotal: 0, 
        shippingCharge: 0, 
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
    let totalDiscount = 0;
    const items = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.productId === cartItem.productId);
      if (!product) continue;

      const seller = sellers.find(s => s.sellerId === product.sellerId);
      const quantity = Number(cartItem.quantity) || 1;
      const price = Number(product.price) || 0;
      
      // Calculate discount (use product discount or 0 if not set)
      const discountOnProduct = Number(product.discount) || 0;
      
      // Calculate per-unit discount and discounted price
      const discountAmountPerUnit = Number((price * discountOnProduct / 100).toFixed(2));
      const discountedPricePerUnit = Number((price - discountAmountPerUnit).toFixed(2));
      
      // Calculate totals for this item
      const itemOriginalPrice = price * quantity;
      const itemDiscount = discountAmountPerUnit * quantity;
      const itemDiscountedPrice = discountedPricePerUnit * quantity;

      // Update cart totals
      totalOriginalPrice += itemOriginalPrice;
      totalDiscount += itemDiscount;

      // Generate image URL
      let imageUrl = null;
      if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
        imageUrl = await generatePresignedUrl(product.imageUrls[0]);
      } else if (typeof product.imageUrls === 'string' && product.imageUrls) {
        imageUrl = await generatePresignedUrl(product.imageUrls);
      }

      items.push({
        productId: product.productId,
        productName: product.productName,
        imageUrl,
        color: product.color,
        size: product.size,
        gender: product.gender,
        material: product.material,
        brand: product.brand,
        sellerId: product.sellerId,
        sellerName: seller?.sellerName,
        price,
        discountOnProduct,
        discountAmount: discountAmountPerUnit,
        quantity,
        // discountedPrice: discountedPricePerUnit, // This is per unit price
        totalDiscountedPrice: itemDiscountedPrice, // Added total for the quantity
        productCategory: product.productCategory,
        description: product.description
      });
    }

    // Calculate final totals
    const subtotal = totalOriginalPrice - totalDiscount;
    const shippingCharge = subtotal < 2399 && subtotal > 0 ? 49 : 0;
    const finalTotal = subtotal + shippingCharge;

    return {
      totalItems: items.length,
      items,
      totalOriginalPrice: parseFloat(totalOriginalPrice.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingCharge,
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
      productDescription: product.description,
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
    getCartWithProducts: getCartWithProducts,
    getLikedProducts
};