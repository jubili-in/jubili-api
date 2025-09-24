const { v4: uuidv4 } = require('uuid');

function generateOrderId() {
    return `oid_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

function buildOrderItem({ 
    orderData,
    product, 
    paymentMode = 'Prepaid',
    transportMode = 'Surface',
}) {
    const orderId = orderData.order_id; 
    const currentTime = new Date().toISOString();

    const totalAmount = orderData.amount / 100;
    const sellerProfitValue = product.unitItemPrice * product.quantity - (product.deliveryBySeller || 0); 

    // const gst = parseFloat(product.gst || 0);

    // const subTotal = price * quantity;
    // const gstAmount = subTotal * (gst / 100);

    // Total amount user pays = product + GST + user portion of delivery
    // const totalAmount = subTotal + gstAmount + deliveryUserPayable;

    // Seller profit = product amount - seller portion of delivery - service charge


    return {
    PK: orderId,//ok
    SK: product.productId, //ok

    // orderId, //ok
    orderNumber: `SO${orderId}`, // SaleOrderNumber //ok
    transactionId: orderData.id || null, //ok
    userId: orderData.notes.userId || null, //ok

    customerName: orderData.notes.address.name, //ok
    customerEmail: orderData.email, //ok
    customerPhone: orderData.notes.address.phoneNumber, // ok

    pickupLocation: product.pickupLocation,  //ok
    transportMode, //ok
    paymentMode, //ok
    codAmount: 0, //ok

    sellerId: product.sellerId, // ok
    sellerName: product.sellerName || null, // ok
    sellerGSTNumber: product.sellerGST || null, //ok

    sellerAddressLine1: product.sellerAddressLine1 || '',
    sellerAddressLine2: product.sellerAddressLine2 || '',
    sellerCity: product.sellerCity || '',
    sellerState: product.sellerState || '',
    sellerPincode: product.sellerPincode || '',
    
    productId: product.productId, //ok
    productName: product.productName, //ok
    quantity: product.quantity, //ok
    packagingType: product.packagingType, //ok
    fragile: product.fragile, //ok
    
    // price,
    unitItemPrice: product.unitItemPrice, // ok
    // subTotal: ,
    gstAmount: null, // ok
    totalAmount: totalAmount, //ok
    quantityOrdered: product.quantity, //ok

    discountType: null, //ok
    discountValue: null, //ok
    taxClass: null, //ok


    shippingAddressLine1: orderData.notes.address.addressLine1, //user address //ok
    shippingAddressLine2: orderData.notes.address.addressLine2, //ok
    shippingCity: orderData.notes.address.city, //ok
    shippingState: orderData.notes.address.state, // ok
    shippingPincode: orderData.notes.address.postalCode, //ok

    LengthCm: product.prodcutDimention.length, //ok
    BreadthCm: product.prodcutDimention.breadth, //ok
    HeightCm: product.prodcutDimention.height, //ok
    WeightGm: product.prodcutDimention.weight, //ok

    billingAddressSameAsShipping: true, // ok

    status: 'pending', //ok
    paymentStatus: 'unpaid', //ok

    shippingProvider: 'Delhivery', //ok
    shippingAwb: null, //ok
    shippingTrackingUrl: null, //ok
    shippingStatus: 'pending', //ok
    shippingWeight: product.prodcutDimention.weight || '',  //ok

    // deliveryTotal: ,
    deliveryUserPayable: product.deliveryByUser, //ok 
    deliverySellerPayable: product.deliveryBySeller, // ok
    serviceCharge: product.serviceCharge || 10, //ok
    sellerProfitValue: sellerProfitValue, //ok

    ItemSkuCode: product.productId,    //ok       // mandatory, maps to productId
    ItemSkuName: product.productName, //ok

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
