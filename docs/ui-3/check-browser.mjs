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
import { minimalCharacter } from "../../tests/minimalCharacter.js";

const require = createRequire(join(process.argv[2], "package.json"));
const { chromium } = require("playwright");
const output = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "arkham-ui3-check-"));
const db = openDatabase({ DATABASE_PATH: join(temp, "check.sqlite") });
const env = { DISCORD_CLIENT_ID: "123", DISCORD_CLIENT_SECRET: "test", OAUTH_CALLBACK_URL: "http://127.0.0.1/auth/callback", DISCORD_GUILD_ID: "456", COC_ACCESS_ROLE_ID: "789", SESSION_SECRET: "test" };
const owner = "100";
const card = minimalCharacter(); card.id = 'ui3-card'; card.identity.name = '江晦'; card.initialSan = 50;
createCharacter(db, card);
const server = createServer((request,response) => handleRequest(request,response,{db,env,rng:()=>0.5,fetchImpl:()=>{throw new Error('No Discord calls in UI test');}}));
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext();
await context.addCookies([{name:'coc_session',value:createWebSession(db,readAuthConfig(env),owner),url:origin}]);
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
const edit=origin+'/investigators/ui3-card/edit'; const results=[];
const state=async expected=>{await page.waitForFunction(value=>document.getElementById('save-status').dataset.state===value,expected);};
const clean=async()=>{await page.goto(edit);await state('saved');await page.waitForFunction(()=>!document.getElementById('save-card').disabled);};
async function noOverflow(){const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,badImages:[...document.images].filter(img=>!img.naturalWidth).length}));assert.equal(layout.width,layout.scrollWidth);assert.equal(layout.badImages,0);return layout;}
try {
for(const width of [1440,1280,390,320]){
 await page.setViewportSize({width,height:width>600?1000:844});await clean();await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode())));
 await page.screenshot({path:join(output,'intro-'+width+'.png'),fullPage:true});await noOverflow();
 await page.locator('[data-tab=stats]').click();assert.equal(await page.locator('.attribute-card').count(),9);assert.equal(await page.locator('.luck-card').count(),1);assert.equal(await page.locator('#derived dd').count(),7);
 await page.locator('[data-tab=stats]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#panel-skills').isVisible(),true);await page.keyboard.press('Home');assert.equal(await page.locator('#panel-intro').isVisible(),true);await page.locator('[data-tab=stats]').click();const stats=await noOverflow();await page.screenshot({path:join(output,'stats-'+width+'.png'),fullPage:true});if(width<600)await page.screenshot({path:join(output,'stats-'+width+'-viewport.png')});
 for(const tab of ['skills','story','gear','intro','stats']){await page.locator('[data-tab='+tab+']').click();await noOverflow();}await state('saved');
 await page.locator('[name=str]').fill('65');await state('dirty');await page.locator('[data-tab=intro]').click();await page.locator('[data-tab=stats]').click();assert.equal(await page.locator('[name=str]').inputValue(),'65');
 await page.locator('[name=str]').fill('50');await state('saved');
 await page.locator('#open-rolls').click();await page.locator('#roll-count').fill('3');await page.locator('#start-rolls').click();await page.locator('.roll-set').first().waitFor();assert.equal(await page.locator('.roll-set').count(),3);await noOverflow();await page.screenshot({path:join(output,'rolls-'+width+'.png'),fullPage:true});await page.keyboard.press('Escape');await state('saved');
 await page.locator('#open-rolls').click();await page.locator('#roll-count').fill('2');await page.locator('#start-rolls').click();await page.locator('.roll-set button').first().click();await state('dirty');assert.equal(await page.locator('[name=pow]').inputValue(),await page.locator('#initialSan').inputValue());assert.equal(await page.locator('[name=luck]').inputValue(),'60');
 // Restore through explicit approved navigation to test the next operation separately.
 page.once('dialog',dialog=>dialog.accept());await page.reload();await state('saved');await page.locator('[data-tab=stats]').click();
 await page.locator('#open-point-buy').click();await page.locator('#point-buy-total').fill('500');await page.locator('#point-buy-luck').check();await page.locator('#point-buy-confirm').click();await state('dirty');await page.waitForFunction(()=>document.querySelector('#point-buy-status').textContent.includes('540'));assert.equal(await page.locator('#point-buy-panel').isVisible(),true);assert.ok((await page.locator('#point-buy-status').textContent()).includes('-40'));await page.screenshot({path:join(output,'point-buy-'+width+'.png'),fullPage:true});await noOverflow();
 await page.locator('#end-point-buy').click();await state('saved');await page.locator('#point-buy-panel').waitFor({state:'hidden'});
 results.push({width,...stats,tabsRetainInput:'PASS',viewOnlyStaysSaved:'PASS',rollAdoptionDirty:'PASS',pointBuyOverspendAndEnd:'PASS'});
}
await page.setViewportSize({width:1280,height:900});await clean();await page.locator('[data-tab=stats]').click();await page.locator('[name=str]').fill('65');
await page.locator('#save-card').click();await state('saved');assert.equal(getCharacter(db,'ui3-card').character.characteristics.str,65);assert.equal(await page.locator('#panel-stats').isVisible(),true);
// A real HTTP save with a delayed response: later typing remains dirty after it completes.
let finishResponse;await page.route('**/api/characters/ui3-card',async route=>{if(route.request().method()!=='PATCH')return route.continue();const response=await route.fetch();await new Promise(done=>{finishResponse=done;});await route.fulfill({response});});
await page.locator('[name=str]').fill('66');await page.locator('#save-card').click();await state('saving');await page.waitForFunction(()=>document.getElementById('save-card').disabled);while(!finishResponse)await new Promise(done=>setTimeout(done,10));await page.locator('[name=str]').fill('67');finishResponse();await state('dirty');assert.equal(getCharacter(db,'ui3-card').character.characteristics.str,66);assert.equal(await page.locator('[name=str]').inputValue(),'67');await page.unroute('**/api/characters/ui3-card');
// Server rejection and network failure retain the form and never claim saved.
await page.route('**/api/characters/ui3-card',route=>route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'测试：保存服务暂时不可用'})}));await page.locator('#save-card').click();await state('failed');assert.ok((await page.locator('#errors').textContent()).includes('测试：保存服务'));assert.equal(await page.locator('[name=str]').inputValue(),'67');await page.unroute('**/api/characters/ui3-card');
await page.route('**/api/characters/ui3-card',route=>route.abort());await page.locator('#save-card').click();await state('failed');assert.equal(await page.locator('[name=str]').inputValue(),'67');await page.unroute('**/api/characters/ui3-card');
await page.route('**/api/characters/preview',route=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({message:'登录已过期，请重新授权'})}));await page.locator('#save-card').click();await state('failed');assert.ok((await page.locator('#errors').textContent()).includes('登录已过期'));assert.equal(await page.locator('[name=str]').inputValue(),'67');await page.unroute('**/api/characters/preview');
await page.locator('#save-card').click();await state('saved');assert.equal(getCharacter(db,'ui3-card').character.characteristics.str,67);
await page.locator('[name=str]').fill('bad');await page.locator('#save-card').click();await state('failed');assert.equal(getCharacter(db,'ui3-card').character.characteristics.str,67);assert.ok((await page.locator('#errors').textContent()).length>0);await page.locator('[name=str]').fill('68');
let cancelled=false;page.once('dialog',async dialog=>{cancelled=true;await dialog.dismiss();});await page.locator('.editor-header>a').first().click();assert.equal(cancelled,true);assert.equal(page.url(),edit);await state('dirty');
let deleteDialogs=0;const cancelDelete=async dialog=>{deleteDialogs++;if(deleteDialogs===1)await dialog.accept();else await dialog.dismiss();};page.on('dialog',cancelDelete);await page.locator('[data-delete="ui3-card"]').click();page.off('dialog',cancelDelete);assert.equal(deleteDialogs,2);assert.equal(getCharacter(db,'ui3-card').character.characteristics.str,67);
let warned=false;page.once('dialog',async dialog=>{warned=dialog.type()==='beforeunload';await dialog.dismiss();});try{await page.reload({timeout:3000});}catch(error){assert.ok(error.message.includes('ERR_ABORTED')||error.message.includes('Timeout'));}assert.equal(warned,true);assert.equal(await page.locator('[name=str]').inputValue(),'68');
page.once('dialog',dialog=>dialog.accept());await page.locator('.editor-header>a').first().click();await page.waitForURL(origin+'/investigators');
await page.goto(origin+'/investigators/new');await state('new');await page.evaluate(card=>{for(const section of ['identity','characteristics'])for(const [key,value] of Object.entries(card[section])){const field=document.querySelector('[data-section="'+section+'"][name="'+key+'"]');if(field)field.value=value;}document.getElementById('initialSan').value='50';document.querySelector('[name=name]').dispatchEvent(new Event('input',{bubbles:true}));},card);await state('dirty');await page.locator('#save-card').click();await state('saved');assert.ok(page.url().endsWith('/edit'));assert.equal(await page.locator('#record-actions').isVisible(),true);assert.ok((await page.locator('#export-card').getAttribute('href')).endsWith('/export'));assert.equal(listCharactersByOwner(db,owner).length,2);await page.locator('[data-tab=stats]').click();await page.locator('[name=str]').fill('55');await page.locator('#save-card').click();await state('saved');assert.equal(listCharactersByOwner(db,owner).length,2);
assert.deepEqual(errors,[]);const record={results,saveAndDatabase:'PASS',saveKeepsTab:'PASS',typingDuringSave:'PASS',serverAndNetworkFailureRetainsInput:'PASS',expiredSessionFeedback:'PASS',invalidValueRejected:'PASS',leaveCancelAndBeforeUnload:'PASS',newThenUpdate:'PASS',errors,environment:'Edge headless; isolated temporary SQLite and simulated session. No real OAuth.'};writeFileSync(join(output,'browser-results.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
}finally{await browser.close();await new Promise(done=>server.close(done));db.close();assert.ok(resolve(temp).startsWith(resolve(tmpdir())+'\\'));rmSync(temp,{recursive:true,force:true});}
