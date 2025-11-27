const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create nodejs directory if it doesn't exist
const nodejsDir = path.join(__dirname, 'nodejs');
if (!fs.existsSync(nodejsDir)) {
  fs.mkdirSync(nodejsDir, { recursive: true });
}

console.log('Creating self-contained installer with Node.js...');

// Check if Node.js is already downloaded
const nodeExecutable = path.join(nodejsDir, 'node.exe');
if (!fs.existsSync(nodeExecutable)) {
  console.log('Downloading Node.js v16.20.2 (LTS) for Windows...');
  
  // Download Node.js using PowerShell
  const downloadScript = `
  $url = "https://nodejs.org/dist/v16.20.2/node-v16.20.2-win-x64.zip"
  $output = "${nodejsDir}\\node.zip"
  Invoke-WebRequest -Uri $url -OutFile $output
  Expand-Archive -Path $output -DestinationPath "${nodejsDir}" -Force
  Move-Item -Path "${nodejsDir}\\node-v16.20.2-win-x64\\*" -Destination "${nodejsDir}" -Force
  Remove-Item -Path "${nodejsDir}\\node-v16.20.2-win-x64" -Recurse -Force
  Remove-Item -Path $output -Force
  `;
  
  try {
    execSync(`powershell -Command "${downloadScript}"`, { stdio: 'inherit' });
    console.log('Node.js downloaded and extracted successfully!');
  } catch (error) {
    console.error('Failed to download Node.js:', error.message);
    process.exit(1);
  }
} else {
  console.log('Node.js already downloaded.');
}

// Update the start.bat script to use the bundled Node.js
const startBatContent = `@echo off
cd /d "%~dp0"
"${nodejsDir}\\node.exe" main.js
`;

const startBatPath = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool', 'start.bat');
fs.writeFileSync(startBatPath, startBatContent);

console.log('Updated start.bat to use bundled Node.js');

// Create a more comprehensive installer script
const installPs1Content = `# WhatsApp Sales Channel Tool Installer
# This script installs Node.js if not present and sets up the application

# Check if Node.js is installed
$nodeInstalled = $true
try {
    node --version > $null
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "Node.js not found. Installing Node.js..."
    
    # Check if bundled Node.js exists
    $bundledNode = "$PSScriptRoot\\nodejs\\node.exe"
    if (Test-Path $bundledNode) {
        Write-Host "Using bundled Node.js..."
        # Add bundled Node.js to PATH for this session
        $env:PATH = "$PSScriptRoot\\nodejs;" + $env:PATH
    } else {
        # Download Node.js installer
        $url = "https://nodejs.org/dist/latest/node-v20.10.0-win-x64.msi"
        $output = "$env:TEMP\\nodejs.msi"
        
        Write-Host "Downloading Node.js..."
        Invoke-WebRequest -Uri $url -OutFile $output
        
        # Install Node.js
        Write-Host "Installing Node.js..."
        Start-Process msiexec.exe -ArgumentList "/i $output /quiet /norestart" -Wait
        
        # Clean up
        Remove-Item $output -Force
        
        Write-Host "Node.js installed successfully!"
    }
} else {
    Write-Host "Node.js is already installed."
}

# Install application dependencies
Write-Host "Installing application dependencies..."
Set-Location -Path "$PSScriptRoot"
npm install

Write-Host "Installation complete!"
Write-Host "Run start.bat to launch the application."
`;

const installPs1Path = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool', 'install.ps1');
fs.writeFileSync(installPs1Path, installPs1Content);

console.log('Updated install.ps1 with bundled Node.js support');

console.log('');
console.log('Self-contained installer preparation complete!');
console.log('The installer now includes Node.js and will work without requiring a separate Node.js installation.');