import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './index.css';

// Mock structure for Web (Vercel / Netlify) so that DevPulse renders interactively in browser
if (!window.devpulse) {
  let progressListeners = [];
  let updateListeners = [];
  let logListeners = [];

  const initialToolsData = {
    python: { installed: true, version: '3.11.4', latestVersion: '3.12.2', canUpdate: true, adminCmd: null, manualUpdateUrl: null },
    nodejs: { installed: true, version: '20.10.0', latestVersion: '20.11.1', canUpdate: false, manualUpdateUrl: 'https://nodejs.org/en/download/' },
    java: { installed: true, version: '17.0.8', latestVersion: '21.0.2', canUpdate: false, manualUpdateUrl: 'https://adoptium.net/temurin/releases/' },
    cpp: { installed: true, version: '13.2.0', latestVersion: null, canUpdate: false, manualUpdateUrl: 'https://winlibs.com/' },
    dotnet: { installed: true, version: '8.0.100', latestVersion: '8.0.200', canUpdate: false, manualUpdateUrl: 'https://dotnet.microsoft.com/en-us/download' },
    npm: { installed: true, version: '10.2.3', latestVersion: '10.5.0', canUpdate: true, adminCmd: null, manualUpdateUrl: null },
    yarn: { installed: true, version: '1.22.19', latestVersion: '1.22.22', canUpdate: true, adminCmd: null, manualUpdateUrl: null },
    pip: { installed: true, version: '23.3.1', latestVersion: '24.0', canUpdate: true, adminCmd: null, manualUpdateUrl: null },
    pipx: { installed: false, version: null, latestVersion: '1.4.3', canUpdate: true, adminCmd: null, manualUpdateUrl: null },
    chocolatey: { installed: true, version: '2.2.2', latestVersion: null, canUpdate: false, adminCmd: 'choco upgrade all -y', manualUpdateUrl: 'https://chocolatey.org/' },
    winget: { installed: true, version: '1.6.3131', latestVersion: null, canUpdate: false, manualUpdateUrl: 'https://apps.microsoft.com/detail/9nblggh4nns1' }
  };

  window.devpulse = {
    scanSystem: async () => {
      progressListeners.forEach(fn => fn('[Web Demo] Scanning browser environment...'));
      progressListeners.forEach(fn => fn('[Web Demo] System scan completed. Interactive web demo active.'));
      return { success: true, data: { ...initialToolsData } };
    },
    getToolStatus: async (toolId) => ({ success: true, data: initialToolsData[toolId] }),
    updateTool: async (toolId) => {
      updateListeners.forEach(fn => fn({ toolId, txt: `[Web Demo] Downloading update package for ${toolId}...` }));
      await new Promise(r => setTimeout(r, 600));
      updateListeners.forEach(fn => fn({ toolId, txt: `[Web Demo] Applying update for ${toolId}...` }));
      await new Promise(r => setTimeout(r, 600));
      if (initialToolsData[toolId] && initialToolsData[toolId].latestVersion) {
        initialToolsData[toolId].version = initialToolsData[toolId].latestVersion;
      }
      return { success: true };
    },
    updateAll: async () => ({ success: true }),
    onScanProgress: (fn) => progressListeners.push(fn),
    onUpdateProgress: (fn) => updateListeners.push(fn),
    onLogMessage: (fn) => logListeners.push(fn),
    getSettings: async () => ({ success: true, data: { theme: 'dark', autoUpdate: false } }),
    saveSettings: async () => ({ success: true }),
    openExternal: async (url) => { window.open(url, '_blank', 'noopener,noreferrer'); },
    copyToClipboard: (text) => { navigator.clipboard.writeText(text); },
    removeAllListeners: () => {
      progressListeners = [];
      updateListeners = [];
      logListeners = [];
    }
  };
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
