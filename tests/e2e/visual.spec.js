import { test, expect } from '@playwright/test';

// Visual regression. Pinned to chromium + a fixed viewport so baseline PNGs
// are deterministic. The log panel is masked because it contains
// wall-clock timestamps (toLocaleTimeString()) that change on every run.
test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are captured against chromium only');

test.use({ viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tool-card')).toHaveCount(11);
  // Let the "up to date ✓" / status-badge state settle before snapshotting.
  await page.waitForTimeout(150);
});

test('dashboard header', async ({ page }) => {
  const header = page.locator('.header');
  await expect(header).toBeVisible();
  await expect(header).toHaveScreenshot('dashboard-header.png');
});

test('dashboard summary stats', async ({ page }) => {
  const stats = page.locator('.stats-grid');
  await expect(stats).toBeVisible();
  await expect(stats).toHaveScreenshot('dashboard-stats.png');
});

test('dashboard controls bar (search + category filters)', async ({ page }) => {
  const controls = page.locator('.controls-bar');
  await expect(controls).toBeVisible();
  await expect(controls).toHaveScreenshot('dashboard-controls-bar.png');
});

test('tool card: up-to-date state', async ({ page }) => {
  const card = page.locator('.tool-card', { hasText: 'npm' });
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot('tool-card-up-to-date.png');
});

test('tool card: update-available state', async ({ page }) => {
  const card = page.locator('.tool-card', { hasText: 'Python' });
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot('tool-card-update-available.png');
});

test('tool card: manual-update state with admin command', async ({ page }) => {
  const card = page.locator('.tool-card', { hasText: 'Chocolatey' });
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot('tool-card-manual-admin-cmd.png');
});

test('full dashboard, mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot('dashboard-mobile.png', {
    fullPage: true,
    mask: [page.locator('.log-panel')]
  });
});
