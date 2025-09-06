const PRODUCT_TABLE = 'products';

module.exports = {
  tableName: PRODUCT_TABLE,
  schema: {
    productId: 'string',
    sellerId: 'string',
    categoryId: 'string',
    brand: 'string',
    attributes: { type: 'map', optional: true }, 
    specifications: { type: 'map', optional: true },
    productName: 'string',
    productDescription: 'string',
    price: 'number',
    currentPrice: 'number',
    stock: 'number',
    dimensions: { type: 'map', optional: true }, // { height, breadth, length, weight }
    addressId: 'string',
    imageUrls: 'list',
    likeCount: 'number',
    linkedItems: 'list',
    createdAt: 'string',
  }
};
