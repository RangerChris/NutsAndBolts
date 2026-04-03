const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const url = process.env.URL || 'http://localhost:5173/';
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    const path = 'screenshot_ui.png';
    await page.screenshot({ path, fullPage: true });
    console.log('Saved', path);
    await browser.close();
})();
