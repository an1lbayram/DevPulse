import { describe, it, expect } from 'vitest';
import { TOOLS } from '../../src/config/tools.js';

describe('Unit: TOOLS configuration integrity', () => {
  it('every tool has the required shape', () => {
    for (const tool of TOOLS) {
      expect(tool.id, `${tool.id} id`).toBeTruthy();
      expect(tool.name, `${tool.id} name`).toBeTruthy();
      expect(['language', 'package_manager']).toContain(tool.category);
      expect(tool.detectCmd, `${tool.id} detectCmd`).toBeTruthy();
      expect(tool.versionRegex).toBeInstanceOf(RegExp);
      expect(typeof tool.parseLatest).toBe('function');
      expect(['winget', 'npm', 'python', 'manual']).toContain(tool.updateMethod);
    }
  });

  it('has unique tool ids', () => {
    const ids = TOOLS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tools with updateMethod "manual" have no auto update descriptor', () => {
    TOOLS.filter(t => t.updateMethod === 'manual').forEach(t => {
      expect(t.update).toBeNull();
    });
  });

  it('tools with an auto update descriptor define cmd and args', () => {
    TOOLS.filter(t => t.update).forEach(t => {
      expect(typeof t.update.cmd).toBe('string');
      expect(Array.isArray(t.update.args)).toBe(true);
    });
  });

  const versionSamples = {
    python: ['Python 3.11.4', '3.11.4'],
    nodejs: ['v20.11.0', '20.11.0'],
    cpp: ['g++ (Rev2, Built by MSYS2 project) 13.2.0', '13.2.0'],
    dotnet: ['8.0.100', '8.0.100'],
    npm: ['10.2.4', '10.2.4'],
    yarn: ['1.22.19', '1.22.19'],
    pip: ['pip 23.3.1 from ...', '23.3.1'],
    pipx: ['1.2.0', '1.2.0'],
    chocolatey: ['2.2.2', '2.2.2'],
    winget: ['v1.6.3131', '1.6.3131']
  };

  Object.entries(versionSamples).forEach(([id, [sample, expected]]) => {
    it(`versionRegex for "${id}" extracts "${expected}" from "${sample}"`, () => {
      const tool = TOOLS.find(t => t.id === id);
      const match = sample.match(tool.versionRegex);
      expect(match).not.toBeNull();
      const version = match.slice(1).find(g => g !== undefined) || match[0];
      expect(version).toBe(expected);
    });
  });

  it('java versionRegex handles both openjdk and standard vendor output', () => {
    const java = TOOLS.find(t => t.id === 'java');
    const m1 = 'java version "17.0.8" 2023-07-18 LTS'.match(java.versionRegex);
    expect((m1.slice(1).find(g => g !== undefined) || m1[0])).toContain('17.0.8');
    const m2 = 'openjdk version "21.0.1" 2023-10-17'.match(java.versionRegex);
    expect((m2.slice(1).find(g => g !== undefined) || m2[0])).toContain('21.0.1');
  });

  it('parseLatest for npm/yarn extracts the .version field from registry payloads', () => {
    const npm = TOOLS.find(t => t.id === 'npm');
    expect(npm.parseLatest({ version: '10.5.0' })).toBe('10.5.0');
    const yarn = TOOLS.find(t => t.id === 'yarn');
    expect(yarn.parseLatest({ version: '1.22.22' })).toBe('1.22.22');
  });

  it('parseLatest for pip/pipx extracts info.version from PyPI payloads', () => {
    const pip = TOOLS.find(t => t.id === 'pip');
    expect(pip.parseLatest({ info: { version: '24.0' } })).toBe('24.0');
  });

  it('parseLatest for nodejs picks the first release with a version field', () => {
    const nodejs = TOOLS.find(t => t.id === 'nodejs');
    const data = [{ version: 'v20.12.0' }, { version: 'v18.20.0' }];
    expect(nodejs.parseLatest(data)).toBe('20.12.0');
  });

  it('parseLatest for tools without a latest API returns null', () => {
    ['cpp', 'chocolatey', 'winget'].forEach(id => {
      const tool = TOOLS.find(t => t.id === id);
      expect(tool.latestVersionApi).toBeNull();
      expect(tool.parseLatest()).toBeNull();
    });
  });
});
