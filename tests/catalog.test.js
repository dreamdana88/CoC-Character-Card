import assert from "node:assert/strict";
import test from "node:test";
import { OCCUPATION_POINT_FORMULAS } from "../rules/characterSchema.js";
import { OCCUPATIONS } from "../rules/data/occupations.js";
import {
  ART_SPECIALTIES,
  DRIVE_BASE,
  FIGHTING_SPECIALTY_BASES,
  FIREARMS_SPECIALTY_BASES,
  FIXED_SKILL_BASES,
  LANGUAGE_BASE,
  LORE_BASE,
  SCIENCE_DEFAULT_BASE,
  SCIENCE_SPECIALTY_BASES,
  SKILL_NAMES,
  SURVIVAL_BASE,
} from "../rules/data/skills.js";
import { WEAPON_CATEGORIES, WEAPONS } from "../rules/data/weapons.js";
import { expectedSkillBase } from "../rules/sheet.js";

test("fixed skill bases come from the workbook table", () => {
  assert.equal(FIXED_SKILL_BASES["人类学"], 1);
  assert.equal(FIXED_SKILL_BASES["估价"], 5);
  assert.equal(FIXED_SKILL_BASES["考古学"], 1);
  assert.equal(Object.keys(FIXED_SKILL_BASES).length, 44);
  for (const [name, base] of Object.entries(FIXED_SKILL_BASES)) {
    assert.equal(SKILL_NAMES.includes(name), true, name);
    assert.deepEqual(expectedSkillBase({ name }), { known: true, base }, name);
  }
  assert.deepEqual(expectedSkillBase({ name: "计算机使用 Ω" }), { known: true, base: 5 });
  assert.deepEqual(expectedSkillBase({ name: "电子学 Ω" }), { known: true, base: 1 });
  assert.deepEqual(expectedSkillBase({ name: "技艺①", specialty: "木工" }), { known: true, base: 5 });
  assert.equal(ART_SPECIALTIES.length, 28);
  assert.equal(ART_SPECIALTIES.every((name) => expectedSkillBase({ name: "技艺", specialty: name }).base === 5), true);
  assert.deepEqual(expectedSkillBase({ name: "科学", specialty: "数学" }), { known: true, base: 10 });
  assert.deepEqual(expectedSkillBase({ name: "科学", specialty: "物理学" }), { known: true, base: SCIENCE_SPECIALTY_BASES["物理学"] });
  assert.equal(SCIENCE_DEFAULT_BASE, 1);
  assert.deepEqual(expectedSkillBase({ name: "格斗：", specialty: "斗殴" }), { known: true, base: 25 });
  assert.deepEqual(expectedSkillBase({ name: "格斗", specialty: "矛" }), { known: true, base: 20 });
  assert.deepEqual(expectedSkillBase({ name: "射击：", specialty: "手枪" }), { known: true, base: 20 });
  assert.deepEqual(expectedSkillBase({ name: "射击", specialty: "步枪/霰弹枪" }), { known: true, base: 25 });
  assert.equal(Object.keys(FIGHTING_SPECIALTY_BASES).length, 8);
  assert.equal(Object.keys(FIREARMS_SPECIALTY_BASES).length, 7);
  assert.deepEqual(expectedSkillBase({ name: "驾驶：", specialty: "飞行器" }), { known: true, base: DRIVE_BASE });
  assert.equal(DRIVE_BASE, 1);
  assert.deepEqual(expectedSkillBase({ name: "外语", specialty: "拉丁语" }), { known: true, base: LANGUAGE_BASE });
  assert.equal(LANGUAGE_BASE, 1);
  assert.deepEqual(expectedSkillBase({ name: "生存：" }), { known: true, base: SURVIVAL_BASE });
  assert.equal(SURVIVAL_BASE, 10);
  assert.deepEqual(expectedSkillBase({ name: "学识：" }), { known: true, base: LORE_BASE });
  assert.equal(LORE_BASE, 1);
  assert.deepEqual(expectedSkillBase({ name: "自定义技能" }), { known: false });
});

