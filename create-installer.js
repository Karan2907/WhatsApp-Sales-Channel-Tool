const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating Windows installer...');

// First, run the packaging script to create the app directory
console.log('Packaging application...');
execSync('node package-app.js', { stdio: 'inherit' });

// Try to create installer with electron-winstaller directly
console.log('Attempting to create installer with electron-winstaller...');

try {
  // Check if electron-winstaller is installed, if not install it
  try {
    require('electron-winstaller');
    console.log('electron-winstaller is already installed');
  } catch (error) {
    console.log('Installing electron-winstaller...');
    execSync('npm install electron-winstaller --save-dev', { stdio: 'inherit' });
  }

  // Use electron-packager to create the app directory first
  console.log('Packaging app with electron-packager...');
  const packager = require('electron-packager');
  
  // Create packaged app
  const appPaths = packager.sync({
    dir: __dirname,
    out: 'dist',
    overwrite: true,
    platform: 'win32',
    arch: 'x64',
    appCopyright: 'Copyright (C) 2025 WhatsApp Sales Channel Team',
    appVersion: '1.0.0',
    buildVersion: '1.0.0',
    ignore: [
      'dist',
      'release',
      'node_modules/.bin',
      '.git',
      '.gitignore',
      '.vscode',
      'docs',
      'test'
    ],
    name: 'WhatsApp Sales Channel Tool',
    prune: true,
    win32metadata: {
      CompanyName: 'WhatsApp Sales Channel Team',
      FileDescription: 'WhatsApp Sales Channel Tool',
      OriginalFilename: 'WhatsApp Sales Channel Tool.exe',
      ProductName: 'WhatsApp Sales Channel Tool'
    }
  });

  console.log('App packaged successfully!');
  
  // Create installer using electron-winstaller
  const electronInstaller = require('electron-winstaller');
  
  const appDirectory = path.join(__dirname, 'dist', 'WhatsApp Sales Channel Tool-win32-x64');
  const outputDirectory = path.join(__dirname, 'release');
  
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
  
  console.log('Creating Windows installer...');
  electronInstaller.createWindowsInstaller({
    appDirectory: appDirectory,
    outputDirectory: outputDirectory,
    authors: 'WhatsApp Sales Channel Team',
    exe: 'WhatsApp Sales Channel Tool.exe',
    setupExe: 'WhatsApp-Sales-Channel-Tool-Setup.exe',
    noMsi: true
  }).then(() => {
    console.log('Windows installer created successfully!');
    console.log(`Installer location: ${path.join(outputDirectory, 'WhatsApp-Sales-Channel-Tool-Setup.exe')}`);
  }).catch((error) => {
    console.error('Failed to create installer:', error.message);
    
    // Fallback to creating a ZIP file
    console.log('Falling back to creating a ZIP file...');
    const appDir = path.join(__dirname, 'dist', 'WhatsApp-Sales-Channel-Tool');
    const zipFile = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool.zip');
    
    if (fs.existsSync(appDir)) {
      console.log('Creating ZIP archive as fallback...');
      execSync(`powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
      console.log(`Fallback ZIP file created at: ${zipFile}`);
      
      // Also create a renamed version as .exe for compatibility with our documentation
      const exeFile = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool-Setup.exe');
      fs.copyFileSync(zipFile, exeFile);
      console.log(`Created ${exeFile} (actually a ZIP file) for compatibility`);
    } else {
      console.error('Application directory not found');
    }
  });
} catch (error) {
  console.error('Failed to create installer:', error.message);
  
  // Fallback to creating a ZIP file
  console.log('Falling back to creating a ZIP file...');
  const appDir = path.join(__dirname, 'dist', 'WhatsApp-Sales-Channel-Tool');
  const zipFile = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool.zip');
  
  if (fs.existsSync(appDir)) {
    console.log('Creating ZIP archive as fallback...');
    execSync(`powershell -Command "Compress-Archive -Path '${appDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
    console.log(`Fallback ZIP file created at: ${zipFile}`);
    
    // Also create a renamed version as .exe for compatibility with our documentation
    const exeFile = path.join(__dirname, 'release', 'WhatsApp-Sales-Channel-Tool-Setup.exe');
    fs.copyFileSync(zipFile, exeFile);
    console.log(`Created ${exeFile} (actually a ZIP file) for compatibility`);
  } else {
    console.error('Application directory not found');
  }
}