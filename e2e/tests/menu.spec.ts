import { test, expect } from '@playwright/test';

test('home menu shows on load and selecting modes starts game', async ({ page }) => {
  await page.goto('/');

  // Home screen should render
  await expect(page.locator('.home-screen h1')).toHaveText('Nuts & Bolts');

  // Start Journey mode
  await page.locator('button:has-text("Journey")').click();
  // Board should appear
  await page.waitForSelector('[data-bolt]');
  const count = await page.locator('[data-bolt]').count();
  await expect(count).toBeGreaterThan(0);

  // Return to home via TopBar exit if present, otherwise reload
  await page.goto('/');

  // Start Custom Seed mode and ensure TopBar seed edit is available
  await page.locator('input[placeholder="seed string"]').fill('test-seed-1');
  await page.locator('button:has-text("Custom Seed")').click();
  // wait for TopBar edit to appear, then open edit and check input
  const editBtn = page.locator('button.topbar-btn-edit');
  await page.waitForSelector('button.topbar-btn-edit');
  await expect(editBtn).toBeVisible();
  await page.evaluate(() => { const e = document.querySelector('button.topbar-btn-edit') as HTMLButtonElement | null; e?.click(); });
  await expect(page.locator('input[aria-label="Seed"]')).toBeVisible();
});
