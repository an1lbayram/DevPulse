import { describe, it, expect } from 'vitest';
import { TOOLS } from '../../src/config/tools.js';

// Contract tests for the third-party version APIs each tool declares in
// src/config/tools.js. These lock in the *shape* each API is expected to
// return (based on real-world responses) so that a breaking upstream schema
// change is caught by a parseLatest() regression instead of surfacing as a
// silent "Unknown" version in production.

function findTool(id) {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) throw new Error(`Tool "${id}" not found in TOOLS`);
  return tool;
}

describe('API contract: every tool with a latestVersionApi', () => {
  const withApi = TOOLS.filter(t => t.latestVersionApi);

  it('declares at least one tool with a live version API', () => {
    expect(withApi.length).toBeGreaterThan(0);
  });

  withApi.forEach(tool => {
    it(`"${tool.id}" points at an https endpoint`, () => {
      expect(tool.latestVersionApi).toMatch(/^https:\/\//);
    });
  });

  it('only dotnet is flagged as a text (non-JSON) API', () => {
    withApi.forEach(tool => {
      if (tool.id === 'dotnet') {
        expect(tool.isTextApi).toBe(true);
      } else {
        expect(tool.isTextApi).toBeFalsy();
      }
    });
  });
});

describe('API contract: endoflife.date/api/python.json (python)', () => {
  const python = findTool('python');

  it('parses the latest field from the first (most recent) release entry', () => {
    const payload = [
      { cycle: '3.13', latest: '3.13.1', releaseDate: '2024-10-07' },
      { cycle: '3.12', latest: '3.12.7', releaseDate: '2023-10-02' }
    ];
    expect(python.parseLatest(payload)).toBe('3.13.1');
  });

  it('returns undefined (not a throw) when the response array is empty', () => {
    expect(python.parseLatest([])).toBeUndefined();
  });
});

describe('API contract: api.adoptium.net available_releases (java)', () => {
  const java = findTool('java');

  it('parses most_recent_lts as a string', () => {
    const payload = {
      available_lts_releases: [8, 11, 17, 21],
      most_recent_lts: 21,
      most_recent_feature_release: 23
    };
    expect(java.parseLatest(payload)).toBe('21');
  });

  it('returns null when most_recent_lts is absent', () => {
    expect(java.parseLatest({})).toBeNull();
    expect(java.parseLatest(undefined)).toBeNull();
  });
});

describe('API contract: dotnetcli.azureedge.net latest.version (dotnet, text API)', () => {
  const dotnet = findTool('dotnet');

  it('trims whitespace/newlines from the raw text response', () => {
    expect(dotnet.parseLatest('8.0.100\n')).toBe('8.0.100');
    expect(dotnet.parseLatest('  8.0.100  ')).toBe('8.0.100');
  });

  it('coerces a non-string payload defensively instead of throwing', () => {
    expect(dotnet.parseLatest(undefined)).toBe('');
    expect(dotnet.parseLatest(null)).toBe('');
  });
});

describe('API contract: registry.npmjs.org/<pkg>/latest (npm, yarn)', () => {
  it('npm reads the top-level version field', () => {
    const npm = findTool('npm');
    expect(npm.parseLatest({ name: 'npm', version: '10.9.2', dist: {} })).toBe('10.9.2');
  });

  it('yarn reads the top-level version field', () => {
    const yarn = findTool('yarn');
    expect(yarn.parseLatest({ name: 'yarn', version: '1.22.22', dist: {} })).toBe('1.22.22');
  });
});

describe('API contract: pypi.org/pypi/<pkg>/json (pip, pipx)', () => {
  it('pip reads info.version from a realistic PyPI payload', () => {
    const pip = findTool('pip');
    const payload = { info: { name: 'pip', version: '24.3.1' }, releases: {}, urls: [] };
    expect(pip.parseLatest(payload)).toBe('24.3.1');
  });

  it('pipx reads info.version from a realistic PyPI payload', () => {
    const pipx = findTool('pipx');
    const payload = { info: { name: 'pipx', version: '1.7.1' }, releases: {}, urls: [] };
    expect(pipx.parseLatest(payload)).toBe('1.7.1');
  });

  it('both return undefined without throwing on a malformed/empty payload', () => {
    const pip = findTool('pip');
    const pipx = findTool('pipx');
    expect(pip.parseLatest({})).toBeUndefined();
    expect(pipx.parseLatest({})).toBeUndefined();
  });
});

describe('API contract: nodejs.org/download/release/index.json (nodejs)', () => {
  const nodejs = findTool('nodejs');

  it('strips the leading "v" from the first entry with a version field', () => {
    const payload = [
      { version: 'v22.11.0', lts: false },
      { version: 'v20.18.1', lts: 'Iron' }
    ];
    expect(nodejs.parseLatest(payload)).toBe('22.11.0');
  });

  it('returns null when the release list is empty', () => {
    expect(nodejs.parseLatest([])).toBeNull();
  });
});
