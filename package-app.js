const fs = require('fs');
const path = require('path');

// Function to copy files and directories recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Create app directory
const appDir = path.join(distDir, 'WhatsApp-Sales-Channel-Tool');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir);
}

// Copy necessary files and directories
const filesToCopy = [
  'main.js',
  'preload.js',
  'package.json',
  'webhooks',
  'api',
  'public',
  'config',
  'test',
  'docs',
  'install-as-service.bat',
  'uninstall-service.bat',
  'monitor-service.bat'
];

console.log('Packaging application...');

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(appDir, file);
  
  if (fs.existsSync(src)) {
    console.log(`Copying ${file}...`);
    copyRecursiveSync(src, dest);
  }
});

// Create a simple start script
const startScript = `@echo off
cd /d "%~dp0"
node main.js
`;
fs.writeFileSync(path.join(appDir, 'start.bat'), startScript);

// Create a simple README for the packaged app
const readmeContent = `# WhatsApp Sales Channel Tool

## Installation

1. Extract this folder to a location of your choice
2. Install Node.js (version 16 or higher) if not already installed
3. Run start.bat to launch the application

## Usage

1. Configure your WhatsApp provider settings through the application interface
2. Set up webhooks from your booking platform to the provided endpoints
3. Start engaging with your guests through automated WhatsApp flows

## Webhook Endpoints

Once the application is running, configure your booking platform to send webhooks to these endpoints:

- Booking Started: http://localhost:3000/webhook/booking-started
- Booking Abandoned: http://localhost:3000/webhook/booking-abandoned
- Reservation Confirmed: http://localhost:3000/webhook/reservation-confirmed
- Guest Checked In: http://localhost:3000/webhook/guest-checked-in
- Health Check: http://localhost:3000/health

## Support

For issues and questions, please refer to the documentation in the docs/ directory or contact support.
`;

fs.writeFileSync(path.join(appDir, 'README.txt'), readmeContent);

console.log('Application packaged successfully!');
console.log(`Location: ${appDir}`);