test("occupations come from the workbook and custom stays unguessed", () => {
  assert.equal(OCCUPATIONS.length, 230);
  const custom = OCCUPATIONS.find((item) => item.id === "1");
  assert.equal(custom.name, "自定义职业");
  assert.equal(custom.pointFormula, "CUSTOM");
  assert.equal(custom.creditMin, null);
  assert.equal(custom.creditMax, null);
  assert.deepEqual(custom.occupationalSkills, []);
  assert.match(custom.skillText, /不多于8个本职技能/);

  const accountant = OCCUPATIONS.find((item) => item.name === "会计师");
  assert.equal(accountant.id, "2");
  assert.equal(accountant.pointFormula, "EDU_X4");
  assert.equal(accountant.creditMin, 30);
  assert.equal(accountant.creditMax, 70);
  assert.deepEqual(accountant.occupationalSkills, ["会计", "法律", "图书馆使用", "聆听", "说服", "侦查"]);
  assert.equal(accountant.skillText, "会计，法律，图书馆，聆听，说服，侦查，任意其他两项个人或时代特长。");

  const ids = new Set();
  for (const occupation of OCCUPATIONS) {
    assert.equal(ids.has(occupation.id), false, occupation.id);
    ids.add(occupation.id);
    assert.equal(occupation.id, String(Number(occupation.id)));
    assert.notEqual(occupation.id, "0");
    assert.equal(OCCUPATION_POINT_FORMULAS.includes(occupation.pointFormula), true, occupation.name);
    assert.equal(Array.isArray(occupation.occupationalSkills), true, occupation.name);
    assert.equal(typeof occupation.skillText, "string", occupation.name);
    const packed = JSON.stringify(occupation);
    assert.equal(packed.includes("附表"), false, occupation.name);
    assert.equal(packed.includes("SUM("), false, occupation.name);
    assert.equal(packed.includes("excel"), false, occupation.name);
  }
});

test("weapons come from the workbook catalog", () => {
  assert.deepEqual(WEAPON_CATEGORIES, ["常规武器", "手枪", "步枪", "霰弹枪", "突击步枪", "冲锋枪", "机枪", "特殊武器"]);
  assert.equal(WEAPONS.length, 113);
  const counts = Object.fromEntries(WEAPON_CATEGORIES.map((category) => [category, 0]));
  for (const weapon of WEAPONS) {
    assert.notEqual(weapon.name.trim(), "");
    assert.notEqual(weapon.skill.trim(), "");
    counts[weapon.type] += 1;
    const packed = JSON.stringify(weapon);
    assert.equal(packed.includes("excel"), false, weapon.name);
    assert.equal(packed.includes("VLOOKUP"), false, weapon.name);
  }
  assert.deepEqual(counts, {
    "常规武器": 28,
    "手枪": 16,
    "步枪": 12,
    "霰弹枪": 9,
    "突击步枪": 9,
    "冲锋枪": 6,
    "机枪": 8,
    "特殊武器": 25,
  });
  assert.equal(WEAPONS.some((weapon) => weapon.name === "毒剂" || weapon.name === "术语解释"), false);

  const shuriken = WEAPONS.find((weapon) => weapon.name === "手里剑");
  assert.deepEqual(shuriken, {
    type: "常规武器",
    name: "手里剑",
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
  });

  const brass = WEAPONS.find((weapon) => weapon.name === "黄铜指虎");
  assert.equal(brass.type, "常规武器");
  assert.equal(brass.skill, "斗殴");
  assert.equal(brass.damage, "1D3+1+DB");
  assert.equal(brass.range, "接触");
  assert.equal(brass.impale, "×");
  assert.equal(brass.rate, "1");
  assert.equal(brass.ammo, "——");
  assert.equal(brass.malfunction, "——");
  assert.equal(brass.price, "1/10");
  assert.equal(brass.invented, "——");
  assert.equal(Object.hasOwn(brass, "note"), false);
});
