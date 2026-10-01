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
import { loginPage } from "./login.js";
import { serveStaticAsset } from "./static-assets.js";
import { escapeHtml } from "./html.js";
import { weaponRow, weaponCatalog } from "./gear.js";
import { listPage } from "./investigator-list.js";

const webDir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(webDir, "site.css"), "utf8");
const gearUiSource = readFileSync(join(webDir, "gear-ui.js"), "utf8");
const skillUiSource = readFileSync(join(webDir, "skill-ui.js"), "utf8");
const editorStateSource = readFileSync(join(webDir, "editor-state.js"), "utf8");
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
  ["str", "力量"],
  ["con", "体质"],
  ["siz", "体型"],
  ["dex", "敏捷"],
  ["app", "外貌"],
  ["int", "智力"],
  ["pow", "意志"],
  ["edu", "教育"],
  ["luck", "幸运"],
]);

const BACKGROUND_LABELS = new Map([
  ["appearance", "外貌描述"],
  ["beliefs", "思想与信念"],
  ["significantPeople", "重要之人"],
  ["meaningfulLocations", "意义非凡之地"],
  ["treasuredPossessions", "宝贵之物"],
  ["traits", "特质"],
  ["scars", "伤口伤疤"],
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
<link rel="icon" href="/assets/archive-emblem.png" type="image/png">
<link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/skills.css"><link rel="stylesheet" href="/gear.css">
</head>
<body class="archive-editor">
<div class="editor-binding editor-binding-left" aria-hidden="true"></div><div class="editor-binding editor-binding-right" aria-hidden="true"></div>
<header class="editor-header">
<a class="editor-brand" href="/investigators"><img src="/assets/archive-emblem.png" width="46" height="46" alt=""><span>茶话会调查员档案馆<small>ARKHAM INVESTIGATOR ARCHIVE</small></span></a>
<a href="/investigators">我的调查员</a>
<a href="/investigators/new">新建调查员</a>
<button type="button" id="logout">登出</button>
</header>
<main class="editor-main">
${main}
</main>
<script>${gearUiSource}
${skillUiSource}
${editorStateSource}
${editorSource}</script>
<script src="/card-actions.js" defer></script>
</body>
</html>`;
}

function identityControl(key, label, integer, identity) {
  const value = identity && Object.hasOwn(identity, key) ? identity[key] : "";
  if (key === "sex") return `<label>${escapeHtml(label)}<select name="sex" data-section="identity"><option value="">请选择</option>${["男", "女", "其它"].map(sex => `<option value="${sex}"${value === sex ? " selected" : ""}>${sex}</option>`).join("")}</select></label>`;
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

function occupationChoices() {
  return OCCUPATIONS.map(item => { const formula = FORMULA_LABELS.find(([key]) => key === item.pointFormula)?.[1] || item.pointFormula; const credit = item.creditMin == null ? '信用范围自行填写' : '信用 ' + item.creditMin + '–' + item.creditMax;
    return '<li data-occupation-result data-search="' + escapeHtml((item.name+' '+item.id+' '+item.skillText).toLocaleLowerCase('zh-CN')) + '"><button type="button" data-occupation-choice="' + escapeHtml(item.id) + '"><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(credit+' · '+formula) + '</small><span>' + escapeHtml(item.skillText) + '</span></button></li>';
  }).join('');
}

function pointPoolMarkup(label, key, pool) {
  const known = typeof pool?.total === 'number' && typeof pool?.spent === 'number';
  return '<section class="pool-card" data-point-pool="'+key+'"><div><strong>'+label+'</strong><span data-pool-usage>'+escapeHtml(known ? pool.spent+' / '+pool.total : '无')+'</span></div><progress aria-label="'+label+'已用比例" max="'+(known ? Math.max(1,pool.total) : 1)+'" value="'+(known ? Math.max(0,pool.spent) : 0)+'"></progress><p data-pool-remaining>'+escapeHtml(known ? '剩余 '+pool.remaining : pool?.message || '填写属性后计算')+'</p></section>';
}

function catalogSkillText(id) {
  return OCCUPATIONS.find((item) => item.id === id)?.skillText ?? "";
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
    ["理智上限", preview.sanMaximum],
    ["移动力", preview.mov],
    ["体格", preview.build],
    ["伤害加值", preview.damageBonus],
  ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(show(value))}</dd></div>`).join("");
}

