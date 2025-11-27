/**
 * SaaS Server for WhatsApp Sales Channel Tool
 * Multi-tenant version that handles multiple clients
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const tenantManager = require('./tenant-manager');
const authMiddleware = require('./auth-middleware');
const productFetcher = require('../api/productFetcher');

// Import existing handlers
const cartHandler = require('../webhooks/cartHandler');
const orderHandler = require('../webhooks/orderHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware for API routes
app.use('/api', authMiddleware.authenticate);
app.use('/api', authMiddleware.tenantContext);
app.use('/webhook', authMiddleware.authenticate);
app.use('/webhook', authMiddleware.tenantContext);

// Public routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { tenantId, ...tenantData } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant already exists
    if (tenantManager.getTenant(tenantId)) {
      return res.status(409).json({ error: 'Tenant already exists' });
    }
    
    // Create tenant
    const tenant = tenantManager.createTenant(tenantId, tenantData);
    
    // Generate token
    const token = authMiddleware.generateToken(tenantId);
    
    res.status(201).json({ 
      message: 'Tenant registered successfully',
      tenantId,
      token
    });
  } catch (error) {
    console.error('Error registering tenant:', error);
    res.status(500).json({ error: 'Failed to register tenant' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { tenantId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant exists
    const tenant = tenantManager.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Generate token
    const token = authMiddleware.generateToken(tenantId);
    
    res.json({ 
      message: 'Login successful',
      tenantId,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Tenant-specific settings API
app.get('/api/settings', (req, res) => {
  try {
    res.json(req.tenant);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    const updatedTenant = tenantManager.updateTenant(req.tenantId, updates);
    
    if (!updatedTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({ 
      message: 'Settings updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Tenant-specific webhook endpoints
app.post('/webhook/booking-started', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(`[${req.tenantId}] Received booking started webhook:`, eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event with tenant context
    await cartHandler.handleCartStarted(eventData);
    
    res.status(200).json({ message: 'Booking started event processed' });
  } catch (error) {
    console.error(`[${req.tenantId}] Error processing booking started webhook:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/booking-abandoned', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(`[${req.tenantId}] Received booking abandoned webhook:`, eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event with tenant context
    await cartHandler.handleCartAbandoned(eventData);
    
    res.status(200).json({ message: 'Booking abandoned event processed' });
  } catch (error) {
    console.error(`[${req.tenantId}] Error processing booking abandoned webhook:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/reservation-confirmed', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(`[${req.tenantId}] Received reservation confirmed webhook:`, eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event with tenant context
    await orderHandler.handleOrderPlaced(eventData);
    
    res.status(200).json({ message: 'Reservation confirmed event processed' });
  } catch (error) {
    console.error(`[${req.tenantId}] Error processing reservation confirmed webhook:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/guest-checked-in', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(`[${req.tenantId}] Received guest checked in webhook:`, eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Process the event with tenant context
    await orderHandler.handleOrderDelivered(eventData);
    
    res.status(200).json({ message: 'Guest checked in event processed' });
  } catch (error) {
    console.error(`[${req.tenantId}] Error processing guest checked in webhook:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tenantId: req.tenantId || null
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`SaaS WhatsApp Sales Channel Tool server running on port ${PORT}`);
  console.log(`Multi-tenant mode enabled`);
  
  // Start periodic product fetching for all tenants
  startPeriodicFetchingForAllTenants();
});

// Function to start periodic fetching for all tenants
function startPeriodicFetchingForAllTenants() {
  console.log('Starting periodic product fetching for all tenants...');
  
  // Fetch products for all tenants every 10 minutes
  setInterval(async () => {
    const tenants = tenantManager.listTenants();
    console.log(`Checking ${tenants.length} tenants for product updates...`);
    
    for (const tenantId of tenants) {
      try {
        const tenant = tenantManager.getTenant(tenantId);
        if (tenant && tenant.productApi && tenant.productApi.enabled) {
          console.log(`[${tenantId}] Fetching products from API...`);
          const products = await productFetcher.fetchProductsFromWebsite(tenant.productApi);
          console.log(`[${tenantId}] Successfully fetched ${products.length} products`);
        }
      } catch (error) {
        console.error(`[${tenantId}] Error fetching products:`, error.message);
      }
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}

module.exports = app;