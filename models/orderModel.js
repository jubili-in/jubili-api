const { v4: uuidv4 } = require('uuid');

function generateOrderId() {
    return `oid_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

function buildOrderItem({ 
    orderData,
    product, 
    quantity, 
    address,
    paymentMode = 'Prepaid',
    transportMode = 'Surface',
    pickupLocation,
    customerEmail,
    deliveryTotal = 0,      // total delivery charge
    deliveryUserPayable = 0,
    deliverySellerPayable = 0,
    serviceCharge = 0
}) {
    const orderId = orderData.orderId; 
    const currentTime = new Date().toISOString();

    const price = parseFloat(product.price);
    // const gst = parseFloat(product.gst || 0);

    // const subTotal = price * quantity;
    // const gstAmount = subTotal * (gst / 100);

    // Total amount user pays = product + GST + user portion of delivery
    // const totalAmount = subTotal + gstAmount + deliveryUserPayable;

    // Seller profit = product amount - seller portion of delivery - service charge
    const sellerProfitValue = subTotal - deliverySellerPayable - serviceCharge;

    return {
    PK: `ORDER#${orderId}`, //done
    SK: `ORDER#${orderId}`, //done // product id

    orderId, //done
    orderNumber: `SO${orderId}`, // SaleOrderNumber //done
    transactionId: orderData.transactionId || null, //done
    userId: orderData.userId || null, // done

    customerName: address.name || '',
    customerEmail: customerEmail || '',
    customerPhone: address.phone || '',

    pickupLocation,
    transportMode, //done
    paymentMode, //done
    codAmount: 0,

    sellerId: product.sellerId,
    sellerName: product.sellerName || '',
    sellerGSTNumber: product.sellerGST || '',

    sellerAddressLine1: product.sellerAddressLine1 || '',
    sellerAddressLine2: product.sellerAddressLine2 || '',
    sellerCity: product.sellerCity || '',
    sellerState: product.sellerState || '',
    sellerPincode: product.sellerPincode || '',
    
    productId: product.productId,
    productName: product.name,
    quantity,
    packagingType: product.packagingType || 'Box',
    fragile: product.fragile || false,
    
    // price,
    unitItemPrice: parseFloat(price.toFixed(2)),
    subTotal,
    gstAmount,
    totalAmount: orderData.totalAmount || parseFloat(totalAmount.toFixed(2)), //done
    quantityOrdered: quantity,

    discountType: null,
    discountValue: null,
    taxClass: null,

    shippingAddressLine1: address.line1 || '', //user address
    shippingAddressLine2: address.line2 || '',
    shippingCity: address.city || '',
    shippingState: address.state || '',
    shippingPincode: address.pincode || '',

    LengthCm: product.lengthCm || 0,
    BreadthCm: product.breadthCm || 0,
    HeightCm: product.heightCm || 0,
    WeightGm: product.weightGm || 0,

    billingAddressSameAsShipping: true,

    status: 'pending',
    paymentStatus: 'unpaid',

    shippingProvider: 'Delhivery',
    shippingAwb: null,
    shippingTrackingUrl: null,
    shippingStatus: 'pending',
    shippingWeight: product.dimensions?.weight || product.weight || 0.5,

    deliveryTotal,
    deliveryUserPayable,
    deliverySellerPayable,
    serviceCharge,
    sellerProfitValue,

    ItemSkuCode: "SKU1001",             // mandatory, maps to productId
    ItemSkuName: "Blue T-Shirt",   

    createdAt: currentTime,
    updatedAt: currentTime,
    isActive: true,
    version: 1,
};
}

module.exports = { 
    buildOrderItem,
    generateOrderId
};
