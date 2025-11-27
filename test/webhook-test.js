/**
 * Test script for webhook functionality with dynamic product fetching
 */

const http = require('http');

// Test data
const testBookingStarted = {
  customerPhone: '+1234567890',
  cartItems: [
    {
      id: 1,
      name: 'Deluxe Ocean Suite',
      price: 399.99,
      quantity: 1
    }
  ]
};

const testReservationConfirmed = {
  customerPhone: '+1234567890',
  orderDetails: {
    orderId: 'RES-2025-001',
    totalAmount: '$399.99',
    estimatedDelivery: '2025-12-25',
    items: [
      {
        id: 1,
        name: 'Deluxe Ocean Suite',
        price: 399.99,
        quantity: 1
      }
    ]
  }
};

// Function to send webhook requests
function sendWebhook(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test booking started webhook
async function testBookingStartedWebhook() {
  console.log('Test 1: Sending booking started webhook...');
  
  try {
    const result = await sendWebhook('/webhook/booking-started', testBookingStarted);
    console.log('✓ Booking started webhook processed:', result.message);
    return true;
  } catch (error) {
    console.error('✗ Error sending booking started webhook:', error.message);
    return false;
  }
}

// Test booking abandoned webhook
async function testBookingAbandonedWebhook() {
  console.log('\nTest 2: Sending booking abandoned webhook...');
  
  try {
    const result = await sendWebhook('/webhook/booking-abandoned', testBookingStarted);
    console.log('✓ Booking abandoned webhook processed:', result.message);
    return true;
  } catch (error) {
    console.error('✗ Error sending booking abandoned webhook:', error.message);
    return false;
  }
}

// Test reservation confirmed webhook
async function testReservationConfirmedWebhook() {
  console.log('\nTest 3: Sending reservation confirmed webhook...');
  
  try {
    const result = await sendWebhook('/webhook/reservation-confirmed', testReservationConfirmed);
    console.log('✓ Reservation confirmed webhook processed:', result.message);
    return true;
  } catch (error) {
    console.error('✗ Error sending reservation confirmed webhook:', error.message);
    return false;
  }
}

// Test guest checked in webhook
async function testGuestCheckedInWebhook() {
  console.log('\nTest 4: Sending guest checked in webhook...');
  
  try {
    const result = await sendWebhook('/webhook/guest-checked-in', testReservationConfirmed);
    console.log('✓ Guest checked in webhook processed:', result.message);
    return true;
  } catch (error) {
    console.error('✗ Error sending guest checked in webhook:', error.message);
    return false;
  }
}

// Run all webhook tests
async function runWebhookTests() {
  console.log('Starting webhook tests with dynamic product fetching...\n');
  
  // Give the server a moment to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = [];
  results.push(await testBookingStartedWebhook());
  results.push(await testBookingAbandonedWebhook());
  results.push(await testReservationConfirmedWebhook());
  results.push(await testGuestCheckedInWebhook());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nWebhook Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✓ All webhook tests passed!');
  } else {
    console.log('✗ Some webhook tests failed');
  }
  
  // Give some time for async operations to complete
  setTimeout(() => {
    console.log('\nWebhook testing completed. Check server logs for product fetching details.');
  }, 5000);
}

// Run the tests
runWebhookTests();