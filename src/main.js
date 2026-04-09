import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Store from 'electron-store';

import CHANNELS from './utils/ipcChannels.js';
import { checkToolStatus } from './core/detector.js';
import { updateTool } from './core/updater.js';
import { getAllLatestVersions } from './core/versionChecker.js';
import logger from './core/logger.js';
import { TOOLS } from './config/tools.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;
const settingsStore = new Store({ name: 'settings' });

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: process.env.NODE_ENV === 'development'
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools only in dev mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  registerIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  const sendToRenderer = (channel, payload) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
      }
    } catch {
      // If window is gone, ignore
    }
  };

  ipcMain.handle(CHANNELS.SCAN_SYSTEM, async (_event) => {
    logger.info('IPC Event: Scan System requested');
    try {
      sendToRenderer(CHANNELS.SCAN_PROGRESS, 'Starting system scan...');

      const installedStatus = {};
      for (const tool of TOOLS) {
        sendToRenderer(CHANNELS.SCAN_PROGRESS, `Checking ${tool.name}...`);
        installedStatus[tool.id] = await checkToolStatus(tool);
      }

      sendToRenderer(CHANNELS.SCAN_PROGRESS, 'Fetching latest versions...');
      const latestVersions = await getAllLatestVersions();
      
      const results = {};
      for (const [toolId, status] of Object.entries(installedStatus)) {
        const toolDef = TOOLS.find(t => t.id === toolId);
        results[toolId] = {
          installed: status.installed,
          version: status.version,
          latestVersion: latestVersions[toolId] || null,
          canUpdate: toolDef ? !!toolDef.update : false,
          manualUpdateUrl: toolDef?.manualUpdateUrl || null,
          adminCmd: toolDef?.adminCmd || null
        };
      }
      sendToRenderer(CHANNELS.SCAN_PROGRESS, 'System scan completed.');
      return { success: true, data: results };
    } catch (err) {
      logger.error('Error during scan: ' + err.message);
      sendToRenderer(CHANNELS.SCAN_PROGRESS, `Scan error: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.UPDATE_TOOL, async (event, toolId) => {
    logger.info(`IPC Event: Update requested for ${toolId}`);
    try {
      await updateTool(toolId, (progressTxt) => {
        sendToRenderer(CHANNELS.UPDATE_PROGRESS, { toolId, txt: progressTxt });
      });
      sendToRenderer(CHANNELS.LOG_MESSAGE, `Update completed for ${toolId}`);
      return { success: true };
    } catch (err) {
      logger.error(`Update failed for ${toolId}: ` + err.message);
      sendToRenderer(CHANNELS.LOG_MESSAGE, `Update failed for ${toolId}: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.GET_TOOL_STATUS, async (event, toolId) => {
    try {
      const tool = TOOLS.find(t => t.id === toolId);
      if (!tool) return { success: false, error: 'Tool not found' };
      const status = await checkToolStatus(tool);
      return { success: true, data: status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.UPDATE_ALL, async () => {
    try {
      const results = {};
      for (const tool of TOOLS) {
        if (!tool.update) continue;
        try {
          await updateTool(tool.id, (progressTxt) => {
            sendToRenderer(CHANNELS.UPDATE_PROGRESS, { toolId: tool.id, txt: progressTxt });
          });
          results[tool.id] = { success: true };
        } catch (e) {
          results[tool.id] = { success: false, error: e.message };
        }
      }
      return { success: true, data: results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.GET_SETTINGS, async () => {
    try {
      const settings = settingsStore.get('settings', {});
      return { success: true, data: settings };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.SAVE_SETTINGS, async (event, settings) => {
    try {
      settingsStore.set('settings', settings || {});
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}
