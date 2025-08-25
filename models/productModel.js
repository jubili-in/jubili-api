const PRODUCT_TABLE = 'products';

module.exports = {
  tableName: PRODUCT_TABLE,
  schema: {
    productId: 'string',
    sellerId: 'string',
    categoryId: 'string',
    brand: 'string',
    color: 'string',
    size: 'string',
    gender: 'string',
    material: 'string',
    productName: 'string',
    productDescription: 'string',
    price: 'number',
    discount: 'number',
    stock: 'number',
    height: 'number',
    width: 'number', 
    length: 'number',
    weight: 'number', 
    addressId: 'string',
    imageUrls: 'list',
    likeCount: 'number',
    linkedItems: 'list',
    createdAt: 'string',
  }
};
