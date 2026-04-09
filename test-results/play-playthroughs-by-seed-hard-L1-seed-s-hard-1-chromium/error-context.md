# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: play.spec.ts >> playthroughs by seed >> hard L1 seed=s-hard-1
- Location: e2e\tests\play.spec.ts:80:9

# Error details

```
TimeoutError: locator.click: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('[data-bolt="extra-0"]')
    - locator resolved to <div tabindex="0" role="button" data-bolt="extra-0" class="bolt   bolt-root-inline" aria-label="Bolt extra-0, 0 of 4 nuts">…</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bottom-bar bottom-bar-inner">…</div> from <div class="game-actions">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bottom-bar bottom-bar-inner">…</div> from <div class="game-actions">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    9 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bottom-bar bottom-bar-inner">…</div> from <div class="game-actions">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]:
            - strong [ref=e10]: Level
            - text: ": 1"
          - generic [ref=e12]:
            - strong [ref=e13]: Difficulty
            - text: ":"
            - combobox "Difficulty :" [ref=e14]:
              - option "easy"
              - option "medium"
              - option "hard" [selected]
              - option "extreme"
        - generic [ref=e15]:
          - generic [ref=e16]:
            - checkbox "Show debug" [ref=e17]
            - generic [ref=e18]: Show debug
          - generic [ref=e19]:
            - strong [ref=e20]: Seed
            - text: ":"
            - generic [ref=e21]:
              - text: s-hard-1
              - button "Edit" [ref=e22]
          - button "Vibrant" [ref=e24]:
            - generic [ref=e25]:
              - img [ref=e26]
              - img [ref=e28]
              - img [ref=e30]
              - img [ref=e32]
              - img [ref=e34]
            - generic [ref=e36]: Vibrant
      - generic [ref=e38]: In play
      - generic [ref=e41]:
        - button "Bolt b0, 3 of 4 nuts" [active] [ref=e43] [cursor=pointer]:
          - img [ref=e44]
        - button "Bolt b1, 4 of 4 nuts" [ref=e72] [cursor=pointer]:
          - img [ref=e73]
        - button "Bolt b2, 3 of 4 nuts" [ref=e102] [cursor=pointer]:
          - img [ref=e103]
        - button "Bolt b3, 2 of 4 nuts" [ref=e131] [cursor=pointer]:
          - img [ref=e132]
        - button "Bolt b4, 4 of 4 nuts" [ref=e159] [cursor=pointer]:
          - img [ref=e160]
        - button "Bolt b5, 4 of 4 nuts" [ref=e189] [cursor=pointer]:
          - img [ref=e190]
        - button "Bolt extra-0, 0 of 4 nuts" [ref=e219] [cursor=pointer]:
          - img [ref=e220]
      - generic [ref=e244]:
        - generic [ref=e247]: "Sorted: 10%"
        - generic [ref=e248]: Sorted 10 percent
      - generic [ref=e250]:
        - button "Undo" [disabled] [ref=e251]
        - button "Hint" [ref=e252] [cursor=pointer]
        - button "Restart level" [ref=e253] [cursor=pointer]: Restart
  - contentinfo:
    - generic [ref=e254]: "Version: 0.1.9"
```

# Test source

