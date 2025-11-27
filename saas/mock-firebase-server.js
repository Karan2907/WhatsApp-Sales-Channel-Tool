/**
 * Mock Firebase Server for Testing
 * Simulates Firebase backend services without actual Firebase connection
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for mock data
const mockTenants = new Map();
const mockUsers = new Map();

// Helper function to generate tenant ID
function generateTenantId(email) {
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${emailPrefix}-${randomSuffix}`;
}

// Mock authentication routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, tenantId, displayName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Auto-generate tenant ID if not provided
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      finalTenantId = generateTenantId(email);
    }
    
    // Check if tenant already exists
    if (mockTenants.has(finalTenantId)) {
      // If tenant exists and it's a Google auth request, just return success
      if (password === 'google-auth') {
        return res.status(200).json({ 
          message: 'Login successful',
          tenantId: finalTenantId,
          email: email,
          customToken: `mock-token-${finalTenantId}`
        });
      }
      return res.status(409).json({ error: 'Tenant already exists' });
    }
    
    // Create mock user
    const userId = `uid_${Math.random().toString(36).substring(2, 12)}`;
    mockUsers.set(email, { 
      uid: userId, 
      email, 
      password: password || 'default-password',
      displayName: displayName || email.split('@')[0]
    });
    
    // Create mock tenant
    const tenantData = {
      id: finalTenantId,
      userId: userId,
      email: email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productApi: {
        enabled: false,
        url: '',
        authType: 'none',
        bearerToken: '',
        username: '',
        password: '',
        apiKeyHeader: '',
        apiKeyValue: '',
        refreshInterval: 60
      },
      whatsapp: {
        provider: '',
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        apiKey: '',
        appName: '',
        verifyToken: ''
      }
    };
    
    mockTenants.set(finalTenantId, tenantData);
    
    res.status(201).json({ 
      message: 'Tenant registered successfully',
      tenantId: finalTenantId,
      email: email,
      customToken: `mock-token-${finalTenantId}`
    });
  } catch (error) {
    console.error('Error registering tenant:', error);
    res.status(500).json({ error: 'Failed to register tenant' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists
    if (!mockUsers.has(email)) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = mockUsers.get(email);
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Find tenant for this user
    let tenantId = null;
    for (const [id, tenant] of mockTenants.entries()) {
      if (tenant.email === email) {
        tenantId = id;
        break;
      }
    }
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant not found' });
    }
    
    res.json({ 
      message: 'Login successful',
      tenantId: tenantId,
      email: email,
      customToken: `mock-token-${tenantId}`
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock tenant settings API
app.get('/api/settings', (req, res) => {
  try {
    // In a real implementation, we would get tenant ID from auth token
    // For mocking, we'll just return the first tenant
    const tenants = Array.from(mockTenants.values());
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'No tenants found' });
    }
    
    res.json(tenants[0]);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    
    // In a real implementation, we would get tenant ID from auth token
    // For mocking, we'll just update the first tenant
    const tenants = Array.from(mockTenants.values());
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'No tenants found' });
    }
    
    const tenantId = tenants[0].id;
    const existingTenant = mockTenants.get(tenantId);
    
    // Apply updates
    const updatedTenant = {
      ...existingTenant,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    mockTenants.set(tenantId, updatedTenant);
    
    res.json({ 
      message: 'Settings updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// WhatsApp configuration endpoint
app.post('/api/settings/whatsapp', (req, res) => {
  try {
    const { provider, ...config } = req.body;
    
    // In a real implementation, we would get tenant ID from auth token
    // For mocking, we'll just update the first tenant
    const tenants = Array.from(mockTenants.values());
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'No tenants found' });
    }
    
    const tenantId = tenants[0].id;
    const existingTenant = mockTenants.get(tenantId);
    
    // Apply WhatsApp configuration
    const updatedTenant = {
      ...existingTenant,
      whatsapp: {
        provider,
        ...config
      },
      updatedAt: new Date().toISOString()
    };
    
    mockTenants.set(tenantId, updatedTenant);
    
    res.json({ 
      message: 'WhatsApp configuration updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to update WhatsApp settings' });
  }
});

// Product API configuration endpoint
app.post('/api/settings/product-api', (req, res) => {
  try {
    const config = req.body;
    
    // In a real implementation, we would get tenant ID from auth token
    // For mocking, we'll just update the first tenant
    const tenants = Array.from(mockTenants.values());
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'No tenants found' });
    }
    
    const tenantId = tenants[0].id;
    const existingTenant = mockTenants.get(tenantId);
    
    // Apply Product API configuration
    const updatedTenant = {
      ...existingTenant,
      productApi: {
        enabled: true,
        ...config
      },
      updatedAt: new Date().toISOString()
    };
    
    mockTenants.set(tenantId, updatedTenant);
    
    res.json({ 
      message: 'Product API configuration updated successfully',
      tenant: updatedTenant
    });
  } catch (error) {
    console.error('Error updating Product API settings:', error);
    res.status(500).json({ error: 'Failed to update Product API settings' });
  }
});

// Mock webhook endpoints
app.post('/webhook/booking-started', (req, res) => {
  try {
    const eventData = req.body;
    console.log('[MOCK] Received booking started webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    res.status(200).json({ message: 'Booking started event processed' });
  } catch (error) {
    console.error('[MOCK] Error processing booking started webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/booking-abandoned', (req, res) => {
  try {
    const eventData = req.body;
    console.log('[MOCK] Received booking abandoned webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.cartItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    res.status(200).json({ message: 'Booking abandoned event processed' });
  } catch (error) {
    console.error('[MOCK] Error processing booking abandoned webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/reservation-confirmed', (req, res) => {
  try {
    const eventData = req.body;
    console.log('[MOCK] Received reservation confirmed webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    res.status(200).json({ message: 'Reservation confirmed event processed' });
  } catch (error) {
    console.error('[MOCK] Error processing reservation confirmed webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhook/guest-checked-in', (req, res) => {
  try {
    const eventData = req.body;
    console.log('[MOCK] Received guest checked in webhook:', eventData);
    
    // Validate required fields
    if (!eventData.customerPhone || !eventData.orderDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    res.status(200).json({ message: 'Guest checked in event processed' });
  } catch (error) {
    console.error('[MOCK] Error processing guest checked in webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mockTenants: mockTenants.size,
    mockUsers: mockUsers.size
  });
});

// Serve the Firebase frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/firebase-index.html'));
});

// Start the mock server
app.listen(PORT, () => {
  console.log(`Mock Firebase server running on port ${PORT}`);
  console.log(`Access the frontend at http://localhost:${PORT}`);
});

module.exports = app;