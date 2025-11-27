const cartHandler = require('../webhooks/cartHandler');
const orderHandler = require('../webhooks/orderHandler');

async function testBookingFeatures() {
  console.log('Testing booking features...');
  
  // Mock tenant configuration for testing
  const mockTenantConfig = {
    brand: {
      name: "Test Resort"
    },
    timings: {
      cartReminder1Minutes: 1,
      cartReminder2Hours: 1,
      postPurchaseReviewDays: 1
    },
    productApi: {
      enabled: true,
      url: 'http://localhost:3001/api/products',
      authType: 'none',
      refreshInterval: 1
    }
  };
  
  // Test data for booking events
  const mockCartData = {
    customerPhone: "+1234567890",
    cartItems: [
      {
        id: 1,
        name: "Deluxe Ocean Suite",
        price: 399.99
      },
      {
        id: 3,
        name: "Spa Treatment Package",
        price: 179.99
      }
    ]
  };
  
  const mockOrderData = {
    customerPhone: "+1234567890",
    orderDetails: {
      orderId: "ORD-2023-001",
      totalAmount: "$579.98",
      estimatedDelivery: "2023-12-25",
      items: [
        {
          id: 1,
          name: "Deluxe Ocean Suite"
        }
      ]
    }
  };
  
  try {
    console.log('\nTesting cart started event...');
    await cartHandler.handleCartStarted(mockCartData, mockTenantConfig);
    console.log('Cart started event handled successfully');
    
    console.log('\nTesting cart abandoned event...');
    await cartHandler.handleCartAbandoned(mockCartData, mockTenantConfig);
    console.log('Cart abandoned event handled successfully');
    
    console.log('\nTesting order placed event...');
    await orderHandler.handleOrderPlaced(mockOrderData, mockTenantConfig);
    console.log('Order placed event handled successfully');
    
    console.log('\nTesting order delivered event...');
    await orderHandler.handleOrderDelivered(mockOrderData, mockTenantConfig);
    console.log('Order delivered event handled successfully');
    
  } catch (error) {
    console.error('Error testing booking features:', error.message);
  }
}

testBookingFeatures();