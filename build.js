const { exec } = require('child_process');
const path = require('path');

console.log('Building desktop application...');

// Build the application directly with electron-builder
exec('npx electron-builder', (buildError, buildStdout, buildStderr) => {
  if (buildError) {
    console.error(`Error building application: ${buildError}`);
    return;
  }
  
  console.log('Application built successfully!');
  console.log('Build output:');
  console.log(buildStdout);
  
  if (buildStderr) {
    console.error('Build stderr:');
    console.error(buildStderr);
  }
});