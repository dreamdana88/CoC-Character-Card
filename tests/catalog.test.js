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
    for (const skill of occupation.occupationalSkills) {
      assert.equal(SKILL_NAMES.includes(skill), true, `${occupation.name} ${skill}`);
    }
    const packed = JSON.stringify(occupation);
    assert.equal(packed.includes("附表"), false, occupation.name);
    assert.equal(packed.includes("SUM("), false, occupation.name);
    assert.equal(packed.includes("excel"), false, occupation.name);
  }
});

test("required skill abbreviations map, and choices stay manual", () => {
  const byName = (name) => OCCUPATIONS.find((item) => item.name === name);
  const archaeologist = byName("考古学家（原作向）");
  assert.equal(archaeologist.skillText, "估价，考古，历史，外语，图书馆，侦查，机械维修，导航或科学（任一：如化学、物理、地理等）。");
  assert.equal(archaeologist.occupationalSkills.includes("考古学"), true);
  assert.equal(archaeologist.occupationalSkills.includes("导航"), false);
  assert.equal(archaeologist.occupationalSkills.includes("科学"), false);
  const museum = byName("博物馆管理员");
  assert.equal(museum.skillText.includes("考古"), true);
  assert.equal(museum.occupationalSkills.includes("考古学"), true);
  const namedArchaeologist = byName("考古学家");
  assert.equal(namedArchaeologist.skillText.includes("考古"), false);
  assert.equal(namedArchaeologist.occupationalSkills.includes("考古学"), false);

  const trainer = byName("动物训练师");
  assert.equal(trainer.skillText, "跳跃，聆听，自然，心理学，科学（动物学），潜行，追踪，任意一项其他个人或时代特长。");
  assert.equal(trainer.occupationalSkills.includes("博物学"), true);
  assert.equal(trainer.occupationalSkills.includes("自然"), false);
  for (const name of ["探险家（古典）", "农民", "猎人", "部落成员", "饲养员", "传教士", "旅行家"]) {
    const occupation = byName(name);
    assert.equal(occupation.skillText.includes("自然"), true, name);
    assert.equal(occupation.occupationalSkills.includes("博物学"), true, name);
    assert.equal(occupation.occupationalSkills.includes("自然"), false, name);
  }
  const artist = byName("艺术家");
  assert.equal(artist.skillText.includes("历史或自然"), true);
  assert.equal(artist.occupationalSkills.includes("博物学"), false);
  assert.equal(artist.occupationalSkills.includes("历史"), false);
  const cowboy = byName("牛仔");
  assert.equal(cowboy.skillText.includes("急救或自然"), true);
  assert.equal(cowboy.skillText.includes("骑乘"), true);
  assert.equal(cowboy.occupationalSkills.includes("博物学"), false);
  assert.equal(cowboy.occupationalSkills.includes("骑术"), true);

  for (const name of ["建筑师", "设计师", "实验室助理", "科学家"]) {
    const occupation = byName(name);
    assert.equal(occupation.skillText.includes("计算机或图书馆"), true, name);
    assert.equal(occupation.occupationalSkills.includes("计算机使用"), false, name);
    assert.equal(occupation.occupationalSkills.includes("图书馆使用"), false, name);
  }
  const secretary = byName("秘书");
  assert.equal(secretary.skillText.includes("图书馆或计算机"), true);
  assert.equal(secretary.occupationalSkills.includes("计算机使用"), false);
  assert.equal(secretary.occupationalSkills.includes("图书馆使用"), false);
  const programmer = byName("程序员、电子工程师（现代）");
  assert.equal(programmer.occupationalSkills.includes("计算机使用"), true);
  assert.equal(programmer.occupationalSkills.includes("图书馆使用"), true);

  const stunt = byName("替身演员");
  assert.equal(stunt.skillText.includes("下面任选一项"), true);
  assert.equal(stunt.occupationalSkills.includes("骑术"), false);
  assert.equal(stunt.occupationalSkills.includes("汽车驾驶"), false);
  assert.equal(stunt.occupationalSkills.includes("驾驶"), false);
});

