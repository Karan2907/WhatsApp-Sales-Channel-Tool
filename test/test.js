/**
 * Simple test script for WhatsApp Sales Channel Tool
 */

const fs = require('fs');
const path = require('path');

console.log('Running WhatsApp Sales Channel Tool tests...\n');

// Test 1: Check if configuration files exist
console.log('Test 1: Checking configuration files...');
try {
  const configPath = path.join(__dirname, '../config/config.json');
  const configExists = fs.existsSync(configPath);
  console.log(`  config.json exists: ${configExists}`);
  
  const productsPath = path.join(__dirname, '../config/products.json');
  const productsExist = fs.existsSync(productsPath);
  console.log(`  products.json exists: ${productsExist}`);
  
  if (configExists && productsExist) {
    console.log('  ✓ Configuration files test PASSED\n');
  } else {
    console.log('  ✗ Configuration files test FAILED\n');
  }
} catch (error) {
  console.log('  ✗ Configuration files test FAILED:', error.message, '\n');
}

// Test 2: Check if required modules can be loaded
console.log('Test 2: Checking module imports...');
try {
  const cartHandler = require('../webhooks/cartHandler');
  const orderHandler = require('../webhooks/orderHandler');
  const whatsappClient = require('../api/whatsappClient');
  const app = require('../app');
  
  console.log('  ✓ All modules imported successfully\n');
} catch (error) {
  console.log('  ✗ Module import test FAILED:', error.message, '\n');
}

// Test 3: Check configuration structure
console.log('Test 3: Checking configuration structure...');
try {
  const configPath = path.join(__dirname, '../config/config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const requiredConfigSections = ['whatsapp', 'webhook', 'timings', 'brand'];
  let allSectionsPresent = true;
  
  requiredConfigSections.forEach(section => {
    if (config.hasOwnProperty(section)) {
      console.log(`  ${section}: ✓`);
    } else {
      console.log(`  ${section}: ✗`);
      allSectionsPresent = false;
    }
  });
  
  if (allSectionsPresent) {
    console.log('  ✓ Configuration structure test PASSED\n');
  } else {
    console.log('  ✗ Configuration structure test FAILED\n');
  }
} catch (error) {
  console.log('  ✗ Configuration structure test FAILED:', error.message, '\n');
}

// Test 4: Check product data structure
console.log('Test 4: Checking product data structure...');
try {
  const productsPath = path.join(__dirname, '../config/products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  
  if (Array.isArray(products) && products.length > 0) {
    const firstProduct = products[0];
    const requiredProductFields = ['id', 'name', 'price', 'benefit', 'url', 'category'];
    let allFieldsPresent = true;
    
    requiredProductFields.forEach(field => {
      if (firstProduct.hasOwnProperty(field)) {
        console.log(`  ${field}: ✓`);
      } else {
        console.log(`  ${field}: ✗`);
        allFieldsPresent = false;
      }
    });
    
    if (allFieldsPresent) {
      console.log('  ✓ Product data structure test PASSED\n');
    } else {
      console.log('  ✗ Product data structure test FAILED\n');
    }
  } else {
    console.log('  ✗ Product data structure test FAILED: No products found\n');
  }
} catch (error) {
  console.log('  ✗ Product data structure test FAILED:', error.message, '\n');
}

// Test 5: Test WhatsApp client functions
console.log('Test 5: Testing WhatsApp client functions...');
try {
  const whatsappClient = require('../api/whatsappClient');
  
  // Test validation function
  const isValid = whatsappClient.validateConfig();
  console.log(`  Configuration validation: ${isValid ? '✓' : '✗ (Expected if not configured)'}`);
  
  console.log('  ✓ WhatsApp client functions test COMPLETED\n');
} catch (error) {
  console.log('  ✗ WhatsApp client functions test FAILED:', error.message, '\n');
}

// Test 6: Check if server file exists
console.log('Test 6: Checking server components...');
try {
  const serverPath = path.join(__dirname, '../webhooks/server.js');
  const serverExists = fs.existsSync(serverPath);
  console.log(`  server.js exists: ${serverExists}`);
  
  if (serverExists) {
    console.log('  ✓ Server components test PASSED\n');
  } else {
    console.log('  ✗ Server components test FAILED\n');
  }
} catch (error) {
  console.log('  ✗ Server components test FAILED:', error.message, '\n');
}

console.log('All tests completed. Check results above.');
console.log('\nTo run the tool:');
console.log('1. Configure with: npm run setup');
console.log('2. Start server with: npm start');
console.log('3. Run demo with: npm run demo');