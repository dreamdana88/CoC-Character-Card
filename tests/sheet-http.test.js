import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readAuthConfig } from "../auth/config.js";
import { createWebSession } from "../auth/store.js";
import { handleRequest } from "../server.js";
import { getCharacter, openDatabase } from "../storage/index.js";
import { minimalCharacter } from "./minimalCharacter.js";

const NOW = new Date("2026-05-01T00:00:00.000Z");
const USER_A = "80351110224678912";
const env = {
  DISCORD_CLIENT_ID: "157730590492196864",
  DISCORD_CLIENT_SECRET: "client-secret-value",
  OAUTH_CALLBACK_URL: "https://card.example/auth/callback",
  DISCORD_GUILD_ID: "9001",
  COC_ACCESS_ROLE_ID: "42",
  SESSION_SECRET: "session-secret-value",
};

function removeTemp(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 });
  } catch (error) {
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error?.code)) throw error;
  }
}

function withDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), "coc-card-b5-"));
  const dbPath = join(dir, "characters.sqlite");
  const db = openDatabase({ DATABASE_PATH: dbPath });
  const finish = () => {
    db.close();
    removeTemp(dir);
  };
  try {
    const result = fn(db, dbPath);
    if (result && typeof result.then === "function") return result.finally(finish);
    finish();
    return result;
  } catch (error) {
    finish();
    throw error;
  }
}

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 0,
    body: "",
    headers,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    end(body = "") {
      this.body = String(body);
    },
  };
}

function sessionFor(db) {
  return createWebSession(db, readAuthConfig(env), USER_A, NOW);
}

async function call(db, { method = "GET", url, cookie, body, rng }) {
  const response = createResponse();
  const request = { method, url, headers: {} };
  if (cookie) request.headers.cookie = `coc_session=${encodeURIComponent(cookie)}`;
  if (body !== undefined) request.body = typeof body === "string" ? body : JSON.stringify(body);
  await handleRequest(request, response, {
    db,
    env,
    now: NOW,
    rng,
    fetchImpl() {
      throw new Error("discord should not be called");
    },
    log() {},
  });
  return response;
}

function json(response) {
  return JSON.parse(response.body);
}

function fullBody() {
  const card = minimalCharacter();
  delete card.schemaVersion;
  delete card.ruleset;
  delete card.id;
  card.ownerDiscordUserId = "attacker";
  card.currentHp = 3;
  card.background.appearance = "灰色眼睛";
  card.background.beliefs = "真相在档案里";
  card.weapons = [{ name: "手杖", type: "格斗", skill: "格斗", damage: "1D6+DB", quantity: 1 }];
  card.armor = { name: "皮甲", applyMovPenalty: true, movPenalty: 1 };
  card.possessions = { items: [{ name: "笔记本" }], cash: 12 };
  card.spells = [{ name: "支配术" }];
  card.skills = card.skills.concat([
    { name: "闪避", specialty: "", base: 35, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "母语", specialty: "英语", base: 80, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "格斗", specialty: "矛", base: 20, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "射击", specialty: "步枪/霰弹枪", base: 25, growth: 0, occupationPoints: 0, interestPoints: 0 },
    { name: "科学", specialty: "数学", base: 10, growth: 0, occupationPoints: 0, interestPoints: 0 },
  ]);
  return card;
}

async function countCards(db, cookie) {
  const response = await call(db, { url: "/api/characters", cookie });
  assert.equal(response.statusCode, 200);
  return json(response).characters.length;
}

