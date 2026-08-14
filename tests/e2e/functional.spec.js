import { test, expect } from '@playwright/test';

// Functional / cross-browser E2E for the web-demo build of DevPulse (the
// same spec runs against chromium, firefox, and webkit per playwright.config.mjs).
// It exercises the real React app + the browser mock API from renderer.jsx,
// not a stubbed page.

test.describe('DevPulse web demo: functional smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the correct document title', async ({ page }) => {
    await expect(page).toHaveTitle(/DevPulse/);
  });

  test('runs an automatic scan on load and renders a card for every tool', async ({ page }) => {
    // The web-demo mock scan resolves almost instantly, so the loading state
    // is too transient to assert on reliably; assert the settled result instead.
    await expect(page.getByText('Python')).toBeVisible();
    await expect(page.getByText('Node.js')).toBeVisible();
    await expect(page.getByText('winget')).toBeVisible();

    // 11 tools configured in src/config/tools.js
    await expect(page.locator('.tool-card')).toHaveCount(11);
  });

  test('shows non-zero summary stats once the scan completes', async ({ page }) => {
    await expect(page.locator('.tool-card').first()).toBeVisible();
    const total = page.locator('.stat-card', { hasText: 'Total Tools' }).locator('.stat-value');
    await expect(total).toHaveText('11');
  });

  test('filters tool cards via the search box', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);
    await page.getByPlaceholder('Search tools...').fill('python');

    await expect(page.locator('.tool-card')).toHaveCount(1);
    await expect(page.getByText('Python')).toBeVisible();
    await expect(page.getByText('Node.js')).not.toBeVisible();
  });

  test('shows an empty state for a search with no matches', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);
    await page.getByPlaceholder('Search tools...').fill('nonexistent-tool-zzz');
    await expect(page.getByText(/no matching tools found/i)).toBeVisible();
  });

  test('filters by category tab', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);
    await page.getByRole('button', { name: 'Package Managers' }).click();

    await expect(page.getByText('npm')).toBeVisible();
    await expect(page.getByText('Python')).not.toBeVisible();
  });

  test('completes an individual tool update and logs the result', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);

    // Python is seeded as installed-but-outdated in the web demo mock, so it
    // has an enabled "Update Tool" button.
    const pythonCard = page.locator('.tool-card', { hasText: 'Python' });
    await pythonCard.getByRole('button', { name: /update tool/i }).click();

    await expect(page.getByText(/update for python completed successfully/i)).toBeVisible({ timeout: 15_000 });
  });

  test('re-running "Scan System" refreshes the log panel', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);
    const initialCount = await page.locator('.log-entry').count();

    await page.getByRole('button', { name: /scan system/i }).click();
    await expect(page.getByText('Scan completed successfully.').last()).toBeVisible();

    const finalCount = await page.locator('.log-entry').count();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  test('clears the log panel', async ({ page }) => {
    await expect(page.locator('.tool-card')).toHaveCount(11);
    await expect(page.locator('.log-entry').first()).toBeVisible();

    await page.getByRole('button', { name: /clear/i }).click();
    await expect(page.getByText(/waiting for operations/i)).toBeVisible();
  });
});
