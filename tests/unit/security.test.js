import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

describe('Unit: security.validateCommand / validateCommandParts (Windows platform)', () => {
  let validateCommand;
  let validateCommandParts;
  let isRunningAsAdmin;
  let execMock;

  beforeEach(async () => {
    vi.resetModules();
    execMock = vi.fn();
    vi.doMock('child_process', () => ({ exec: execMock }));
    vi.doMock('os', () => ({ default: { platform: () => 'win32' }, platform: () => 'win32' }));
    ({ validateCommand, validateCommandParts, isRunningAsAdmin } = await import('../../src/core/security.js'));
  });

  afterEach(() => {
    vi.doUnmock('child_process');
    vi.doUnmock('os');
  });

  describe('validateCommand', () => {
    it('rejects an empty or falsy command string', () => {
      expect(validateCommand('')).toBe(false);
      expect(validateCommand(null)).toBe(false);
      expect(validateCommand(undefined)).toBe(false);
    });

    it('rejects commands not on the whitelist', () => {
      expect(validateCommand('calc.exe')).toBe(false);
      expect(validateCommand('powershell.exe -Command Remove-Item C:\\*')).toBe(false);
      expect(validateCommand('rm -rf /')).toBe(false);
    });

    it('rejects shell metacharacters used for chaining/injection', () => {
      expect(validateCommand('npm install & dir')).toBe(false);
      expect(validateCommand('winget upgrade | calc')).toBe(false);
      expect(validateCommand('pip install; echo hacked')).toBe(false);
      expect(validateCommand('npm install `whoami`')).toBe(false);
      expect(validateCommand('npm install $(whoami)')).toBe(false);
      expect(validateCommand('npm install > out.txt')).toBe(false);
      expect(validateCommand('npm install < in.txt')).toBe(false);
    });

    it('accepts a whitelisted command with an allowed argument pattern', () => {
      expect(validateCommand('npm install -g npm@latest')).toBe(true);
      expect(validateCommand('winget upgrade Python.Python.3')).toBe(true);
      expect(validateCommand('choco upgrade all -y')).toBe(true);
    });

    it('rejects a whitelisted base command with a disallowed argument pattern', () => {
      // "yarn" is only whitelisted for ['global', 'add'], not a bare install
      expect(validateCommand('yarn install')).toBe(false);
    });

    it('collapses repeated whitespace without breaking validation', () => {
      expect(validateCommand('npm   install   -g   npm@latest')).toBe(true);
    });
  });

  describe('validateCommandParts', () => {
    it('rejects a falsy base command', () => {
      expect(validateCommandParts('', ['install'])).toBe(false);
      expect(validateCommandParts(null, [])).toBe(false);
    });

    it('rejects a non-whitelisted base command regardless of args', () => {
      expect(validateCommandParts('curl', ['http://evil.example'])).toBe(false);
    });

    it('accepts clean whitelisted arguments', () => {
      expect(validateCommandParts('winget', ['upgrade', 'Python.Python.3', '--accept-source-agreements'])).toBe(true);
      expect(validateCommandParts('npm', ['install', '-g', 'npm@latest'])).toBe(true);
      expect(validateCommandParts('yarn', ['global', 'add', 'yarn@latest'])).toBe(true);
      expect(validateCommandParts('python', ['-m', 'pip', 'install', '--upgrade', 'pip'])).toBe(true);
      expect(validateCommandParts('choco', ['install', 'nodejs'])).toBe(true);
    });

    it('rejects arguments containing shell injection characters', () => {
      expect(validateCommandParts('winget', ['upgrade', 'Python; calc'])).toBe(false);
      expect(validateCommandParts('npm', ['install', 'pkg & echo 1'])).toBe(false);
      expect(validateCommandParts('npm', ['install', 'pkg | evil'])).toBe(false);
      expect(validateCommandParts('npm', ['install', 'pkg`evil`'])).toBe(false);
      expect(validateCommandParts('npm', ['install', 'pkg\r\nEXTRA'])).toBe(false);
    });

    it('rejects argument lists that do not match any allowed prefix pattern', () => {
      expect(validateCommandParts('npm', ['uninstall', '-g', 'npm'])).toBe(false);
      expect(validateCommandParts('winget', ['source', 'add', 'evil'])).toBe(false);
    });

    it('coerces non-string argument values before checking them', () => {
      // numbers/booleans should not throw and should still be checked as strings
      expect(() => validateCommandParts('npm', ['install', 42])).not.toThrow();
    });

    it('defaults to an empty argument list when none is provided', () => {
      expect(validateCommandParts('npm')).toBe(false);
    });
  });

  describe('isRunningAsAdmin', () => {
    it('resolves true when "net session" succeeds (no error)', async () => {
      execMock.mockImplementation((cmd, cb) => cb(null, '', ''));
      await expect(isRunningAsAdmin()).resolves.toBe(true);
    });

    it('resolves false when "net session" errors (non-elevated process)', async () => {
      execMock.mockImplementation((cmd, cb) => cb(new Error('Access is denied.')));
      await expect(isRunningAsAdmin()).resolves.toBe(false);
    });
  });
});

describe('Unit: security module on a non-Windows platform', () => {
  afterEach(() => {
    vi.doUnmock('child_process');
    vi.doUnmock('os');
    vi.resetModules();
  });

  it('blocks every command because command execution is Windows-only', async () => {
    vi.resetModules();
    vi.doMock('child_process', () => ({ exec: vi.fn() }));
    vi.doMock('os', () => ({ default: { platform: () => 'linux' }, platform: () => 'linux' }));

    const { validateCommand, validateCommandParts } = await import('../../src/core/security.js');

    expect(validateCommand('npm install -g npm@latest')).toBe(false);
    expect(validateCommandParts('npm', ['install', '-g', 'npm@latest'])).toBe(false);
  });
});
