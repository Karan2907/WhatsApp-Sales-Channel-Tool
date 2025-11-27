const productFetcher = require('../api/productFetcher');

// Mock configuration for testing
const mockConfig = {
  productApi: {
    enabled: true,
    url: 'http://localhost:3001/api/products',
    authType: 'none',
    refreshInterval: 0.1 // 0.1 minutes = 6 seconds for testing
  }
};

// Temporarily override the config loading in productFetcher
// This is a bit of a hack, but it works for testing
const originalConfigPath = '../config/config.json';
require.cache[require.resolve('../config/config.json')] = {
  exports: mockConfig
};

console.log('Testing periodic product fetching...');
console.log('This test will run for about 20 seconds and show two fetch cycles.');

// Set up periodic fetching with a callback to log results
productFetcher.startPeriodicFetching((error, products) => {
  if (error) {
    console.error('Error in periodic fetching:', error.message);
  } else {
    console.log(`Fetched ${products.length} products at ${new Date().toISOString()}`);
    if (products.length > 0) {
      console.log(`Sample product: ${products[0].name}`);
    }
  }
});

// Run for 20 seconds then exit
setTimeout(() => {
  console.log('Periodic fetching test completed.');
  process.exit(0);
}, 20000);