```ts
  46  |         parent.set(c, { prev: canon(state), move: { fromBoltId: mv.fromBoltId, toBoltId: mv.toBoltId } });
  47  |         if (isWin(ns)) {
  48  |           // reconstruct path
  49  |           const path: Move[] = [];
  50  |           let cur = c;
  51  |           while (cur) {
  52  |             const p = parent.get(cur);
  53  |             if (!p) break;
  54  |             if (p.move) path.unshift(p.move);
  55  |             cur = p.prev as string;
  56  |             if (!cur) break;
  57  |           }
  58  |           return path;
  59  |         }
  60  |         visited.add(c);
  61  |         queue.push({ state: ns, depth: depth + 1 });
  62  |       }
  63  |     }
  64  | 
  65  |   }
  66  |   return null;
  67  | }
  68  | 
  69  | test.describe('playthroughs by seed', () => {
  70  |   // Expanded cases: a few representative levels per difficulty
  71  |   const cases: Array<{ difficulty: string; level: number; seed: string }> = [];
  72  |   // easy: levels 1..3
  73  |   for (let l = 1; l <= 3; l++) cases.push({ difficulty: 'easy', level: l, seed: `s-easy-${l}` });
  74  |   // medium: levels 1..2
  75  |   for (let l = 1; l <= 2; l++) cases.push({ difficulty: 'medium', level: l, seed: `s-medium-${l}` });
  76  |   // hard: level 1 (keep limited to avoid long test times)
  77  |   cases.push({ difficulty: 'hard', level: 1, seed: 's-hard-1' });
  78  | 
  79  |   for (const c of cases) {
  80  |     test(`${c.difficulty} L${c.level} seed=${c.seed}`, async ({ page }) => {
  81  |       // Try the provided seed; if unsolvable, try nearby variations until a solvable seed is found.
  82  |       let chosenSeed = c.seed;
  83  |       let path = null as any;
  84  |       for (let attempt = 0; attempt < 50; attempt++) {
  85  |         const s = attempt === 0 ? chosenSeed : `${c.seed}-${attempt}`;
  86  |         const { state } = createLevel({ difficulty: c.difficulty as any, level: c.level, seed: s });
  87  |         path = findSolutionPath(state, 200);
  88  |         if (path) {
  89  |           chosenSeed = s;
  90  |           break;
  91  |         }
  92  |       }
  93  |       if (!path) {
  94  |         // eslint-disable-next-line no-console
  95  |         console.error('No solvable seed found near', c.seed);
  96  |         // For very hard difficulty it's acceptable we don't find a path within our limits — log the original state and skip.
  97  |         if (c.difficulty === 'hard') {
  98  |           const { state: original } = createLevel({ difficulty: c.difficulty as any, level: c.level, seed: c.seed });
  99  |           // eslint-disable-next-line no-console
  100 |           console.error('Original seed state bolts:', JSON.stringify(original.bolts, null, 2));
  101 |           test.skip(true, 'no solvable seed found near hard level');
  102 |           return;
  103 |         }
  104 |       }
  105 |       expect(path).not.toBeNull();
  106 |       if (!path) return;
  107 | 
  108 |       // Prepare localStorage so app loads the desired difficulty/level
  109 |       const progress = {
  110 |         version: 1,
  111 |         difficulties: { [c.difficulty]: { currentLevel: c.level, maxReached: c.level } },
  112 |         settings: { paletteId: 0, difficulty: c.difficulty, seeds: { [c.difficulty]: chosenSeed } },
  113 |       };
  114 |       await page.addInitScript((p) => {
  115 |         try { localStorage.setItem('nuts-and-bolts:progress', JSON.stringify(p)); } catch {};
  116 |       }, progress);
  117 | 
  118 |       await page.goto('/');
  119 | 
  120 |       // set seed via TopBar: open edit mode if needed, fill input, Save
  121 |       // Use DOM-triggered clicks so overlays cannot intercept pointer events.
  122 |       const seedInput = page.locator('input[aria-label="Seed"]');
  123 |       if (!(await seedInput.isVisible())) {
  124 |         await page.evaluate(() => {
  125 |           const edit = document.querySelector('button.topbar-btn-edit') as HTMLButtonElement | null;
  126 |           edit?.click();
  127 |         });
  128 |       }
  129 |       await expect(seedInput).toBeVisible();
  130 |       await seedInput.fill(chosenSeed);
  131 |       await page.evaluate(() => {
  132 |         const save = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Save') as HTMLButtonElement | undefined;
  133 |         save?.click();
  134 |       });
  135 | 
  136 |       // Wait a moment for the level to be generated
  137 |       await page.waitForTimeout(200);
  138 | 
  139 |       // Play moves by clicking bolts for each move pair.
  140 |       for (const mv of path) {
  141 |         const from = page.locator(`[data-bolt="${mv.fromBoltId}"]`);
  142 |         const to = page.locator(`[data-bolt="${mv.toBoltId}"]`);
  143 |         await expect(from).toBeVisible();
  144 |         await expect(to).toBeVisible();
  145 |         await from.click();
> 146 |         await to.click();
      |                  ^ TimeoutError: locator.click: Timeout 5000ms exceeded.
  147 |         // wait for animation/DOM update
  148 |         await page.waitForTimeout(200);
  149 |       }
  150 | 
  151 |       // Assert completion overlay appears
  152 |       await expect(page.locator('.complete-overlay')).toBeVisible({ timeout: 5000 });
  153 |     });
  154 |   }
  155 | });
  156 | 
```