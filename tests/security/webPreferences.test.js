import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Renderer processes in an Electron app with contextIsolation off, nodeIntegration
// on, or sandbox off can let a compromised/untrusted web page (or a bug in the
// renderer bundle) reach into Node.js APIs and the filesystem. This test asserts
// main.js's BrowserWindow is actually constructed with the hardened settings,
// by capturing the real constructor arguments rather than grepping source text.

const constructorArgs = vi.hoisted(() => []);

vi.mock('electron', () => {
  class BrowserWindow {
    constructor(options) {
      constructorArgs.push(options);
      this.webContents = { send: vi.fn(), openDevTools: vi.fn() };
      this.loadURL = vi.fn();
      this.loadFile = vi.fn();
      this.isDestroyed = () => false;
    }
    static getAllWindows() {
      return [];
    }
  }
  return {
    app: { quit: vi.fn(), whenReady: () => Promise.resolve(), on: vi.fn() },
    BrowserWindow,
    ipcMain: { handle: vi.fn() }
  };
});

vi.mock('electron-squirrel-startup', () => ({ default: false }));
vi.mock('electron-store', () => ({
  default: class Store {
    get() { return {}; }
    set() {}
  }
}));
vi.mock('../../src/core/detector.js', () => ({ checkToolStatus: vi.fn() }));
vi.mock('../../src/core/updater.js', () => ({ updateTool: vi.fn() }));
vi.mock('../../src/core/versionChecker.js', () => ({ getAllLatestVersions: vi.fn() }));
vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

beforeAll(async () => {
  globalThis.MAIN_WINDOW_VITE_DEV_SERVER_URL = 'http://localhost:5173';
  globalThis.MAIN_WINDOW_VITE_NAME = 'main_window';
  await import('../../src/main.js');
  await vi.waitFor(() => {
    if (constructorArgs.length === 0) throw new Error('BrowserWindow not constructed yet');
  });
});

afterAll(() => {
  delete globalThis.MAIN_WINDOW_VITE_DEV_SERVER_URL;
  delete globalThis.MAIN_WINDOW_VITE_NAME;
});

describe('Security: BrowserWindow webPreferences hardening', () => {
  it('enables contextIsolation', () => {
    expect(constructorArgs[0].webPreferences.contextIsolation).toBe(true);
  });

  it('disables nodeIntegration', () => {
    expect(constructorArgs[0].webPreferences.nodeIntegration).toBe(false);
  });

  it('enables the renderer sandbox', () => {
    expect(constructorArgs[0].webPreferences.sandbox).toBe(true);
  });

  it('routes preload through a dedicated preload script', () => {
    expect(typeof constructorArgs[0].webPreferences.preload).toBe('string');
    expect(constructorArgs[0].webPreferences.preload).toMatch(/preload\.js$/);
  });

  it('gates devtools behind NODE_ENV=development rather than always-on', () => {
    // process.env.NODE_ENV is not 'development' while running the test suite
    expect(constructorArgs[0].webPreferences.devTools).toBe(false);
  });
});
