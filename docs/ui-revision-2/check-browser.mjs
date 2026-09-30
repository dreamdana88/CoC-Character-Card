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
const temp = mkdtempSync(join(tmpdir(), "arkham-revision2-check-"));
const db = openDatabase({ DATABASE_PATH: join(temp, "check.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test" };
const owner = "100";
const card=minimalCharacter();card.id="rev2-card";card.skills.push({name:"技艺",specialty:"乐理",base:5,growth:0,occupationPoints:0,interestPoints:0,interestSelected:true});createCharacter(db,card);
const server=createServer((request,response)=>handleRequest(request,response,{db,env}));await new Promise(done=>server.listen(0,"127.0.0.1",done));const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});const context=await browser.newContext();await context.addCookies([{name:"coc_session",value:createWebSession(db,readAuthConfig(env),owner),url:origin}]);const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));const results=[];
try{for(const width of [1440,1280,390,320]){
await context.request.patch(origin+"/api/characters/rev2-card",{data:card});await page.setViewportSize({width,height:1000});await page.goto(origin+"/investigators/rev2-card/edit");await page.locator("[data-tab=skills]").click();await page.waitForFunction(()=>document.querySelector('.skill-rating').textContent.includes('成功率'));
assert.equal(await page.locator("#save-status").count(),0);assert.equal(await page.locator(".skill-details").count(),0);assert.equal(await page.locator(".skill-row [data-field=name]").first().inputValue(),"信用评级");
await page.locator("[data-skill-view=interest]").click();const row=page.locator('.skill-row').filter({has:page.locator('.skill-title').filter({hasText:'技艺'})});const select=row.locator('select[data-field=specialty]');assert.ok(await select.locator('option').count()>2);await select.selectOption({label:"美术"});await select.selectOption({label:"乐理"});await select.selectOption({label:"美术"});await row.locator('[data-pool=interestPoints] [data-step="5"]').click();await page.waitForFunction(()=>document.querySelector('[data-point-pool=interestPoints] [data-pool-remaining]').textContent==='剩余 145');assert.equal(await row.locator('[data-field=interestPoints]').inputValue(),'5');await row.locator('[data-pool=interestPoints] [data-step="-5"]').click();assert.equal(await row.locator('[data-field=interestPoints]').inputValue(),'0');await row.locator('[data-field=interestPoints]').fill('65');await page.waitForFunction(()=>[...document.querySelectorAll('.skill-row')].some(row=>row.querySelector('[data-field=name]').value==='技艺'&&row.querySelector('[data-rating]').textContent==='成功率 70% · 困难 35 · 极难 14'));
const response=page.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().includes('/api/characters/'));await page.locator('#save-card').click();assert.equal((await response).status(),200);await page.waitForFunction(()=>!document.getElementById('save-card').disabled);assert.equal(getCharacter(db,card.id).character.skills.find(s=>s.name==='技艺').specialty,'美术');assert.equal(await page.locator('#save-card').textContent(),'✓ 保存成功');await page.waitForFunction(()=>document.getElementById('save-card').textContent==='保存修改');
await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await page.screenshot({path:join(output,'skills-'+width+'.png'),fullPage:true});results.push({width,specialtyReselect:'PASS',ratingCalculation:'PASS',creditFirst:'PASS',singleSaveButton:'PASS',noOverflow:'PASS'});
}
await page.goto(origin+"/investigators/rev2-card/edit");await page.locator('[data-tab=skills]').click();await page.locator('#show-growth').check();const creditRow=page.locator('.skill-row').filter({has:page.locator('.skill-title').filter({hasText:'信用评级'})});await creditRow.locator('[data-field=growth]').fill('0');await page.waitForFunction(()=>document.getElementById('point-errors').textContent.includes('信用评级必须'));assert.equal(await page.locator('#save-card').isDisabled(),false);await page.locator('#save-card').click();await page.waitForFunction(()=>document.getElementById('errors').textContent.includes('信用评级必须'));assert.equal(await page.locator('#save-card').isDisabled(),false);assert.equal(getCharacter(db,card.id).character.skills.find(s=>s.name==='信用评级').growth,30);
assert.deepEqual(errors,[]);writeFileSync(join(output,'browser-results.json'),JSON.stringify({results,errors,environment:'Temporary SQLite, simulated session, real Edge. Real OAuth not tested.'},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await new Promise(done=>server.close(done));db.close();assert.ok(resolve(temp).startsWith(resolve(tmpdir())+"\\"));rmSync(temp,{recursive:true,force:true});}

