import { test, expect } from '@playwright/test';

test('Restart button recreates the initial board state', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:has-text("Journey")').click();
  // start first level
  await page.locator('.journey-screen button.control-btn:has-text("1")').first().click();

  // wait for board to render
  await page.waitForSelector('[data-bolt]');

  const captureBoard = async () => {
    return await page.evaluate(() => {
      const bolts = Array.from(document.querySelectorAll('[data-bolt]'));
      return bolts.map((b) => {
        const id = b.getAttribute('data-bolt') || '';
        const nuts = Array.from(b.querySelectorAll('[data-nut-index]')).map((n) => n.getAttribute('data-nut-id') || '');
        return { id, nuts };
      });
    });
  };

  const before = await captureBoard();
  // Click Restart (aria-label added to the button)
  const restart = page.locator('button[aria-label="Restart level"]');
  await expect(restart).toBeVisible();
  await restart.click();

  // wait for bolts to be present again (stabilize)
  const beforeCount = before.length;
  await page.waitForFunction((n) => document.querySelectorAll('[data-bolt]').length === n, beforeCount);

  const after = await captureBoard();

  // Assert the bolt/nut arrangement is identical after a restart
  expect(after).toEqual(before);
});