test("a full sheet can be saved, reread, copied, and deleted", async () => {
  await withDb(async (db, dbPath) => {
    const cookie = sessionFor(db);
    const created = await call(db, { method: "POST", url: "/api/characters", cookie, body: fullBody() });
    assert.equal(created.statusCode, 201);
    const body = json(created);
    assert.equal(Object.hasOwn(body, "ownerDiscordUserId"), false);
    assert.equal(Object.hasOwn(body, "pointBuy"), false);
    assert.equal(body.derived.hp, 11);
    assert.equal(body.derived.majorWound, 6);
    assert.equal(body.derived.mp, 10);
    assert.equal(Object.hasOwn(body.derived, "sanity"), false);
    assert.equal(Object.hasOwn(body.derived, "initialSan"), false);
    assert.equal(Object.hasOwn(body, "initialSan"), false);
    assert.equal(body.derived.sanMaximum, 99);
    assert.equal(body.derived.mov, 7);
    assert.equal(body.derived.build, 0);
    assert.equal(body.derived.damageBonus, "0");
    assert.equal(body.derived.occupationPoints.total, 320);
    assert.equal(body.derived.occupationPoints.spent, 40);
    assert.equal(body.derived.occupationPoints.remaining, 280);
    assert.equal(body.derived.interestPoints.total, 150);
    assert.equal(body.derived.interestPoints.spent, 0);
    assert.equal(body.derived.interestPoints.remaining, 150);
    assert.equal(body.derived.skills.find((skill) => skill.name === "会计").rating.regular, 45);
    assert.equal(body.derived.skills.find((skill) => skill.name === "会计").rating.hard, 22);
    assert.equal(body.derived.skills.find((skill) => skill.name === "会计").rating.extreme, 9);
    assert.equal(body.derived.skills.find((skill) => skill.name === "闪避").expectedBase, 35);
    assert.equal(body.derived.skills.find((skill) => skill.name === "格斗").expectedBase, 20);
    assert.deepEqual(body.occupation.occupationalSkills, ["会计"]);

    const stored = getCharacter(db, body.id).character;
    assert.equal(stored.ownerDiscordUserId, USER_A);
    assert.equal(stored.id === "card-1", false);
    assert.equal(Object.hasOwn(stored, "derived"), false);
    assert.equal(Object.hasOwn(stored, "pointBuy"), false);
    assert.equal(JSON.stringify(stored).includes("currentHp"), false);
    assert.equal(stored.background.appearance, "灰色眼睛");
    assert.equal(stored.weapons[0].damage, "1D6+DB");
    assert.equal(stored.weapons[0].quantity, 1);
    assert.equal(stored.armor.movPenalty, 1);
    assert.equal(stored.possessions.cash, 12);
    assert.equal(stored.spells[0].name, "支配术");
    assert.equal(stored.skills.find((skill) => skill.name === "母语").base, 80);
    assert.equal(stored.skills.find((skill) => skill.name === "科学").specialty, "数学");

    const again = openDatabase({ DATABASE_PATH: dbPath });
    try {
      assert.equal(getCharacter(again, body.id).character.spells[0].name, "支配术");
    } finally {
      again.close();
    }

    const loaded = await call(db, { url: `/api/characters/${body.id}`, cookie });
    assert.equal(loaded.statusCode, 200);
    assert.equal(json(loaded).weapons[0].name, "手杖");
    assert.equal(json(loaded).background.beliefs, "真相在档案里");

    const page = await call(db, { url: `/investigators/${body.id}/edit`, cookie });
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /灰色眼睛/);
    assert.match(page.body, /手杖/);
    assert.match(page.body, /支配术/);
    assert.match(page.body, /1D6\+DB/);
    assert.match(page.body, /生命值：11/);
    assert.match(page.body, /id="initialSan"/);
    assert.equal(page.body.includes('id="sanity"'), false);
    assert.equal(page.body.includes("理智：50"), false);
    assert.match(page.body, /职业点总额 320/);
    assert.match(page.body, /兴趣点总额 150/);
    assert.match(page.body, /会计/);
    assert.equal(page.body.includes('name="ownerDiscordUserId"'), false);

    const kept = json(loaded);
    const renamed = await call(db, {
      method: "PATCH",
      url: `/api/characters/${body.id}`,
      cookie,
      body: {
        identity: { ...kept.identity, name: "改过的名字" },
        characteristics: kept.characteristics,
      },
    });
    assert.equal(renamed.statusCode, 200);
    const afterRename = getCharacter(db, body.id).character;
    assert.equal(afterRename.identity.name, "改过的名字");
    assert.equal(afterRename.spells[0].name, "支配术");
    assert.equal(afterRename.weapons[0].name, "手杖");
    assert.equal(afterRename.occupation.name, "会计师");
    assert.equal(afterRename.skills.length, kept.skills.length);

    const copy = await call(db, { method: "POST", url: `/api/characters/${body.id}/duplicate`, cookie });
    assert.equal(copy.statusCode, 201);
    const copied = json(copy);
    assert.equal(copied.id === body.id, false);
    assert.equal(getCharacter(db, copied.id).character.ownerDiscordUserId, USER_A);
    assert.equal(getCharacter(db, copied.id).character.weapons[0].name, "手杖");

    const removed = await call(db, { method: "DELETE", url: `/api/characters/${body.id}`, cookie });
    assert.equal(removed.statusCode, 200);
    const missing = await call(db, { url: `/api/characters/${body.id}`, cookie });
    assert.equal(missing.statusCode, 404);
    assert.equal(json(await call(db, { url: "/api/characters", cookie })).characters.length, 1);
  });
});

