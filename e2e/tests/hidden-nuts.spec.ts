import { test, expect } from '@playwright/test';
import { createLevel } from '../../src/lib/generator';
import { performMove } from '../../src/lib/engine';

test.describe('hidden nuts level (E2E)', () => {
  test('shows hidden underlying nuts and reveals on move', async ({ page }) => {
    let seed = 'hidden-e2e-1';
    // Force hiddenNuts so test is deterministic
    // try multiple nearby seeds until we find a level with hiddenNuts enabled
    // and at least one legal move (source must have >=2 nuts so an underlying nut exists)
    let foundState = null as any;
    let fromId: string | null = null;
    let toId: string | null = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const s = attempt === 0 ? seed : `${seed}-${attempt}`;
      const { state } = createLevel({ difficulty: 'easy', level: 1, seed: s });
      if (!state.hiddenNuts) continue;
      // look for any legal performMove or a single-nut move that fits capacity and color rules
      let found = false;
      for (let i = 0; i < state.bolts.length && !found; i++) {
        const src = state.bolts[i];
        // require source to have at least 2 nuts so there's an underlying hidden nut
        if (!src.nuts || src.nuts.length < 2) continue;
        const topColor = src.nuts[src.nuts.length - 1];
        for (let j = 0; j < state.bolts.length; j++) {
          if (i === j) continue;
          const tgt = state.bolts[j];
          // quick capacity check for one nut
          const free = tgt.capacity - tgt.nuts.length;
          const tgtTop = tgt.nuts.length > 0 ? tgt.nuts[tgt.nuts.length - 1] : undefined;
          if (free >= 1 && (tgt.nuts.length === 0 || tgtTop === topColor)) {
            // legal move of one nut
            fromId = src.id;
            toId = tgt.id;
            found = true;
            break;
          }
          // otherwise try performMove which handles group moves
          const ssrc = { id: src.id, capacity: src.capacity, nuts: src.nuts.slice() } as any;
          const stgt = { id: tgt.id, capacity: tgt.capacity, nuts: tgt.nuts.slice() } as any;
          const mv = performMove(ssrc, stgt);
          if (mv) {
            fromId = src.id;
            toId = tgt.id;
            found = true;
            break;
          }
        }
      }
      if (found) {
        foundState = state;
        seed = s; // use the discovered seed so app generates same
        break;
      }
    }
    test.expect(fromId).not.toBeNull();
    test.expect(toId).not.toBeNull();
    if (!fromId || !toId) return;

    // Seed the app and load
    const progress = {
      version: 1,
      difficulties: { easy: { currentLevel: 1, maxReached: 1 } },
      settings: { paletteId: 0, difficulty: 'easy' },
    } as any;
    await page.addInitScript((p) => {
      try { localStorage.setItem('nuts-and-bolts:progress', JSON.stringify(p)); } catch {};
    }, progress);

    await page.goto('/');

    // set seed via topbar edit UI (matches other e2e tests)
    const editBtn = page.locator('button.topbar-btn-edit');
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    const seedInput = page.locator('input[aria-label="Seed"]');
    await expect(seedInput).toBeVisible();
    await seedInput.fill(seed);
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();

    // wait for render
    await page.waitForTimeout(300);

    // There should be at least one underlying hidden nut element
    const hiddenSelector = `[data-bolt="${fromId}"] [data-nut-index="0"] rect[data-hidden="true"]`;
    const hiddenEl = page.locator(hiddenSelector);
    await expect(hiddenEl).toBeVisible();

    // Perform the move by clicking source then target
    const fromEl = page.locator(`[data-bolt="${fromId}"]`);
    const toEl = page.locator(`[data-bolt="${toId}"]`);
    await expect(fromEl).toBeVisible();
    await expect(toEl).toBeVisible();
    await fromEl.click();
    await toEl.click();
    await page.waitForTimeout(300);

    // After the move, the new top nut at the source should not be hidden
    const newTopIndex = (await page.locator(`[data-bolt="${fromId}"] [data-nut-index]`).count()) - 1;
    const newTopHidden = page.locator(`[data-bolt="${fromId}"] [data-nut-index="${newTopIndex}"] rect[data-hidden="true"]`);
    await expect(newTopHidden).toHaveCount(0);
  });
});
