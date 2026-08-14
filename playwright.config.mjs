import { defineConfig, devices } from '@playwright/test';

// DevPulse is primarily an Electron desktop app, but src/renderer.jsx ships a
// built-in browser mock for window.devpulse specifically so the renderer can
// run standalone as an interactive web demo (see vercel.json / netlify.toml).
// That web build is what these Playwright suites drive: functional E2E,
// cross-browser (via the `projects` below), responsive layout, and visual
// regression testing.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Firefox in particular gets flaky under heavy worker contention against a
  // single preview server on modest CI/dev hardware; one retry absorbs that
  // without masking genuine logic failures (which fail consistently).
  retries: 1,
  workers: 4,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: 'disabled' }
  },
  use: {
    baseURL: 'http://localhost:5183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    // Serve the production build (matches the actual Vercel/Netlify deploy)
    // instead of the on-demand Vite dev server: dozens of parallel test
    // workers hammering an unbundled dev server on first load caused
    // widespread cold-compile timeouts. `preview` serves static, pre-built
    // assets, which is both faster and closer to what ships.
    command: 'npx vite build -c vite.renderer.config.mjs && npx vite preview -c vite.renderer.config.mjs --port 5183 --strictPort',
    url: 'http://localhost:5183',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  // Cross-browser coverage: the same functional spec runs against all three
  // engines. Responsive and visual-regression specs pin themselves to
  // chromium internally (via test.skip on browserName) since they drive
  // their own explicit viewport sizes rather than relying on device presets.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