test("preview, rolls, and the new-character page do not write a card", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db);
    const preview = await call(db, { method: "POST", url: "/api/characters/preview", cookie, body: fullBody() });
    assert.equal(preview.statusCode, 200);
    assert.equal(json(preview).derived.hp, 11);
    assert.equal(json(preview).derived.occupationPoints.total, 320);
    assert.equal(await countCards(db, cookie), 0);

    let calls = 0;
    const rolls = await call(db, {
      method: "POST",
      url: "/api/characteristics/rolls",
      cookie,
      body: { count: 2 },
      rng() {
        calls += 1;
        return 0;
      },
    });
    assert.equal(rolls.statusCode, 200);
    assert.equal(calls, 48);
    const sets = json(rolls).sets;
    assert.equal(sets.length, 2);
    assert.equal(sets[0].str, 15);
    assert.equal(sets[0].siz, 40);
    assert.equal(sets[0].luck, 15);
    assert.equal(sets[0].total, 195);
    assert.equal(sets[0].totalWithLuck, 210);
    assert.equal(sets[0].luckNote, "");
    assert.equal(sets[0].derived.hp, 5);
    assert.equal(sets[0].derived.mp, 3);
    assert.equal(sets[0].derived.mov, 7);
    assert.equal(sets[0].derived.build, -2);
    assert.equal(sets[0].derived.damageBonus, "-2");
    assert.equal(sets[0].derived.initialSan, 15);
    assert.equal(Object.hasOwn(sets[0].derived, "sanity"), false);
    assert.equal(Object.hasOwn(sets[0].derived, "sanMaximum"), false);
    assert.equal(sets[1].str, 15);
    assert.equal(await countCards(db, cookie), 0);

    const rejected = await call(db, {
      method: "POST",
      url: "/api/characteristics/rolls",
      cookie,
      body: { count: 21 },
    });
    assert.equal(rejected.statusCode, 400);
    assert.match(json(rejected).message, /1 到 20/);

    const fresh = await call(db, { url: "/investigators/new", cookie });
    assert.match(fresh.body, /角色简介/);
    assert.match(fresh.body, /基础属性/);
    assert.match(fresh.body, /职业&amp;技能/);
    assert.match(fresh.body, /背景故事/);
    assert.match(fresh.body, /武器&amp;物品/);
    assert.match(fresh.body, /id="panel-stats"[^>]*hidden/);
    assert.equal(/id="panel-intro"[^>]*hidden/.test(fresh.body), false);
    assert.match(fresh.body, /天命/);
    assert.match(fresh.body, /购点/);
    assert.match(fresh.body, /生成数量 X/);
    assert.match(fresh.body, /开始骰点/);
    assert.match(fresh.body, /购点总额/);
    assert.match(fresh.body, /包含幸运/);
    assert.match(fresh.body, /使用此方案/);
    assert.match(fresh.body, /总值含运/);
    assert.match(fresh.body, /3D6×5 掷幸运/);
    assert.match(fresh.body, /生命值/);
    assert.match(fresh.body, /魔力/);
    assert.match(fresh.body, /图书馆使用/);
    assert.match(fresh.body, /闪避/);
    assert.match(fresh.body, /不能从属性算出职业点/);
    assert.match(fresh.body, /id="occupation-choice"/);
    assert.match(fresh.body, /id="initialSan"/);
    assert.match(fresh.body, /0 到 99 的整数/);
    assert.match(fresh.body, /0 到 90 的整数/);
    assert.match(fresh.body, />会计师</);
    assert.match(fresh.body, />自定义职业</);
    assert.match(fresh.body, /id="weapon-choice"/);
    assert.match(fresh.body, /加入所选武器/);
    assert.match(fresh.body, />手里剑</);
    assert.match(fresh.body, />黄铜指虎</);
    assert.equal(fresh.body.includes("受伤程度"), false);
    assert.equal(fresh.body.includes("血肉横飞"), false);
    assert.equal(fresh.body.includes("护甲调整"), false);
    assert.equal(fresh.body.includes("关于霰弹枪"), false);
    assert.equal(fresh.body.includes("伤害等级"), false);
    assert.match(fresh.body, /人类学/);
    assert.equal(fresh.body.includes('id="point-buy-total" value='), false);
    assert.equal(fresh.body.includes('name="ownerDiscordUserId"'), false);
  });
});

