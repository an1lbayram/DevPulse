import { describe, it, expect, vi, beforeEach } from 'vitest';

const execMock = vi.hoisted(() => vi.fn());

// Node's real child_process.exec carries a [util.promisify.custom] symbol that
// makes `util.promisify(exec)` resolve to `{ stdout, stderr }`. A plain vi.fn()
// replacement loses that symbol, so util.promisify falls back to its default
// single-value behavior (only the first callback arg), silently breaking
// detector.js's `const { stdout, stderr } = await execAsync(...)` destructure.
// We restore the same contract here so the mock behaves like the real API.
vi.mock('child_process', async () => {
  const { promisify } = await import('util');
  execMock[promisify.custom] = (cmd, opts) =>
    new Promise((resolve, reject) => {
      execMock(cmd, opts, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      });
    });
  return { exec: execMock };
});

vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const { checkToolStatus } = await import('../../src/core/detector.js');

function mockExecOnce({ error, stdout = '', stderr = '' }) {
  execMock.mockImplementationOnce((cmd, opts, cb) => {
    const callback = typeof opts === 'function' ? opts : cb;
    callback(error || null, stdout, stderr);
  });
}

describe('Unit: detector.checkToolStatus', () => {
  beforeEach(() => {
    execMock.mockReset();
  });

  it('reports installed:true with a parsed version on success', async () => {
    mockExecOnce({ stdout: 'Python 3.11.4\n' });
    const tool = { id: 'python', detectCmd: 'python --version', versionRegex: /Python\s+(\d+\.\d+\.\d+)/ };

    const result = await checkToolStatus(tool);
    expect(result).toEqual({ installed: true, version: '3.11.4' });
  });

  it('reports installed:false when the command errors (tool missing)', async () => {
    mockExecOnce({ error: new Error('command not found') });
    const tool = { id: 'ghost', detectCmd: 'ghost --version', versionRegex: /(\d+\.\d+\.\d+)/ };

    const result = await checkToolStatus(tool);
    expect(result).toEqual({ installed: false, version: null });
  });

  it('falls back to version "Unknown" when output does not match the regex', async () => {
    mockExecOnce({ stdout: 'some unparsable output' });
    const tool = { id: 'weird', detectCmd: 'weird --version', versionRegex: /(\d+\.\d+\.\d+)/ };

    const result = await checkToolStatus(tool);
    expect(result).toEqual({ installed: true, version: 'Unknown' });
  });

  it('reads version output from stderr as well as stdout', async () => {
    mockExecOnce({ stdout: '', stderr: 'java version "17.0.8" 2023-07-18 LTS' });
    const tool = {
      id: 'java',
      detectCmd: 'java -version',
      versionRegex: /"(?:openjdk\s+)?(\d+\.\d+\.\d+[^"]*)"|version\s+"(\d+\.\d+\.\d+[^"]*)"|(\d+\.\d+\.\d+)/
    };

    const result = await checkToolStatus(tool);
    expect(result.installed).toBe(true);
    expect(result.version).toContain('17.0.8');
  });
});
