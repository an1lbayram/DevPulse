import { describe, it, expect } from 'vitest';
import { buildCmdStringForCmdExe } from '../../src/core/updater.js';

describe('Unit: updater.buildCmdStringForCmdExe', () => {
  it('joins simple args with spaces, no quoting needed', () => {
    expect(buildCmdStringForCmdExe('npm', ['install', '-g', 'npm@latest'])).toBe('npm install -g npm@latest');
  });

  it('quotes args containing spaces', () => {
    expect(buildCmdStringForCmdExe('winget', ['upgrade', 'Program With Space'])).toBe(
      'winget upgrade "Program With Space"'
    );
  });

  it('escapes embedded double quotes', () => {
    expect(buildCmdStringForCmdExe('winget', ['upgrade', 'Weird"Name'])).toBe('winget upgrade "Weird\\"Name"');
  });

  it('handles a command with no arguments', () => {
    expect(buildCmdStringForCmdExe('choco', [])).toBe('choco');
  });
});