test("illegal points, fields, point buy, and wrong bases are not stored", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db);
    const failures = [];

    const mythosOccupation = fullBody();
    mythosOccupation.skills.find((skill) => skill.name === "克苏鲁神话").occupationPoints = 4;
    failures.push([mythosOccupation, "克苏鲁神话不能分配职业点"]);

    const mythosInterest = fullBody();
    mythosInterest.skills.find((skill) => skill.name === "克苏鲁神话").interestPoints = 2;
    failures.push([mythosInterest, "克苏鲁神话不能分配兴趣点"]);

    const negative = fullBody();
    negative.skills[0].interestPoints = -1;
    failures.push([negative, "不能为负数"]);

    const credit = fullBody();
    credit.occupation.creditMin = 80;
    credit.occupation.creditMax = 10;
    failures.push([credit, "信用评级下限不能高于上限"]);

    const customSkills = fullBody();
    customSkills.occupation.pointFormula = "CUSTOM";
    customSkills.occupation.occupationalSkills = Array.from({ length: 9 }, (_, index) => `技能${index}`);
    failures.push([customSkills, "自定义职业最多 8 个本职技能"]);

    const textStat = fullBody();
    textStat.characteristics.edu = "80";
    failures.push([textStat, "必须是整数"]);

    const dodge = fullBody();
    dodge.skills.find((skill) => skill.name === "闪避").base = 34;
    failures.push([dodge, "基础值应为 35"]);

    const spear = fullBody();
    spear.skills.find((skill) => skill.name === "格斗").base = 19;
    failures.push([spear, "基础值应为 20"]);

    const highSanity = fullBody();
    highSanity.initialSan = 100;
    failures.push([highSanity, "初始理智必须是 0 到 99 的整数"]);

    const negativeSanity = fullBody();
    negativeSanity.initialSan = -1;
    failures.push([negativeSanity, "初始理智必须是 0 到 99 的整数"]);

    const negativeStat = fullBody();
    negativeStat.characteristics.str = -1;
    negativeStat.pointBuy = { total: 1000, includeLuck: false };
    failures.push([negativeStat, "购点时每项属性必须是 0 到 90 的整数"]);

    const highStat = fullBody();
    highStat.characteristics.edu = 91;
    highStat.pointBuy = { total: 1000, includeLuck: false };
    failures.push([highStat, "购点时每项属性必须是 0 到 90 的整数"]);

    const highLuck = fullBody();
    highLuck.characteristics.luck = 91;
    highLuck.pointBuy = { total: 1000, includeLuck: false };
    failures.push([highLuck, "购点时每项属性必须是 0 到 90 的整数"]);

    const overBudget = fullBody();
    overBudget.pointBuy = { total: 100, includeLuck: false };
    failures.push([overBudget, "购点超过总额"]);

    const vagueBuy = fullBody();
    vagueBuy.pointBuy = { total: 12345, includeLuck: "yes" };
    failures.push([vagueBuy, "是否包含幸运必须明确选择"]);

    for (const [body, message] of failures) {
      const response = await call(db, { method: "POST", url: "/api/characters", cookie, body });
      assert.equal(response.statusCode, 400, message);
      assert.equal(json(response).errors.some((error) => error.message.includes(message)), true, JSON.stringify(json(response).errors));
      assert.equal(await countCards(db, cookie), 0, message);
    }

    const bought = fullBody();
    bought.pointBuy = { total: 12345, includeLuck: false };
    const saved = await call(db, { method: "POST", url: "/api/characters", cookie, body: bought });
    assert.equal(saved.statusCode, 201);
    const stored = getCharacter(db, json(saved).id).character;
    assert.equal(JSON.stringify(stored).includes("12345"), false);
    assert.equal(JSON.stringify(stored).includes("pointBuy"), false);
    assert.equal(JSON.stringify(stored).includes("includeLuck"), false);

    const ownSanity = fullBody();
    ownSanity.initialSan = 40;
    ownSanity.characteristics.pow = 50;
    ownSanity.pointBuy = { total: 12345, includeLuck: false };
    const keptSanity = await call(db, {
      method: "PATCH",
      url: `/api/characters/${json(saved).id}`,
      cookie,
      body: ownSanity,
    });
    assert.equal(keptSanity.statusCode, 200);
    assert.equal(json(keptSanity).initialSan, 40);
    assert.equal(Object.hasOwn(json(keptSanity), "sanity"), false);
    assert.equal(json(keptSanity).characteristics.pow, 50);
    assert.equal(getCharacter(db, json(saved).id).character.initialSan, 40);
    assert.equal(Object.hasOwn(getCharacter(db, json(saved).id).character, "sanity"), false);

    const keptBody = { ...ownSanity, identity: { ...ownSanity.identity, name: "仍保留初始理智" } };
    delete keptBody.initialSan;
    const untouched = await call(db, {
      method: "PATCH",
      url: `/api/characters/${json(saved).id}`,
      cookie,
      body: keptBody,
    });
    assert.equal(untouched.statusCode, 200, untouched.body);
    assert.equal(getCharacter(db, json(saved).id).character.initialSan, 40);
    assert.equal(getCharacter(db, json(saved).id).character.identity.name, "仍保留初始理智");

    ownSanity.initialSan = 100;
    const capped = await call(db, {
      method: "PATCH",
      url: `/api/characters/${json(saved).id}`,
      cookie,
      body: ownSanity,
    });
    assert.equal(capped.statusCode, 400);
    assert.match(JSON.stringify(json(capped).errors), /初始理智必须是 0 到 99 的整数/);
    assert.equal(getCharacter(db, json(saved).id).character.initialSan, 40);

    const manual = fullBody();
    manual.characteristics.str = 99;
    const raised = await call(db, {
      method: "PATCH",
      url: `/api/characters/${json(saved).id}`,
      cookie,
      body: manual,
    });
    assert.equal(raised.statusCode, 200);
    assert.equal(getCharacter(db, json(saved).id).character.characteristics.str, 99);
    assert.equal(getCharacter(db, json(saved).id).character.initialSan, 40);

    manual.pointBuy = { total: 100, includeLuck: true };
    const blocked = await call(db, {
      method: "PATCH",
      url: `/api/characters/${json(saved).id}`,
      cookie,
      body: manual,
    });
    assert.equal(blocked.statusCode, 400);
    assert.equal(getCharacter(db, json(saved).id).character.characteristics.str, 99);
  });
});

