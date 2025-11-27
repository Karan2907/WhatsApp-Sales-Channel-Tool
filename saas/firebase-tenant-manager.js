/**
 * Firebase Tenant Manager for SaaS version
 * Handles multi-tenancy using Firebase Firestore and Authentication
 */

const { firestore, auth } = require('./firebase-config');

/**
 * Create a new tenant user and tenant configuration
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} tenantId - Unique identifier for the tenant
 * @param {Object} tenantData - Tenant configuration data
 * @returns {Object} Created user and tenant information
 */
async function createTenantUser(email, password, tenantId, tenantData) {
  try {
    let userRecord;
    
    // Check if user already exists
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, create new user
      const userConfig = {
        email: email,
        displayName: tenantData.displayName || tenantId
      };
      
      // Only set password if it's not a Google auth placeholder
      if (password !== 'google-auth') {
        userConfig.password = password;
      }
      
      userRecord = await auth.createUser(userConfig);
    }
    
    // Create tenant configuration in Firestore
    const tenantDoc = {
      id: tenantId,
      userId: userRecord.uid,
      email: email,
      displayName: tenantData.displayName || tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add product API configuration if provided
    if (tenantData.productApi) {
      tenantDoc.productApi = {
        enabled: tenantData.productApi.enabled || false,
        url: tenantData.productApi.url || '',
        authType: tenantData.productApi.authType || 'none',
        bearerToken: tenantData.productApi.bearerToken || '',
        username: tenantData.productApi.username || '',
        password: tenantData.productApi.password || '',
        apiKeyHeader: tenantData.productApi.apiKeyHeader || '',
        apiKeyValue: tenantData.productApi.apiKeyValue || '',
        refreshInterval: tenantData.productApi.refreshInterval || 60
      };
    }
    
    // Add WhatsApp configuration if provided
    if (tenantData.whatsapp) {
      tenantDoc.whatsapp = {
        provider: tenantData.whatsapp.provider || '',
        accessToken: tenantData.whatsapp.accessToken || '',
        phoneNumberId: tenantData.whatsapp.phoneNumberId || '',
        businessAccountId: tenantData.whatsapp.businessAccountId || '',
        accountSid: tenantData.whatsapp.accountSid || '',
        authToken: tenantData.whatsapp.authToken || '',
        phoneNumber: tenantData.whatsapp.phoneNumber || '',
        apiKey: tenantData.whatsapp.apiKey || '',
        appName: tenantData.whatsapp.appName || '',
        verifyToken: tenantData.whatsapp.verifyToken || ''
      };
    }
    
    // Save tenant configuration to Firestore
    await firestore.collection('tenants').doc(tenantId).set(tenantDoc, { merge: true });
    
    return {
      uid: userRecord.uid,
      tenantId: tenantId,
      email: email
    };
  } catch (error) {
    throw new Error(`Failed to create tenant: ${error.message}`);
  }
}

/**
 * Get tenant configuration from Firestore
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object|null} Tenant configuration or null if not found
 */
async function getTenant(tenantId) {
  try {
    const tenantDoc = await firestore.collection('tenants').doc(tenantId).get();
    
    if (tenantDoc.exists) {
      return { id: tenantDoc.id, ...tenantDoc.data() };
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to get tenant: ${error.message}`);
  }
}

/**
 * Update tenant configuration in Firestore
 * @param {string} tenantId - Unique identifier for the tenant
 * @param {Object} updates - Configuration updates
 * @returns {Object} Updated tenant configuration
 */
async function updateTenant(tenantId, updates) {
  try {
    // Remove id from updates if present
    const { id, ...updateData } = updates;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date().toISOString();
    
    // Update tenant configuration in Firestore
    await firestore.collection('tenants').doc(tenantId).update(updateData);
    
    // Return updated tenant
    return await getTenant(tenantId);
  } catch (error) {
    throw new Error(`Failed to update tenant: ${error.message}`);
  }
}

/**
 * Delete a tenant and associated user
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {boolean} True if deleted successfully
 */
async function deleteTenant(tenantId) {
  try {
    // Get tenant to find associated user
    const tenant = await getTenant(tenantId);
    
    if (!tenant) {
      return false;
    }
    
    // Delete tenant configuration from Firestore
    await firestore.collection('tenants').doc(tenantId).delete();
    
    // Delete Firebase Authentication user
    await auth.deleteUser(tenant.userId);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to delete tenant: ${error.message}`);
  }
}

/**
 * List all tenants
 * @returns {Array} Array of tenant objects
 */
async function listTenants() {
  try {
    const snapshot = await firestore.collection('tenants').get();
    const tenants = [];
    
    snapshot.forEach(doc => {
      tenants.push({ id: doc.id, ...doc.data() });
    });
    
    return tenants;
  } catch (error) {
    throw new Error(`Failed to list tenants: ${error.message}`);
  }
}

/**
 * Authenticate tenant user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Authentication result with token
 */
async function authenticateTenantUser(email, password) {
  try {
    // In a real implementation, you would use Firebase Client SDK for sign-in
    // This is a simplified version for server-side validation
    
    // Find tenant by email
    const snapshot = await firestore.collection('tenants')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      throw new Error('Tenant not found');
    }
    
    const tenantDoc = snapshot.docs[0];
    const tenant = { id: tenantDoc.id, ...tenantDoc.data() };
    
    // In a real implementation, you would verify the password
    // For now, we'll just return the tenant information
    
    return {
      tenantId: tenant.id,
      userId: tenant.userId,
      email: tenant.email
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Get tenant-specific product fetcher configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object} Product API configuration for the tenant
 */
async function getTenantProductApiConfig(tenantId) {
  try {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    
    return tenant.productApi || {};
  } catch (error) {
    throw new Error(`Failed to get tenant product API config: ${error.message}`);
  }
}

/**
 * Get tenant-specific WhatsApp configuration
 * @param {string} tenantId - Unique identifier for the tenant
 * @returns {Object} WhatsApp configuration for the tenant
 */
async function getTenantWhatsAppConfig(tenantId) {
  try {
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    
    return tenant.whatsapp || {};
  } catch (error) {
    throw new Error(`Failed to get tenant WhatsApp config: ${error.message}`);
  }
}

// Export functions
module.exports = {
  createTenantUser,
  getTenant,
  updateTenant,
  deleteTenant,
  listTenants,
  authenticateTenantUser,
  getTenantProductApiConfig,
  getTenantWhatsAppConfig
};