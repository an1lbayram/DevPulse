import { describe, it, expect, vi, beforeEach } from 'vitest';

const axiosGetMock = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: { get: axiosGetMock }
}));

vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const { getLatestVersion, getAllLatestVersions } = await import('../../src/core/versionChecker.js');
const { clearCache } = await import('../../src/core/cache.js');

describe('Unit: versionChecker.getLatestVersion', () => {
  beforeEach(() => {
    axiosGetMock.mockReset();
    clearCache();
  });

  it('returns null for an unknown tool id', async () => {
    const result = await getLatestVersion('not-a-real-tool');
    expect(result).toBeNull();
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('returns null for a tool with no latestVersionApi (e.g. cpp)', async () => {
    const result = await getLatestVersion('cpp');
    expect(result).toBeNull();
    expect(axiosGetMock).not.toHaveBeenCalled();
  });

  it('fetches, parses, and caches the latest version for npm', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { version: '10.9.2' } });

    const result = await getLatestVersion('npm');
    expect(result).toBe('10.9.2');
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    expect(axiosGetMock).toHaveBeenCalledWith(
      'https://registry.npmjs.org/npm/latest',
      expect.objectContaining({
        timeout: 10_000,
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('DevPulse') })
      })
    );
  });

  it('serves a cached value on the second call without hitting the network again', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { version: '10.9.2' } });

    const first = await getLatestVersion('npm');
    const second = await getLatestVersion('npm');

    expect(first).toBe('10.9.2');
    expect(second).toBe('10.9.2');
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });

  it('requests a text response for text-based APIs (dotnet)', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: '8.0.100\n' });

    const result = await getLatestVersion('dotnet');
    expect(result).toBe('8.0.100');
    expect(axiosGetMock).toHaveBeenCalledWith(
      'https://dotnetcli.azureedge.net/dotnet/Sdk/LTS/latest.version',
      expect.objectContaining({ responseType: 'text' })
    );
  });

  it('returns null and does not cache when the API call rejects', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('network down'));

    const result = await getLatestVersion('npm');
    expect(result).toBeNull();

    // A subsequent successful call should hit the network again (nothing was cached)
    axiosGetMock.mockResolvedValueOnce({ data: { version: '10.9.2' } });
    const second = await getLatestVersion('npm');
    expect(second).toBe('10.9.2');
    expect(axiosGetMock).toHaveBeenCalledTimes(2);
  });

  it('returns null and does not cache when parseLatest yields a falsy value', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: {} }); // no .version field

    const result = await getLatestVersion('npm');
    expect(result).toBeNull();
  });
});

describe('Unit: versionChecker.getAllLatestVersions', () => {
  beforeEach(() => {
    axiosGetMock.mockReset();
    clearCache();
  });

  it('resolves a version map covering every configured tool, using null for tools without an API', async () => {
    axiosGetMock.mockResolvedValue({ data: { version: '1.0.0' } });

    const versions = await getAllLatestVersions();

    expect(versions).toHaveProperty('npm');
    expect(versions).toHaveProperty('cpp', null);
    expect(versions).toHaveProperty('chocolatey', null);
    expect(versions).toHaveProperty('winget', null);
    expect(Object.keys(versions).length).toBeGreaterThan(5);
  });

  it('does not let one failing tool API abort the rest of the batch', async () => {
    axiosGetMock.mockImplementation((url) => {
      if (url.includes('/npm/latest')) return Promise.reject(new Error('npm registry down'));
      return Promise.resolve({ data: { version: '9.9.9' } });
    });

    const versions = await getAllLatestVersions();
    expect(versions.npm).toBeNull();
    expect(versions.yarn).toBe('9.9.9');
  });
});
