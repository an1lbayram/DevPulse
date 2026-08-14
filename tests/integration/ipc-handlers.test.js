import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// main.js is the Electron main-process entry point: it wires together
// detector/updater/versionChecker/cache behind ipcMain.handle(...) channels
// that the preload script exposes to the renderer as `window.devpulse`.
// This test exercises that wiring end-to-end (real TOOLS config, real
// CHANNELS, real handler-registration flow) while stubbing only the
// Electron runtime and the I/O-heavy leaves (child_process/axios via the
// core modules' public functions).

const ipcHandlers = vi.hoisted(() => new Map());
const sentEvents = vi.hoisted(() => []);
const browserWindowInstances = vi.hoisted(() => []);

const checkToolStatusMock = vi.hoisted(() => vi.fn());
const updateToolMock = vi.hoisted(() => vi.fn());
const getAllLatestVersionsMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => {
  class BrowserWindow {
    constructor() {
      this.webContents = {
        send: vi.fn((channel, payload) => sentEvents.push({ channel, payload })),
        openDevTools: vi.fn()
      };
      this.loadURL = vi.fn();
      this.loadFile = vi.fn();
      this.isDestroyed = () => false;
      browserWindowInstances.push(this);
    }
    static getAllWindows() {
      return browserWindowInstances;
    }
  }

  return {
    app: {
      quit: vi.fn(),
      whenReady: () => Promise.resolve(),
      on: vi.fn()
    },
    BrowserWindow,
    ipcMain: {
      handle: (channel, handler) => ipcHandlers.set(channel, handler)
    }
  };
});

vi.mock('electron-squirrel-startup', () => ({ default: false }));

vi.mock('electron-store', () => {
  return {
    default: class Store {
      constructor() {
        this._data = {};
      }
      get(key, fallback) {
        return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : fallback;
      }
      set(key, value) {
        this._data[key] = value;
      }
    }
  };
});

vi.mock('../../src/core/detector.js', () => ({ checkToolStatus: checkToolStatusMock }));
vi.mock('../../src/core/updater.js', () => ({ updateTool: updateToolMock }));
vi.mock('../../src/core/versionChecker.js', () => ({ getAllLatestVersions: getAllLatestVersionsMock }));
vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

let CHANNELS;
let TOOLS;

beforeAll(async () => {
  // These globals are normally injected by @electron-forge/plugin-vite at build time.
  globalThis.MAIN_WINDOW_VITE_DEV_SERVER_URL = 'http://localhost:5173';
  globalThis.MAIN_WINDOW_VITE_NAME = 'main_window';

  checkToolStatusMock.mockImplementation(async (tool) => ({ installed: true, version: `${tool.id}-v1` }));
  getAllLatestVersionsMock.mockImplementation(async () => {
    const map = {};
    TOOLS?.forEach(t => { map[t.id] = `${t.id}-latest`; });
    return map;
  });

  ({ default: CHANNELS } = await import('../../src/utils/ipcChannels.js'));
  ({ TOOLS } = await import('../../src/config/tools.js'));
  getAllLatestVersionsMock.mockImplementation(async () => {
    const map = {};
    TOOLS.forEach(t => { map[t.id] = `${t.id}-latest`; });
    return map;
  });

  await import('../../src/main.js');
  await vi.waitFor(() => {
    if (ipcHandlers.size === 0) throw new Error('IPC handlers not registered yet');
  });
});

afterAll(() => {
  delete globalThis.MAIN_WINDOW_VITE_DEV_SERVER_URL;
  delete globalThis.MAIN_WINDOW_VITE_NAME;
});

describe('Integration: main.js IPC handler registration', () => {
  it('registers a handler for every channel the preload script needs', () => {
    ['SCAN_SYSTEM', 'GET_TOOL_STATUS', 'UPDATE_TOOL', 'UPDATE_ALL', 'GET_SETTINGS', 'SAVE_SETTINGS'].forEach(key => {
      expect(ipcHandlers.has(CHANNELS[key])).toBe(true);
    });
  });
});

