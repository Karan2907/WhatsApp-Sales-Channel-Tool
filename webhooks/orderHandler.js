/**
 * Webhook handler for reservation-related events for Resort Owners
 * Processes reservation_confirmed, guest_checked_in events
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
 * Handle reservation confirmed event
 * @param {Object} eventData - The reservation confirmed event data
 */
function handleOrderPlaced(eventData) {
  console.log('Reservation confirmed event received:', eventData);
  
  const customerPhone = eventData.customerPhone;
  const reservationDetails = eventData.orderDetails;
  
  // Send reservation confirmation
  sendReservationConfirmation(customerPhone, reservationDetails);
}

/**
 * Handle guest checked in event
 * @param {Object} eventData - The guest checked in event data
 */
function handleOrderDelivered(eventData) {
  console.log('Guest checked in event received:', eventData);
  
  const customerPhone = eventData.customerPhone;
  const reservationDetails = eventData.orderDetails;
  
  // Schedule review request
  setTimeout(() => {
    sendReviewRequest(customerPhone, reservationDetails);
  }, config.timings.postPurchaseReviewDays * 24 * 60 * 60 * 1000); // Convert days to milliseconds
}

/**
 * Send reservation confirmation message
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Object} reservationDetails - Reservation details
 */
function sendReservationConfirmation(customerPhone, reservationDetails) {
  console.log(`Sending reservation confirmation to ${customerPhone}`);
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "order_confirmation",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" }, // Would be personalized
            { type: "text", text: reservationDetails.orderId },
            { type: "text", text: reservationDetails.totalAmount },
            { type: "text", text: reservationDetails.estimatedDelivery }
          ]
        }
      ]
    }
  };
  
  console.log("Reservation confirmation message:", JSON.stringify(messageData, null, 2));
  
  // In a real implementation:
  // sendWhatsAppMessage(messageData);
}

/**
 * Send review request message
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Object} reservationDetails - Reservation details
 */
function sendReviewRequest(customerPhone, reservationDetails) {
  console.log(`Sending review request to ${customerPhone}`);
  
  // Select an accommodation from the reservation for review
  const accommodationForReview = reservationDetails.items[0]; // Simplified for POC
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "post_purchase_review",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" }, // Would be personalized
            { type: "text", text: accommodationForReview.name }
          ]
        },
        {
          type: "button",
          parameters: [
            {
              type: "payload",
              payload: "REVIEW_YES"
            }
          ]
        }
      ]
    }
  };
  
  console.log("Review request message:", JSON.stringify(messageData, null, 2));
  
  // In a real implementation:
  // sendWhatsAppMessage(messageData);
  
  // Also send upsell message
  setTimeout(() => {
    sendUpsellOffer(customerPhone, accommodationForReview);
  }, 5000); // Small delay for demo purposes
}

/**
 * Send upsell offer message
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Object} purchasedAccommodation - The accommodation that was booked
 */
function sendUpsellOffer(customerPhone, purchasedAccommodation) {
  console.log(`Sending upsell offer to ${customerPhone}`);
  
  // Find a complementary experience
  const complementaryExperiences = accommodations.filter(a => 
    a.category === 'experience'
  );
  
  const upsellExperience = complementaryExperiences.length > 0 ? 
    complementaryExperiences[0] : accommodations[0];
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "upsell_offer",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" }, // Would be personalized
            { type: "text", text: purchasedAccommodation.name },
            { type: "text", text: upsellExperience.name },
            { type: "text", text: `$${upsellExperience.price}` }
          ]
        },
        {
          type: "button",
          parameters: [
            {
              type: "payload",
              payload: `VIEW_${upsellExperience.id}`
            }
          ]
        }
      ]
    }
  };
  
  console.log("Upsell offer message:", JSON.stringify(messageData, null, 2));
  
  // In a real implementation:
  // sendWhatsAppMessage(messageData);
}

// Export functions
module.exports = {
  handleOrderPlaced,
  handleOrderDelivered
};