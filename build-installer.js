const packager = require('electron-packager');
const electronInstaller = require('electron-winstaller');
const path = require('path');
const fs = require('fs');

async function buildInstaller() {
  console.log('Building application package...');
  
  try {
    // Package the Electron app
    const appPaths = await packager({
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
    console.log('App path:', appPaths[0]);

    // Create installer using electron-winstaller
    const appDirectory = path.join(__dirname, 'dist', 'WhatsApp Sales Channel Tool-win32-x64');
    const outputDirectory = path.join(__dirname, 'release');

    // Check if app directory exists
    if (!fs.existsSync(appDirectory)) {
      console.error('App directory does not exist:', appDirectory);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    console.log('Creating Windows installer...');
    
    const result = await electronInstaller.createWindowsInstaller({
      appDirectory: appDirectory,
      outputDirectory: outputDirectory,
      authors: 'WhatsApp Sales Channel Team',
      exe: 'WhatsApp Sales Channel Tool.exe',
      setupExe: 'WhatsApp-Sales-Channel-Tool-Setup.exe',
      noMsi: true
    });

    console.log('Windows installer created successfully!');
    console.log('Installer location:', path.join(outputDirectory, 'WhatsApp-Sales-Channel-Tool-Setup.exe'));
  } catch (error) {
    console.error('Error building installer:', error);
    process.exit(1);
  }
}

buildInstaller();