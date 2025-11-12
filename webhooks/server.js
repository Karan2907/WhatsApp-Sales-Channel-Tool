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

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Sales Channel Tool</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #333; 
                text-align: center;
                margin-bottom: 30px;
            }
            .endpoint {
                background-color: #f8f9fa;
                border-left: 4px solid #007bff;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 4px;
            }
            .endpoint-title {
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }
            .endpoint-url {
                font-family: monospace;
                background-color: #e9ecef;
                padding: 2px 6px;
                border-radius: 3px;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 4px;
                margin: 10px 5px;
                font-weight: bold;
            }
            .button:hover {
                background-color: #0056b3;
            }
            .center {
                text-align: center;
            }
            .api-info {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>WhatsApp Sales Channel Tool for Resort Owners</h1>
            
            <div class="center">
                <a href="/settings" class="button">Configure Settings</a>
                <a href="/health" class="button">Health Check</a>
            </div>
            
            <div class="api-info">
                <h2>API Endpoints</h2>
                <div class="endpoint">
                    <div class="endpoint-title">Booking Started</div>
                    <div class="endpoint-url">POST /webhook/booking-started</div>
                    <div>Triggered when a guest starts a booking</div>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">Booking Abandoned</div>
                    <div class="endpoint-url">POST /webhook/booking-abandoned</div>
                    <div>Triggered when a guest abandons a booking</div>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">Reservation Confirmed</div>
                    <div class="endpoint-url">POST /webhook/reservation-confirmed</div>
                    <div>Triggered when a reservation is confirmed</div>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">Guest Checked In</div>
                    <div class="endpoint-url">POST /webhook/guest-checked-in</div>
                    <div>Triggered when a guest checks in</div>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">Health Check</div>
                    <div class="endpoint-url">GET /health</div>
                    <div>Check if the service is running</div>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-title">Settings</div>
                    <div class="endpoint-url">GET /settings</div>
                    <div>Configure WhatsApp provider settings</div>
                </div>
            </div>
            
            <div class="center" style="margin-top: 30px; color: #666;">
                <p>Version 1.0.0</p>
                <p>See README.md and docs/ directory for detailed setup instructions</p>
            </div>
        </div>
    </body>
    </html>
  `);
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