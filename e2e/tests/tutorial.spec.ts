import { test, expect } from '@playwright/test';
import { createLevel } from '../../src/lib/generator';
import { performMove } from '../../src/lib/engine';

test('tutorial flow advances with pick and move', async ({ page }) => {
  // find a seed with at least one valid move
  let chosenSeed = 'tutorial-1';
  let foundMove: { fromBoltId: string; toBoltId: string } | null = null;

  for (let attempt = 0; attempt < 50; attempt++) {
    const s = attempt === 0 ? chosenSeed : `${chosenSeed}-${attempt}`;
    const { state } = createLevel({ difficulty: 'medium', level: 1, seed: s });
    outer: for (let i = 0; i < state.bolts.length; i++) {
      for (let j = 0; j < state.bolts.length; j++) {
        if (i === j) continue;
        // use cloned bolt objects so we don't mutate original
        const src = JSON.parse(JSON.stringify(state.bolts[i]));
        const tgt = JSON.parse(JSON.stringify(state.bolts[j]));
        const mv = performMove(src, tgt);
        if (mv) {
          foundMove = { fromBoltId: state.bolts[i].id, toBoltId: state.bolts[j].id };
          chosenSeed = s;
          break outer;
        }
      }
    }
    if (foundMove) break;
  }

  expect(foundMove).not.toBeNull();
  if (!foundMove) return;

  // Seed the app so GameShell loads a predictable board for medium difficulty
  const progress = {
    version: 1,
    difficulties: { medium: { currentLevel: 1, maxReached: 1 } },
    settings: { paletteId: 0, difficulty: 'medium', seeds: { medium: chosenSeed } },
  };

  await page.addInitScript((p) => {
    try { localStorage.setItem('nuts-and-bolts:progress', JSON.stringify(p)); } catch { }
  }, progress);

  await page.goto('/');

  // Start Tutorial from Home
  await page.locator('button[data-testid="help-tutorial"]').click();
  await page.waitForSelector('.tutorial-overlay');
  await expect(page.locator('.tutorial-overlay p')).toContainText('Welcome');

  // Perform a pick (press Enter on the source bolt) then place on target
  const from = page.locator(`[data-bolt="${foundMove.fromBoltId}"]`);
  const to = page.locator(`[data-bolt="${foundMove.toBoltId}"]`);
  await expect(from).toBeVisible();
  await expect(to).toBeVisible();

  await from.focus();
  await from.press('Enter');
  // step should advance after pick (announce Pick step)
  await expect(page.locator('.tutorial-overlay p')).toContainText('Pick');

  await to.focus();
  await to.press('Enter');
  // move should have advanced tutorial to next phase (Extra Bolt step)
  await expect(page.locator('.tutorial-overlay p')).toContainText('Extra Bolt');
});
