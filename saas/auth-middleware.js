/**
 * Authentication Middleware for SaaS version
 * Handles tenant identification and authentication
 */

const jwt = require('jsonwebtoken');
const tenantManager = require('./tenant-manager');

// Secret key for JWT (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-sales-channel-secret-key';

/**
 * Generate JWT token for tenant
 * @param {string} tenantId - Tenant identifier
 * @returns {string} JWT token
 */
function generateToken(tenantId) {
  return jwt.sign({ tenantId }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify JWT token and extract tenant ID
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Authentication middleware
 * Extracts tenant ID from JWT token and attaches to request
 */
function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if tenant exists
    const tenant = tenantManager.getTenant(decoded.tenantId);
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid tenant' });
    }
    
    // Attach tenant ID to request
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Tenant context middleware
 * Loads tenant configuration and attaches to request
 */
function tenantContext(req, res, next) {
  if (!req.tenantId) {
    return next();
  }
  
  try {
    const tenant = tenantManager.getTenant(req.tenantId);
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
  generateToken,
  verifyToken,
  authenticate,
  tenantContext
};