/**
 * Product Fetcher for WhatsApp Sales Channel Tool
 * Handles fetching products from client's website API
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '../config/config.json');
let config = {};

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.error('Error loading config for product fetcher:', error);
}

/**
 * Fetch products from client's website API
 * @param {Object} productApiConfig - Product API configuration
 * @returns {Promise<Array>} - Promise resolving to array of products
 */
function fetchProductsFromWebsite(productApiConfig) {
  return new Promise((resolve, reject) => {
    if (!productApiConfig || !productApiConfig.enabled || !productApiConfig.url) {
      reject(new Error('Product API not configured'));
      return;
    }

    const url = new URL(productApiConfig.url);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET'
    };

    // Add authentication headers if configured
    if (!options.headers) {
      options.headers = {};
    }

    switch (productApiConfig.authType) {
      case 'bearer':
        if (productApiConfig.bearerToken) {
          options.headers['Authorization'] = `Bearer ${productApiConfig.bearerToken}`;
        }
        break;
      case 'basic':
        if (productApiConfig.username && productApiConfig.password) {
          const auth = Buffer.from(`${productApiConfig.username}:${productApiConfig.password}`).toString('base64');
          options.headers['Authorization'] = `Basic ${auth}`;
        }
        break;
      case 'apikey':
        if (productApiConfig.apiKeyHeader && productApiConfig.apiKeyValue) {
          options.headers[productApiConfig.apiKeyHeader] = productApiConfig.apiKeyValue;
        }
        break;
    }

    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const products = JSON.parse(data);
          resolve(products);
        } catch (error) {
          reject(new Error(`Failed to parse product data: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Failed to fetch products: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Get products either from API or fallback to local file
 * @returns {Promise<Array>} - Promise resolving to array of products
 */
async function getProducts() {
  // If product API is enabled and configured, try to fetch from API
  if (config.productApi && config.productApi.enabled && config.productApi.url) {
    try {
      console.log('Fetching products from client website API...');
      const products = await fetchProductsFromWebsite(config.productApi);
      console.log(`Successfully fetched ${products.length} products from API`);
      return products;
    } catch (error) {
      console.error('Error fetching products from API, falling back to local file:', error.message);
    }
  }

  // Fallback to local products file
  try {
    const productsPath = path.join(__dirname, '../config/products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      console.log(`Loaded ${products.length} products from local file`);
      return products;
    } else {
      console.warn('Local products file not found');
      return [];
    }
  } catch (error) {
    console.error('Error loading local products file:', error.message);
    return [];
  }
}

/**
 * Start periodic product fetching
 * @param {Function} callback - Function to call with fetched products
 */
function startPeriodicFetching(callback) {
  if (!config.productApi || !config.productApi.enabled) {
    console.log('Product API not enabled, skipping periodic fetching');
    return;
  }

  const intervalMinutes = config.productApi.refreshInterval || 60;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`Starting periodic product fetching every ${intervalMinutes} minutes`);

  // Fetch immediately
  fetchAndNotify(callback);

  // Set up interval
  setInterval(() => {
    fetchAndNotify(callback);
  }, intervalMs);
}

/**
 * Fetch products and notify callback
 * @param {Function} callback - Function to call with fetched products
 */
async function fetchAndNotify(callback) {
  try {
    const products = await getProducts();
    if (callback && typeof callback === 'function') {
      callback(null, products);
    }
  } catch (error) {
    console.error('Error in periodic product fetching:', error.message);
    if (callback && typeof callback === 'function') {
      callback(error, []);
    }
  }
}

// Export functions
module.exports = {
  fetchProductsFromWebsite,
  getProducts,
  startPeriodicFetching
};