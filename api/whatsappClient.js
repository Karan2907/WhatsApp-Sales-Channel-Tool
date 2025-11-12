/**
 * WhatsApp API Client for Resort Owners
 * Handles communication with WhatsApp Business Cloud API, Twilio, and Gupshup
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load configuration
const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Send a message via the configured WhatsApp API
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendMessage(messageData) {
  const provider = config.whatsapp.provider;
  
  switch(provider) {
    case 'whatsapp-cloud-api':
      return sendViaWhatsAppCloudAPI(messageData);
    case 'twilio':
      return sendViaTwilio(messageData);
    case 'gupshup':
      return sendViaGupshup(messageData);
    default:
      // Fallback to mock for demo purposes
      return sendMockMessage(messageData);
  }
}

/**
 * Send message via WhatsApp Cloud API (Meta)
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendViaWhatsAppCloudAPI(messageData) {
  return new Promise((resolve, reject) => {
    if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
      reject(new Error('WhatsApp Cloud API credentials not configured'));
      return;
    }
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v20.0/${config.whatsapp.phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(messageData));
    req.end();
  });
}

/**
 * Send message via Twilio
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendViaTwilio(messageData) {
  return new Promise((resolve, reject) => {
    if (!config.whatsapp.accountSid || !config.whatsapp.authToken || !config.whatsapp.phoneNumber) {
      reject(new Error('Twilio credentials not configured'));
      return;
    }
    
    // Twilio requires different message format
    const twilioMessage = convertToTwilioFormat(messageData);
    
    const auth = Buffer.from(`${config.whatsapp.accountSid}:${config.whatsapp.authToken}`).toString('base64');
    
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${config.whatsapp.accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    const postData = new URLSearchParams(twilioMessage).toString();
    req.write(postData);
    req.end();
  });
}

/**
 * Send message via Gupshup
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendViaGupshup(messageData) {
  return new Promise((resolve, reject) => {
    if (!config.whatsapp.apiKey || !config.whatsapp.appName) {
      reject(new Error('Gupshup credentials not configured'));
      return;
    }
    
    // Gupshup requires different message format
    const gupshupMessage = convertToGupshupFormat(messageData);
    
    const options = {
      hostname: 'api.gupshup.io',
      port: 443,
      path: '/sm/api/v1/template/msg',
      method: 'POST',
      headers: {
        'apikey': config.whatsapp.apiKey,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(gupshupMessage));
    req.end();
  });
}

/**
 * Mock message sending for demo purposes
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} - Promise resolving to a mock response
 */
function sendMockMessage(messageData) {
  return new Promise((resolve) => {
    console.log('Sending WhatsApp message:', JSON.stringify(messageData, null, 2));
    
    // For demo, we'll simulate a successful response
    const mockResponse = {
      success: true,
      messageId: 'mock-message-id-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    
    // Simulate network delay
    setTimeout(() => {
      resolve(mockResponse);
    }, 500);
  });
}

/**
 * Convert message format for Twilio
 * @param {Object} messageData - WhatsApp Cloud API format message
 * @returns {Object} - Twilio format message
 */
function convertToTwilioFormat(messageData) {
  // Simplified conversion - in a real implementation, this would be more complex
  return {
    From: `whatsapp:${config.whatsapp.phoneNumber}`,
    To: `whatsapp:${messageData.to}`,
    Body: `Template: ${messageData.template.name}`
  };
}

/**
 * Convert message format for Gupshup
 * @param {Object} messageData - WhatsApp Cloud API format message
 * @returns {Object} - Gupshup format message
 */
function convertToGupshupFormat(messageData) {
  // Simplified conversion - in a real implementation, this would be more complex
  return {
    source: config.whatsapp.appName,
    destination: messageData.to,
    template: messageData.template
  };
}

/**
 * Send welcome message to new guest
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendWelcomeMessage(customerPhone) {
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "welcome_qualifier",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" } // Would be personalized
          ]
        },
        {
          type: "button",
          parameters: [
            {
              type: "payload",
              payload: "QUALIFIER_ACCOMMODATION"
            }
          ]
        },
        {
          type: "button",
          parameters: [
            {
              type: "payload",
              payload: "QUALIFIER_EXPERIENCE"
            }
          ]
        },
        {
          type: "button",
          parameters: [
            {
              type: "payload",
              payload: "QUALIFIER_SPECIAL_OFFERS"
            }
          ]
        }
      ]
    }
  };
  
  return sendMessage(messageData);
}

/**
 * Send accommodation suggestions based on guest interest
 * @param {string} customerPhone - Guest's WhatsApp phone number
 * @param {string} category - Accommodation category of interest
 * @param {Array} accommodationList - List of accommodations to suggest
 * @returns {Promise<Object>} - Promise resolving to the API response
 */
function sendAccommodationSuggestions(customerPhone, category, accommodationList) {
  // Limit to 3 accommodations for WhatsApp template
  const suggestedAccommodations = accommodationList.slice(0, 3);
  
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "template",
    template: {
      name: "product_suggestions",
      language: { code: "en" },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              text: getCategoryDisplayName(category)
            }
          ]
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: "Guest Name" } // Would be personalized
          ]
        }
      ]
    }
  };
  
  // Add accommodation parameters
  suggestedAccommodations.forEach((accommodation, index) => {
    messageData.template.components.push({
      type: "body",
      parameters: [
        { type: "text", text: accommodation.name },
        { type: "text", text: accommodation.benefit },
        { type: "text", text: `$${accommodation.price}/night` }
      ]
    });
  });
  
  // Add view accommodations button
  messageData.template.components.push({
    type: "button",
    parameters: [
      {
        type: "payload",
        payload: "VIEW_ACCOMMODATIONS"
      }
    ]
  });
  
  return sendMessage(messageData);
}

/**
 * Get display name for category
 * @param {string} category - Category identifier
 * @returns {string} - Display name for category
 */
function getCategoryDisplayName(category) {
  const displayNames = {
    'accommodation': 'Luxury Accommodations',
    'experience': 'Resort Experiences'
  };
  
  return displayNames[category] || category;
}

/**
 * Validate WhatsApp configuration
 * @returns {boolean} - True if configuration is valid
 */
function validateConfig() {
  const whatsappConfig = config.whatsapp;
  
  if (!whatsappConfig.provider) {
    console.warn('WhatsApp provider not configured');
    return false;
  }
  
  switch(whatsappConfig.provider) {
    case 'whatsapp-cloud-api':
      if (!whatsappConfig.accessToken) {
        console.warn('WhatsApp Cloud API access token not configured');
        return false;
      }
      if (!whatsappConfig.phoneNumberId) {
        console.warn('WhatsApp Cloud API phone number ID not configured');
        return false;
      }
      break;
    case 'twilio':
      if (!whatsappConfig.accountSid) {
        console.warn('Twilio account SID not configured');
        return false;
      }
      if (!whatsappConfig.authToken) {
        console.warn('Twilio auth token not configured');
        return false;
      }
      if (!whatsappConfig.phoneNumber) {
        console.warn('Twilio phone number not configured');
        return false;
      }
      break;
    case 'gupshup':
      if (!whatsappConfig.apiKey) {
        console.warn('Gupshup API key not configured');
        return false;
      }
      if (!whatsappConfig.appName) {
        console.warn('Gupshup app name not configured');
        return false;
      }
      break;
    default:
      console.warn('Unsupported provider');
      return false;
  }
  
  return true;
}

// Export functions
module.exports = {
  sendMessage,
  sendWelcomeMessage,
  sendAccommodationSuggestions: sendAccommodationSuggestions,
  validateConfig
};