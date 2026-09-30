import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readAuthConfig } from "../auth/config.js";
import { SESSION_COOKIE } from "../auth/constants.js";
import { AuthError, authStatus } from "../auth/errors.js";
import { readCookie } from "../auth/http.js";
import { readSession } from "../auth/store.js";
import { BACKGROUND_FIELDS, CHARACTERISTIC_FIELDS, ERAS, readBackground } from "../rules/characterSchema.js";
import { OCCUPATIONS } from "../rules/data/occupations.js";
import { WEAPON_CATEGORIES, WEAPONS } from "../rules/data/weapons.js";
import {
  ART_SPECIALTIES,
  FIGHTING_SPECIALTY_BASES,
  FIREARMS_SPECIALTY_BASES,
  FORMULA_LABELS,
  SCIENCE_SPECIALTY_BASES,
  SKILL_NAMES,
  derivePreview,
  starterSkills,
} from "../rules/sheet.js";
import { getCharacter, listCharactersByOwner } from "../storage/index.js";
import { StorageError } from "../storage/errors.js";

const webDir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(webDir, "site.css"), "utf8");
const editorSource = readFileSync(join(webDir, "editor.js"), "utf8");

const IDENTITY_LABELS = [
  ["name", "姓名", false],
  ["age", "年龄", true],
  ["sex", "性别", false],
  ["era", "时代", false],
  ["residence", "住地", false],
  ["birthplace", "故乡", false],
];

const CHARACTERISTIC_LABELS = new Map([
  ["str", "力量 STR"],
  ["con", "体质 CON"],
  ["siz", "体型 SIZ"],
  ["dex", "敏捷 DEX"],
  ["app", "外貌 APP"],
  ["int", "智力 INT"],
  ["pow", "意志 POW"],
  ["edu", "教育 EDU"],
  ["luck", "幸运 Luck"],
]);

const BACKGROUND_LABELS = new Map([
  ["appearance", "外貌描述"],
  ["beliefs", "思想与信念"],
  ["significantPeople", "重要之人"],
  ["meaningfulLocations", "意义非凡之地"],
  ["treasuredPossessions", "宝贵之物"],
  ["traits", "特质"],
  ["scars", "伤疤"],
  ["phobias", "恐惧症/狂躁症"],
  ["personalHistory", "个人经历说明"],
]);

const SESSION_FAILURES = new Set([
  "SESSION_MISSING",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "ENTITLEMENT_EXPIRED",
]);

const EMPTY_OCCUPATION = {
  id: "unset",
  name: "",
  pointFormula: "CUSTOM",
  creditMin: 0,
  creditMax: 0,
  occupationalSkills: [],
};

function headerValue(headers, name) {
  if (!headers) return "";
  const value = headers[name] ?? headers[name.toLowerCase()];
  return typeof value === "string" ? value : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sendText(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(body);
}

function sendHtml(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(body);
}

function redirect(response, location) {
  response.statusCode = 302;
  response.setHeader("Location", location);
  response.setHeader("Cache-Control", "no-store");
  response.end("");
}

function readUser(request, context) {
  const config = readAuthConfig(context.env);
  const sessionId = readCookie(headerValue(request.headers, "cookie"), SESSION_COOKIE);
  return readSession(context.db, config, sessionId, context.now);
}

function tryUser(request, context) {
  try {
    return readUser(request, context);
  } catch (error) {
    if (error instanceof AuthError) return null;
    throw error;
  }
}

function requireUser(request, response, context) {
  try {
    return readUser(request, context);
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    if (SESSION_FAILURES.has(error.code)) {
      redirect(response, "/auth/login");
      return null;
    }
    sendText(response, authStatus(error.code), `${error.code} ${error.message}`);
    return null;
  }
}

function layout(title, main) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/site.css">
</head>
<body>
<header>
<a href="/investigators">我的调查员</a>
<a href="/investigators/new">新建调查员</a>
<button type="button" id="logout">登出</button>
</header>
<main>
${main}
</main>
<script>${editorSource}</script>
</body>
</html>`;
}

function loginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>登录</title>
<link rel="stylesheet" href="/site.css">
</head>
<body>
<main>
<h1>CoC 角色卡</h1>
<p><a href="/auth/login">使用 Discord 登录</a></p>
</main>
</body>
</html>`;
}

