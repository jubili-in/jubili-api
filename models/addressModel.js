const ADDRESS_TABLE = 'Addresses'; 


module.exports = {
  tableName: ADDRESS_TABLE,
  schema: {
    addressId: 'string',
    ownerId: 'string',
    addressLine1: 'string',
    addressLine2: 'string',
    addressType: 'string',
    altPhoneNumber: 'string',
    city: 'string',
    state: 'string',
    country: 'string',
    postalCode: 'string',
    latitude: 'number',
    longitude: 'number',
    isDefault: 'boolean',
    createdAt: 'string',
    updatedAt: 'string',
  }
};