function poolLine(label, pool) {
  if (pool?.message) return pool.message;
  if (pool?.total == null) return "";
  return `${label}：${pool.total} / 已用 ${show(pool.spent)} / 剩余 ${show(pool.remaining)}`;
}

function occupationLine(preview) {
  return poolLine("职业点", preview.occupationPoints);
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
  return `成功率 ${view.rating.regular}% · 困难 ${view.rating.hard} · 极难 ${view.rating.extreme}`;
}

function stepper(label, field, value, { hidden = false, disabled = false } = {}) {
  const hiddenAttr = hidden ? " hidden" : "";
  const disabledAttr = disabled ? " disabled" : "";
  return `<label class="stepper" data-pool="${field}"${hiddenAttr}><span>${label}</span><span class="stepper-controls"><button type="button" data-step="-5" aria-label="减少5点"${disabledAttr}>-</button><input data-field="${field}" data-integer="true" inputmode="numeric" value="${escapeHtml(value)}"${disabledAttr}><button type="button" data-step="5" aria-label="增加5点"${disabledAttr}>+</button></span></label>`;
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
  return `<article class="skill-row" data-interest-selected="${skill?.interestSelected === true || Number(skill?.interestPoints) > 0 || (!onOccupationPage && Number(skill?.growth) > 0) ? "true" : "false"}" data-occupational="${onOccupationPage ? "true" : "false"}" data-mythos="${mythos ? "true" : "false"}" data-illegal-occupation="${illegalOccupation ? "true" : "false"}"${onOccupationPage ? "" : " hidden"}>
<div class="skill-summary"><p class="skill-title">${escapeHtml(skillTitle(skill))}</p><span class="skill-base">基础 <b data-base-display>${escapeHtml(skill?.base ?? "—")}</b></span><p data-credit-range${creditText ? "" : " hidden"}>${escapeHtml(creditText)}</p><p data-mythos>${escapeHtml(view?.mythosError ?? "")}</p></div>
<p class="skill-rating" data-rating title="普通 / 困难 / 极难" tabindex="0" aria-label="普通 / 困难 / 极难：${escapeHtml(ratingText(view))}">${escapeHtml(ratingText(view))}</p>
<div class="skill-points">
${stepper("职业点", "occupationPoints", skill?.occupationPoints ?? 0, { hidden: mythos || (!onOccupationPage && !illegalOccupation), disabled: mythos })}
${stepper("兴趣点", "interestPoints", skill?.interestPoints ?? 0, { hidden: true, disabled: mythos })}
${stepper("成长", "growth", skill?.growth ?? 0, { hidden: true })}
</div><div class="skill-specialty"><input type="hidden" data-field="name" value="${escapeHtml(skill?.name ?? "")}"><input type="hidden" data-field="specialty" value="${escapeHtml(skill?.specialty ?? "")}"><input type="hidden" data-field="base" data-integer="true" value="${escapeHtml(skill?.base ?? "")}"><button type="button" data-remove-skill hidden>移除兴趣</button></div>
<p class="errors" data-row-error>${escapeHtml(rowError)}</p>
</article>`;
}

function occupationalRow(name) {
  return `<input type="hidden" data-occupational-skill value="${escapeHtml(name)}">`;
}

