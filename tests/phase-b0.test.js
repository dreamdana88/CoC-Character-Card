import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envKeys = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "OAUTH_CALLBACK_URL",
  "DISCORD_GUILD_ID",
  "COC_ACCESS_ROLE_ID",
  "SESSION_SECRET",
  "DATABASE_PATH",
  "INTERNAL_API_SECRET",
];

function atLeast(version, minimum) {
  const parse = (value) => value.replace(/^v/, "").split(".").map((part) => Number(part));
  const current = parse(version);
  const required = parse(minimum);
  for (let index = 0; index < required.length; index += 1) {
    const left = current[index] ?? 0;
    const right = required[index];
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

test("Phase B0 skeleton stays runnable", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "coc-character-card");
  assert.equal(pkg.private, true);
  assert.equal(pkg.engines.node, ">=22.20.0");
  assert.match(pkg.scripts.test, /node --test /);
  assert.deepEqual(pkg.dependencies, { "better-sqlite3": "^13.0.3" });
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(atLeast(process.version, "22.20.0"), true);

  for (const dir of ["web", "api", "tests"]) {
    assert.equal(statSync(join(root, dir)).isDirectory(), true, dir);
  }
  assert.deepEqual(readdirSync(join(root, "web")).sort(), [
    "asset-review.css", "asset-review.html", "assets", "card-actions.js", "editor-state.js", "editor.js", "gear-ui.js", "gear.css", "gear.js", "html.js", "investigator-list-client.js", "investigator-list.css", "investigator-list.js", "login.css", "login.js", "pages.js", "site.css", "skill-ui.js", "skills.css", "static-assets.js",
  ]);
  assert.deepEqual(readdirSync(join(root, "api")).sort(), ["characters.js", "internal.js"]);
  assert.equal(statSync(join(root, "server.js")).isFile(), true);
  assert.deepEqual(readdirSync(join(root, "storage")).sort(), [
    "backup.js",
    "characters.js",
    "database.js",
    "errors.js",
    "index.js",
    "migrations",
  ]);
  assert.deepEqual(readdirSync(join(root, "storage", "migrations")).sort(), ["001_init.sql", "002_auth.sql", "003_character_rolls.sql"]);
  assert.deepEqual(readdirSync(join(root, "auth")).sort(), [
    "config.js",
    "constants.js",
    "discord.js",
    "errors.js",
    "http.js",
    "index.js",
    "store.js",
  ]);
  const ruleFiles = readdirSync(join(root, "rules")).filter((name) => name !== ".gitkeep").sort();
  assert.deepEqual(ruleFiles, ["characterSchema.js", "coc7.js", "data", "index.js", "sheet.js", "validation.js"]);
  const dataFiles = readdirSync(join(root, "rules", "data")).filter((name) => name.endsWith(".js")).sort();
  assert.deepEqual(dataFiles, ["occupations.js", "skills.js", "weapons.js"]);
  const ruleSources = [
    ...ruleFiles.filter((name) => name.endsWith(".js")).map((name) => join("rules", name)),
    ...dataFiles.map((name) => join("rules", "data", name)),
  ];
  for (const file of ruleSources) {
    const source = readFileSync(join(root, file), "utf8");
    assert.equal(source.includes("better-sqlite3"), false, file);
    assert.equal(source.includes("discord"), false, file);
    assert.equal(source.includes("../TeaParty-Bell"), false, file);
  }

  const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(gitignore, /(^|\r?\n)\.env(\r?\n|$)/);

  const example = readFileSync(join(root, ".env.example"), "utf8");
  const values = new Map();
  for (const line of example.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    assert.notEqual(separator, -1, trimmed);
    values.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim());
  }
  assert.deepEqual([...values.keys()], envKeys);
  for (const key of envKeys) {
    assert.equal(values.get(key), "", `${key} must stay empty in .env.example`);
  }
  assert.equal(example.includes("1447978053665030280"), false);

  const readme = readFileSync(join(root, "README.md"), "utf8");
  const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
  const references = [
    "docs/reference/tl-coc-card-xlsx-audit.md",
    "docs/reference/coc-phase0-audit.md",
  ];
  for (const reference of references) {
    assert.match(readme, new RegExp(reference.replaceAll(".", "\\.")));
    assert.match(agents, new RegExp(reference.replaceAll(".", "\\.")));
    const text = readFileSync(join(root, reference), "utf8");
    assert.equal(text.length > 1000, true, reference);
  }
  assert.match(readFileSync(join(root, references[0]), "utf8"), /^# TL COC CARD\.xlsx 拆解报告/);
  assert.match(readFileSync(join(root, references[1]), "utf8"), /^# TeaParty-Bell CoC Phase 0 审计报告/);
  for (const file of [readme, agents]) {
    assert.equal(file.includes("../TeaParty-Bell"), false);
    assert.equal(file.includes("../TL COC CARD.xlsx"), false);
  }
  assert.match(readme, /Phase B7/);
  assert.match(readme, /better-sqlite3/);
  assert.equal(readme.includes("本阶段不安装数据库驱动"), false);
  assert.match(agents, /B0、B1、B2、B3、B4、B5、B6、B7 已完成/);
});