test("CUSTOM can be saved without a guessed total, and age text does not change attributes", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db);
    const custom = fullBody();
    custom.occupation = {
      id: "custom",
      name: "自定义调查员",
      pointFormula: "CUSTOM",
      creditMin: 10,
      creditMax: 40,
      occupationalSkills: ["聆听", "心理学"],
    };
    const saved = await call(db, { method: "POST", url: "/api/characters", cookie, body: custom });
    assert.equal(saved.statusCode, 201);
    const body = json(saved);
    assert.equal(body.derived.occupationPoints.total, null);
    assert.match(body.derived.occupationPoints.message, /不能从属性算出职业点/);
    const stored = getCharacter(db, body.id).character;
    assert.equal(stored.occupation.pointFormula, "CUSTOM");
    assert.equal(JSON.stringify(stored).includes("不能从属性算出职业点"), false);
    assert.equal(stored.characteristics.str, 50);

    const aged = fullBody();
    aged.identity.age = 15;
    const response = await call(db, { method: "POST", url: "/api/characters", cookie, body: aged });
    assert.equal(response.statusCode, 201);
    const ageBody = json(response);
    assert.equal(ageBody.characteristics.str, 50);
    assert.equal(ageBody.identity.age, 15);
    assert.equal(ageBody.derived.age.adjustsCharacteristics, false);
    assert.match(ageBody.derived.age.text, /力量体型共-5/);
    assert.equal(getCharacter(db, ageBody.id).character.characteristics.str, 50);
    const page = await call(db, { url: `/investigators/${ageBody.id}/edit`, cookie });
    assert.match(page.body, /力量体型共-5/);
    assert.match(page.body, /value="50"/);

    const unknownFight = fullBody();
    unknownFight.skills.push({ name: "格斗", specialty: "拳", base: 40, growth: 0, occupationPoints: 0, interestPoints: 0 });
    const fight = await call(db, { method: "POST", url: "/api/characters", cookie, body: unknownFight });
    assert.equal(fight.statusCode, 201);
    const fightCard = getCharacter(db, json(fight).id).character;
    assert.equal(fightCard.skills.find((skill) => skill.specialty === "拳").base, 40);
  });
});

