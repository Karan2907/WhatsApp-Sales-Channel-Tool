/**
 * Setup script for WhatsApp Sales Channel Tool for Resort Owners
 * Helps resort owners configure the tool for their specific provider
 */

const fs = require('fs');
const path = require('path');

console.log('WhatsApp Sales Channel Tool Setup for Resort Owners');
console.log('==================================================\n');

// Check if config file exists
const configPath = path.join(__dirname, 'config', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found!');
  process.exit(1);
}

// Load current configuration
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Welcome to the WhatsApp Sales Channel Tool setup for your resort!');
console.log('This script will help you configure the tool for your provider.\n');

// Provider selection
console.log('Available providers:');
console.log('1. WhatsApp Business API (Meta)');
console.log('2. Twilio');
console.log('3. Gupshup\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\nConfiguration saved successfully!');
  console.log('You can now start the server with: npm start');
  rl.close();
}

function configureWhatsAppCloudAPI() {
  console.log('\nConfiguring WhatsApp Business API (Meta):');
  
  rl.question('Enter your Facebook Access Token: ', (token) => {
    config.whatsapp.accessToken = token;
    
    rl.question('Enter your Phone Number ID: ', (phoneId) => {
      config.whatsapp.phoneNumberId = phoneId;
      
      rl.question('Enter your Business Account ID (optional): ', (businessId) => {
        config.whatsapp.businessAccountId = businessId || '';
        config.whatsapp.provider = 'whatsapp-cloud-api';
        config.whatsapp.apiEndpoint = 'https://graph.facebook.com/v20.0';
        saveConfig();
      });
    });
  });
}

function configureTwilio() {
  console.log('\nConfiguring Twilio:');
  
  rl.question('Enter your Twilio Account SID: ', (sid) => {
    config.whatsapp.accountSid = sid;
    
    rl.question('Enter your Twilio Auth Token: ', (token) => {
      config.whatsapp.authToken = token;
      
      rl.question('Enter your Twilio WhatsApp Phone Number (e.g., +1234567890): ', (phone) => {
        config.whatsapp.phoneNumber = phone;
        config.whatsapp.provider = 'twilio';
        config.whatsapp.apiEndpoint = 'https://api.twilio.com/2010-04-01/Accounts';
        saveConfig();
      });
    });
  });
}

function configureGupshup() {
  console.log('\nConfiguring Gupshup:');
  
  rl.question('Enter your Gupshup API Key: ', (apiKey) => {
    config.whatsapp.apiKey = apiKey;
    
    rl.question('Enter your Gupshup App Name: ', (appName) => {
      config.whatsapp.appName = appName;
      config.whatsapp.provider = 'gupshup';
      config.whatsapp.apiEndpoint = 'https://api.gupshup.io/sm/api/v1/template/msg';
      saveConfig();
    });
  });
}

function configureFromEnvironment() {
  console.log('\nConfiguring from environment variables:');
  
  // Check for environment variables
  if (process.env.WHATSAPP_PROVIDER) {
    config.whatsapp.provider = process.env.WHATSAPP_PROVIDER;
    
    switch(process.env.WHATSAPP_PROVIDER) {
      case 'whatsapp-cloud-api':
        config.whatsapp.apiEndpoint = 'https://graph.facebook.com/v20.0';
        config.whatsapp.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
        config.whatsapp.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        config.whatsapp.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
        break;
        
      case 'twilio':
        config.whatsapp.apiEndpoint = 'https://api.twilio.com/2010-04-01/Accounts';
        config.whatsapp.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        config.whatsapp.authToken = process.env.TWILIO_AUTH_TOKEN || '';
        config.whatsapp.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
        break;
        
      case 'gupshup':
        config.whatsapp.apiEndpoint = 'https://api.gupshup.io/sm/api/v1/template/msg';
        config.whatsapp.apiKey = process.env.GUPSHUP_API_KEY || '';
        config.whatsapp.appName = process.env.GUPSHUP_APP_NAME || '';
        break;
    }
    
    console.log(`Configured provider: ${config.whatsapp.provider}`);
    saveConfig();
  } else {
    console.log('No WHATSAPP_PROVIDER environment variable found.');
    console.log('Please set environment variables or run interactive setup.');
    rl.close();
  }
}

// Check if running in environment mode (for Vercel)
if (process.argv.includes('--env')) {
  configureFromEnvironment();
} else {
  rl.question('Select your provider (1-3) or press Enter for environment setup: ', (answer) => {
    switch(answer) {
      case '1':
        configureWhatsAppCloudAPI();
        break;
      case '2':
        configureTwilio();
        break;
      case '3':
        configureGupshup();
        break;
      case '':
        configureFromEnvironment();
        break;
      default:
        console.log('Invalid selection. Please run the setup again.');
        rl.close();
    }
  });
}