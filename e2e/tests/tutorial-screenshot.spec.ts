import { test, expect } from '@playwright/test';

test('capture screenshot before and after Help/Tutorial click', async ({ page }) => {
  // ensure predictable board
  await page.addInitScript(() => {
    try {
      const p = { version: 1, difficulties: { easy: { currentLevel: 1, maxReached: 1 } }, settings: { paletteId: 0, difficulty: 'easy', seeds: {} } };
      localStorage.setItem('nuts-and-bolts:progress', JSON.stringify(p));
    } catch {}
  });

  await page.goto('/');

  // screenshot before clicking help
  await page.screenshot({ path: 'test-results/tutorial-before.png', fullPage: true });

  const help = page.locator('button[data-testid="help-tutorial"]');
  await expect(help).toBeVisible();
  await help.click();

  // give UI a moment to update
  await page.waitForTimeout(250);

  // screenshot after clicking help
  await page.screenshot({ path: 'test-results/tutorial-after.png', fullPage: true });

  // also assert overlay exists (test will still fail if it doesn't)
  const overlay = page.locator('.tutorial-overlay');
  await expect(overlay).toBeVisible();
});
