// Run with: node docs/ui-1/check-browser.cjs <preview-url> <bundled-node-modules>
const { createRequire } = require('node:module');
const { join } = require('node:path');
const { writeFileSync } = require('node:fs');
const runtimeRequire = createRequire(join(process.argv[3], 'package.json'));
const { chromium } = runtimeRequire('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const results = [];
  try {
    for (const route of ['/', '/ui/asset-review']) {
      for (const width of [1440, 1280, 390, 320]) {
        const page = await browser.newPage({ viewport: { width, height: width > 600 ? 900 : 844 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
        await page.goto(new URL(route, process.argv[2]).href);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, fontLoaded: document.fonts.check('700 29px ArchiveSerif', '茶话会调查员档案馆'), unloadedImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src), title: document.title }));
        if (route === '/') {
          await page.keyboard.press('Tab');
          result.keyboardLogin = await page.locator('.discord-login').evaluate(element => element === document.activeElement);
          const client = await page.context().newCDPSession(page);
          await client.send('DOM.enable'); await client.send('CSS.enable');
          const { root } = await client.send('DOM.getDocument');
          const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' });
          result.titleFonts = (await client.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
        } else {
          await page.locator('#sample-note').fill('纸面试写：侦查 65');
          result.textareaEditable = await page.locator('#sample-note').inputValue() === '纸面试写：侦查 65';
        }
        const name = route === '/' ? 'login' : 'asset-review';
        await page.evaluate(() => document.activeElement?.blur());
        await page.screenshot({ path: join(__dirname, `${name}-${width}.png`), fullPage: true });
        results.push({ route, width, ...result, errors });
        await page.close();
      }
    }
    writeFileSync(join(__dirname, 'browser-results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    if (results.some(result => result.scrollWidth > result.viewport || !result.fontLoaded || result.unloadedImages.length || result.errors.length || result.keyboardLogin === false || result.textareaEditable === false)) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