function displayName(identity) {
  const name = typeof identity?.name === "string" ? identity.name.trim() : "";
  return name || "未命名";
}

function listPage(records) {
  const items = records.length === 0
    ? "<p>还没有调查员。</p>"
    : `<ul class="cards">${records.map((record) => {
      const id = escapeHtml(record.character.id);
      const href = `/investigators/${escapeHtml(encodeURIComponent(record.character.id))}/edit`;
      const exportHref = `/api/characters/${escapeHtml(encodeURIComponent(record.character.id))}/export`;
      return `<li><a href="${href}">${escapeHtml(displayName(record.character.identity))}</a> <a href="${href}">编辑</a> <a href="${exportHref}">导出</a> <button type="button" data-duplicate="${id}">复制</button> <button type="button" data-delete="${id}">删除</button></li>`;
    }).join("")}</ul>`;
  const importer = `<form id="import-card" class="import-card"><label>导入为新卡<input type="file" accept=".coc7.json,.json,application/json"></label><button type="submit">导入为新卡</button><p class="errors" id="import-errors"></p></form>`;
  return layout("我的调查员", `<h1>我的调查员</h1>${importer}${items}`);
}

function identityControl(key, label, integer, identity) {
  const value = identity && Object.hasOwn(identity, key) ? identity[key] : "";
  if (key === "era") {
    const options = [`<option value="">请选择</option>`].concat(ERAS.map((era) => {
      const selected = identity?.era === era ? " selected" : "";
      return `<option value="${escapeHtml(era)}"${selected}>${escapeHtml(era)}</option>`;
    }));
    return `<label>${escapeHtml(label)}<select name="era" data-section="identity">${options.join("")}</select></label>`;
  }
  const integerAttr = integer ? ` data-integer="true" inputmode="numeric"` : "";
  return `<label>${escapeHtml(label)}<input name="${escapeHtml(key)}" data-section="identity"${integerAttr} value="${escapeHtml(value)}"></label>`;
}

function optionList(id, values) {
  const options = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
  return `<datalist id="${id}">${options}</datalist>`;
}

function catalogScript(id, value) {
  const json = JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");
  return `<script type="application/json" id="${id}">${json}</script>`;
}

function occupationOptions(selectedId) {
  const options = [`<option value="">请选择</option>`];
  for (const item of OCCUPATIONS) {
    const selected = item.id === selectedId ? " selected" : "";
    options.push(`<option value="${escapeHtml(item.id)}"${selected}>${escapeHtml(item.name)}</option>`);
  }
  return options.join("");
}

function catalogSkillText(id) {
  return OCCUPATIONS.find((item) => item.id === id)?.skillText ?? "";
}

function weaponOptions() {
  const options = [`<option value="">请选择</option>`];
  WEAPONS.forEach((weapon, index) => {
    options.push(`<option value="${index}">${escapeHtml(weapon.name)}</option>`);
  });
  return options.join("");
}

function initialSanValue(card) {
  if (card && Object.hasOwn(card, "initialSan")) return card.initialSan;
  if (card && typeof card.sanity === "number") return card.sanity;
  return "";
}

