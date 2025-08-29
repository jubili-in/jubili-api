// models/addressModel.js
const ADDRESS_TABLE = 'Addresses';

module.exports = {
  tableName: ADDRESS_TABLE,
  schema: {
    ownerId: 'string',      // Partition key - USER ID or SELLER ID
    addressId: 'string',    // Sort key - Unique address ID
    ownerType: 'string',    // 'USER' or 'SELLER'
    addressType: 'string',  // 'HOME', 'WORK', 'WAREHOUSE', etc.
    name: 'string',         // Name for this address
    phoneNumber: 'string',  // Primary phone number
    altPhoneNumber: 'string', // Alternative phone number
    addressLine1: 'string', // Required - Street address
    addressLine2: 'string', // Optional - Apartment, suite, etc.
    city: 'string',         // Required
    state: 'string',        // Required
    postalCode: 'string',   // Required
    country: 'string',      // Required
    latitude: 'number',     // Optional - GPS coordinates
    longitude: 'number',    // Optional - GPS coordinates
    isDefault: 'boolean',   // Whether this is the default address
    createdAt: 'string',    // ISO timestamp
    updatedAt: 'string',    // ISO timestamp
  },
  
  // GSI Configuration (for reference)
  gsi: {
    AddressIdIndex: {
      partitionKey: 'addressId',
      // No sort key needed for this GSI since addressId is unique
      projectionType: 'ALL'
    }
  },
  
  // Constants for address types
  addressTypes: {
    HOME: 'HOME',
    WORK: 'WORK',
    WAREHOUSE: 'WAREHOUSE',
    OTHER: 'OTHER'
  },
  
  // Constants for owner types
  ownerTypes: {
    USER: 'USER',
    SELLER: 'SELLER'
  }
};