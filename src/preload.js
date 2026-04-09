// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, shell, clipboard } from 'electron';
import CHANNELS from './utils/ipcChannels.js';

contextBridge.exposeInMainWorld('devpulse', {
  scanSystem: () => ipcRenderer.invoke(CHANNELS.SCAN_SYSTEM),
  getToolStatus: () => ipcRenderer.invoke(CHANNELS.GET_TOOL_STATUS),
  updateTool: (toolId) => ipcRenderer.invoke(CHANNELS.UPDATE_TOOL, toolId),
  updateAll: () => ipcRenderer.invoke(CHANNELS.UPDATE_ALL),
  
  onScanProgress: (callback) => {
    ipcRenderer.on(CHANNELS.SCAN_PROGRESS, (event, value) => callback(value));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on(CHANNELS.UPDATE_PROGRESS, (event, data) => callback(data));
  },
  onLogMessage: (callback) => {
    ipcRenderer.on(CHANNELS.LOG_MESSAGE, (event, message) => callback(message));
  },
  
  // Settings
  getSettings: () => ipcRenderer.invoke(CHANNELS.GET_SETTINGS),
  saveSettings: (settings) => ipcRenderer.invoke(CHANNELS.SAVE_SETTINGS, settings),
  
  // Open external links in default browser
  openExternal: async (url) => {
    const safeUrl = typeof url === 'string' ? url.trim() : '';
    if (!safeUrl || !(safeUrl.startsWith('https://') || safeUrl.startsWith('http://'))) {
      throw new Error('Invalid URL');
    }
    return await shell.openExternal(safeUrl);
  },
  
  // Copy text to clipboard
  copyToClipboard: (text) => {
    clipboard.writeText(text);
  },
  
  // Cleanup listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners(CHANNELS.SCAN_PROGRESS);
    ipcRenderer.removeAllListeners(CHANNELS.UPDATE_PROGRESS);
    ipcRenderer.removeAllListeners(CHANNELS.LOG_MESSAGE);
  }
});
