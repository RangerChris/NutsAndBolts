const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const url = process.env.URL || 'http://localhost:5173/';
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1200, height: 900 });

    const results = [];

    // Test multiple difficulties and seeds to expose clipping bugs on tall bolts
    const testCases = [
        { difficulty: 'easy', seed: 'bugcheck-easy-1' },
        { difficulty: 'easy', seed: 'bugcheck-easy-2' },
        { difficulty: 'medium', seed: 'bugcheck-medium-1' },
        { difficulty: 'medium', seed: 'bugcheck-medium-2' },
        { difficulty: 'hard', seed: 'bugcheck-hard-1' },
        { difficulty: 'hard', seed: 'bugcheck-hard-2' },
        { difficulty: 'extreme', seed: 'bugcheck-extreme-1' },
        { difficulty: 'extreme', seed: 'bugcheck-extreme-2' },
    ];

    for (let i = 0; i < testCases.length; i++) {
        const { difficulty, seed } = testCases[i];

        // switch difficulty via the select element
        await page.selectOption('select', difficulty);
        await page.waitForTimeout(300);

        // open seed editor and set the seed
        try {
            await page.click('button:has-text("Edit")');
            await page.fill('input', seed);
            await page.click('button:has-text("Save")');
        } catch (e) {
            // ignore
        }

        // wait for UI to update
        await page.waitForTimeout(700);

        // capture board screenshot
        const shotPath = `screenshots/check-${i}-${difficulty}.png`;
        await page.screenshot({ path: shotPath, fullPage: true });

        // collect bolt data
        const bolts = await page.evaluate(() => {
            const out = [];
            const boltEls = Array.from(document.querySelectorAll('[data-bolt]'));
            for (const be of boltEls) {
                const id = be.getAttribute('data-bolt');
                // debug labels under bolt (text like "0:c0")
                // debug labels under bolt: select the aria-hidden debug container we render in BoltView
                const dbgContainer = be.querySelector('div[aria-hidden="true"]');
                let debugLabels = [];
                let debugDetail = [];
                if (dbgContainer) {
                    const children = Array.from(dbgContainer.children);
                    debugLabels = children.map((d) => (d.textContent || '').trim()).filter((t) => /^\d+:/.test(t));
                    debugDetail = children.map((d) => ({ text: (d.textContent || '').trim(), html: d.outerHTML }));
                }
                // svg groups with data-nut-index
                const groups = Array.from(be.querySelectorAll('[data-nut-index]'));
                const svgLabels = groups.map((g) => {
                    // prefer explicit data-nut-id attribute when available
                    const dataId = g.getAttribute('data-nut-id');
                    if (dataId) return dataId;
                    const text = g.querySelector('text');
                    return text ? (text.textContent || '').trim() : null;
                }).filter((t) => t != null);

                // also check if any nut SVG group has a negative y on its rect (clipped above tip)
                const clippedNuts = groups.filter((g) => {
                    const r = g.querySelector('rect');
                    if (!r) return false;
                    const y = parseFloat(r.getAttribute('y') || '0');
                    return y < 0;
                }).map((g) => g.getAttribute('data-nut-index'));

                // get declared capacity from SVG height heuristic: compare svg height vs nut count
                const svg = be.querySelector('svg');
                const svgHeight = svg ? parseFloat(svg.getAttribute('height') || '0') : 0;

                out.push({ id, debugLabels, svgLabels, clippedNuts, svgHeight, debugDetail });
            }
            return out;
        });

        // compare
        const mismatches = [];
        for (const b of bolts) {
            const dbg = b.debugLabels.map((t) => t.split(':')[1]);
            const svg = b.svgLabels;
            // compare arrays (length and elements by index)
            const same = dbg.length === svg.length && dbg.every((v, idx) => v === svg[idx]);
            if (!same || b.clippedNuts.length > 0) {
                mismatches.push({ id: b.id, debug: dbg, svg, clippedNuts: b.clippedNuts });
            }
        }

        results.push({ seed, difficulty, shotPath, mismatches, boltsCount: bolts.length });
    }

    await browser.close();

    fs.mkdirSync('screenshots', { recursive: true });
    fs.writeFileSync('screenshots/check-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to screenshots/check-results.json');
    console.log(JSON.stringify(results, null, 2));
})();