test("initialSan stays on the card, and catalog weapon fields round-trip", async () => {
  await withDb(async (db) => {
    const cookie = sessionFor(db);
    const zero = fullBody();
    zero.initialSan = 0;
    const savedZero = await call(db, { method: "POST", url: "/api/characters", cookie, body: zero });
    assert.equal(savedZero.statusCode, 201);
    assert.equal(json(savedZero).initialSan, 0);

    const top = fullBody();
    top.initialSan = 99;
    const savedTop = await call(db, { method: "POST", url: "/api/characters", cookie, body: top });
    assert.equal(savedTop.statusCode, 201);
    assert.equal(json(savedTop).initialSan, 99);
    assert.equal(json(savedTop).characteristics.pow, 50);

    const legacy = fullBody();
    legacy.sanity = 40;
    const savedLegacy = await call(db, { method: "POST", url: "/api/characters", cookie, body: legacy });
    assert.equal(savedLegacy.statusCode, 201);
    assert.equal(json(savedLegacy).initialSan, 40);
    assert.equal(Object.hasOwn(json(savedLegacy), "sanity"), false);
    const legacyStored = getCharacter(db, json(savedLegacy).id).character;
    assert.equal(legacyStored.initialSan, 40);
    assert.equal(Object.hasOwn(legacyStored, "sanity"), false);

    const armed = fullBody();
    armed.initialSan = 40;
    armed.weapons = [{
      name: "手里剑",
      type: "常规武器",
      skill: "投掷",
      damage: "1D3+半DB",
      range: "STR/5码",
      impale: "√",
      rate: "2",
      ammo: "一次性",
      malfunction: "100",
      era: "1920s,现代",
      price: "0.5/3",
      invented: "——",
    }];
    const savedWeapon = await call(db, { method: "POST", url: "/api/characters", cookie, body: armed });
    assert.equal(savedWeapon.statusCode, 201);
    const weapon = getCharacter(db, json(savedWeapon).id).character.weapons[0];
    assert.equal(weapon.range, "STR/5码");
    assert.equal(weapon.impale, "√");
    assert.equal(weapon.rate, "2");
    assert.equal(weapon.price, "0.5/3");
    assert.equal(Object.hasOwn(weapon, "note"), false);
    assert.equal(JSON.stringify(weapon).includes("excel"), false);
    const weaponPage = await call(db, { url: `/investigators/${json(savedWeapon).id}/edit`, cookie });
    assert.match(weaponPage.body, /STR\/5码/);
    assert.match(weaponPage.body, /id="initialSan"[^>]*value="40"/);

    const custom = fullBody();
    custom.occupation = {
      id: "1",
      name: "自定义职业",
      pointFormula: "CUSTOM",
      creditMin: 9,
      creditMax: 30,
      occupationalSkills: ["聆听"],
    };
    const savedCustom = await call(db, { method: "POST", url: "/api/characters", cookie, body: custom });
    assert.equal(savedCustom.statusCode, 201);
    assert.equal(json(savedCustom).occupation.pointFormula, "CUSTOM");
    assert.equal(json(savedCustom).derived.occupationPoints.total, null);
  });
});

test("guests cannot preview or roll, and an oversized body is refused", async () => {
  await withDb(async (db) => {
    const preview = await call(db, { method: "POST", url: "/api/characters/preview", body: fullBody() });
    assert.equal(preview.statusCode, 401);
    const rolls = await call(db, { method: "POST", url: "/api/characteristics/rolls", body: { count: 1 } });
    assert.equal(rolls.statusCode, 401);

    const cookie = sessionFor(db);
    const huge = await call(db, {
      method: "POST",
      url: "/api/characters",
      cookie,
      body: `{"pad":"${"x".repeat(512 * 1024)}"}`,
    });
    assert.equal(huge.statusCode, 413);
    assert.equal(await countCards(db, cookie), 0);
  });
});
