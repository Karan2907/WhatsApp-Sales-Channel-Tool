/**
 * Main application file for WhatsApp Sales Channel Tool for Resort Owners
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Import handlers
const cartHandler = require('./webhooks/cartHandler');
const orderHandler = require('./webhooks/orderHandler');
const whatsappClient = require('./api/whatsappClient');

// Load configuration
const configPath = path.join(__dirname, './config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load accommodation data
const accommodationsPath = path.join(__dirname, './config/products.json');
const accommodations = JSON.parse(fs.readFileSync(accommodationsPath, 'utf8'));

/**
 * Simulate receiving a webhook event
 * @param {string} eventType - Type of event
 * @param {Object} eventData - Event data
 */
function simulateWebhookEvent(eventType, eventData) {
  console.log(`Simulating ${eventType} webhook event`);
  
  switch (eventType) {
    case config.webhook.cartStartedEvent:
      cartHandler.handleCartStarted(eventData);
      break;
    case config.webhook.cartAbandonedEvent:
      cartHandler.handleCartAbandoned(eventData);
      break;
    case config.webhook.orderPlacedEvent:
      orderHandler.handleOrderPlaced(eventData);
      break;
    case config.webhook.orderDeliveredEvent:
      orderHandler.handleOrderDelivered(eventData);
      break;
    default:
      console.warn(`Unknown event type: ${eventType}`);
  }
}

/**
 * Simulate a new WhatsApp conversation
 * @param {string} customerPhone - Guest's WhatsApp phone number
 */
function simulateNewConversation(customerPhone) {
  console.log(`Simulating new conversation with ${customerPhone}`);
  
  // Send welcome message
  whatsappClient.sendWelcomeMessage(customerPhone)
    .then(response => {
      console.log('Welcome message sent:', response);
    })
    .catch(error => {
      console.error('Failed to send welcome message:', error);
    });
}

/**
 * Simulate accommodation suggestion based on guest interest
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {string} category - Accommodation category of interest
 */
function simulateAccommodationSuggestion(customerPhone, category) {
  console.log(`Simulating accommodation suggestion for ${category} to ${customerPhone}`);
  
  // Filter accommodations by category
  const categoryAccommodations = accommodations.filter(accommodation => accommodation.category === category);
  
  // Send accommodation suggestions
  whatsappClient.sendAccommodationSuggestions(customerPhone, category, categoryAccommodations)
    .then(response => {
      console.log('Accommodation suggestions sent:', response);
    })
    .catch(error => {
      console.error('Failed to send accommodation suggestions:', error);
    });
}

/**
 * Initialize the application
 */
function init() {
  console.log('WhatsApp Sales Channel Tool for Resort Owners initialized');
  
  // Validate configuration
  if (!whatsappClient.validateConfig()) {
    console.warn('WhatsApp configuration is incomplete. Please update config.json');
  }
  
  // Demonstrate functionality
  demonstrateFlows();
}

/**
 * Demonstrate the core flows
 */
function demonstrateFlows() {
  console.log('\n--- Demonstrating Core Flows ---\n');
  
  // Simulate new conversation
  simulateNewConversation('+1234567890');
  
  // Simulate accommodation suggestion
  setTimeout(() => {
    simulateAccommodationSuggestion('+1234567890', 'accommodation');
  }, 2000);
  
  // Simulate booking started event
  setTimeout(() => {
    simulateWebhookEvent(config.webhook.cartStartedEvent, {
      customerPhone: '+1234567890',
      cartItems: [
        { id: 1, name: 'Ocean View Suite', price: 299.99 },
        { id: 3, name: 'Presidential Suite', price: 499.99 }
      ],
      cartUrl: 'https://yourresort.com/booking/abc123'
    });
  }, 4000);
  
  // Simulate booking abandoned event
  setTimeout(() => {
    simulateWebhookEvent(config.webhook.cartAbandonedEvent, {
      customerPhone: '+1234567890',
      cartItems: [
        { id: 1, name: 'Ocean View Suite', price: 299.99 },
        { id: 3, name: 'Presidential Suite', price: 499.99 }
      ],
      cartUrl: 'https://yourresort.com/booking/abc123'
    });
  }, 6000);
  
  // Simulate reservation confirmed event
  setTimeout(() => {
    simulateWebhookEvent(config.webhook.orderPlacedEvent, {
      customerPhone: '+1234567890',
      orderDetails: {
        orderId: 'RESERVATION-12345',
        totalAmount: '$799.98',
        estimatedDelivery: 'Check-in: 2025-11-15',
        items: [
          { id: 1, name: 'Ocean View Suite', price: 299.99 },
          { id: 3, name: 'Presidential Suite', price: 499.99 }
        ]
      }
    });
  }, 8000);
  
  // Simulate guest checked in event
  setTimeout(() => {
    simulateWebhookEvent(config.webhook.orderDeliveredEvent, {
      customerPhone: '+1234567890',
      orderDetails: {
        orderId: 'RESERVATION-12345',
        items: [
          { id: 1, name: 'Ocean View Suite', price: 299.99 }
        ]
      }
    });
  }, 10000);
}

/**
 * Health check function
 * @returns {Object} Health status
 */
function healthCheck() {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    provider: config.whatsapp.provider || 'Not configured'
  };
}

// Export functions
module.exports = {
  simulateWebhookEvent,
  simulateNewConversation,
  simulateAccommodationSuggestion,
  init,
  healthCheck
};

// Run the application if this file is executed directly
if (require.main === module) {
  init();
}