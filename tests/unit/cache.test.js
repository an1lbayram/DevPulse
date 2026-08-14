import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setCache, getCache, clearCache } from '../../src/core/cache.js';

describe('Unit: cache module', () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for a key that was never set', () => {
    expect(getCache('missing_key')).toBeNull();
  });

  it('stores and retrieves a value within TTL', () => {
    setCache('k1', { a: 1 });
    expect(getCache('k1')).toEqual({ a: 1 });
  });

  it('overwrites an existing key with the latest value', () => {
    setCache('k2', 'first');
    setCache('k2', 'second');
    expect(getCache('k2')).toBe('second');
  });

  it('expires entries older than the 30 minute TTL', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setCache('k3', 'value');
    expect(getCache('k3')).toBe('value');

    vi.setSystemTime(new Date('2026-01-01T00:31:00Z'));
    expect(getCache('k3')).toBeNull();
  });

  it('still returns a value just under the TTL boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setCache('k4', 'value');

    vi.setSystemTime(new Date('2026-01-01T00:29:00Z'));
    expect(getCache('k4')).toBe('value');
  });

  it('clearCache wipes all stored entries', () => {
    setCache('k5', 'v');
    setCache('k6', 'v');
    clearCache();
    expect(getCache('k5')).toBeNull();
    expect(getCache('k6')).toBeNull();
  });
});
