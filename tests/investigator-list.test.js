import assert from "node:assert/strict";
import test from "node:test";
import { listPage } from "../web/investigator-list.js";
import { minimalCharacter } from "./minimalCharacter.js";

test("archive summaries escape user text and show initial rather than session resources", () => {
  const card = minimalCharacter();
  card.identity.name = '<img src=x onerror="alert(1)">';
  card.occupation.name = '职业" onclick="bad()';
  card.initialSan = 42;
  const html = listPage([{ character: card, updatedAt: "2026-09-29T20:00:00Z" }], "");
  assert.equal(html.includes('<img src=x'), false);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /<dt>初始理智<\/dt><dd>42<\/dd>/);
  assert.match(html, /2026\.09\.30/); // Shanghai date, independent of execution host timezone.
  assert.match(html, /1920年代/);
  assert.equal(html.includes("currentHp"), false);
  assert.match(html, /\/api\/characters\/card-1\/export/);
});
test("archives initially sort by updated time without mutating supplied records", () => {
  const a = minimalCharacter(); a.id = "older"; a.identity.name = "旧卡";
  const b = minimalCharacter(); b.id = "newer"; b.identity.name = "新卡";
  const records = [{ character: a, updatedAt: "2026-09-01T00:00:00Z" }, { character: b, updatedAt: "2026-09-30T00:00:00Z" }];
  const html = listPage(records, "");
  assert.ok(html.indexOf('data-name="新卡"') < html.indexOf('data-name="旧卡"'));
  assert.equal(records[0].character.id, "older");
  assert.match(listPage([], ""), /还没有调查员/);
});
