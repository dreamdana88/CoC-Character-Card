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
const temp = mkdtempSync(join(tmpdir(), "arkham-revision-check-"));
const db = openDatabase({ DATABASE_PATH: join(temp, "check.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test" };
const owner = "100";
const card = minimalCharacter(); card.id = "revision-card"; card.identity.name = "江晦"; card.identity.sex = "男"; card.initialSan = 50; card.possessions = { items: [{name:"怀表"},{name:"调查笔记"}], cash: 125 }; card.spells = [{name:"旧日咒文"}];
createCharacter(db, card);
const server = createServer((request, response) => handleRequest(request, response, { db, env, fetchImpl: () => { throw new Error("No Discord calls in test"); } })); await new Promise(done => server.listen(0,"127.0.0.1",done));
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch({headless:true,executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}); const context = await browser.newContext({acceptDownloads:true}); await context.addCookies([{name:"coc_session",value:createWebSession(db,readAuthConfig(env),owner),url:origin}]); const page = await context.newPage(); const errors = []; page.on("pageerror",error=>errors.push(error.message));
const edit = origin + "/investigators/revision-card/edit"; const results = [];
const state = value => page.waitForFunction(expected => document.getElementById("save-status").dataset.state===expected,value);
async function save(){await page.waitForFunction(()=>!document.getElementById("save-card").disabled);await page.locator("#save-card").click();await page.waitForFunction(()=>["saved","failed"].includes(document.getElementById("save-status").dataset.state));assert.equal(await page.locator("#errors").textContent(), "");await state("saved");}
async function noOverflow(){const m=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,badImages:[...document.images].filter(img=>!img.complete||!img.naturalWidth).length}));assert.equal(m.scrollWidth,m.width);assert.equal(m.badImages,0);return m;}
const row=name=>page.locator(".skill-row").filter({has:page.locator(".skill-title").filter({hasText:new RegExp("^"+name+"(?: -|$)")})});
async function addInterest(name){await page.locator("#choose-skill").click();await page.locator("#skill-picker-custom").fill(name);await page.locator("#skill-picker-add").click();await state("dirty");}
try {
for(const width of [1440,1280,390,320]){
 const reset=await context.request.patch(origin+"/api/characters/revision-card",{data:card});assert.equal(reset.status(),200); await page.setViewportSize({width,height:width>600?1000:844});await page.goto(edit);await state("saved");await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
 assert.equal(await page.locator("select[name=sex]").inputValue(),"男"); assert.equal(await page.locator(".identity-rose").count(),0);assert.equal(await page.locator("#record-actions").count(),0);
 await page.screenshot({path:join(output,"intro-"+width+".png"),fullPage:true});await noOverflow();
 await page.locator("select[name=sex]").selectOption("女");await save();assert.equal(getCharacter(db,card.id).character.identity.sex,"女");
 await page.locator("[data-tab=skills]").click();assert.equal(await page.locator("#occupational-skills").isVisible(),false);assert.equal(await page.locator("[data-occupation=id]").getAttribute("type"),"hidden");assert.equal(await row("会计").locator("[data-remove-skill]").isVisible(),false);
 await page.locator("[data-skill-view=interest]").click();assert.equal(await page.locator("#skill-rows .skill-row:visible").count(),0);
 await addInterest("急救");assert.equal(await row("急救").isVisible(),true);await save();await page.reload();await state("saved");await page.locator("[data-tab=skills]").click();await page.locator("[data-skill-view=interest]").click();assert.equal(await row("急救").isVisible(),true);assert.equal(getCharacter(db,card.id).character.skills.find(skill=>skill.name==="急救").interestSelected,true);
 await row("急救").locator("[data-field=interestPoints]").fill("25");await save();await page.screenshot({path:join(output,"interest-"+width+".png"),fullPage:true});await noOverflow();
 await row("急救").locator("summary").click();await row("急救").locator("[data-remove-skill]").click();await save();assert.equal(await page.locator("#skill-rows .skill-row:visible").count(),0);
 await page.locator("[data-skill-view=occupation]").click();await page.locator("#mix-points").check();await page.locator("#show-growth").check();await page.screenshot({path:join(output,"profession-"+width+".png"),fullPage:true});await noOverflow();
 await page.locator("#choose-occupation").click();assert.equal((await page.locator("#occupation-results").textContent()).includes("编号"),false);await page.locator("#occupation-picker-close").click();
 await page.locator("[data-tab=story]").click();assert.ok((await page.locator("#panel-story").textContent()).includes("伤口伤疤"));assert.equal(await page.locator("#panel-story textarea").count(),8);
 await page.locator("[data-tab=gear]").click();assert.equal(await page.locator("#carried-items").inputValue(),"怀表\n调查笔记");assert.equal(await page.locator("#cash").isVisible(),false);assert.equal(await page.locator("#add-item").count(),0);assert.equal(await page.locator("#more-investigator-info").evaluate(node=>node.open),false);
 await page.locator("#carried-items").fill("怀表、调查笔记\n一束黑玫瑰");await page.locator("#more-investigator-info>summary").click();assert.equal(await page.locator(".additional-record").count(),5);
 for(const [key,text] of [["spells","旧日咒文\n守护咒文"],["assets","阿卡姆的一间旧书店"],["mythos","码头事件留下的神话线索"],["personalHistory","调查员的三次调查经历"],["companions","同行的医生与记者"]]){const detail=page.locator(".additional-record").filter({has:page.locator("#extra-"+key)});await detail.locator("summary").click();await page.locator("#extra-"+key).fill(text);await detail.locator("summary").click();}
 await page.locator("#more-investigator-info>summary").click();await save();const stored=getCharacter(db,card.id).character;assert.equal(stored.possessions.items[0].name,"怀表、调查笔记\n一束黑玫瑰");assert.equal(stored.possessions.cash,125);assert.equal(stored.background.assets,"阿卡姆的一间旧书店");assert.equal(stored.background.companions,"同行的医生与记者");assert.equal(stored.spells[0].name,"旧日咒文\n守护咒文");
 await page.screenshot({path:join(output,"equipment-"+width+".png"),fullPage:true});await noOverflow();await page.reload();await state("saved");await page.locator("[data-tab=gear]").click();await page.locator("#more-investigator-info>summary").click();await page.locator(".additional-record").filter({has:page.locator("#extra-assets")}).locator("summary").click();assert.equal(await page.locator("#extra-assets").inputValue(),"阿卡姆的一间旧书店");
 const dock=await page.locator(".save-toolbar").boundingBox();assert.ok(Math.abs((dock.x+dock.width/2)-width/2)<3);const panelBox=await page.locator('#panel-gear').boundingBox();assert.ok(dock.y>=panelBox.y+panelBox.height);assert.equal(await page.locator('.save-toolbar').evaluate(node=>getComputedStyle(node).position),'static');
 results.push({width,interestSelectionAndPersistence:"PASS",fixedOccupationalSkills:"PASS",singleTextRecordsAndDisclosure:"PASS",sexAndNonOverlappingBottomSave:"PASS",noOverflow:"PASS"});
}
const before=getCharacter(db,card.id).character;await page.goto(origin+"/investigators");const downloaded=page.waitForEvent("download");await page.locator('a[href="/api/characters/revision-card/export"]').click();const file=await downloaded;const path=join(temp,"roundtrip.coc7.json");await file.saveAs(path);await page.locator("#open-import").click();await page.locator("#import-file").setInputFiles(path);await page.locator("#import-card button[type=submit]").click();await page.waitForURL(/\/investigators\/[^/]+\/edit$/);const importedId=new URL(page.url()).pathname.split("/")[2];const imported=getCharacter(db,importedId).character;for(const key of ["background","possessions","spells","skills"])assert.deepEqual(imported[key],before[key]);assert.notEqual(importedId,card.id);
// A new card must still save successfully without the removed editor action bar.
await page.goto(origin+"/investigators/new");await page.locator('[name=name]').fill("新档案测试");await page.locator('[name=age]').fill("28");await page.locator('[name=sex]').selectOption("男");await page.locator('[name=era]').selectOption("1920s");await page.locator('[data-tab=stats]').click();for(const key of ["str","con","siz","dex","app","int","pow","edu","luck"])await page.locator('[name='+key+']').fill("50");await page.locator("#initialSan").fill("50");await save();assert.ok(new URL(page.url()).pathname.endsWith("/edit"));
assert.deepEqual(errors,[]);const record={results,jsonRoundtrip:"PASS",newCardSave:"PASS",errors,environment:"Edge headless; temporary SQLite and simulated session, real OAuth not tested."};writeFileSync(join(output,"browser-results.json"),JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
}finally{await browser.close();await new Promise(done=>server.close(done));db.close();assert.ok(resolve(temp).startsWith(resolve(tmpdir())+"\\"));rmSync(temp,{recursive:true,force:true});}
