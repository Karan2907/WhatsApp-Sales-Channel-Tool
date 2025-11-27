/**
 * Firebase Authentication Middleware for SaaS version
 * Handles tenant identification and authentication using Firebase
 */

const admin = require('firebase-admin');
const { getTenant } = require('./firebase-tenant-manager');

// Secret key for JWT (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-sales-channel-secret-key';

/**
 * Generate custom token for tenant
 * @param {string} tenantId - Tenant identifier
 * @returns {string} Custom token
 */
async function generateCustomToken(tenantId) {
  try {
    // Get tenant to verify it exists
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    // Generate custom token with tenant claims
    const customToken = await admin.auth().createCustomToken(tenant.userId, {
      tenantId: tenantId,
      role: 'tenant'
    });
    
    return customToken;
  } catch (error) {
    throw new Error(`Failed to generate custom token: ${error.message}`);
  }
}

/**
 * Verify Firebase ID token and extract tenant ID
 * @param {string} idToken - Firebase ID token
 * @returns {Object} Decoded token payload
 */
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
}

/**
 * Authentication middleware
 * Extracts tenant ID from Firebase ID token and attaches to request
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const idToken = authHeader.substring(7);
    
    // Verify token
    const decodedToken = await verifyIdToken(idToken);
    
    // Extract tenant ID from custom claims
    const tenantId = decodedToken.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Token does not contain tenant information' });
    }
    
    // Check if tenant exists
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid tenant' });
    }
    
    // Attach tenant information to request
    req.tenantId = tenantId;
    req.userId = decodedToken.uid;
    req.tenant = tenant;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

/**
 * Tenant context middleware
 * Loads tenant configuration and attaches to request
 */
async function tenantContext(req, res, next) {
  if (!req.tenantId) {
    return next();
  }
  
  try {
    const tenant = await getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error loading tenant configuration' });
  }
}

// Export functions
module.exports = {
  generateCustomToken,
  verifyIdToken,
  authenticate,
  tenantContext
};