describe('Integration: scan-system flow (detector + versionChecker + TOOLS -> renderer contract)', () => {
  it('merges installed status, latest versions, and update metadata for every configured tool', async () => {
    sentEvents.length = 0;
    const handler = ipcHandlers.get(CHANNELS.SCAN_SYSTEM);
    const result = await handler({});

    expect(result.success).toBe(true);
    expect(Object.keys(result.data)).toEqual(TOOLS.map(t => t.id));

    const npmEntry = result.data.npm;
    expect(npmEntry).toEqual({
      installed: true,
      version: 'npm-v1',
      latestVersion: 'npm-latest',
      canUpdate: true, // npm has an `update` descriptor
      manualUpdateUrl: null,
      adminCmd: null
    });

    const cppEntry = result.data.cpp; // manual-only tool, no update descriptor
    expect(cppEntry.canUpdate).toBe(false);
    expect(cppEntry.manualUpdateUrl).toBe('https://winlibs.com/');
  });

  it('streams progress messages to the renderer while scanning', async () => {
    sentEvents.length = 0;
    const handler = ipcHandlers.get(CHANNELS.SCAN_SYSTEM);
    await handler({});

    const progressChannels = sentEvents.map(e => e.channel);
    expect(progressChannels).toContain(CHANNELS.SCAN_PROGRESS);
    expect(sentEvents.some(e => e.payload === 'System scan completed.')).toBe(true);
  });

  it('reports failure without throwing when a core module rejects', async () => {
    checkToolStatusMock.mockRejectedValueOnce(new Error('exec timed out'));
    const handler = ipcHandlers.get(CHANNELS.SCAN_SYSTEM);
    const result = await handler({});

    expect(result.success).toBe(false);
    expect(result.error).toContain('exec timed out');
  });
});

describe('Integration: update-tool flow', () => {
  it('delegates to updater.updateTool and reports success', async () => {
    updateToolMock.mockResolvedValueOnce({ success: true });
    const handler = ipcHandlers.get(CHANNELS.UPDATE_TOOL);
    const result = await handler({}, 'npm');

    expect(result).toEqual({ success: true });
    expect(updateToolMock).toHaveBeenCalledWith('npm', expect.any(Function));
  });

  it('surfaces updater errors as a structured failure response', async () => {
    updateToolMock.mockRejectedValueOnce(new Error('winget exited with code 1'));
    const handler = ipcHandlers.get(CHANNELS.UPDATE_TOOL);
    const result = await handler({}, 'python');

    expect(result).toEqual({ success: false, error: 'winget exited with code 1' });
  });
});

describe('Integration: get-tool-status flow', () => {
  it('returns an error for a tool id that does not exist in TOOLS', async () => {
    const handler = ipcHandlers.get(CHANNELS.GET_TOOL_STATUS);
    const result = await handler({}, 'not-a-real-tool');
    expect(result).toEqual({ success: false, error: 'Tool not found' });
  });

  it('returns live status for a known tool id', async () => {
    checkToolStatusMock.mockResolvedValueOnce({ installed: true, version: '20.0.0' });
    const handler = ipcHandlers.get(CHANNELS.GET_TOOL_STATUS);
    const result = await handler({}, 'nodejs');
    expect(result).toEqual({ success: true, data: { installed: true, version: '20.0.0' } });
  });
});

describe('Integration: settings persistence (electron-store)', () => {
  it('round-trips settings through save-settings and get-settings', async () => {
    const save = ipcHandlers.get(CHANNELS.SAVE_SETTINGS);
    const get = ipcHandlers.get(CHANNELS.GET_SETTINGS);

    const saveResult = await save({}, { theme: 'dark' });
    expect(saveResult).toEqual({ success: true });

    const getResult = await get({});
    expect(getResult).toEqual({ success: true, data: { theme: 'dark' } });
  });
});

describe('Integration: update-all flow', () => {
  it('only attempts to update tools that have an `update` descriptor, and isolates per-tool failures', async () => {
    updateToolMock.mockReset();
    updateToolMock.mockImplementation(async (toolId) => {
      if (toolId === 'pip') throw new Error('pip upgrade failed');
      return { success: true };
    });

    const handler = ipcHandlers.get(CHANNELS.UPDATE_ALL);
    const result = await handler({});

    expect(result.success).toBe(true);
    const updatableIds = TOOLS.filter(t => t.update).map(t => t.id);
    expect(Object.keys(result.data).sort()).toEqual(updatableIds.sort());
    expect(result.data.pip).toEqual({ success: false, error: 'pip upgrade failed' });
    expect(result.data.npm).toEqual({ success: true });
  });
});
