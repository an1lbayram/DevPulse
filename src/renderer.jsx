import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './index.css';

// Web (Netlify) için mock yapısı, böylece Electron dışında (tarayıcıda) çökmeyecek
if (!window.devpulse) {
  window.devpulse = {
    scanSystem: async () => ({}),
    getToolStatus: async () => ([]),
    updateTool: async () => ({ success: true }),
    updateAll: async () => ({ success: true }),
    onScanProgress: () => {},
    onUpdateProgress: () => {},
    onLogMessage: () => {},
    getSettings: async () => ({ theme: 'dark', autoUpdate: false }),
    saveSettings: async () => ({ success: true }),
    openExternal: async () => {},
    copyToClipboard: () => {},
    removeAllListeners: () => {}
  };
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
