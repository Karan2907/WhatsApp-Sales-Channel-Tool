/**
 * Webhook server for handling events from the resort booking website
 * This is the production implementation using Express.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const cartHandler = require('./cartHandler');
const orderHandler = require('./orderHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from public directory

// Load configuration
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'WhatsApp Sales Channel Tool for Resort Owners API',
    version: '1.0.0',
    description: 'This is the webhook server for the WhatsApp Sales Channel Tool. Please use the webhook endpoints to integrate with your booking platform.',
    endpoints: {
      'Booking Started': 'POST /webhook/booking-started',
      'Booking Abandoned': 'POST /webhook/booking-abandoned',
      'Reservation Confirmed': 'POST /webhook/reservation-confirmed',
      'Guest Checked In': 'POST /webhook/guest-checked-in',
      'Health Check': 'GET /health',
      'Settings': 'GET /settings'
    },
    documentation: 'See README.md and docs/ directory for detailed setup instructions'
  });
});

// Settings page endpoint
app.get('/settings', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Sales Channel Settings</title>
        <link rel="stylesheet" href="/settings.css">
    </head>
    <body data-provider="${config.whatsapp.provider || ''}">
        <h1>WhatsApp Sales Channel Settings</h1>
        <form id="settingsForm">
            <div class="form-group">
                <label for="provider">WhatsApp Provider:</label>
                <select id="provider" name="provider">
                    <option value="">Select Provider</option>
                    <option value="whatsapp-cloud-api">WhatsApp Business API (Meta)</option>
                    <option value="twilio">Twilio</option>
                    <option value="gupshup">Gupshup</option>
                </select>
            </div>

            <!-- WhatsApp Business API Fields -->
            <div id="whatsapp-cloud-api-fields" class="provider-fields">
                <div class="form-group">
                    <label for="accessToken">Access Token:</label>
                    <input type="password" id="accessToken" name="accessToken" value="${config.whatsapp.accessToken || ''}">
                </div>
                <div class="form-group">
                    <label for="phoneNumberId">Phone Number ID:</label>
                    <input type="text" id="phoneNumberId" name="phoneNumberId" value="${config.whatsapp.phoneNumberId || ''}">
                </div>
                <div class="form-group">
                    <label for="businessAccountId">Business Account ID (optional):</label>
                    <input type="text" id="businessAccountId" name="businessAccountId" value="${config.whatsapp.businessAccountId || ''}">
                </div>
            </div>

            <!-- Twilio Fields -->
            <div id="twilio-fields" class="provider-fields">
                <div class="form-group">
                    <label for="accountSid">Account SID:</label>
                    <input type="password" id="accountSid" name="accountSid" value="${config.whatsapp.accountSid || ''}">
                </div>
                <div class="form-group">
                    <label for="authToken">Auth Token:</label>
                    <input type="password" id="authToken" name="authToken" value="${config.whatsapp.authToken || ''}">
                </div>
                <div class="form-group">
                    <label for="phoneNumber">WhatsApp Phone Number:</label>
                    <input type="text" id="phoneNumber" name="phoneNumber" value="${config.whatsapp.phoneNumber || ''}">
                </div>
            </div>

            <!-- Gupshup Fields -->
            <div id="gupshup-fields" class="provider-fields">
                <div class="form-group">
                    <label for="apiKey">API Key:</label>
                    <input type="password" id="apiKey" name="apiKey" value="${config.whatsapp.apiKey || ''}">
                </div>
                <div class="form-group">
                    <label for="appName">App Name:</label>
                    <input type="text" id="appName" name="appName" value="${config.whatsapp.appName || ''}">
                </div>
            </div>

            <div class="form-group">
                <label for="brandName">Brand Name:</label>
                <input type="text" id="brandName" name="brandName" value="${config.brand.name || ''}">
            </div>

            <div class="form-group">
                <label for="brandTone">Brand Tone:</label>
                <select id="brandTone" name="brandTone">
                    <option value="friendly" ${config.brand.tone === 'friendly' ? 'selected' : ''}>Friendly</option>
                    <option value="premium" ${config.brand.tone === 'premium' ? 'selected' : ''}>Premium</option>
                    <option value="relaxed" ${config.brand.tone === 'relaxed' ? 'selected' : ''}>Relaxed</option>
                </select>
            </div>

            <button type="submit">Save Settings</button>
        </form>

        <div id="message"></div>

        <script src="/settings.js"></script>
    </body>
    </html>
  `);
});

// API endpoint to get current settings
app.get('/api/settings', (req, res) => {
  res.json(config);
});

// API endpoint to update settings
app.post('/api/settings', (req, res) => {
  try {
    // Update config with new settings
    config = { ...config, ...req.body };
    
    // Save to config file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.json({ message: 'Settings saved successfully!' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Webhook endpoint for booking started
app.post('/webhook/booking-started', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received booking started webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    cartHandler.handleCartStarted(eventData);
    
    res.status(200).json({ message: 'Booking started event processed' });
  } catch (error) {
    console.error('Error processing booking started webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for booking abandoned
app.post('/webhook/booking-abandoned', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received booking abandoned webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    cartHandler.handleCartAbandoned(eventData);
    
    res.status(200).json({ message: 'Booking abandoned event processed' });
  } catch (error) {
    console.error('Error processing booking abandoned webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for reservation confirmed
app.post('/webhook/reservation-confirmed', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received reservation confirmed webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    orderHandler.handleOrderPlaced(eventData);
    
    res.status(200).json({ message: 'Reservation confirmed event processed' });
  } catch (error) {
    console.error('Error processing reservation confirmed webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for guest checked in
app.post('/webhook/guest-checked-in', (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received guest checked in webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event
    orderHandler.handleOrderDelivered(eventData);
    
    res.status(200).json({ message: 'Guest checked in event processed' });
  } catch (error) {
    console.error('Error processing guest checked in webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});

module.exports = app;