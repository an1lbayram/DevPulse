import { describe, it, expect } from 'vitest';
import CHANNELS from '../../src/utils/ipcChannels.js';

describe('Unit: IPC channel registry', () => {
  const expectedKeys = [
    'SCAN_SYSTEM',
    'GET_TOOL_STATUS',
    'UPDATE_TOOL',
    'UPDATE_ALL',
    'SCAN_PROGRESS',
    'UPDATE_PROGRESS',
    'LOG_MESSAGE',
    'GET_SETTINGS',
    'SAVE_SETTINGS'
  ];

  it('defines every channel the renderer/main processes rely on', () => {
    expectedKeys.forEach(key => {
      expect(CHANNELS).toHaveProperty(key);
      expect(typeof CHANNELS[key]).toBe('string');
      expect(CHANNELS[key].length).toBeGreaterThan(0);
    });
  });

  it('has no unexpected extra channels (keeps preload whitelist in sync)', () => {
    expect(Object.keys(CHANNELS).sort()).toEqual(expectedKeys.sort());
  });

  it('has unique channel string values (no accidental IPC collisions)', () => {
    const values = Object.values(CHANNELS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('uses kebab-case string values, not the JS identifier names', () => {
    Object.values(CHANNELS).forEach(value => {
      expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });
  });
});
