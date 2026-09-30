// Isolated browser acceptance: never opens .env or the existing character database.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleRequest } from "../../server.js";
import { createCharacter, getCharacter, listCharactersByOwner, openDatabase } from "../../storage/index.js";
import { createWebSession } from "../../auth/store.js";
import { readAuthConfig } from "../../auth/config.js";
import { starterSkills, derivePreview } from "../../rules/sheet.js";
import { OCCUPATIONS } from "../../rules/data/occupations.js";
import { minimalCharacter } from "../../tests/minimalCharacter.js";

const require = createRequire(join(process.argv[2], "package.json"));
const { chromium } = require("playwright");
const output = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "arkham-ui5-check-"));
const db = openDatabase({ DATABASE_PATH: join(temp, "check.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test" };
const owner = "100";
const card = minimalCharacter(); card.id = "ui5-card"; card.identity.name = "江晦"; card.initialSan = 50;
card.background.appearance = "旧大衣的口袋里，总留着一张泛黄的照片。";
card.background.personalHistory = "九月三十日，阿卡姆。\n" + "在图书馆闭馆之后，他沿着旧码头寻找失踪者的足迹。\n".repeat(35);
createCharacter(db, card);
const server = createServer((request, response) => handleRequest(request, response, { db, env, fetchImpl: () => { throw new Error("No Discord calls in test"); } }));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const context = await browser.newContext({ acceptDownloads: true });
await context.addCookies([{ name: "coc_session", value: createWebSession(db, readAuthConfig(env), owner), url: origin }]);
const page = await context.newPage(); const errors = []; page.on("pageerror", error => errors.push(error.message));
const edit = origin + "/investigators/ui5-card/edit"; const results = [];
const state = expected => page.waitForFunction(value => document.getElementById("save-status").dataset.state === value, expected);
async function save() { await page.waitForFunction(() => !document.getElementById("save-card").disabled); await page.locator("#save-card").click(); await state("saved"); }
async function metrics() {
  const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, badImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).length }));
  assert.equal(result.scrollWidth, result.width); assert.equal(result.badImages, 0); return result;
}
async function restore() { const response = await context.request.patch(origin + "/api/characters/ui5-card", { data: card }); assert.equal(response.status(), 200); }
try {
for (const width of [1440, 1280, 390, 320]) {
  await restore(); await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 }); await page.goto(edit); await state("saved");
  await page.locator("[data-tab=story]").click(); assert.equal(await page.locator("#panel-story textarea").count(), 9);
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
  await page.screenshot({ path: join(output, "story-" + width + ".png"), fullPage: true });
  const storyMetrics = await metrics();
  const longText = card.background.personalHistory + "\n纸页末尾：<script>这只是手记文字</script>";
  await page.locator("[name=personalHistory]").fill(longText); await state("dirty");
  await page.locator("[data-tab=gear]").click(); await page.locator("[data-tab=story]").click(); assert.equal(await page.locator("[name=personalHistory]").inputValue(), longText);
  await save(); assert.equal(getCharacter(db, card.id).character.background.personalHistory, longText);
  await page.locator("[data-tab=gear]").click(); assert.equal(await page.locator("#weapon-empty").isVisible(), true);
  await page.locator("#open-weapon-catalog").click(); await page.locator("#weapon-category").selectOption("手枪"); await page.locator("#weapon-search").fill("左轮");
  assert.ok(await page.locator("[data-weapon-entry]:visible").count() > 0); assert.equal(await page.locator("[data-weapon-entry]:visible").evaluateAll(entries => entries.every(entry => entry.dataset.category === "手枪")), true);
  await state("saved"); await metrics();
  await page.screenshot({ path: join(output, "catalog-" + width + "-viewport.png") });
  await page.locator("#weapon-search").fill("找不到的武器"); assert.equal(await page.locator("#weapon-no-results").isVisible(), true);
  await page.locator("#weapon-search").fill("左轮"); await page.locator("[data-weapon-entry]:visible button").first().click(); await state("dirty");
  assert.ok((await page.locator("#weapon-added").textContent()).includes("已加入"));
  await page.locator("[data-weapon-entry]:visible button").first().click(); await page.keyboard.press("Escape");
  assert.equal(await page.locator("#weapon-catalog-dialog").evaluate(node => node.open), false);
  assert.equal(await page.locator("#open-weapon-catalog").evaluate(node => node === document.activeElement), true);
  assert.equal(await page.locator("#weapon-rows .weapon-row").count(), 2);
  const first = page.locator("#weapon-rows .weapon-row").first(); await first.locator("summary").click();
  await first.locator("[data-field=note]").fill("从旧书桌的抽屉里找到。\n保留 DB 与半DB 原文。");
  await first.locator("[data-field=price]").fill("私人收藏"); await first.locator("[data-field=quantity]").fill("2");
  await first.locator("summary").click(); await save(); const saved = getCharacter(db, card.id).character;
  assert.equal(saved.weapons.length, 2); assert.equal(saved.weapons[0].price, "私人收藏"); assert.equal(saved.weapons[0].quantity, 2); assert.ok(saved.weapons[0].note.includes("半DB"));
  await page.reload(); await state("saved"); await page.locator("[data-tab=gear]").click();
  await page.locator("#weapon-rows .weapon-row").first().locator("summary").click(); assert.equal(await page.locator("#weapon-rows .weapon-row").first().locator("[data-field=price]").inputValue(), "私人收藏");
  await page.locator("#add-weapon").click(); const custom = page.locator("#weapon-rows .weapon-row").last();
  await custom.locator("[data-field=name]").fill("刻着黑玫瑰的手杖"); await custom.locator("[data-field=type]").fill("常规武器"); await custom.locator("[data-field=skill]").fill("格斗（斗殴）"); await custom.locator("[data-field=damage]").fill("1D6+半DB");
  await page.locator("#armor-enabled").check(); await page.locator("#armor-name").fill("厚皮夹克"); await page.locator("#armor-mov").check(); await page.locator("#armor-penalty").fill("1");
  await page.locator("#cash").fill("125"); await page.locator("#add-item").click(); await page.locator(".item-row [data-field=name]").fill("旧怀表与调查笔记");
  await page.locator("#add-spell").click(); await page.locator(".spell-row [data-field=name]").fill("古旧书页中的咒文"); await save();
  const complete = getCharacter(db, card.id).character; assert.equal(complete.weapons[2].damage, "1D6+半DB"); assert.equal(complete.armor.movPenalty, 1); assert.equal(complete.possessions.cash, 125); assert.equal(complete.spells[0].name, "古旧书页中的咒文");
  await metrics(); await page.screenshot({ path: join(output, "gear-" + width + ".png"), fullPage: true }); if (width < 600) await page.screenshot({ path: join(output, "gear-" + width + "-viewport.png") });
  await page.locator("#weapon-rows .weapon-row").last().locator("[data-remove-row]").click(); assert.equal(await page.locator("#weapon-rows .weapon-row").count(), 2);
  await page.locator(".item-row [data-remove-row]").click(); await page.waitForFunction(() => !document.getElementById("item-empty").hidden); assert.equal(await page.locator("#item-empty").isVisible(), true);
  await page.locator(".spell-row [data-remove-row]").click(); await page.locator("#armor-enabled").uncheck(); await save(); assert.equal(getCharacter(db, card.id).character.armor, null); assert.equal(getCharacter(db, card.id).character.possessions.items.length, 0);
  results.push({ width, storyMetrics, longTextAndTabs: "PASS", catalogSearchAndEmpty: "PASS", multipleWeaponsAndCollapsedFields: "PASS", customWeaponArmorItemsSpells: "PASS", removalAndSave: "PASS" });
}
// Export download and import upload exercise the actual UI and ownership-safe API.
const roundtripCard = getCharacter(db, card.id).character;
await page.goto(edit); await state("saved");
const downloaded = page.waitForEvent("download"); await page.locator("#export-card").click(); const file = await downloaded; const filePath = join(temp, "roundtrip.coc7.json"); await file.saveAs(filePath);
assert.ok(file.suggestedFilename().endsWith(".coc7.json"));
await page.goto(origin + "/investigators"); await page.locator("#open-import").click(); await page.locator("#import-file").setInputFiles(filePath); await page.screenshot({ path: join(output, "import-320-viewport.png") });
await page.locator("#import-card button[type=submit]").click(); await page.waitForURL(/\/investigators\/[^/]+\/edit$/);
const importedId = decodeURIComponent(new URL(page.url()).pathname.split("/")[2]); assert.notEqual(importedId, card.id); const imported = getCharacter(db, importedId).character; assert.equal(imported.ownerDiscordUserId, owner); for (const key of ["background", "weapons", "armor", "possessions", "spells", "identity", "characteristics", "skills"]) assert.deepEqual(imported[key], roundtripCard[key]);
await page.locator("[data-tab=story]").click(); assert.equal(await page.locator("[name=personalHistory]").inputValue(), roundtripCard.background.personalHistory);
assert.deepEqual(errors, []); const record = { results, exportDownloadImportUpload: "PASS", errors, environment: "Edge headless with temporary SQLite and simulated session; real OAuth not tested." };
writeFileSync(join(output, "browser-results.json"), JSON.stringify(record, null, 2)); console.log(JSON.stringify(record, null, 2));
} finally { await browser.close(); await new Promise(done => server.close(done)); db.close(); assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + "\\")); rmSync(temp, { recursive: true, force: true }); }
