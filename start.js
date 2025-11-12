/**
 * Startup script for WhatsApp Sales Channel Tool
 * Checks configuration and starts the server
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Load configuration
const configPath = path.join(__dirname, 'config', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: config.json not found!');
  console.error('Please run "npm run setup" first to configure the tool.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('WhatsApp Sales Channel Tool');
console.log('==========================\n');

// Check if provider is configured
if (!config.whatsapp || !config.whatsapp.provider) {
  console.warn('Warning: WhatsApp provider not configured!');
  console.log('Please run "npm run setup" to configure your provider.\n');
  
  // Try to configure from environment variables if available
  if (process.env.WHATSAPP_PROVIDER) {
    console.log('Attempting to configure from environment variables...');
    configureFromEnvironment();
  }
}

function configureFromEnvironment() {
  // Update config with environment variables
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
    
    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Configured provider: ${config.whatsapp.provider}`);
  }
}

console.log('Starting webhook server...');
console.log('Server will be available on port ' + (process.env.PORT || 3000));
console.log('Press Ctrl+C to stop the server\n');

// Start the server
exec('node webhooks/server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting server: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`Server error: ${stderr}`);
  }
  
  console.log(stdout);
});