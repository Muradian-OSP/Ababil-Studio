/**
 * Preload Script
 * 
 * This script runs in a context that has access to both the renderer process
 * and Node.js APIs. It exposes a safe API to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('ababilAPI', {
  // Make HTTP request via native Rust library
  makeHttpRequest: (requestJson) => {
    return ipcRenderer.invoke('native:makeHttpRequest', requestJson);
  },

  // Get native library status
  getNativeLibraryStatus: () => {
    return ipcRenderer.invoke('native:getStatus');
  },

  // Parse Postman collection
  parsePostmanCollection: (jsonString) => {
    return ipcRenderer.invoke('native:parsePostmanCollection', jsonString);
  },

  // Select Postman file
  selectPostmanFile: () => {
    return ipcRenderer.invoke('native:selectPostmanFile');
  },

  // Parse Postman environment
  parsePostmanEnvironment: (jsonString) => {
    return ipcRenderer.invoke('native:parsePostmanEnvironment', jsonString);
  },

  // Select Postman environment file
  selectPostmanEnvironmentFile: () => {
    return ipcRenderer.invoke('native:selectPostmanEnvironmentFile');
  },

  // Platform info
  platform: process.platform,
});

console.log('[Preload] Ababil API exposed to renderer');

