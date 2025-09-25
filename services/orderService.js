const { ddbDocClient } = require('../config/dynamoDB');
const { PutCommand, QueryCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { buildOrderItem } = require('../models/orderModel');

const ORDERS_TABLE = 'Orders';

const generateOrderId = () => `order_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

  const createOrder = async (orderData) => {
    console.log("createOrder called");

    // Parse address and items safely
    let address = {};
    let items = [];

    try {
      address = JSON.parse(orderData.notes.address);
    } catch (err) {
      console.error("Failed to parse address:", err);
    }

    try {
      items = JSON.parse(orderData.notes.items);
    } catch (err) {
      console.error("Failed to parse items:", err);
    }

    const createdItems = [];

    for (const product of items) {
      const orderItem = buildOrderItem({
        orderData: { ...orderData, notes: { ...orderData.notes, address } },
        product,
      });

      console.log("Inserting item:", orderItem.SK);

      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: ORDERS_TABLE,
            Item: orderItem,
            ConditionExpression:
              "attribute_not_exists(PK) AND attribute_not_exists(SK)",
          })
        );
        createdItems.push(orderItem);
      } catch (err) {
        console.error("Failed to insert item:", err);
      }
    }

    return createdItems; // array of inserted items
  };

const updateOrderPaymentStatus = async (orderId,productIds, updates) => {
  // console.log(productIds); 
  // if (!products || !products.length) {
  //   throw new Error("No products provided for update");
  // }

  // Map each product SK to an UpdateCommand promise
  // console.log(orderId,"eta hoi")
  const updatePromises = productIds?.map((sk) => {
    const params = {
      TableName: ORDERS_TABLE,
      Key: {
        PK: orderId,
        SK: sk,
      },
      UpdateExpression:
        "SET paymentStatus = :status, paymentMethod = :method, #statusAttr = :orderStatus, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#statusAttr": "status",
      },
      ExpressionAttributeValues: {
        ":status": updates.paymentStatus,
        ":method": updates.paymentMethod,
        ":orderStatus": updates.status,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    return ddbDocClient.send(new UpdateCommand(params));
  });

  // Run all updates in parallel
  const results = await Promise.all(updatePromises);

  // Extract updated attributes from results
  const updatedItems = results.map((res) => res.Attributes);

  return updatedItems; // array of updated items
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