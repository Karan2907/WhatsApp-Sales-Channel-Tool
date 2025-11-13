const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  onServerStatus: (callback) => ipcRenderer.on('server-status', (_event, value) => callback(value)),
  onServerError: (callback) => ipcRenderer.on('server-error', (_event, value) => callback(value))
});