import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/component/**', 'jsdom'],
      ['tests/a11y/**', 'jsdom']
    ],
    setupFiles: ['./tests/setup/vitest.setup.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.vite/**', 'tests/e2e/**'],
    // ESLint's programmatic lintFiles() and a couple of CPU-timing budgets can
    // legitimately take longer than the 5s default once ~20 files' worth of
    // suites (several running real jsdom + axe) are competing for the CPU at
    // once; running files sequentially trades a bit of wall-clock time for a
    // suite that doesn't spuriously fail under contention.
    testTimeout: 20_000,
    fileParallelism: false
  }
});
