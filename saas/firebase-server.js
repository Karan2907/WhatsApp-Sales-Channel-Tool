const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const admin = require('firebase-admin');
const { firestore } = require('./firebase-config');
const tenantManager = require('./firebase-tenant-manager');
const authMiddleware = require('./firebase-auth-middleware');
const productFetcher = require('../api/productFetcher');
const myoperatorHandler = require('./myoperator-webhook-handler');
const twilioHandler = require('./twilio-webhook-handler');

// Add multer for file upload handling
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Import existing handlers
const cartHandler = require('../webhooks/cartHandler');
const orderHandler = require('../webhooks/orderHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public routes (no authentication required)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Authentication routes (no authentication required)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, tenantId, displayName, ...tenantData } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Auto-generate tenant ID if not provided
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      // Create a tenant ID based on email prefix and random string
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      finalTenantId = `${emailPrefix}-${randomSuffix}`;
    }
    
    // Check if tenant already exists
    const existingTenant = await tenantManager.getTenant(finalTenantId);
    if (existingTenant) {
      // If tenant exists and it's a Google auth request, just return success
      if (password === 'google-auth') {
        // Get the user record to set custom claims
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Set custom claims on the existing user
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          tenantId: finalTenantId,
          role: 'tenant'
        });
        
        // Generate custom token for webhook use (using uid directly)
        const customToken = await admin.auth().createCustomToken(userRecord.uid, {
          tenantId: finalTenantId,
          role: 'tenant'
        });
        
        return res.status(200).json({ 
          message: 'Login successful',
          tenantId: finalTenantId,
          email: email,
          customToken
        });
      }
      return res.status(409).json({ error: 'Tenant already exists' });
    }
    
    // Set default password if not provided (for Google auth)
    const finalPassword = password || 'default-password';
    
    // Create tenant user and configuration
    const tenantUser = await tenantManager.createTenantUser(email, finalPassword, finalTenantId, { displayName, ...tenantData });
    
    // Set custom claims on Firebase user
    await admin.auth().setCustomUserClaims(tenantUser.uid, {
      tenantId: finalTenantId,
      role: 'tenant'
    });
    
    // Generate custom token for webhook use (using uid directly)
    const customToken = await admin.auth().createCustomToken(tenantUser.uid, {
      tenantId: finalTenantId,
      role: 'tenant'
    });
    
    res.status(201).json({ 
      message: 'Tenant registered successfully',
      tenantId: tenantUser.tenantId,
      email: tenantUser.email,
      customToken
    });
  } catch (error) {
    console.error('Error registering tenant:', error);
    res.status(500).json({ error: error.message || 'Failed to register tenant' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Authenticate user
    const tenantUser = await tenantManager.authenticateTenantUser(email, password);
    
    // Generate custom token
    const customToken = await authMiddleware.generateCustomToken(tenantUser.tenantId);
    
    res.json({ 
      message: 'Login successful',
      tenantId: tenantUser.tenantId,
      email: tenantUser.email,
      customToken
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

// Authentication middleware for protected API routes (applied after public routes)
app.use('/api', authMiddleware.authenticate);
app.use('/api', authMiddleware.tenantContext);
app.use('/webhook', authMiddleware.authenticate);
app.use('/webhook', authMiddleware.tenantContext);

// MyOperator webhook endpoints (public - no auth required)
// Incoming message webhook
app.post('/myoperator/webhook/message', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('[MyOperator] Incoming webhook:', JSON.stringify(webhookData).substring(0, 500));
    
    // MyOperator sends phone_number_id in data object
    const phoneNumberId = webhookData.data?.phone_number_id;
    
    if (!phoneNumberId) {
      console.warn('[MyOperator] No phone_number_id in webhook');
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ success: true, message: 'No phone_number_id' });
    }
    
    // Find tenant by phone_number_id
    const tenants = await tenantManager.listTenants();
    const tenant = tenants.find(t => 
      t.whatsapp && 
      (t.whatsapp.phoneNumberId === phoneNumberId || 
       t.whatsapp.phoneNumber === phoneNumberId)
    );
    
    if (!tenant) {
      console.warn(`[MyOperator] No tenant found for phoneNumberId: ${phoneNumberId}`);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ success: true, message: 'Webhook received but no tenant found' });
    }
    
    // Process the message
    const result = await myoperatorHandler.handleIncomingMessage(webhookData, tenant.id);
    
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[MyOperator] Error processing message webhook:', error);
    // Always return 200 to acknowledge receipt
    res.status(200).json({ success: false, error: error.message });
  }
});

