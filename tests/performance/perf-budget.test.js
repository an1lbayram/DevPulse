import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TOOLS } from '../../src/config/tools.js';
import { setCache, getCache, clearCache } from '../../src/core/cache.js';
import { validateCommand, validateCommandParts } from '../../src/core/security.js';

const execMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', async () => {
  const { promisify } = await import('util');
  execMock[promisify.custom] = (cmd, opts) =>
    new Promise((resolve, reject) => {
      // Simulate a fast-but-nonzero real process round trip.
      setTimeout(() => execMock(cmd, opts, (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve({ stdout, stderr });
      }), 2);
    });
  return { exec: execMock };
});

vi.mock('../../src/core/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

// These are smoke-level performance budgets, not micro-benchmarks: they exist to
// catch accidental O(n^2)/regex-backtracking/blocking-I/O regressions, not to
// pin exact timings. Budgets are generous on purpose to avoid CI flakiness.

describe('Performance: cache module throughput', () => {
  beforeEach(() => {
    clearCache();
  });

  it('writes and reads 5,000 cache entries within budget', () => {
    const N = 5000;
    const start = performance.now();
    for (let i = 0; i < N; i++) {
      setCache(`perf_key_${i}`, { i, payload: 'x'.repeat(32) });
    }
    for (let i = 0; i < N; i++) {
      expect(getCache(`perf_key_${i}`)).toEqual({ i, payload: 'x'.repeat(32) });
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(3000);
  });
});

describe('Performance: security validation regex safety', () => {
  it('validates 10,000 well-formed commands quickly (no catastrophic backtracking)', () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      validateCommand(`npm install -g some-package-${i}@1.0.${i}`);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(1500);
  });

  it('stays fast even against long, hostile-looking argument strings', () => {
    const hostile = 'a'.repeat(5000) + ';'.repeat(200) + 'b'.repeat(5000);
    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      validateCommandParts('npm', ['install', hostile]);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(1500);
  });
});

describe('Performance: TOOLS lookup', () => {
  it('resolves 20,000 TOOLS.find lookups within budget (guards against TOOLS list growth regressions)', () => {
    const ids = TOOLS.map(t => t.id);
    const start = performance.now();
    for (let i = 0; i < 20_000; i++) {
      const id = ids[i % ids.length];
      const tool = TOOLS.find(t => t.id === id);
      expect(tool).toBeDefined();
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(2000);
  });
});

describe('Performance: full-catalog detection scan latency', () => {
  it('scans every configured tool (sequential, as main.js does) within budget', async () => {
    const { checkToolStatus } = await import('../../src/core/detector.js');
    execMock.mockImplementation((cmd, opts, cb) => cb(null, 'v1.0.0', ''));

    const start = performance.now();
    for (const tool of TOOLS) {
      await checkToolStatus(tool);
    }
    const elapsedMs = performance.now() - start;

    // 11 tools * ~2ms simulated exec + overhead should stay well under a second.
    expect(elapsedMs).toBeLessThan(1000);
  });
});