function show(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function derivedText(preview) {
  return [
    ["生命值", preview.hp],
    ["重伤线", preview.majorWound],
    ["魔力", preview.mp],
    ["SAN上限", preview.sanMaximum],
    ["移动", preview.mov],
    ["体格", preview.build],
    ["伤害加值", preview.damageBonus],
  ].map(([label, value]) => `${label}：${show(value)}`).join("\n");
}

function poolLine(label, pool) {
  if (pool?.message) return pool.message;
  if (pool?.total == null) return "";
  return `${label}：${pool.total} / 已用 ${show(pool.spent)} / 剩余 ${show(pool.remaining)}`;
}

function occupationLine(preview) {
  return poolLine("职业点", preview.occupationPoints);
}

function pointPoolText(preview) {
  return [occupationLine(preview), poolLine("兴趣点", preview.interestPoints)].filter(Boolean).join("\n");
}

function ageText(preview) {
  const text = preview.age?.text || preview.age?.reason || "";
  return text ? `年龄提示：${text}。属性保持手填的数值。` : "";
}

function formulaOptions(selected) {
  return FORMULA_LABELS.map(([value, label]) => {
    const isSelected = value === selected ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${isSelected}>${escapeHtml(label)}</option>`;
  }).join("");
}

function skillTitle(skill) {
  const name = typeof skill?.name === "string" ? skill.name.trim() : "";
  const specialty = typeof skill?.specialty === "string" ? skill.specialty.trim() : "";
  return specialty ? `${name} - ${specialty}` : name;
}

function ratingText(view) {
  if (!view?.rating) return "";
  return `成功率：${view.rating.regular}%  困难 ${view.rating.hard} / 极难 ${view.rating.extreme}`;
}

function stepper(label, field, value, { hidden = false, disabled = false } = {}) {
  const hiddenAttr = hidden ? " hidden" : "";
  const disabledAttr = disabled ? " disabled" : "";
  return `<label class="stepper" data-pool="${field}"${hiddenAttr}>${label} <button type="button" data-step="-1"${disabledAttr}>-</button><input data-field="${field}" data-integer="true" inputmode="numeric" value="${escapeHtml(value)}"${disabledAttr}><button type="button" data-step="1"${disabledAttr}>+</button></label>`;
}

function skillRow(skill, view, { occupational, credit, creditLocked }) {
  const name = typeof skill?.name === "string" ? skill.name.trim() : "";
  const mythos = view?.mythos === true;
  const onOccupationPage = occupational || name === "信用评级";
  const occupationPoints = Number(skill?.occupationPoints);
  const illegalOccupation = !onOccupationPage && Number.isInteger(occupationPoints) && occupationPoints > 0;
  const creditText = name === "信用评级" && Number.isInteger(credit?.min) && Number.isInteger(credit?.max)
    ? `信用评级（${credit.min}～${credit.max}）`
    : "";
  const rowError = view?.occupationPointError || (name === "信用评级" && credit?.error ? credit.error : "");
  return `<article class="skill-row" data-occupational="${onOccupationPage ? "true" : "false"}" data-mythos="${mythos ? "true" : "false"}" data-illegal-occupation="${illegalOccupation ? "true" : "false"}"${onOccupationPage ? "" : " hidden"}>
<header class="skill-head"><input data-field="name" list="skill-names" value="${escapeHtml(skill?.name ?? "")}"><input data-field="specialty" value="${escapeHtml(skill?.specialty ?? "")}"><button type="button" data-remove-skill${creditLocked ? " hidden" : ""}>删除</button></header>
<p class="skill-title">${escapeHtml(skillTitle(skill))}</p>
<p data-rating>${escapeHtml(ratingText(view))}</p>
<p data-credit-range${creditText ? "" : " hidden"}>${escapeHtml(creditText)}</p>
<p data-mythos>${escapeHtml(view?.mythosError ?? "")}</p>
<label class="base-line">基础值 <input data-field="base" data-integer="true" inputmode="numeric" value="${escapeHtml(skill?.base ?? "")}"${typeof view?.expectedBase === "number" ? " readonly" : ""}></label>
${stepper("职业点", "occupationPoints", skill?.occupationPoints ?? 0, { hidden: mythos || (!onOccupationPage && !illegalOccupation), disabled: mythos })}
${stepper("兴趣点", "interestPoints", skill?.interestPoints ?? 0, { hidden: true, disabled: mythos })}
${stepper("成长", "growth", skill?.growth ?? 0, { hidden: true })}
<p class="errors" data-row-error>${escapeHtml(rowError)}</p>
</article>`;
}

function weaponCell(weapon, key, integer = false) {
  const integerAttr = integer ? ` data-integer="true"` : "";
  return `<td><input data-field="${key}"${integerAttr} value="${escapeHtml(weapon?.[key] ?? "")}"></td>`;
}

function weaponRow(weapon) {
  const textKeys = ["name", "type", "skill", "damage", "range", "impale", "rate", "ammo", "malfunction", "era", "price", "invented", "note"];
  return `<tr class="weapon-row">
${textKeys.map((key) => weaponCell(weapon, key)).join("")}
${weaponCell(weapon, "quantity", true)}
<td><button type="button" data-remove-row>删除</button></td>
</tr>`;
}

function namedRow(className, name) {
  return `<tr class="${className}"><td><input data-field="name" value="${escapeHtml(name ?? "")}"></td><td><button type="button" data-remove-row>删除</button></td></tr>`;
}

function occupationalRow(name) {
  return `<div class="occupational-row"><input data-occupational-skill list="skill-names" value="${escapeHtml(name)}"><button type="button" data-remove-row>删除</button></div>`;
}

function formPage({ mode, record, notice }) {
  const card = record?.character;
  const identity = card?.identity ?? {};
  const characteristics = card?.characteristics ?? {};
  const occupation = card?.occupation ?? EMPTY_OCCUPATION;
  const skills = card?.skills ?? starterSkills();
  const background = readBackground(card?.background);
  const weapons = card?.weapons ?? [];
  const armor = card?.armor ?? null;
  const possessions = card?.possessions ?? { items: [] };
  const spells = card?.spells ?? [];
  const preview = derivePreview({ identity, characteristics, occupation, skills, armor });
  const editing = mode === "edit";
  const id = editing ? card.id : "";
  const action = editing ? `/api/characters/${encodeURIComponent(id)}` : "/api/characters";
  const method = editing ? "PATCH" : "POST";
  const noticeHtml = notice ? `<p class="notice">${escapeHtml(notice)}</p>` : "";
  const identityHtml = IDENTITY_LABELS.map(([key, label, integer]) => identityControl(key, label, integer, identity)).join("");
  const statsHtml = CHARACTERISTIC_FIELDS.map((key) => {
    const value = Object.hasOwn(characteristics, key) ? characteristics[key] : "";
    return `<label>${escapeHtml(CHARACTERISTIC_LABELS.get(key))}<input name="${escapeHtml(key)}" data-section="characteristics" data-integer="true" inputmode="numeric" value="${escapeHtml(value)}"></label>`;
  }).join("");
  const formulaLabel = FORMULA_LABELS.find(([value]) => value === occupation.pointFormula)?.[1] ?? "";
  const occupationalNames = Array.isArray(occupation.occupationalSkills) ? occupation.occupationalSkills : [];
  const occupationalNameSet = new Set(occupationalNames.map((name) => String(name).trim()).filter(Boolean));
  const occupationChosen = typeof occupation.id === "string" && occupation.id.trim() !== "" && occupation.id !== "unset";
  const creditCount = skills.filter((skill) => String(skill?.name ?? "").trim() === "信用评级").length;
  const summary = [
    `职业名：${occupation.name?.trim() || "未填写"}`,
    `职业点公式：${formulaLabel}`,
    `信用评级：${show(occupation.creditMin)}–${show(occupation.creditMax)}`,
    `本职技能：${occupationalNames.filter((name) => String(name).trim() !== "").join("、") || "未填写"}`,
    occupationLine(preview),
  ].filter(Boolean).join("\n");
  const backgroundHtml = BACKGROUND_FIELDS.map((key) => {
    const value = Object.hasOwn(background, key) ? background[key] : "";
    return `<label>${escapeHtml(BACKGROUND_LABELS.get(key))}<textarea name="${escapeHtml(key)}" data-section="background">${escapeHtml(value)}</textarea></label>`;
  }).join("");
  const armorChecked = armor ? " checked" : "";
  const armorHidden = armor ? "" : " hidden";
  const movChecked = armor?.applyMovPenalty === true ? " checked" : "";
  const exportHref = `/api/characters/${escapeHtml(encodeURIComponent(id))}/export`;
  const extra = editing
    ? `<div class="actions"><a href="${exportHref}">导出</a> <button type="button" data-duplicate="${escapeHtml(id)}">复制</button> <button type="button" data-delete="${escapeHtml(id)}">删除</button></div>`
    : "";
  return layout(editing ? "编辑调查员" : "新建调查员", `${noticeHtml}
<h1>${editing ? "编辑调查员" : "新建调查员"}</h1>
<form id="card-form" data-url="${escapeHtml(action)}" data-method="${method}">
<div class="sheet-tabs" role="tablist">
<button type="button" role="tab" id="tab-intro" data-tab="intro" aria-selected="true" aria-controls="panel-intro">角色简介</button>
<button type="button" role="tab" id="tab-stats" data-tab="stats" aria-selected="false" aria-controls="panel-stats">基础属性</button>
<button type="button" role="tab" id="tab-skills" data-tab="skills" aria-selected="false" aria-controls="panel-skills">职业&amp;技能</button>
<button type="button" role="tab" id="tab-story" data-tab="story" aria-selected="false" aria-controls="panel-story">背景故事</button>
<button type="button" role="tab" id="tab-gear" data-tab="gear" aria-selected="false" aria-controls="panel-gear">武器&amp;物品</button>
</div>
<section id="panel-intro" data-panel="intro" role="tabpanel" aria-labelledby="tab-intro">
${identityHtml}
<p id="age-note">${escapeHtml(ageText(preview))}</p>
</section>
<section id="panel-stats" data-panel="stats" role="tabpanel" aria-labelledby="tab-stats" hidden>
<div class="actions">
<button type="button" id="open-rolls">天命</button>
<button type="button" id="open-point-buy">购点</button>
</div>
<p id="point-buy-status"></p>
<button type="button" id="end-point-buy" hidden>结束购点</button>
<div class="characteristics">${statsHtml}</div>
<label>初始理智<input id="initialSan" data-integer="true" inputmode="numeric" value="${escapeHtml(initialSanValue(card))}"></label>
<p>天命选定方案时，初始理智等于该方案的意志。手填和购点自行填写，必须是 0 到 99 的整数。</p>
<p>天命按 3D6×5 掷幸运，并计入总值含运。幸运也可以手改。</p>
<pre id="derived">${escapeHtml(derivedText(preview))}</pre>
</section>
<section id="panel-skills" data-panel="skills" role="tabpanel" aria-labelledby="tab-skills" hidden>
<h2>职业</h2>
<label>选择职业<select id="occupation-choice">${occupationOptions(occupation.id)}</select></label>
<p id="occupation-skill-text">${escapeHtml(catalogSkillText(occupation.id))}</p>
<label>职业编号<input data-occupation="id" value="${escapeHtml(occupation.id ?? "")}"></label>
<label>职业名<input data-occupation="name" value="${escapeHtml(occupation.name ?? "")}"></label>
<label>职业点公式<select data-occupation="pointFormula">${formulaOptions(occupation.pointFormula)}</select></label>
<label>信用评级下限<input data-occupation="creditMin" data-integer="true" inputmode="numeric" value="${escapeHtml(occupation.creditMin ?? "")}"></label>
<label>信用评级上限<input data-occupation="creditMax" data-integer="true" inputmode="numeric" value="${escapeHtml(occupation.creditMax ?? "")}"></label>
<div id="occupational-skills">${occupationalNames.map((name) => occupationalRow(name)).join("")}</div>
<button type="button" id="add-occupational-skill">增加本职技能</button>
<pre id="occupation-summary">${escapeHtml(summary)}</pre>
<div id="point-status" class="point-status">
<pre id="point-pools">${escapeHtml(pointPoolText(preview))}</pre>
<p id="point-errors" class="errors"></p>
</div>
<h2>技能</h2>
<div class="sheet-tabs" role="tablist">
<button type="button" data-skill-view="occupation" aria-selected="true">本职</button>
<button type="button" data-skill-view="interest" aria-selected="false">兴趣</button>
</div>
<div class="skill-toolbar">
<button type="button" id="choose-skill">选择技能</button>
<label class="switch">混点 <input type="checkbox" id="mix-points"></label>
<label class="switch">成长 <input type="checkbox" id="show-growth"></label>
</div>
<p>固定基础值按技能名自动填入。闪避、母语，以及格斗、射击的专攻会随属性或专攻更新。任选技能要自己加进本职技能。</p>
<div id="skill-rows">${skills.map((skill, index) => skillRow(skill, preview.skills[index], {
    occupational: occupationalNameSet.has(String(skill?.name ?? "").trim()),
    credit: preview.credit,
    creditLocked: occupationChosen && creditCount <= 1 && String(skill?.name ?? "").trim() === "信用评级",
  })).join("")}</div>
</section>
<section id="panel-story" data-panel="story" role="tabpanel" aria-labelledby="tab-story" hidden>
${backgroundHtml}
</section>
<section id="panel-gear" data-panel="gear" role="tabpanel" aria-labelledby="tab-gear" hidden>
<h2>武器</h2>
<p>从武器表选择后，属性抄到这一行。伤害里的 DB、半DB 按原表文字保留。成功率用角色自己的技能，不写在武器上。</p>
<label>武器类型<select id="weapon-category"><option value="">全部</option>${WEAPON_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label>
<label>武器<select id="weapon-choice">${weaponOptions()}</select></label>
<div class="actions"><button type="button" id="add-catalog-weapon">加入所选武器</button> <button type="button" id="add-weapon">增加武器</button></div>
<div class="table-wrap">
<table>
<thead><tr><th>名称</th><th>类型</th><th>技能</th><th>伤害</th><th>射程</th><th>贯穿</th><th>每轮</th><th>装弹</th><th>故障</th><th>时代</th><th>价格</th><th>发明时间</th><th>注释</th><th>数量</th><th></th></tr></thead>
<tbody id="weapon-rows">${weapons.map((weapon) => weaponRow(weapon)).join("")}</tbody>
</table>
</div>
<h2>护甲</h2>
<label><input type="checkbox" id="armor-enabled"${armorChecked}> 穿着护甲</label>
<div id="armor-fields"${armorHidden}>
<label>名称<input id="armor-name" value="${escapeHtml(armor?.name ?? "")}"></label>
<label><input type="checkbox" id="armor-mov"${movChecked}> 计入移动惩罚</label>
<label>移动惩罚<input id="armor-penalty" data-integer="true" inputmode="numeric" value="${escapeHtml(armor?.movPenalty ?? "")}"></label>
</div>
<h2>物品</h2>
<label>现金（可选）<input id="cash" data-integer="true" inputmode="numeric" value="${escapeHtml(possessions.cash ?? "")}"></label>
<table>
<thead><tr><th>名称</th><th></th></tr></thead>
<tbody id="item-rows">${(possessions.items ?? []).map((item) => namedRow("item-row", item?.name)).join("")}</tbody>
</table>
<button type="button" id="add-item">增加物品</button>
<h2>法术</h2>
<table>
<thead><tr><th>名称</th><th></th></tr></thead>
<tbody id="spell-rows">${spells.map((spell) => namedRow("spell-row", spell?.name)).join("")}</tbody>
</table>
<button type="button" id="add-spell">增加法术</button>
</section>
${optionList("skill-names", SKILL_NAMES)}
${optionList("fighting-specialties", Object.keys(FIGHTING_SPECIALTY_BASES))}
${optionList("firearms-specialties", Object.keys(FIREARMS_SPECIALTY_BASES))}
${optionList("art-specialties", ART_SPECIALTIES)}
${optionList("science-specialties", Object.keys(SCIENCE_SPECIALTY_BASES))}
${catalogScript("occupation-catalog", OCCUPATIONS)}
${catalogScript("weapon-catalog", WEAPONS)}
<p id="errors" class="errors"></p>
<div class="actions"><button type="submit">保存</button></div>
</form>
<dialog id="rolls-dialog">
<label>生成数量 X<input id="roll-count" inputmode="numeric"></label>
<p id="roll-error" class="errors"></p>
<div class="actions"><button type="button" id="start-rolls">开始骰点</button> <button type="button" id="close-rolls">关闭</button></div>
<div id="roll-results"></div>
</dialog>
<dialog id="skill-picker">
<label>搜索技能<input id="skill-search"></label>
<select id="skill-picker-list" size="8"></select>
<label>专攻<input id="skill-picker-specialty"></label>
<label>自定义技能名<input id="skill-picker-custom"></label>
<p id="skill-picker-error" class="errors"></p>
<div class="actions"><button type="button" id="skill-picker-add">加入</button> <button type="button" id="skill-picker-close">关闭</button></div>
</dialog>
<dialog id="point-buy-dialog">
<p>购点时每项属性是 0 到 90 的整数，幸运不计入总额时也一样。</p>
<label>购点总额<input id="point-buy-total" inputmode="numeric"></label>
<label><input type="checkbox" id="point-buy-luck"> 包含幸运</label>
<p id="point-buy-error" class="errors"></p>
<div class="actions"><button type="button" id="point-buy-confirm">确定</button> <button type="button" id="point-buy-cancel">取消</button></div>
</dialog>
${extra}`);
}

function messagePage(statusText) {
  return layout("角色卡", `<p>${escapeHtml(statusText)}</p>`);
}

export async function handlePage(request, response, context) {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/site.css") {
    if (request.method !== "GET") {
      sendText(response, 405, "方法不允许");
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/css; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(css);
    return;
  }
  if (request.method !== "GET") {
    sendText(response, 405, "方法不允许");
    return;
  }
  if (url.pathname === "/") {
    if (tryUser(request, context)) {
      redirect(response, "/investigators");
      return;
    }
    sendHtml(response, 200, loginPage());
    return;
  }

  const user = requireUser(request, response, context);
  if (!user) return;

  if (url.pathname === "/investigators") {
    const records = listCharactersByOwner(context.db, user.userDiscordId);
    sendHtml(response, 200, listPage(records));
    return;
  }
  if (url.pathname === "/investigators/new") {
    sendHtml(response, 200, formPage({ mode: "new" }));
    return;
  }

  const edit = url.pathname.match(/^\/investigators\/([^/]+)\/edit$/);
  if (!edit) {
    sendText(response, 404, "没有这个地址");
    return;
  }

  let id;
  try {
    id = decodeURIComponent(edit[1]);
  } catch {
    sendHtml(response, 404, messagePage("找不到角色卡"));
    return;
  }

  let record;
  try {
    record = getCharacter(context.db, id);
  } catch (error) {
    if (error instanceof StorageError && error.code === "NOT_FOUND") {
      sendHtml(response, 404, messagePage("找不到角色卡"));
      return;
    }
    throw error;
  }
  if (record.character.ownerDiscordUserId !== user.userDiscordId) {
    sendHtml(response, 403, messagePage("不能访问别人的角色卡"));
    return;
  }
  const notice = url.searchParams.get("saved") === "1"
    ? "已保存"
    : url.searchParams.get("copied") === "1"
      ? "已复制"
      : "";
  sendHtml(response, 200, formPage({ mode: "edit", record, notice }));
}
