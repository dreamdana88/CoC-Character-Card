// Isolated browser acceptance: never opens .env or the existing character database.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleRequest } from "../../server.js";
import { createCharacter, listCharactersByOwner, openDatabase } from "../../storage/index.js";
import { createWebSession } from "../../auth/store.js";
import { readAuthConfig } from "../../auth/config.js";
import { minimalCharacter } from "../../tests/minimalCharacter.js";

const require = createRequire(join(process.argv[2], "package.json"));
const { chromium } = require("playwright");
const output = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "arkham-ui2-check-"));
const db = openDatabase({ DATABASE_PATH: join(temp, "check.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test" };
const owner = "100";
const samples = [
  ["江晦", "私家侦探"], ["沈瑾言", "学者"], ["鹤归", "艺术家"],
  ["白露", "医生"], ["这是一位拥有非常长姓名的调查员用于窄屏排版检查", "拥有很长职业名称的档案馆文献研究工作者"],
];
samples.forEach(([name, occupation], index) => {
  const card = minimalCharacter(); card.id = `ui2-${index}`; card.identity.name = name; card.occupation.name = occupation; card.initialSan = 50;
  createCharacter(db, card, { now: new Date(`2026-09-${String(20 + index).padStart(2, "0")}T00:00:00Z`) });
});
const server = createServer((request, response) => handleRequest(request, response, { db, env, fetchImpl: () => { throw new Error("No Discord calls in UI test"); } }));
await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const context = await browser.newContext();
await context.addCookies([{ name: "coc_session", value: createWebSession(db, readAuthConfig(env), owner), url: origin }]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
const results = [];
try {
  for (const width of [1440, 1280, 390, 320]) {
    await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
    await page.goto(`${origin}/investigators`);
    await page.locator(".archive-card").first().waitFor();
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    assert.equal(await page.locator(".archive-card").count(), 5);
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, badImages: [...document.images].filter(image => !image.naturalWidth).length }));
    assert.equal(metrics.scrollWidth, width);
    assert.equal(metrics.badImages, 0);
    const layout = await page.locator('.archive-card').evaluateAll(cards => cards.map(card => {
      const rect = card.getBoundingClientRect();
      const footer = card.querySelector('.card-footer').getBoundingClientRect();
      const image = card.querySelector('.card-side-ornament');
      const imageRect = image.getBoundingClientRect();
      return { name: card.dataset.name, height: rect.height, footerBottomGap: rect.bottom-footer.bottom, ornament: image.getAttribute('src'), imageWidth: imageRect.width, imageHeight: imageRect.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
    }));
    assert.equal(new Set(layout.map(card => card.height)).size, 1, 'all card heights match including long-name fixture');
    assert.ok(layout.every(card => card.footerBottomGap >= 14), 'actions retain safe bottom paper margin');
    const artHeights = layout.map(card => Math.min(card.imageWidth/card.naturalWidth,card.imageHeight/card.naturalHeight)*card.naturalHeight);
    assert.ok(Math.max(...artHeights)/Math.min(...artHeights)<1.08,'trimmed ornaments have comparable effective heights');
    writeFileSync(join(output, 'layout-'+width+'.json'), JSON.stringify(layout, null, 2));
    await page.screenshot({ path: join(output, `library-${width}.png`), fullPage: true });
    await page.locator("#archive-search").fill("侦探");
    assert.equal(await page.locator(".archive-card:visible").count(), 1);
    await page.locator("#archive-search").fill("找不到的名字");
    assert.equal(await page.locator("#no-search-results").isVisible(), true);
    await page.locator("#clear-search").click();
    assert.equal(await page.locator(".archive-card:visible").count(), 5);
    await page.locator("#archive-sort").selectOption("name");
    const names = await page.locator(".archive-card").evaluateAll(cards => cards.map(card => card.dataset.name));
    assert.deepEqual(names, [...names].sort(new Intl.Collator("zh-CN", { numeric: true }).compare));
    await page.locator("#open-import").click();
    assert.equal(await page.locator("#import-dialog").isVisible(), true);
    await page.screenshot({ path: join(output, `import-${width}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#import-dialog").isVisible(), false);
    results.push({ width, ...metrics, search: "PASS", sort: "PASS", importDialog: "PASS" });
  }
  // Real HTTP mutations and file import/export, but only against the temporary fixture database.
  const exported = await context.request.get(`${origin}/api/characters/ui2-0/export`);
  assert.equal(exported.status(), 200);
  const payload = await exported.body();
  assert.ok(exported.headers()["content-disposition"].includes("attachment"));
  await page.locator("#open-import").click();
  await page.locator("#import-file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("bad json") });
  await page.locator("#import-card button[type=submit]").click();
  await page.getByText("文件不是 JSON", { exact: true }).waitFor();
  await page.locator("#import-file").setInputFiles({ name: "sample.coc7.json", mimeType: "application/json", buffer: payload });
  await Promise.all([page.waitForURL(/\/edit$/), page.locator("#import-card button[type=submit]").click()]);
  assert.equal(listCharactersByOwner(db, owner).length, 6);
  await page.goto(`${origin}/investigators`);
  await page.locator('[data-archive-card]').filter({ has: page.locator('[data-duplicate="ui2-0"]') }).locator('summary').click();
  await Promise.all([page.waitForURL(/copied=1/), page.locator('[data-duplicate="ui2-0"]').click()]);
  assert.equal(listCharactersByOwner(db, owner).length, 7);
  const copyId = new URL(page.url()).pathname.split("/")[2];
  await page.goto(`${origin}/investigators`);
  await page.locator(`[data-delete="${copyId}"]`).evaluate(button => { button.closest("details").open = true; });
  page.once("dialog", dialog => dialog.dismiss());
  await page.locator(`[data-delete="${copyId}"]`).click();
  assert.equal(listCharactersByOwner(db, owner).length, 7);
  page.once("dialog", dialog => dialog.accept());
  await Promise.all([page.waitForNavigation(), page.locator(`[data-delete="${copyId}"]`).click()]);
  assert.equal(listCharactersByOwner(db, owner).length, 6);
  await page.locator("#logout").click();
  await page.waitForURL(`${origin}/`);
  assert.equal(await page.locator(".discord-login").count(), 1);
  await context.addCookies([{ name: "coc_session", value: createWebSession(db, readAuthConfig(env), "200"), url: origin }]);
  await page.goto(`${origin}/investigators`);
  assert.equal(await page.locator(".archive-card").count(), 0);
  assert.equal(await page.locator("#empty-archive").isVisible(), true);
  await page.screenshot({ path: join(output, "empty-320.png"), fullPage: true });
  assert.deepEqual(errors, []);
  const record = { results, export: "PASS", invalidJson: "PASS", import: "PASS", duplicate: "PASS", deleteCancelAndConfirm: "PASS", logout: "PASS", emptyAndOwnerIsolation: "PASS", errors, environment: "Edge headless, temporary DB and simulated authenticated session; no real OAuth" };
  writeFileSync(join(output, "browser-results.json"), JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
  db.close();
  assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + "\\"));
  rmSync(temp, { recursive: true, force: true });
}
