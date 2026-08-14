import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Code quality: ESLint over src/', () => {
  it('reports zero lint errors across the shipped application source', async () => {
    const eslint = new ESLint({ cwd: rootDir });
    const results = await eslint.lintFiles(['src/**/*.{js,jsx}']);

    const errors = results.flatMap(r => r.messages.filter(m => m.severity === 2));
    if (errors.length > 0) {
      const formatter = await eslint.loadFormatter('stylish');
      const formatted = await formatter.format(results);
      throw new Error(`ESLint found ${errors.length} error(s) in src/:\n${formatted}`);
    }

    expect(errors).toHaveLength(0);
  });

  it('lints at least the known application source files (config isn\'t accidentally excluding everything)', async () => {
    const eslint = new ESLint({ cwd: rootDir });
    const results = await eslint.lintFiles(['src/**/*.{js,jsx}']);
    expect(results.length).toBeGreaterThanOrEqual(10);
  });
});
