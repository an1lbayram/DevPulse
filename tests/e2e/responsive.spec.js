import { test, expect } from '@playwright/test';

// Responsive layout checks. Runs once (chromium) across a matrix of explicit
// viewport sizes rather than relying on Playwright's mobile device presets,
// so it stays fast and deterministic regardless of which browser projects
// are configured.
test.skip(({ browserName }) => browserName !== 'chromium', 'Responsive checks only need one engine');

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide-desktop', width: 1920, height: 1080 }
];

for (const viewport of viewports) {
  test.describe(`Responsive: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.tool-card')).toHaveCount(11);
    });

    test('never causes horizontal page overflow', async ({ page }) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      // Allow a small tolerance for scrollbar rendering differences.
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test('keeps the primary actions reachable and clickable', async ({ page }) => {
      const scanButton = page.getByRole('button', { name: /scan system/i });
      await expect(scanButton).toBeVisible();
      await scanButton.click();
      await expect(page.getByText('Scan completed successfully.').last()).toBeVisible();
    });

    test('keeps the search input usable', async ({ page }) => {
      const search = page.getByPlaceholder('Search tools...');
      await expect(search).toBeVisible();
      await search.fill('npm');
      await expect(page.locator('.tool-card')).toHaveCount(1);
    });

    test('renders the log panel without overflowing its container', async ({ page }) => {
      const logPanel = page.locator('.log-panel');
      await expect(logPanel).toBeVisible();
      const overflowing = await logPanel.evaluate(el => el.scrollWidth > el.clientWidth + 2);
      expect(overflowing).toBe(false);
    });
  });
}
