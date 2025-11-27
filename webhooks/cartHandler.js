/**
 * Webhook handler for booking-related events for Resort Owners
 * Processes booking_started and booking_abandoned events
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Load product fetcher
const productFetcher = require('../api/productFetcher');

// Load accommodation data (fallback)
let accommodations = [];
const accommodationsPath = path.join(__dirname, '../config/products.json');
if (fs.existsSync(accommodationsPath)) {
  accommodations = JSON.parse(fs.readFileSync(accommodationsPath, 'utf8'));
}

/**
 * Handle booking started event
 * @param {Object} eventData - The booking started event data
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function handleCartStarted(eventData, tenantConfig = null) {
  console.log('Booking started event received:', eventData);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  // In a real implementation, you would:
  // 1. Store the booking information in a database
  // 2. Set up timers for abandonment reminders
  // 3. Associate the booking with the guest's WhatsApp number
  
  // For POC, we'll just log the event
  const customerPhone = eventData.customerPhone;
  const bookingItems = eventData.cartItems;
  
  console.log(`Booking started for ${customerPhone} with ${bookingItems.length} items`);
  
  // Set timeout for booking abandonment reminder
  setTimeout(async () => {
    await sendBookingReminder1(customerPhone, bookingItems, effectiveConfig);
  }, effectiveConfig.timings.cartReminder1Minutes * 60 * 1000); // Convert minutes to milliseconds
}

/**
 * Handle booking abandoned event
 * @param {Object} eventData - The booking abandoned event data
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function handleCartAbandoned(eventData, tenantConfig = null) {
  console.log('Booking abandoned event received:', eventData);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  const customerPhone = eventData.customerPhone;
  const bookingItems = eventData.cartItems;
  
  // Send first reminder immediately
  await sendBookingReminder1(customerPhone, bookingItems, effectiveConfig);
  
  // Schedule second reminder
  setTimeout(async () => {
    await sendBookingReminder2(customerPhone, bookingItems, effectiveConfig);
  }, effectiveConfig.timings.cartReminder2Hours * 60 * 60 * 1000); // Convert hours to milliseconds
}

/**
 * Send first booking reminder
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Array} bookingItems - Items in the booking
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function sendBookingReminder1(customerPhone, bookingItems, tenantConfig = null) {
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  // In a real implementation, this would call the WhatsApp API
  console.log(`Sending Booking Reminder 1 to ${customerPhone}`);
  
  // Get first item name for personalization
  const firstItemName = bookingItems.length > 0 ? bookingItems[0].name : "your accommodations";
  
  // Fetch current products to get updated information
  let currentProducts = accommodations;
  try {
    // Use tenant-specific product API config if available
    const productApiConfig = tenantConfig?.productApi || config.productApi;
    if (productApiConfig && productApiConfig.enabled && productApiConfig.url) {
      currentProducts = await productFetcher.fetchProductsFromWebsite(productApiConfig);
    } else {
      currentProducts = await productFetcher.getProducts();
    }
    console.log(`Using ${currentProducts.length} current products for recommendation`);
  } catch (error) {
    console.error('Error fetching current products, using fallback:', error.message);
  }
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "cart_reminder_1",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" }, // Would be personalized
            { type: "text", text: firstItemName },
            { type: "text", text: effectiveConfig.brand.name },
            { type: "text", text: "https://yourresort.com/booking" } // Would be actual booking URL
          ]
        }
      ]
    }
  };
  
  // Log the message that would be sent
  console.log("Booking Reminder 1 message:", JSON.stringify(messageData, null, 2));
  
  // In a real implementation:
  // sendWhatsAppMessage(messageData);
}

/**
 * Send second booking reminder
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Array} bookingItems - Items in the booking
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function sendBookingReminder2(customerPhone, bookingItems, tenantConfig = null) {
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  // In a real implementation, this would call the WhatsApp API
  console.log(`Sending Booking Reminder 2 to ${customerPhone}`);
  
  // Fetch current products to get updated information
  let currentProducts = accommodations;
  try {
    // Use tenant-specific product API config if available
    const productApiConfig = tenantConfig?.productApi || config.productApi;
    if (productApiConfig && productApiConfig.enabled && productApiConfig.url) {
      currentProducts = await productFetcher.fetchProductsFromWebsite(productApiConfig);
    } else {
      currentProducts = await productFetcher.getProducts();
    }
    console.log(`Using ${currentProducts.length} current products for recommendation`);
  } catch (error) {
    console.error('Error fetching current products, using fallback:', error.message);
  }
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "cart_reminder_2",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" }, // Would be personalized
            { type: "text", text: effectiveConfig.brand.name }
          ]
        }
      ]
    }
  };
  
  // Log the message that would be sent
  console.log("Booking Reminder 2 message:", JSON.stringify(messageData, null, 2));
  
  // In a real implementation:
  // sendWhatsAppMessage(messageData);
}

// Export functions
module.exports = {
  handleCartStarted,
  handleCartAbandoned,
  sendBookingReminder1,
  sendBookingReminder2
};