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

// Load accommodation data
const accommodationsPath = path.join(__dirname, '../config/products.json');
const accommodations = JSON.parse(fs.readFileSync(accommodationsPath, 'utf8'));

/**
 * Handle booking started event
 * @param {Object} eventData - The booking started event data
 */
function handleCartStarted(eventData) {
  console.log('Booking started event received:', eventData);
  
  // In a real implementation, you would:
  // 1. Store the booking information in a database
  // 2. Set up timers for abandonment reminders
  // 3. Associate the booking with the guest's WhatsApp number
  
  // For POC, we'll just log the event
  const customerPhone = eventData.customerPhone;
  const bookingItems = eventData.cartItems;
  
  console.log(`Booking started for ${customerPhone} with ${bookingItems.length} items`);
  
  // Set timeout for booking abandonment reminder
  setTimeout(() => {
    sendBookingReminder1(customerPhone, bookingItems);
  }, config.timings.cartReminder1Minutes * 60 * 1000); // Convert minutes to milliseconds
}

/**
 * Handle booking abandoned event
 * @param {Object} eventData - The booking abandoned event data
 */
function handleCartAbandoned(eventData) {
  console.log('Booking abandoned event received:', eventData);
  
  const customerPhone = eventData.customerPhone;
  const bookingItems = eventData.cartItems;
  
  // Send first reminder immediately
  sendBookingReminder1(customerPhone, bookingItems);
  
  // Schedule second reminder
  setTimeout(() => {
    sendBookingReminder2(customerPhone, bookingItems);
  }, config.timings.cartReminder2Hours * 60 * 60 * 1000); // Convert hours to milliseconds
}

/**
 * Send first booking reminder
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Array} bookingItems - Items in the booking
 */
function sendBookingReminder1(customerPhone, bookingItems) {
  // In a real implementation, this would call the WhatsApp API
  console.log(`Sending Booking Reminder 1 to ${customerPhone}`);
  
  // Get first item name for personalization
  const firstItemName = bookingItems.length > 0 ? bookingItems[0].name : "your accommodations";
  
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
            { type: "text", text: config.brand.name },
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
 */
function sendBookingReminder2(customerPhone, bookingItems) {
  // In a real implementation, this would call the WhatsApp API
  console.log(`Sending Booking Reminder 2 to ${customerPhone}`);
  
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
            { type: "text", text: config.brand.name }
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
  handleCartAbandoned
};