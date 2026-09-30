import { escapeHtml as e } from "./html.js";

const MAIN_FIELDS = [["name", "名称"], ["type", "类型"], ["skill", "使用技能"], ["damage", "伤害"], ["range", "射程"], ["rate", "每轮攻击"], ["ammo", "装弹量"], ["malfunction", "故障值"], ["quantity", "数量"]];
const DETAIL_FIELDS = [["impale", "贯穿"], ["era", "时代"], ["price", "价格"], ["invented", "发明时间"], ["note", "备注"]];
function field(weapon, [key, label]) {
  const value = e(weapon?.[key] ?? "");
  return `<label class="weapon-field field-${key}">${label}${key === "note" ? `<textarea data-field="${key}">${value}</textarea>` : `<input data-field="${key}"${key === "quantity" ? ' data-integer="true" inputmode="numeric"' : ""} value="${value}">`}</label>`;
}
export function weaponRow(weapon = {}) {
  return `<article class="weapon-row"><header class="gear-record-heading"><span>武器记录</span><button type="button" data-remove-row aria-label="删除这件武器">删除武器</button></header><div class="weapon-main-fields">${MAIN_FIELDS.map(item => field(weapon, item)).join("")}</div><details class="weapon-details"><summary>详细资料 · 时代、价格与备注</summary><div class="weapon-detail-fields">${DETAIL_FIELDS.map(item => field(weapon, item)).join("")}</div></details></article>`;
}
export function weaponCatalog(weapons) {
  return weapons.map((weapon, index) => `<li data-weapon-entry data-category="${e(weapon.type)}" data-search="${e([weapon.name, weapon.type, weapon.skill, weapon.era].join(" ").toLowerCase())}"><article><header><span>${e(weapon.type)}</span><h3>${e(weapon.name)}</h3></header><dl><div><dt>伤害</dt><dd>${e(weapon.damage)}</dd></div><div><dt>射程</dt><dd>${e(weapon.range || "—")}</dd></div><div><dt>装弹</dt><dd>${e(weapon.ammo || "—")}</dd></div><div><dt>故障</dt><dd>${e(weapon.malfunction || "—")}</dd></div></dl><p>使用技能：${e(weapon.skill)} · ${e(weapon.era || "时代未标注")}</p><button type="button" data-add-catalog-weapon="${index}">＋ 加入角色卡</button></article></li>`).join("");
}
