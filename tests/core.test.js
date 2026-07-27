import { describe, it, expect, beforeEach } from 'vitest';
import { validateCommand, validateCommandParts } from '../src/core/security.js';
import { setCache, getCache, clearCache } from '../src/core/cache.js';
import { buildCmdStringForCmdExe } from '../src/core/updater.js';
import { TOOLS } from '../src/config/tools.js';

describe('Security module', () => {
  it('should block non-whitelisted commands', () => {
    expect(validateCommand('calc.exe')).toBe(false);
    expect(validateCommand('powershell.exe -Command Remove-Item C:\\*')).toBe(false);
  });

  it('should block shell injection operators', () => {
    expect(validateCommand('npm install & dir')).toBe(false);
    expect(validateCommand('winget upgrade | calc')).toBe(false);
    expect(validateCommand('pip install; echo hacked')).toBe(false);
  });

  it('should allow whitelisted commands with clean arguments', () => {
    expect(validateCommandParts('winget', ['upgrade', 'Python.Python.3', '--accept-source-agreements'])).toBe(true);
    expect(validateCommandParts('npm', ['install', '-g', 'npm@latest'])).toBe(true);
    expect(validateCommandParts('python', ['-m', 'pip', 'install', '--upgrade', 'pip'])).toBe(true);
  });

  it('should block dangerous shell characters in argument values', () => {
    expect(validateCommandParts('winget', ['upgrade', 'Python; calc'])).toBe(false);
    expect(validateCommandParts('npm', ['install', 'pkg & echo 1'])).toBe(false);
  });
});

describe('Cache module', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should set and get cache correctly within TTL', () => {
    setCache('test_key', '1.2.3');
    expect(getCache('test_key')).toBe('1.2.3');
  });

  it('should return null for non-existent cache keys', () => {
    expect(getCache('non_existent')).toBeNull();
  });
});

describe('Updater utility', () => {
  it('should correctly format and quote command strings for cmd.exe', () => {
    expect(buildCmdStringForCmdExe('npm', ['install', '-g', 'npm@latest'])).toBe('npm install -g npm@latest');
    expect(buildCmdStringForCmdExe('winget', ['upgrade', 'Program With Space'])).toBe('winget upgrade "Program With Space"');
  });
});

describe('Tool regex parser checks', () => {
  it('should match Python version regex', () => {
    const pythonTool = TOOLS.find(t => t.id === 'python');
    const match = 'Python 3.11.4'.match(pythonTool.versionRegex);
    expect(match).not.toBeNull();
    const version = match.slice(1).find(g => g !== undefined) || match[0];
    expect(version).toBe('3.11.4');
  });

  it('should match Node.js version regex', () => {
    const nodeTool = TOOLS.find(t => t.id === 'nodejs');
    const match = 'v20.11.0'.match(nodeTool.versionRegex);
    expect(match).not.toBeNull();
    const version = match.slice(1).find(g => g !== undefined) || match[0];
    expect(version).toBe('20.11.0');
  });

  it('should match Java version regex for different JDK outputs', () => {
    const javaTool = TOOLS.find(t => t.id === 'java');
    const match1 = 'java version "17.0.8" 2023-07-18 LTS'.match(javaTool.versionRegex);
    expect(match1).not.toBeNull();
    const v1 = match1.slice(1).find(g => g !== undefined) || match1[0];
    expect(v1).toContain('17.0.8');

    const match2 = 'openjdk version "21.0.1" 2023-10-17'.match(javaTool.versionRegex);
    expect(match2).not.toBeNull();
    const v2 = match2.slice(1).find(g => g !== undefined) || match2[0];
    expect(v2).toContain('21.0.1');
  });

  it('should match C++ g++ version regex', () => {
    const cppTool = TOOLS.find(t => t.id === 'cpp');
    const match = 'g++ (Rev2, Built by MSYS2 project) 13.2.0'.match(cppTool.versionRegex);
    expect(match).not.toBeNull();
    const version = match.slice(1).find(g => g !== undefined) || match[0];
    expect(version).toBe('13.2.0');
  });

  it('should match winget version regex with or without leading v', () => {
    const wingetTool = TOOLS.find(t => t.id === 'winget');
    const match1 = 'v1.6.3131'.match(wingetTool.versionRegex);
    const v1 = match1.slice(1).find(g => g !== undefined) || match1[0];
    expect(v1).toBe('1.6.3131');

    const match2 = '1.6.3131'.match(wingetTool.versionRegex);
    const v2 = match2.slice(1).find(g => g !== undefined) || match2[0];
    expect(v2).toBe('1.6.3131');
  });
});
