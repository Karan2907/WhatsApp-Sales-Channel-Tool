/**
 * Tenant Manager for SaaS version of WhatsApp Sales Channel Tool
 * Handles multi-tenancy and client-specific configurations
 */

const fs = require('fs');
const path = require('path');

// Tenant data storage
const tenantsDir = path.join(__dirname, '../data/tenants');
if (!fs.existsSync(tenantsDir)) {
  fs.mkdirSync(tenantsDir, { recursive: true });
}

/**
 * Create a new tenant
 * @param {string} tenantId - Unique identifier for the tenant
 * @param {Object} tenantData - Tenant configuration data
 */
function createTenant(tenantId, tenantData) {
  const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
  
  const tenantConfig = {
    id: tenantId,
    createdAt: new Date().toISOString(),
    ...tenantData,
    productApi: {
      enabled: tenantData.productApi?.enabled || false,
      url: tenantData.productApi?.url || '',
      authType: tenantData.productApi?.authType || 'none',
      bearerToken: tenantData.productApi?.bearerToken || '',
      username: tenantData.productApi?.username || '',
      password: tenantData.productApi?.password || '',
      apiKeyHeader: tenantData.productApi?.apiKeyHeader || '',
      apiKeyValue: tenantData.productApi?.apiKeyValue || '',
      refreshInterval: tenantData.productApi?.refreshInterval || 60
    },
    whatsapp: {
      provider: tenantData.whatsapp?.provider || '',
      accessToken: tenantData.whatsapp?.accessToken || '',
      phoneNumberId: tenantData.whatsapp?.phoneNumberId || '',
      businessAccountId: tenantData.whatsapp?.businessAccountId || '',
      accountSid: tenantData.whatsapp?.accountSid || '',
      authToken: tenantData.whatsapp?.authToken || '',
      phoneNumber: tenantData.whatsapp?.phoneNumber || '',
      apiKey: tenantData.whatsapp?.apiKey || '',
      appName: tenantData.whatsapp?.appName || '',
      verifyToken: tenantData.whatsapp?.verifyToken || ''
    }
  };
  
  fs.writeFileSync(tenantPath, JSON.stringify(tenantConfig, null, 2));
  return tenantConfig;
}

/**
 * Get tenant configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object|null} Tenant configuration or null if not found
 */
function getTenant(tenantId) {
  const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
  
  if (fs.existsSync(tenantPath)) {
    const tenantData = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
    return tenantData;
  }
  
  return null;
}

/**
 * Update tenant configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @param {Object} updates - Configuration updates
 * @returns {Object|null} Updated tenant configuration or null if not found
 */
function updateTenant(tenantId, updates) {
  const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
  
  if (!fs.existsSync(tenantPath)) {
    return null;
  }
  
  const existingConfig = JSON.parse(fs.readFileSync(tenantPath, 'utf8'));
  const updatedConfig = { ...existingConfig, ...updates };
  
  fs.writeFileSync(tenantPath, JSON.stringify(updatedConfig, null, 2));
  return updatedConfig;
}

/**
 * Delete a tenant
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {boolean} True if deleted, false if not found
 */
function deleteTenant(tenantId) {
  const tenantPath = path.join(tenantsDir, `${tenantId}.json`);
  
  if (fs.existsSync(tenantPath)) {
    fs.unlinkSync(tenantPath);
    return true;
  }
  
  return false;
}

/**
 * List all tenants
 * @returns {Array} Array of tenant IDs
 */
function listTenants() {
  if (!fs.existsSync(tenantsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(tenantsDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Get tenant-specific product fetcher configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object} Product API configuration for the tenant
 */
function getTenantProductApiConfig(tenantId) {
  const tenant = getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }
  
  return tenant.productApi || {};
}

/**
 * Get tenant-specific WhatsApp configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object} WhatsApp configuration for the tenant
 */
function getTenantWhatsAppConfig(tenantId) {
  const tenant = getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }
  
  return tenant.whatsapp || {};
}

// Export functions
module.exports = {
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant,
  listTenants,
  getTenantProductApiConfig,
  getTenantWhatsAppConfig
};