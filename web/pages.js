import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readAuthConfig } from "../auth/config.js";
import { SESSION_COOKIE } from "../auth/constants.js";
import { AuthError, authStatus } from "../auth/errors.js";
import { readCookie } from "../auth/http.js";
import { readSession } from "../auth/store.js";
import { CHARACTERISTIC_FIELDS, ERAS } from "../rules/characterSchema.js";
import { getCharacter, listCharactersByOwner } from "../storage/index.js";
import { StorageError } from "../storage/errors.js";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "site.css"), "utf8");

const IDENTITY_LABELS = [
  ["name", "姓名", false],
  ["playerName", "玩家显示名", false],
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

const SESSION_FAILURES = new Set([
  "SESSION_MISSING",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "ENTITLEMENT_EXPIRED",
]);

const PAGE_SCRIPT = `
document.getElementById("logout")?.addEventListener("click", async () => {
  await fetch("/auth/logout", { method: "POST" });
  location.href = "/";
});
document.querySelectorAll("[data-delete]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!confirm("删除这张调查员卡？此操作不能撤销。")) return;
    const response = await fetch("/api/characters/" + encodeURIComponent(button.dataset.delete), { method: "DELETE" });
    if (response.ok) location.href = "/investigators";
    else alert("删除失败");
  });
});
document.querySelectorAll("[data-duplicate]").forEach((button) => {
  button.addEventListener("click", async () => {
    const response = await fetch("/api/characters/" + encodeURIComponent(button.dataset.duplicate) + "/duplicate", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.id) location.href = "/investigators/" + encodeURIComponent(body.id) + "/edit?copied=1";
    else alert("复制失败");
  });
});
const form = document.querySelector("#card-form");
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = { identity: {}, characteristics: {} };
    for (const field of form.querySelectorAll("[data-section]")) {
      let value = field.value;
      if (field.dataset.integer === "true") value = /^-?\\d+$/.test(value) ? Number(value) : value;
      data[field.dataset.section][field.name] = value;
    }
    const response = await fetch(form.dataset.url, {
      method: form.dataset.method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => ({}));
    const errors = document.querySelector("#errors");
    if (!response.ok) {
      const lines = Array.isArray(body.errors) ? body.errors.map((item) => item.path + "：" + item.message) : [];
      errors.textContent = lines.join("\\n") || body.message || "保存失败";
      return;
    }
    location.href = "/investigators/" + encodeURIComponent(body.id) + "/edit?saved=1";
  });
}
`;

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
<script>${PAGE_SCRIPT}</script>
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
      return `<li><a href="${href}">${escapeHtml(displayName(record.character.identity))}</a> <a href="${href}">编辑</a> <button type="button" data-duplicate="${id}">复制</button> <button type="button" data-delete="${id}">删除</button></li>`;
    }).join("")}</ul>`;
  return layout("我的调查员", `<h1>我的调查员</h1>${items}`);
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

function formPage({ mode, record, notice }) {
  const identity = record?.character.identity ?? {};
  const characteristics = record?.character.characteristics ?? {};
  const editing = mode === "edit";
  const id = editing ? record.character.id : "";
  const action = editing ? `/api/characters/${encodeURIComponent(id)}` : "/api/characters";
  const method = editing ? "PATCH" : "POST";
  const noticeHtml = notice ? `<p class="notice">${escapeHtml(notice)}</p>` : "";
  const identityHtml = IDENTITY_LABELS.map(([key, label, integer]) => identityControl(key, label, integer, identity)).join("");
  const statsHtml = CHARACTERISTIC_FIELDS.map((key) => {
    const value = Object.hasOwn(characteristics, key) ? characteristics[key] : "";
    return `<label>${escapeHtml(CHARACTERISTIC_LABELS.get(key))}<input name="${escapeHtml(key)}" data-section="characteristics" data-integer="true" inputmode="numeric" value="${escapeHtml(value)}"></label>`;
  }).join("");
  const extra = editing
    ? `<div class="actions"><button type="button" data-duplicate="${escapeHtml(id)}">复制</button> <button type="button" data-delete="${escapeHtml(id)}">删除</button></div>`
    : "";
  return layout(editing ? "编辑调查员" : "新建调查员", `${noticeHtml}
<h1>${editing ? "编辑调查员" : "新建调查员"}</h1>
<form id="card-form" data-url="${escapeHtml(action)}" data-method="${method}">
<h2>角色简介</h2>
${identityHtml}
<h2>属性</h2>
<div class="characteristics">${statsHtml}</div>
<p id="errors" class="errors"></p>
<div class="actions"><button type="submit">保存</button></div>
</form>
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
