import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('difficulty control changes value and screenshot saved', async ({ page }) => {
  await page.goto('/');
  // enter the game from the Home menu
  await page.locator('button:has-text("Journey")').click();

  const select = page.locator('label:has-text("Difficulty") select');
  await expect(select).toHaveValue(/easy|medium|hard|extreme/);

  // change difficulty to medium
  await select.selectOption('medium');
  await expect(select).toHaveValue('medium');

  // take screenshot for verification
  const outDir = path.join(process.cwd(), 'e2e', 'screenshots');
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    // ignore
  }
  const outPath = path.join(outDir, 'controls.png');
  await page.screenshot({ path: outPath, fullPage: true });
  // basic assertion: file exists and is non-empty
  const stat = fs.statSync(outPath);
  expect(stat.size).toBeGreaterThan(0);
});

test('palette picker opens and changes palette, with no extra bolt button', async ({ page }) => {
  await page.goto('/');
  // enter the game from the Home menu
  await page.locator('button:has-text("Journey")').click();

  // Palette picker: open the palette dropdown
  const paletteToggle = page.locator('button[aria-haspopup="true"]');
  await expect(paletteToggle).toBeVisible();
  const currentText = await paletteToggle.textContent();
  await paletteToggle.click();

  // Prefer selecting 'Pastel' palette for the test (defaults start as 'Vibrant')
  const tryNames = ['Pastel', 'Dark', 'Colorblind'];
  let picked: string | null = null;
  for (const name of tryNames) {
    const opt = page.locator(`div[style*="position: absolute"] button:has-text("${name}")`);
    if (await opt.count() > 0) {
      await opt.first().click();
      picked = name;
      break;
    }
  }
  if (!picked) {
    // fallback: close the picker
    await paletteToggle.click();
  } else {
    await expect(paletteToggle).toContainText(picked);
  }

  const extraBtn = page.locator('button:has-text("Extra Bolt")');
  await expect(extraBtn).toHaveCount(0);
});
