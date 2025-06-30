const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand, QueryCommand,ScanCommand, GetCommand, UpdateCommand} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');


const ORDERS_TABLE = 'Orders';

const generateOrderId = () => `${uuidv4().replace(/-/g, '').substring(0, 16)}`;

const createOrder = async (orderData) => {
  const orderId = generateOrderId();
  const currentDate = new Date().toISOString();
  
  const subTotal = orderData.productPrice * orderData.quantity;
  const gstAmount = subTotal * (orderData.GST / 100);
  const totalAmount = subTotal + gstAmount + orderData.deliveryCharges + orderData.otherCharges;

  const orderItem = {
    PK: `ORDER#${orderId}`,
    SK: `ORDER#${orderId}`,
    orderId: orderId,
    transactionId: `txn_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
    userId: orderData.userId,
    sellerId: orderData.sellerId,
    productId: orderData.productId,
    productName: orderData.productName,
    quantity: orderData.quantity,
    productPrice: orderData.productPrice,
    GST: orderData.GST,
    deliveryCharges: orderData.deliveryCharges,
    otherCharges: orderData.otherCharges,
    subTotal: subTotal,
    gstAmount: gstAmount,
    totalAmount: totalAmount,
    address: orderData.address,
    trackingUrl: `https://www.edens.in/track/${orderId}`,
    status: 'pending',
    createdAt: currentDate,
    updatedAt: currentDate,
    paymentStatus: 'unpaid',
    paymentMethod: null,
    isActive: true,
    version: 1
  };

  await ddbDocClient.send(new PutCommand({
    TableName: ORDERS_TABLE,
    Item: orderItem,
    ConditionExpression: 'attribute_not_exists(PK)'
  }));

  return orderItem;
};

const updateOrderPaymentStatus = async (orderId, updates) => {
  const params = {
    TableName: ORDERS_TABLE,
    Key: {
      PK: `ORDER#${orderId}`,
      SK: `ORDER#${orderId}`,
    },
    UpdateExpression: "SET paymentStatus = :status, paymentMethod = :method, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":status": updates.paymentStatus,
      ":method": updates.paymentMethod,
      ":updatedAt": new Date().toISOString(),
    },
  };

  await ddbDocClient.send(new UpdateCommand(params));
};

















const getOrdersByUser = async (userId) => {
  try {
    try {
      const params = {
        TableName: 'Orders',
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`
        },
        ScanIndexForward: false, 
        Limit: 100
      };
      
      const data = await ddbDocClient.send(new QueryCommand(params));
      return data.Items || [];
    } catch (gsiError) {
      if (gsiError.name === 'ResourceNotFoundException' || gsiError.message.includes('specified index')) {
        const scanParams = {
          TableName: 'Orders',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          Limit: 100
        };
        
        const scanData = await ddbDocClient.send(new ScanCommand(scanParams));
        return scanData.Items || [];
      }
      throw gsiError;
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};



const getOrdersBySeller = async (sellerId) => {
  try {
    try {
      const params = {
        TableName: ORDERS_TABLE,
        IndexName: 'GSI2', 
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `SELLER#${sellerId}`
        },
        ScanIndexForward: false, 
        Limit: 100
      };
      
      const data = await ddbDocClient.send(new QueryCommand(params));
      return data.Items || [];
    } catch (gsiError) {
      if (gsiError.name === 'ResourceNotFoundException' || gsiError.message.includes('specified index')) {
        const scanParams = {
          TableName: ORDERS_TABLE,
          FilterExpression: 'sellerId = :sellerId',
          ExpressionAttributeValues: {
            ':sellerId': sellerId
          },
          Limit: 100
        };
        
        const scanData = await ddbDocClient.send(new ScanCommand(scanParams));
        return scanData.Items || [];
      }
      throw gsiError;
    }
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    throw error;
  }
};







const updateOrderStatus = async (cleanOrderId, sellerId, newStatus) => {
  try {
    const getOrderResult = await ddbDocClient.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId: cleanOrderId }
    }));

    if (!getOrderResult.Item) {
      throw new Error('Order not found');
    }

    if (getOrderResult.Item.sellerId !== sellerId) {
      throw new Error('Unauthorized: Seller does not own this order');
    }

    const updateParams = {
      TableName: ORDERS_TABLE,
      Key: { orderId: cleanOrderId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await ddbDocClient.send(new UpdateCommand(updateParams));
    return result.Attributes;
  } catch (error) {
    console.error('FULL ERROR DETAILS:', error);
    throw error;
  }
};



const cancelUserOrder = async (cleanOrderId, userId) => {
  // Fetch the order using orderId as the key (consistent with updateOrderStatus)
  const getOrderResult = await ddbDocClient.send(new GetCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId: cleanOrderId }
  }));

  const order = getOrderResult.Item;
  if (!order) throw new Error('Order not found');
  if (order.userId !== userId) throw new Error('Unauthorized: User does not own this order');
  if (['shipped', 'delivered'].includes(order.status)) throw new Error('Cannot cancel: Order already shipped or delivered');

  // Update status to cancelled
  const updateParams = {
    TableName: ORDERS_TABLE,
    Key: { orderId: cleanOrderId },
    UpdateExpression: 'SET #status = :cancelled, updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':cancelled': 'cancelled',
      ':updatedAt': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await ddbDocClient.send(new UpdateCommand(updateParams));
  return result.Attributes;
};



module.exports = {
  createOrder,
  updateOrderPaymentStatus,
  getOrdersByUser,
  getOrdersBySeller,
  updateOrderStatus,
  cancelUserOrder
};