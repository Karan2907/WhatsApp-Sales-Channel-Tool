const productFetcher = require('../api/productFetcher');

async function testProductFetching() {
  console.log('Testing product fetching...');
  
  // Test with the mock API configuration
  const mockApiConfig = {
    enabled: true,
    url: 'http://localhost:3001/api/products',
    authType: 'none',
    refreshInterval: 1
  };
  
  try {
    console.log('Fetching products from mock API...');
    const products = await productFetcher.fetchProductsFromWebsite(mockApiConfig);
    console.log(`Successfully fetched ${products.length} products:`);
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error fetching products:', error.message);
  }
  
  // Test with authenticated API
  const authApiConfig = {
    enabled: true,
    url: 'http://localhost:3001/api/products-auth',
    authType: 'bearer',
    bearerToken: 'test-token-123',
    refreshInterval: 1
  };
  
  try {
    console.log('\nFetching products from authenticated mock API...');
    const products = await productFetcher.fetchProductsFromWebsite(authApiConfig);
    console.log(`Successfully fetched ${products.length} products:`);
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error fetching products with auth:', error.message);
  }
}

testProductFetching();