function formPage({ mode, record, notice }) {
  const card = record?.character;
  const identity = card?.identity ?? {};
  const characteristics = card?.characteristics ?? {};
  const occupation = card?.occupation ?? EMPTY_OCCUPATION;
  const skills = [...(card?.skills ?? starterSkills())].sort((a,b) => Number(b.name === "信用评级") - Number(a.name === "信用评级"));
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
    return `<label class="attribute-card${key === "luck" ? " luck-card" : ""}"><span>${escapeHtml(CHARACTERISTIC_LABELS.get(key))}</span><input name="${escapeHtml(key)}" data-section="characteristics" data-integer="true" inputmode="numeric" value="${escapeHtml(value)}"></label>`;
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

    occupationLine(preview),
  ].filter(Boolean).join("\n");
  const backgroundHtml = BACKGROUND_FIELDS.filter(key => !["personalHistory", "assets", "mythos", "companions"].includes(key)).map((key, index) => {
    const value = Object.hasOwn(background, key) ? background[key] : "";
    return `<article class="journal-entry${key === "personalHistory" ? " journal-history" : ""}"><label for="story-${escapeHtml(key)}"><span class="journal-index">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(BACKGROUND_LABELS.get(key))}</span></label><textarea id="story-${escapeHtml(key)}" name="${escapeHtml(key)}" data-section="background" rows="5">${escapeHtml(value)}</textarea></article>`;
  }).join("");
  const armorChecked = armor ? " checked" : "";
  const armorHidden = armor ? "" : " hidden";
  const movChecked = armor?.applyMovPenalty === true ? " checked" : "";
  return layout(editing ? "编辑调查员" : "新建调查员", `${noticeHtml}
<div class="editor-heading"><div><p class="editor-eyebrow">私人珍藏 · 调查员档案</p><h1 id="investigator-title">${editing ? escapeHtml(identity.name || "未命名调查员") : "新建调查员"}</h1><p id="editor-description">${editing ? "编辑调查员档案" : "记录一段新的调查旅程"}</p></div></div>
<form id="card-form" data-url="${escapeHtml(action)}" data-method="${method}">
<div class="sheet-tabs dossier-tabs" role="tablist" aria-label="档案分区">
<button type="button" role="tab" id="tab-intro" data-tab="intro" aria-selected="true" tabindex="0" aria-controls="panel-intro">基本资料</button>
<button type="button" role="tab" id="tab-stats" data-tab="stats" aria-selected="false" aria-controls="panel-stats">基础属性</button>
<button type="button" role="tab" id="tab-skills" data-tab="skills" aria-selected="false" aria-controls="panel-skills">职业&amp;技能</button>
<button type="button" role="tab" id="tab-story" data-tab="story" aria-selected="false" aria-controls="panel-story">背景故事</button>
<button type="button" role="tab" id="tab-gear" data-tab="gear" aria-selected="false" aria-controls="panel-gear">武器&amp;物品</button>
</div>
<section id="panel-intro" data-panel="intro" role="tabpanel" aria-labelledby="tab-intro">
<div class="section-title"><span>01 / PERSONAL RECORD</span><h2>基本资料</h2></div><div class="identity-layout"><aside class="identity-emblem" aria-hidden="true"><div class="identity-stamp">${escapeHtml(Array.from(identity.name || "档")[0])}</div><p>调查员私人档案</p><small>ARCHIVE · CONFIDENTIAL</small></aside><div class="identity-fields">${identityHtml}</div></div>
<p id="age-note">${escapeHtml(ageText(preview))}</p>
</section>
<section id="panel-stats" data-panel="stats" role="tabpanel" aria-labelledby="tab-stats" hidden>
<div class="stats-heading"><div class="section-title"><span>02 / CHARACTERISTICS</span><h2>基础属性</h2></div><div class="actions"><button type="button" id="open-rolls">⚄ 天命</button><button type="button" id="open-point-buy">✧ 购点</button></div></div>
<div id="point-buy-panel" class="point-buy-panel" hidden><div><h3>购点分配</h3><button type="button" id="end-point-buy" hidden>结束购点</button></div><p id="point-buy-status" role="status"></p><progress id="point-buy-progress" max="1" value="0" aria-label="购点已用比例"></progress><p class="field-note">单项属性为 0 到 90 的整数；是否计入幸运按本次购点设置。</p></div>
<div class="stats-layout"><div><div class="characteristics">${statsHtml}</div><p class="field-note">幸运独立记录。天命按 3D6×5 掷幸运，并计入总值含运。</p></div><aside class="derived-panel"><h3>派生值</h3><label class="initial-sanity">初始理智<input id="initialSan" data-integer="true" inputmode="numeric" value="${escapeHtml(initialSanValue(card))}"></label><dl id="derived" class="derived-values">${derivedText(preview)}</dl><p class="field-note">天命采用时，初始理智等于意志。手填与购点自行填写，必须是 0 到 99 的整数。</p></aside></div><p id="preview-error" class="errors" role="alert"></p>
</section>
<section id="panel-skills" data-panel="skills" role="tabpanel" aria-labelledby="tab-skills" hidden>
<div class="section-title"><span>03 / PROFESSION & SKILLS</span><h2>职业与技能</h2></div>
<section class="occupation-overview"><div class="occupation-heading"><h3>职业档案</h3><button type="button" id="choose-occupation" aria-haspopup="dialog" aria-controls="occupation-picker">⌕ 搜索 / 更换职业</button></div><pre id="occupation-summary">${escapeHtml(summary)}</pre><p id="occupation-skill-text" class="field-note">${escapeHtml(catalogSkillText(occupation.id))}</p>
<details id="occupation-edit"><summary>编辑职业属性 / 自定义</summary><div class="occupation-fields">
<input type="hidden" data-occupation="id" value="${escapeHtml(occupation.id ?? "")}"><label>职业名<input data-occupation="name" value="${escapeHtml(occupation.name ?? "")}"></label><label class="formula-field">职业点公式<select data-occupation="pointFormula">${formulaOptions(occupation.pointFormula)}</select></label><label>信用评级下限<input data-occupation="creditMin" data-integer="true" inputmode="numeric" value="${escapeHtml(occupation.creditMin ?? "")}"></label><label>信用评级上限<input data-occupation="creditMax" data-integer="true" inputmode="numeric" value="${escapeHtml(occupation.creditMax ?? "")}"></label></div><div id="occupational-skills" hidden>${occupationalNames.map((name) => occupationalRow(name)).join("")}</div></details></section>
<div id="point-status" class="point-status"><div class="point-pools">${pointPoolMarkup("职业点", "occupationPoints", preview.occupationPoints)}${pointPoolMarkup("兴趣点", "interestPoints", preview.interestPoints)}</div><ul id="point-errors" class="errors" aria-label="点数错误"></ul></div>
<div class="skills-heading"><h3>技能记录</h3><button type="button" id="choose-skill">＋ 选择任选技能</button></div><div class="skill-toolbar"><div class="skill-views" aria-label="技能视图"><button type="button" data-skill-view="occupation" aria-pressed="true">本职</button><button type="button" data-skill-view="interest" aria-pressed="false">兴趣</button></div><label class="switch">混点 <input type="checkbox" id="mix-points"></label><label class="switch">成长 <input type="checkbox" id="show-growth"></label></div>
<label class="skill-search-label">搜索技能 / 专攻<input id="sheet-skill-search" type="search" placeholder="例如：侦查、格斗、手枪……" autocomplete="off"></label><div class="skill-results-line"><span id="sheet-skill-count" role="status"></span><span class="field-note">成功率：普通 · 困难 · 极难</span></div><p id="skill-empty" hidden>没有匹配的技能。<button type="button" id="clear-skill-search">清除搜索</button></p>
<div id="skill-rows">${skills.map((skill, index) => skillRow(skill, preview.skills[index], {
    occupational: occupationalNameSet.has(String(skill?.name ?? "").trim()),
    credit: preview.credit,
    creditLocked: occupationChosen && creditCount <= 1 && String(skill?.name ?? "").trim() === "信用评级",
  })).join("")}</div>
</section>
<section id="panel-story" data-panel="story" role="tabpanel" aria-labelledby="tab-story" hidden>
<div class="panel-title"><span>04 / PERSONAL JOURNAL</span><h2>背景手记</h2><p>那些让你成为你的经历，留在这里。</p></div><div class="journal-pages">${backgroundHtml}</div>
</section>
<section id="panel-gear" data-panel="gear" role="tabpanel" aria-labelledby="tab-gear" hidden>
<div class="panel-title"><span>05 / EQUIPMENT RECORDS</span><h2>随身装备</h2><p>武器、物品与法术，归入同一份档案。</p></div>
<section class="gear-section"><header class="gear-heading"><div><span class="gear-section-index">I · ARMORY</span><h3>武器记录</h3></div><div class="actions"><button type="button" id="open-weapon-catalog">查看军械目录</button><button type="button" id="add-weapon">＋ 自定义武器</button></div></header><p class="field-note">伤害中的 DB、半DB 保留原文；检定使用调查员自己的技能。</p><div id="weapon-rows">${weapons.map(weaponRow).join("")}</div><p id="weapon-empty"${weapons.length ? " hidden" : ""}>尚未收录武器，可从目录加入或填写自定义武器。</p></section>
<section class="gear-section"><header class="gear-heading"><div><span class="gear-section-index">II · PROTECTION</span><h3>护甲</h3></div><label class="armor-switch"><input type="checkbox" id="armor-enabled"${armorChecked}> 穿着护甲</label></header><div id="armor-fields"${armorHidden}><label>护甲名称<input id="armor-name" value="${escapeHtml(armor?.name ?? "")}"></label><label class="armor-switch"><input type="checkbox" id="armor-mov"${movChecked}> 计入移动惩罚</label><label>移动惩罚<input id="armor-penalty" data-integer="true" inputmode="numeric" value="${escapeHtml(armor?.movPenalty ?? "")}"></label></div></section>
<section class="gear-section"><header class="gear-heading"><div><span class="gear-section-index">III · PERSONAL EFFECTS</span><h3>携带物品</h3></div></header><label class="long-record-label" for="carried-items">物品记录</label><textarea id="carried-items" rows="6">${escapeHtml((possessions.items ?? []).map(item => item.name).join("\n"))}</textarea><input id="cash" type="hidden" value="${escapeHtml(possessions.cash ?? "")}"></section>
<details id="more-investigator-info" class="more-records"><summary>更多调查员信息</summary><div class="additional-records">
${[["spells", "法术"], ["assets", "个人资产"], ["mythos", "神话"], ["personalHistory", "调查员经历"], ["companions", "调查员伙伴"]].map(([key, label]) => `<details class="additional-record"><summary>${label}</summary><label class="sr-only" for="extra-${key}">${label}</label><textarea id="extra-${key}"${key === "spells" ? "" : ` name="${key}" data-section="background"`} rows="6">${escapeHtml(key === "spells" ? spells.map(spell => spell.name).join("\n") : background[key] ?? "")}</textarea></details>`).join("")}
</div></details><template id="weapon-template">${weaponRow()}</template>
</section>
${optionList("skill-names", SKILL_NAMES)}
${optionList("fighting-specialties", Object.keys(FIGHTING_SPECIALTY_BASES))}
${optionList("firearms-specialties", Object.keys(FIREARMS_SPECIALTY_BASES))}
${optionList("art-specialties", ART_SPECIALTIES)}
${optionList("science-specialties", Object.keys(SCIENCE_SPECIALTY_BASES))}
${catalogScript("occupation-catalog", OCCUPATIONS)}
${catalogScript("weapon-catalog", WEAPONS)}
<p id="errors" class="errors" role="alert" tabindex="-1"></p>
</form>
<dialog id="rolls-dialog" aria-labelledby="rolls-title"><div class="dialog-title"><span>命运档案袋</span><h2 id="rolls-title">选择你的天命</h2></div><p>每张卡只能生成一次。首次数量与候选会固定保存，刷新也不会重掷；可从候选中选择，或改用手填、购点。</p>
<label>生成数量 X<input id="roll-count" inputmode="numeric"></label>
<p id="roll-error" class="errors"></p>
<div class="actions"><button type="button" id="start-rolls">生成 / 取回固定天命</button> <button type="button" id="close-rolls">关闭</button></div>
<div id="roll-results"></div>
</dialog>
<dialog id="occupation-picker" aria-labelledby="occupation-picker-title"><div class="dialog-title"><span>职业目录 · PROFESSION INDEX</span><h2 id="occupation-picker-title">选择职业</h2></div><div class="occupation-search-bar"><label>搜索职业或技能<input id="occupation-search" type="search" placeholder="例如：侦探、科学家……" autocomplete="off"></label><button type="button" id="occupation-picker-close">关闭</button></div><p id="occupation-result-count" role="status"></p><ul id="occupation-results">${occupationChoices()}</ul><p id="occupation-empty" hidden>没有匹配的职业，请换个关键词，或选“自定义职业”。</p></dialog>
<dialog id="weapon-catalog-dialog" aria-labelledby="weapon-catalog-title"><div class="dialog-title"><span>ARMORY INDEX · 军械目录</span><h2 id="weapon-catalog-title">查阅武器</h2></div><div class="weapon-catalog-tools"><label>分类<select id="weapon-category"><option value="">全部类型</option>${WEAPON_CATEGORIES.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label><label>搜索武器<input type="search" id="weapon-search" placeholder="名称、技能或时代……" autocomplete="off"></label><button type="button" id="close-weapon-catalog">关闭</button></div><p id="weapon-result-count" role="status"></p><ul id="weapon-results">${weaponCatalog(WEAPONS)}</ul><p id="weapon-no-results" hidden>没有匹配的武器，请换个关键词或分类。</p><p id="weapon-added" role="status" aria-live="polite"></p></dialog>
<dialog id="skill-picker" aria-label="添加技能">
<label>搜索技能<input id="skill-search"></label>
<select id="skill-picker-list" size="8"></select>
<label>专攻<input id="skill-picker-specialty"></label>
<label>自定义技能名<input id="skill-picker-custom"></label>
<p id="skill-picker-error" class="errors"></p>
<div class="actions"><button type="button" id="skill-picker-add">加入</button> <button type="button" id="skill-picker-close">关闭</button></div>
</dialog>
<dialog id="point-buy-dialog" aria-labelledby="point-buy-title"><div class="dialog-title"><span>属性分配 · POINT BUY</span><h2 id="point-buy-title">开启购点</h2></div>
<p>购点时每项属性是 0 到 90 的整数，幸运不计入总额时也一样。</p>
<label>购点总额<input id="point-buy-total" inputmode="numeric"></label>
<label><input type="checkbox" id="point-buy-luck"> 包含幸运</label>
<p id="point-buy-error" class="errors"></p>
<div class="actions"><button type="button" id="point-buy-confirm">确定</button> <button type="button" id="point-buy-cancel">取消</button></div>
</dialog>
<div class="save-toolbar"><button type="submit" form="card-form" id="save-card">保存修改</button></div>`);
}

function messagePage(statusText) {
  return layout("角色卡", `<p>${escapeHtml(statusText)}</p>`);
}

export async function handlePage(request, response, context) {
  const url = new URL(request.url, "http://127.0.0.1");
  if (serveStaticAsset(request, response, url.pathname)) return;
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
