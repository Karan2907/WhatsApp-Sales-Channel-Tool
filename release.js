const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating release package...');

// Run the packaging script
console.log('Packaging application...');
execSync('node package-app.js', { stdio: 'inherit' });

// Create zip file
console.log('Creating ZIP archive...');
const appDir = path.join(__dirname, 'dist', 'WhatsApp-Sales-Channel-Tool');
const zipFile = path.join(__dirname, 'dist', 'WhatsApp-Sales-Channel-Tool.zip');

// Use PowerShell to create the zip file
execSync(`powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });

console.log('Release package created successfully!');
console.log(`Location: ${zipFile}`);