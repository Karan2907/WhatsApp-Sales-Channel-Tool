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

// Load product fetcher
const productFetcher = require('../api/productFetcher');

// Load accommodation data (fallback)
let accommodations = [];
const accommodationsPath = path.join(__dirname, '../config/products.json');
if (fs.existsSync(accommodationsPath)) {
  accommodations = JSON.parse(fs.readFileSync(accommodationsPath, 'utf8'));
}

/**
 * Handle reservation confirmed event
 * @param {Object} eventData - The reservation confirmed event data
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function handleOrderPlaced(eventData, tenantConfig = null) {
  console.log('Reservation confirmed event received:', eventData);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  const customerPhone = eventData.customerPhone;
  const reservationDetails = eventData.orderDetails;
  
  // Send reservation confirmation
  sendReservationConfirmation(customerPhone, reservationDetails, effectiveConfig);
}

/**
 * Handle guest checked in event
 * @param {Object} eventData - The guest checked in event data
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function handleOrderDelivered(eventData, tenantConfig = null) {
  console.log('Guest checked in event received:', eventData);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
  const customerPhone = eventData.customerPhone;
  const reservationDetails = eventData.orderDetails;
  
  // Schedule review request
  setTimeout(async () => {
    await sendReviewRequest(customerPhone, reservationDetails, effectiveConfig);
  }, effectiveConfig.timings.postPurchaseReviewDays * 24 * 60 * 60 * 1000); // Convert days to milliseconds
}

/**
 * Send reservation confirmation message
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Object} reservationDetails - Reservation details
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
function sendReservationConfirmation(customerPhone, reservationDetails, tenantConfig = null) {
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
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function sendReviewRequest(customerPhone, reservationDetails, tenantConfig = null) {
  console.log(`Sending review request to ${customerPhone}`);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
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
  setTimeout(async () => {
    await sendUpsellOffer(customerPhone, accommodationForReview, effectiveConfig);
  }, 5000); // Small delay for demo purposes
}

/**
 * Send upsell offer message
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {Object} purchasedAccommodation - The accommodation that was booked
 * @param {Object} tenantConfig - Optional tenant configuration for SaaS version
 */
async function sendUpsellOffer(customerPhone, purchasedAccommodation, tenantConfig = null) {
  console.log(`Sending upsell offer to ${customerPhone}`);
  
  // Use tenant config if provided, otherwise use global config
  const effectiveConfig = tenantConfig || config;
  
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
    console.log(`Using ${currentProducts.length} current products for upsell`);
  } catch (error) {
    console.error('Error fetching current products, using fallback:', error.message);
  }
  
  // Find a complementary experience
  const complementaryExperiences = currentProducts.filter(a => 
    a.category === 'experience'
  );
  
  const upsellExperience = complementaryExperiences.length > 0 ? 
    complementaryExperiences[0] : currentProducts[0];
  
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
  handleOrderDelivered,
  sendReservationConfirmation,
  sendReviewRequest,
  sendUpsellOffer
};