test("workbook skill names map onto the skill list", () => {
  const byName = (name) => OCCUPATIONS.find((item) => item.name === name);
  const keeper = byName("饲养员");
  assert.equal(keeper.skillText.startsWith("驯兽，"), true);
  assert.equal(keeper.occupationalSkills.includes("动物驯养"), true);
  assert.equal(keeper.occupationalSkills.includes("博物学"), true);

  for (const name of ["运动员（网球）", "司法科学家", "服装设计师", "厨师"]) {
    const occupation = byName(name);
    assert.equal(occupation.skillText.includes("侦察"), true, name);
    assert.equal(occupation.occupationalSkills.includes("侦查"), true, name);
  }

  for (const name of ["司法科学家", "勘测员", "医疗技术员"]) {
    const occupation = byName(name);
    assert.equal(occupation.skillText.includes("艺术（摄影）"), true, name);
    assert.equal(occupation.occupationalSkills.includes("技艺"), true, name);
  }
  const filmmaker = byName("电影摄制人员");
  assert.equal(filmmaker.skillText.includes("艺术/工艺"), true);
  assert.equal(filmmaker.occupationalSkills.includes("技艺"), true);
  const cook = byName("厨师");
  assert.equal(cook.skillText.includes("手艺（烹饪）"), true);
  assert.equal(cook.occupationalSkills.includes("技艺"), true);

  const archaeologist = byName("考古学家");
  assert.equal(archaeologist.skillText.includes("其他语言（欧洲）"), true);
  assert.equal(archaeologist.skillText.includes("艺术（任意）"), true);
  assert.equal(archaeologist.occupationalSkills.includes("外语"), true);
  assert.equal(archaeologist.occupationalSkills.includes("技艺"), true);
  assert.equal(archaeologist.occupationalSkills.includes("考古学"), false);
  const writer = byName("作家");
  assert.equal(writer.skillText.includes("其他语言（欧洲）"), true);
  assert.equal(writer.skillText.includes("艺术（写作）"), true);
  assert.equal(writer.occupationalSkills.includes("外语"), true);
  assert.equal(writer.occupationalSkills.includes("技艺"), true);
  const priest = byName("牧师");
  assert.equal(priest.skillText.includes("拉丁语"), true);
  assert.equal(priest.occupationalSkills.includes("外语"), true);

  const student = byName("女学生");
  assert.equal(student.skillText.includes("自行车驾驶"), true);
  assert.equal(student.skillText.includes("艺术/ 工艺"), true);
  assert.equal(student.skillText.includes("格斗（矛）或射击（弓术）"), true);
  assert.equal(student.occupationalSkills.includes("驾驶"), true);
  assert.equal(student.occupationalSkills.includes("技艺"), true);
  assert.equal(student.occupationalSkills.includes("格斗"), false);
  assert.equal(student.occupationalSkills.includes("射击"), false);
  const driver = byName("马车夫");
  assert.equal(driver.skillText.includes("马车驾驶"), true);
  assert.equal(driver.occupationalSkills.includes("驾驶"), true);
  const laborer = byName("劳工");
  assert.equal(laborer.skillText.includes("重型机械操作"), true);
  assert.equal(laborer.occupationalSkills.includes("操作重型机械"), true);
  assert.equal(laborer.skillText.includes("手艺（任意）"), true);
  assert.equal(laborer.skillText.includes("马车驾驶"), true);
  assert.equal(laborer.occupationalSkills.includes("技艺"), false);
  assert.equal(laborer.occupationalSkills.includes("驾驶"), false);
  assert.equal(laborer.occupationalSkills.includes("攀爬"), false);

  const sailor = OCCUPATIONS.find((item) => item.skillText.includes("电工或机械维修"));
  assert.equal(sailor.occupationalSkills.includes("电气维修"), false);
  assert.equal(sailor.occupationalSkills.includes("机械维修"), false);
  const intern = byName("学生、实习生");
  assert.equal(intern.skillText.includes("语言（母语或外语）"), true);
  assert.equal(intern.occupationalSkills.includes("母语"), false);
  assert.equal(intern.occupationalSkills.includes("外语"), false);
  const monk = byName("神职人员(和尚,尼姑)");
  assert.equal(monk.skillText.includes("历史或图书馆"), true);
  assert.equal(monk.skillText.includes("艺术（书法）"), true);
  assert.equal(monk.occupationalSkills.includes("历史"), false);
  assert.equal(monk.occupationalSkills.includes("图书馆使用"), false);
  assert.equal(monk.occupationalSkills.includes("技艺"), true);
  const pupil = byName("高中生(教育60以下)");
  assert.equal(pupil.skillText.includes("科学（任一）或历史"), true);
  assert.equal(pupil.skillText.includes("外语（英语或其他）"), true);
  assert.equal(pupil.occupationalSkills.includes("科学"), false);
  assert.equal(pupil.occupationalSkills.includes("历史"), false);
  assert.equal(pupil.occupationalSkills.includes("外语"), true);
});

test("weapons come from the workbook catalog", () => {
  assert.deepEqual(WEAPON_CATEGORIES, ["常规武器", "手枪", "步枪", "霰弹枪", "突击步枪", "冲锋枪", "机枪", "特殊武器"]);
  const explanationNames = ["受伤程度", "轻度", "中度", "重度", "致命", "终结", "血肉横飞", "护甲调整", "关于霰弹枪"];
  const explanationSkills = ["伤害等级", "部位瞄准", "1D3", "1D6", "1D10", "2D10", "4D10", "8D10"];
  for (const weapon of WEAPONS) {
    assert.notEqual(weapon.name.trim(), "");
    assert.notEqual(weapon.skill.trim(), "");
    assert.notEqual(weapon.damage.trim(), "");
    assert.equal(WEAPON_CATEGORIES.includes(weapon.type), true, weapon.name);
    assert.equal(explanationNames.some((name) => weapon.name.startsWith(name)), false, weapon.name);
    assert.equal(explanationSkills.includes(weapon.skill), false, weapon.name);
    const packed = JSON.stringify(weapon);
    assert.equal(packed.includes("excel"), false, weapon.name);
    assert.equal(packed.includes("VLOOKUP"), false, weapon.name);
  }
  assert.equal(WEAPONS.some((weapon) => weapon.name === "毒剂" || weapon.name === "术语解释"), false);
  assert.equal(WEAPONS.some((weapon) => weapon.name === "M72 式单发轻型反坦克炮"), true);
  assert.equal(WEAPONS.some((weapon) => weapon.name === "20 号霰弹枪(双管)"), true);

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
