import { escapeHtml as e } from "./html.js";
import { derivePreview } from "../rules/sheet.js";

const ornaments = ['card-side-black-rose', 'card-side-books', 'card-side-documents', 'card-side-flowers', 'archive-botanical-edge'];
const value = (number) => number == null || number === "" ? "—" : String(number);
function summary(items, className) {
  return `<dl class="${className}">${items.map(([label, number]) => `<div><dt>${e(label)}</dt><dd>${e(value(number))}</dd></div>`).join("")}</dl>`;
}
function archiveCard(record) {
  const card = record.character;
  const ornament = ornaments[Array.from(card.id).reduce((sum, character) => sum + character.codePointAt(0), 0) % ornaments.length];
  const name = card.identity?.name?.trim() || "未命名";
  const occupation = card.occupation?.name?.trim() || "职业待填写";
  const era = card.identity?.era === "1920s" ? "1920年代" : card.identity?.era || "时代待填写";
  const stats = card.characteristics || {};
  const preview = derivePreview(card);
  const href = `/investigators/${encodeURIComponent(card.id)}/edit`;
  const date = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(record.updatedAt)).replaceAll("/", ".");
  return `<li class="archive-card" data-archive-card data-search="${e(`${name} ${occupation} ${era}`.toLocaleLowerCase("zh-CN"))}" data-name="${e(name)}" data-updated="${e(record.updatedAt)}">
<img class="card-side-ornament" src="/assets/${ornament}.webp" alt="" aria-hidden="true">
<div class="name-seal" aria-hidden="true">${e(Array.from(name)[0])}</div>
<div class="card-content"><div class="card-heading"><div><h2><a title="${e(name)}" href="${e(href)}">${e(name)}</a></h2><p class="occupation" title="${e(`${occupation} · ${era}`)}">${e(occupation)} <span aria-hidden="true">·</span> <span class="era">${e(era)}</span></p></div>
<details class="card-menu"><summary aria-label="${e(name)}的更多操作">⋯</summary><div class="menu-content"><button type="button" data-duplicate="${e(card.id)}">复制档案</button><button type="button" class="danger" data-delete="${e(card.id)}">删除档案</button></div></details></div>
${summary([["力量", stats.str], ["体质", stats.con], ["意志", stats.pow], ["教育", stats.edu]], "card-stats")}
${summary([["生命值", preview.hp], ["初始理智", card.initialSan], ["魔力", preview.mp], ["移动力", preview.mov]], "card-derived")}
<div class="card-footer"><p><img src="/assets/archive-wax-seal.webp" width="26" height="26" alt=""><span>最后更新：<time datetime="${e(record.updatedAt)}">${e(date)}</time></span></p><div class="card-actions"><a class="paper-button" href="/api/characters/${e(encodeURIComponent(card.id))}/export">导出</a><a class="wine-button" href="${e(href)}">编辑</a></div></div></div></li>`;
}
export function listPage(records) {
  const sorted = [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.character.id.localeCompare(b.character.id));
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ede8dd"><link rel="icon" href="/assets/archive-emblem.png" type="image/png"><title>我的调查员 · 茶话会调查员档案馆</title><link rel="stylesheet" href="/investigator-list.css"></head>
<body class="archive-library"><div class="page-binding page-binding-left" aria-hidden="true"></div><div class="page-binding page-binding-right" aria-hidden="true"></div><div class="library-corners" aria-hidden="true"><i></i><i></i></div>
<header class="library-header"><a href="/investigators" class="archive-brand"><img src="/assets/archive-emblem.png" alt="" width="54" height="54"><span><strong>茶话会调查员档案馆</strong><small lang="en">ARKHAM INVESTIGATOR ARCHIVE</small></span></a><button class="paper-button" type="button" id="logout">登出</button></header>
<nav class="library-nav" aria-label="档案操作"><a href="/investigators" class="wine-button" aria-current="page">▣ 我的调查员</a><a class="paper-button" href="/investigators/new">＋ 新建调查员</a><button class="paper-button" type="button" id="open-import">↥ 导入角色卡</button></nav>
<main class="library-main"><div class="library-intro"><p class="eyebrow">私人珍藏 / INVESTIGATOR RECORDS</p><h1>我的调查员</h1><p>一纸档案，留存每一次启程。</p></div>
<div class="library-toolbar"><label class="search-field"><span class="sr-only">搜索姓名或职业</span><span aria-hidden="true">⌕</span><input id="archive-search" type="search" placeholder="搜索姓名或职业……" autocomplete="off"></label><label class="sort-field">排序<select id="archive-sort"><option value="updated">最近更新</option><option value="name">姓名</option></select></label></div>
<p class="result-count" id="archive-count" role="status">共 ${records.length} 份档案</p>
<div class="archive-shelves"><ul class="archive-cards" id="archive-cards">${sorted.map(archiveCard).join("")}</ul>
<section class="empty-archive" id="empty-archive"${records.length ? " hidden" : ""}><div class="empty-seal" aria-hidden="true">＋</div><h2>还没有调查员</h2><p>从第一张档案开始，记录你的调查员。</p><a href="/investigators/new" class="wine-button">新建调查员</a></section>
<section class="empty-archive" id="no-search-results" hidden><h2>没有匹配的档案</h2><p>试试其他姓名或职业。</p><button class="paper-button" id="clear-search" type="button">清除搜索</button></section></div>
<p class="library-error" id="library-error" role="alert"></p></main>
<footer class="library-footer"><img src="/assets/archive-divider.svg" width="280" height="22" alt=""><p>茶话会 · 调查员私人档案</p></footer>
<dialog id="import-dialog" aria-labelledby="import-title"><div class="dialog-heading"><h2 id="import-title">导入调查员档案</h2><button class="close-dialog" type="button" id="close-import" aria-label="关闭导入窗口">×</button></div><p>选择本站导出的 .coc7.json 文件，导入为属于你的新卡。</p><form id="import-card"><label for="import-file">角色卡文件</label><input id="import-file" type="file" accept=".coc7.json,.json,application/json"><p id="import-errors" class="library-error" role="alert"></p><button type="submit" class="wine-button">导入为新卡</button></form></dialog>
<script src="/card-actions.js" defer></script><script src="/investigator-list-client.js" defer></script></body></html>`;
}