// Status update webhook
app.post('/myoperator/webhook/status', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('[MyOperator] Status update webhook:', webhookData);
    
    // Extract message_id
    const message_id = webhookData.message_id;
    
    if (!message_id) {
      return res.status(200).json({ success: true, message: 'No message_id provided' });
    }
    
    // Find which tenant owns this message
    const tenants = await tenantManager.listTenants();
    
    for (const tenant of tenants) {
      try {
        const messagesCollection = firestore.collection('tenants').doc(tenant.id).collection('messages');
        const messageDoc = await messagesCollection.doc(message_id).get();
        
        if (messageDoc.exists) {
          // Process the status update
          await myoperatorHandler.handleStatusUpdate(webhookData, tenant.id);
          return res.status(200).json({ success: true });
        }
      } catch (err) {
        console.error(`[MyOperator] Error checking tenant ${tenant.id}:`, err.message);
      }
    }
    
    res.status(200).json({ success: true, message: 'Message not found in any tenant' });
  } catch (error) {
    console.error('[MyOperator] Error processing status webhook:', error);
    res.status(200).json({ success: false, error: error.message });
  }
});

// Twilio webhook endpoints (public - no auth required)
// Incoming message webhook
app.post('/twilio/webhook/message', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('[Twilio] Incoming webhook:', JSON.stringify(webhookData).substring(0, 500));
    
    // Twilio sends To (business number) in format: whatsapp:+1234567890
    const businessPhone = webhookData.To ? webhookData.To.replace('whatsapp:', '') : null;
    
    if (!businessPhone) {
      console.warn('[Twilio] No To (business phone) in webhook');
      // Return TwiML response (Twilio requires XML response)
      res.set('Content-Type', 'text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    
    // Find tenant by business phone number
    const tenants = await tenantManager.listTenants();
    const tenant = tenants.find(t => 
      t.whatsapp && 
      (t.whatsapp.phoneNumber === businessPhone || 
       t.whatsapp.phoneNumber === `whatsapp:${businessPhone}` ||
       t.whatsapp.phoneNumber.replace(/whatsapp:/g, '') === businessPhone.replace(/\+/g, ''))
    );
    
    if (!tenant) {
      console.warn(`[Twilio] No tenant found for phone: ${businessPhone}`);
      // Still return success TwiML
      res.set('Content-Type', 'text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    
    // Process the message
    const result = await twilioHandler.handleIncomingMessage(webhookData, tenant.id);
    
    // Return TwiML response
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('[Twilio] Error processing message webhook:', error);
    // Always return TwiML to acknowledge receipt
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

// Status callback webhook
app.post('/twilio/webhook/status', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('[Twilio] Status callback webhook:', webhookData);
    
    // Extract MessageSid
    const MessageSid = webhookData.MessageSid;
    
    if (!MessageSid) {
      // Return TwiML
      res.set('Content-Type', 'text/xml');
      return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    
    // Find which tenant owns this message
    const tenants = await tenantManager.listTenants();
    
    for (const tenant of tenants) {
      try {
        const messagesCollection = firestore.collection('tenants').doc(tenant.id).collection('messages');
        const messageDoc = await messagesCollection.doc(MessageSid).get();
        
        if (messageDoc.exists) {
          // Process the status update
          await twilioHandler.handleStatusUpdate(webhookData, tenant.id);
          res.set('Content-Type', 'text/xml');
          return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        }
      } catch (err) {
        console.error(`[Twilio] Error checking tenant ${tenant.id}:`, err.message);
      }
    }
    
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('[Twilio] Error processing status webhook:', error);
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
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

app.post('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    const updatedTenant = await tenantManager.updateTenant(req.tenantId, updates);
    
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
    await cartHandler.handleCartStarted(eventData, req.tenant);
    
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
    await cartHandler.handleCartAbandoned(eventData, req.tenant);
    
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
    await orderHandler.handleOrderPlaced(eventData, req.tenant);
    
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
    await orderHandler.handleOrderDelivered(eventData, req.tenant);
    
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

// Start the server (only when not running on Vercel)
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Firebase-based SaaS WhatsApp Sales Channel Tool server running on port ${PORT}`);
    console.log(`Multi-tenant mode enabled with Firebase backend`);
    
    // Start periodic product fetching for all tenants
    startPeriodicFetchingForAllTenants();
  });
}

// Export the app for Vercel
module.exports = app;

// Function to start periodic fetching for all tenants
async function startPeriodicFetchingForAllTenants() {
  console.log('Starting periodic product fetching for all tenants...');
  
  // Fetch products for all tenants every 10 minutes
  setInterval(async () => {
    try {
      const tenants = await tenantManager.listTenants();
      console.log(`Checking ${tenants.length} tenants for product updates...`);
      
      for (const tenant of tenants) {
        try {
          if (tenant.productApi && tenant.productApi.enabled) {
            console.log(`[${tenant.id}] Fetching products from API...`);
            const products = await productFetcher.fetchProductsFromWebsite(tenant.productApi);
            console.log(`[${tenant.id}] Successfully fetched ${products.length} products`);
            
            // Store products in Firestore for this tenant
            await storeTenantProducts(tenant.id, products);
          }
        } catch (error) {
          console.error(`[${tenant.id}] Error fetching products:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error listing tenants for periodic fetching:', error.message);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}

// Function to store tenant products in Firestore
async function storeTenantProducts(tenantId, products) {
  try {
    // Store products in a tenant-specific collection
    const productsCollection = firestore.collection('tenants').doc(tenantId).collection('products');
    
    // Clear existing products
    const existingProducts = await productsCollection.listDocuments();
    const batch = firestore.batch();
    
    for (const docRef of existingProducts) {
      batch.delete(docRef);
    }
    
    // Add new products (in batches of 500 to avoid Firestore limits)
    for (let i = 0; i < products.length; i += 500) {
      const batchProducts = products.slice(i, i + 500);
      
      for (const product of batchProducts) {
        // Generate a unique ID for the product or use existing ID
        const productId = product.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        batch.set(productsCollection.doc(productId), {
          ...product,
          id: productId,
          fetchedAt: new Date().toISOString()
        });
      }
      
      // Commit this batch
      await batch.commit();
      batch._reset(); // Reset batch for next iteration
    }
    
    console.log(`[${tenantId}] Successfully stored ${products.length} products in Firestore`);
  } catch (error) {
    console.error(`[${tenantId}] Error storing products in Firestore:`, error.message);
    throw error;
  }
}

// Add endpoint to get tenant products
app.get('/api/products', async (req, res) => {
  try {
    console.log(`[GET /api/products] Request from tenantId: ${req.tenantId}`);
    
    const productsCollection = firestore.collection('tenants').doc(req.tenantId).collection('products');
    const snapshot = await productsCollection.get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`[GET /api/products] Returning ${products.length} products for tenant ${req.tenantId}`);
    console.log(`[GET /api/products] Products:`, JSON.stringify(products).substring(0, 500));
    
    res.json(products);
  } catch (error) {
    console.error(`[${req.tenantId}] Error fetching products:`, error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add endpoint to create a new product
app.post('/api/products', async (req, res) => {
  try {
    console.log(`[${req.tenantId}] Creating product...`, { tenantId: req.tenantId, userId: req.userId });
    
    if (!req.tenantId) {
      console.error('No tenantId found in request!');
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const productData = req.body;
    console.log(`[${req.tenantId}] Product data:`, JSON.stringify(productData).substring(0, 200));
    
    // Generate a unique ID for the product
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add timestamps
    const productDoc = {
      ...productData,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store product in tenant-specific collection
    const productsCollection = firestore.collection('tenants').doc(req.tenantId).collection('products');
    await productsCollection.doc(productId).set(productDoc);
    
    console.log(`[${req.tenantId}] Product created successfully: ${productId}`);
    
    res.status(201).json({ 
      message: 'Product created successfully',
      product: productDoc
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error creating product:`, error);
    res.status(500).json({ error: 'Failed to create product: ' + error.message });
  }
});

// Add endpoint to delete a product
app.delete('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Delete product from tenant-specific collection
    const productsCollection = firestore.collection('tenants').doc(req.tenantId).collection('products');
    await productsCollection.doc(productId).delete();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(`[${req.tenantId}] Error deleting product:`, error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Add endpoint to update a product
app.put('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const productData = req.body;
    
    console.log(`[${req.tenantId}] Updating product: ${productId}`);
    
    // Add updated timestamp
    const productDoc = {
      ...productData,
      id: productId,
      updatedAt: new Date().toISOString()
    };
    
    // Update product in tenant-specific collection
    const productsCollection = firestore.collection('tenants').doc(req.tenantId).collection('products');
    await productsCollection.doc(productId).update(productDoc);
    
    console.log(`[${req.tenantId}] Product updated successfully: ${productId}`);
    
    res.json({ 
      message: 'Product updated successfully',
      product: productDoc
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error updating product:`, error);
    res.status(500).json({ error: 'Failed to update product: ' + error.message });
  }
});

// Add endpoint to manually trigger product fetching
app.post('/api/fetch-products', async (req, res) => {
  try {
    const tenant = await tenantManager.getTenant(req.tenantId);
    
    if (!tenant.productApi || !tenant.productApi.enabled) {
      return res.status(400).json({ error: 'Product API not enabled for this tenant' });
    }
    
    console.log(`[${req.tenantId}] Manually fetching products from API...`);
    const products = await productFetcher.fetchProductsFromWebsite(tenant.productApi);
    console.log(`[${req.tenantId}] Successfully fetched ${products.length} products`);
    
    // Store products in Firestore
    await storeTenantProducts(req.tenantId, products);
    
    res.json({ 
      message: `Successfully fetched and stored ${products.length} products`,
      productCount: products.length
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error fetching products:`, error);
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

// Add endpoint to get bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { status, date, search } = req.query;
    
    // Get bookings collection for this tenant
    const bookingsCollection = firestore.collection('tenants').doc(req.tenantId).collection('bookings');
    let query = bookingsCollection.orderBy('createdAt', 'desc');
    
    // Apply status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    // Apply date filter
    if (date && date !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (date) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query = query.where('createdAt', '>=', startDate);
      }
    }
    
    // Execute query
    const snapshot = await query.get();
    
    const bookings = [];
    snapshot.forEach(doc => {
      const booking = { id: doc.id, ...doc.data() };
      
      // Apply search filter on server side (if needed)
      if (search) {
        const searchTerm = search.toLowerCase();
        const customerName = (booking.customerName || '').toLowerCase();
        const customerPhone = (booking.customerPhone || '').toLowerCase();
        
        if (customerName.includes(searchTerm) || customerPhone.includes(searchTerm)) {
          bookings.push(booking);
        }
      } else {
        bookings.push(booking);
      }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error(`[${req.tenantId}] Error fetching bookings:`, error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Add endpoint to get booking details
app.get('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking document
    const bookingDoc = await firestore.collection('tenants').doc(req.tenantId).collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = { id: bookingDoc.id, ...bookingDoc.data() };
    res.json(booking);
  } catch (error) {
    console.error(`[${req.tenantId}] Error fetching booking details:`, error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// Add endpoint to update booking
app.put('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    
    // Add timestamps
    const bookingDoc = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Update booking in tenant-specific collection
    const bookingsCollection = firestore.collection('tenants').doc(req.tenantId).collection('bookings');
    await bookingsCollection.doc(bookingId).update(bookingDoc);
    
    res.json({ 
      message: 'Booking updated successfully',
      booking: { id: bookingId, ...bookingDoc }
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error updating booking:`, error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Add endpoint to create a new booking (for webhook integration)
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Generate a unique ID for the booking
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add timestamps and default status
    const bookingDoc = {
      ...bookingData,
      id: bookingId,
      status: bookingData.status || 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store booking in tenant-specific collection
    const bookingsCollection = firestore.collection('tenants').doc(req.tenantId).collection('bookings');
    await bookingsCollection.doc(bookingId).set(bookingDoc);
    
    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: bookingDoc
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error creating booking:`, error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Add endpoint for image upload (updated to handle multiple files)
app.post('/api/upload', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    
    const urls = [];
    
    // Upload each file
    for (const file of req.files) {
      // Generate a unique filename
      const fileName = `${req.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.originalname}`;
      
      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const storageFile = bucket.file(`products/${req.tenantId}/${fileName}`);
      
      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          cacheControl: 'public, max-age=31536000' // 1 year cache
        }
      });
      
      // Make the file publicly readable
      await storageFile.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFile.name}`;
      urls.push(publicUrl);
    }
    
    res.json({ 
      message: 'Images uploaded successfully',
      urls: urls
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error uploading images:`, error);
    res.status(500).json({ error: error.message || 'Failed to upload images' });
  }
});

// Add endpoint to update a product
app.put('/api/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const productData = req.body;
    
    // Add timestamps
    const productDoc = {
      ...productData,
      updatedAt: new Date().toISOString()
    };
    
    // Update product in tenant-specific collection
    const productsCollection = firestore.collection('tenants').doc(req.tenantId).collection('products');
    await productsCollection.doc(productId).update(productDoc);
    
    res.json({ 
      message: 'Product updated successfully',
      product: productDoc
    });
  } catch (error) {
    console.error(`[${req.tenantId}] Error updating product:`, error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

module.exports = app;