import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const emptyDirs = ["web", "api", "auth", "storage", "rules"];
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

test("Phase B0 skeleton is runnable and later phases are not started", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "coc-character-card");
  assert.equal(pkg.private, true);
  assert.equal(pkg.engines.node, ">=22.20.0");
  assert.equal(pkg.scripts.test.includes("tests/phase-b0.test.js"), true);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(atLeast(process.version, "22.20.0"), true);

  for (const dir of [...emptyDirs, "tests"]) {
    assert.equal(statSync(join(root, dir)).isDirectory(), true, dir);
  }
  for (const dir of emptyDirs) {
    assert.deepEqual(readdirSync(join(root, dir)), [".gitkeep"]);
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
  assert.match(readme, /tl-coc-card-xlsx-audit\.md/);
  assert.match(readme, /coc-phase0-audit\.md/);
  assert.match(readme, /TL COC CARD\.xlsx/);
  assert.equal(existsSync(join(root, "../TeaParty-Bell/docs/tl-coc-card-xlsx-audit.md")), true);
  assert.equal(existsSync(join(root, "../TeaParty-Bell/docs/coc-phase0-audit.md")), true);
  assert.equal(existsSync(join(root, "../TL COC CARD.xlsx")), true);
});
