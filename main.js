const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let serverProcess;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'icon.png')
  });

  // Load the settings page
  mainWindow.loadFile('public/settings.html');

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// Start the webhook server as a separate process
function startServer() {
  serverProcess = fork(path.join(__dirname, 'webhooks', 'server.js'));
  
  serverProcess.on('message', (message) => {
    if (mainWindow) {
      mainWindow.webContents.send('server-status', message);
    }
  });
  
  serverProcess.on('error', (error) => {
    if (mainWindow) {
      mainWindow.webContents.send('server-error', error.message);
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  startServer();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  // Kill the server process when the app is closed
  if (serverProcess) {
    serverProcess.kill();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-app-info', async () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    serverPort: process.env.PORT || 3000
  };
});

ipcMain.handle('restart-server', async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  startServer();
  return { success: true, message: 'Server restarted' };
});