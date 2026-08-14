import { describe, it, expect, vi, beforeAll } from 'vitest';

// preload.js is the only bridge between the sandboxed renderer and Node/Electron.
// Anything it exposes via contextBridge.exposeInMainWorld becomes directly callable
// by renderer-side JS. This test captures the exact object handed to
// exposeInMainWorld and checks (a) the surface is a fixed, minimal whitelist with
// no raw ipcRenderer/require/process leakage, and (b) openExternal enforces an
// http(s)-only allowlist so the renderer can't trigger shell.openExternal on a
// dangerous scheme (file:, javascript:, custom protocol handlers, etc).

const exposed = vi.hoisted(() => ({ key: null, api: null }));
const ipcRendererMock = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue({ success: true }),
  on: vi.fn(),
  removeAllListeners: vi.fn()
}));
const shellOpenExternalMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const clipboardWriteTextMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key, api) => {
      exposed.key = key;
      exposed.api = api;
    }
  },
  ipcRenderer: ipcRendererMock,
  shell: { openExternal: shellOpenExternalMock },
  clipboard: { writeText: clipboardWriteTextMock }
}));

let api;

beforeAll(async () => {
  await import('../../src/preload.js');
  api = exposed.api;
});

describe('Security: preload contextBridge surface', () => {
  it('exposes the API under the expected global key', () => {
    expect(exposed.key).toBe('devpulse');
  });

  it('exposes exactly the whitelisted methods, nothing more', () => {
    const allowed = [
      'scanSystem', 'getToolStatus', 'updateTool', 'updateAll',
      'onScanProgress', 'onUpdateProgress', 'onLogMessage',
      'getSettings', 'saveSettings',
      'openExternal', 'copyToClipboard', 'removeAllListeners'
    ];
    expect(Object.keys(api).sort()).toEqual(allowed.sort());
  });

  it('does not leak the raw ipcRenderer, require, or process objects', () => {
    const values = Object.values(api);
    expect(values).not.toContain(ipcRendererMock);
    expect(api).not.toHaveProperty('ipcRenderer');
    expect(api).not.toHaveProperty('require');
    expect(api).not.toHaveProperty('process');
  });
});

describe('Security: openExternal URL scheme allowlist', () => {
  it('allows https URLs', async () => {
    await api.openExternal('https://example.com');
    expect(shellOpenExternalMock).toHaveBeenCalledWith('https://example.com');
  });

  it('allows http URLs', async () => {
    await api.openExternal('http://example.com');
    expect(shellOpenExternalMock).toHaveBeenCalledWith('http://example.com');
  });

  it('rejects a javascript: URL instead of forwarding it to shell.openExternal', async () => {
    shellOpenExternalMock.mockClear();
    await expect(api.openExternal('javascript:alert(1)')).rejects.toThrow('Invalid URL');
    expect(shellOpenExternalMock).not.toHaveBeenCalled();
  });

  it('rejects a file: URL', async () => {
    shellOpenExternalMock.mockClear();
    await expect(api.openExternal('file:///etc/passwd')).rejects.toThrow('Invalid URL');
    expect(shellOpenExternalMock).not.toHaveBeenCalled();
  });

  it('rejects a bare/relative string with no scheme', async () => {
    shellOpenExternalMock.mockClear();
    await expect(api.openExternal('example.com')).rejects.toThrow('Invalid URL');
    expect(shellOpenExternalMock).not.toHaveBeenCalled();
  });

  it('rejects an empty or non-string URL', async () => {
    await expect(api.openExternal('')).rejects.toThrow('Invalid URL');
    await expect(api.openExternal(undefined)).rejects.toThrow('Invalid URL');
  });
});

describe('Security: clipboard bridge', () => {
  it('forwards copyToClipboard to Electron clipboard.writeText without ipc round-trip', () => {
    api.copyToClipboard('some command');
    expect(clipboardWriteTextMock).toHaveBeenCalledWith('some command');
  });
});
