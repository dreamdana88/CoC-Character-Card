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

document.getElementById("import-card")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const errors = document.getElementById("import-errors");
  const file = event.currentTarget.querySelector("input[type=file]")?.files?.[0];
  if (!file) {
    if (errors) errors.textContent = "请选择一个 .coc7.json 文件";
    return;
  }
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    if (errors) errors.textContent = "文件不是 JSON";
    return;
  }
  const response = await fetch("/api/characters/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.id) {
    location.href = "/investigators/" + encodeURIComponent(body.id) + "/edit";
    return;
  }
  const details = Array.isArray(body.errors) ? body.errors.map((error) => error.message).filter(Boolean).join("\n") : "";
  if (errors) errors.textContent = details || body.message || "导入失败";
});

function integerOrRaw(value) {
  return /^-?\d+$/.test(value) ? Number(value) : value;
}

function fieldValue(row, name) {
  return row.querySelector(`[data-field="${name}"]`)?.value ?? "";
}

function filledRow(row, names) {
  return names.some((name) => fieldValue(row, name).trim() !== "");
}

const WEAPON_TEXT_FIELDS = ["type", "skill", "damage", "range", "impale", "rate", "ammo", "malfunction", "era", "price", "invented", "note"];
const WEAPON_ROW_FIELDS = ["name", ...WEAPON_TEXT_FIELDS, "quantity"];

function readCatalog(id) {
  const node = document.getElementById(id);
  if (!node) return [];
  try {
    const value = JSON.parse(node.textContent);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function canonicalSkillName(name) {
  return name.trim().replace(/[：:]\s*$/u, "").replace(/\s*Ω\s*$/u, "").replace(/[①②③]$/u, "");
}

const form = document.querySelector("#card-form");
if (form) {
  let pointBuy = null;
  let previewTimer = 0;
  let skillView = "occupation";
  let mixPoints = false;
  let showGrowth = false;
  let saveBlocked = false;
  const occupations = readCatalog("occupation-catalog");
  const weapons = readCatalog("weapon-catalog");

  function collect() {
    const data = {
      identity: {},
      characteristics: {},
      occupation: {
        id: form.querySelector("[data-occupation='id']").value,
        name: form.querySelector("[data-occupation='name']").value,
        pointFormula: form.querySelector("[data-occupation='pointFormula']").value,
        creditMin: integerOrRaw(form.querySelector("[data-occupation='creditMin']").value),
        creditMax: integerOrRaw(form.querySelector("[data-occupation='creditMax']").value),
        occupationalSkills: [...form.querySelectorAll("[data-occupational-skill]")]
          .map((input) => input.value)
          .filter((name) => name.trim() !== ""),
      },
      skills: [...form.querySelectorAll(".skill-row")].map((row) => ({
        name: fieldValue(row, "name"),
        specialty: fieldValue(row, "specialty"),
        base: integerOrRaw(fieldValue(row, "base")),
        growth: integerOrRaw(fieldValue(row, "growth")),
        occupationPoints: integerOrRaw(fieldValue(row, "occupationPoints")),
        interestPoints: integerOrRaw(fieldValue(row, "interestPoints")),
      })),
      background: {},
      weapons: [...form.querySelectorAll(".weapon-row")].filter((row) => filledRow(row, WEAPON_ROW_FIELDS)).map((row) => {
        const weapon = {
          name: fieldValue(row, "name"),
          type: fieldValue(row, "type"),
          skill: fieldValue(row, "skill"),
          damage: fieldValue(row, "damage"),
        };
        for (const key of WEAPON_TEXT_FIELDS) {
          if (key === "type" || key === "skill" || key === "damage") continue;
          const value = fieldValue(row, key).trim();
          if (value !== "") weapon[key] = value;
        }
        const quantity = fieldValue(row, "quantity").trim();
        if (quantity !== "") weapon.quantity = integerOrRaw(quantity);
        return weapon;
      }),
      possessions: {
        items: [...form.querySelectorAll(".item-row")]
          .filter((row) => fieldValue(row, "name").trim() !== "")
          .map((row) => ({ name: fieldValue(row, "name") })),
      },
      spells: [...form.querySelectorAll(".spell-row")]
        .filter((row) => fieldValue(row, "name").trim() !== "")
        .map((row) => ({ name: fieldValue(row, "name") })),
    };
    for (const field of form.querySelectorAll("[data-section]")) {
      const value = field.dataset.integer === "true" ? integerOrRaw(field.value) : field.value;
      data[field.dataset.section][field.name] = value;
    }
    const armorOn = form.querySelector("#armor-enabled");
    if (armorOn?.checked) {
      data.armor = {
        name: form.querySelector("#armor-name").value,
        applyMovPenalty: Boolean(form.querySelector("#armor-mov")?.checked),
      };
      if (data.armor.applyMovPenalty) {
        data.armor.movPenalty = integerOrRaw(form.querySelector("#armor-penalty").value);
      }
    } else {
      data.armor = null;
    }
    const cash = form.querySelector("#cash");
    if (cash && cash.value.trim() !== "") data.possessions.cash = integerOrRaw(cash.value);
    const initialSan = form.querySelector("#initialSan");
    if (initialSan) data.initialSan = initialSan.value.trim() === "" ? null : integerOrRaw(initialSan.value.trim());
    if (pointBuy) data.pointBuy = { total: pointBuy.total, includeLuck: pointBuy.includeLuck };
    return data;
  }

  function specialtyList(name) {
    const canonical = canonicalSkillName(name);
    if (canonical === "格斗") return "fighting-specialties";
    if (canonical === "射击") return "firearms-specialties";
    if (canonical === "技艺") return "art-specialties";
    if (canonical === "科学") return "science-specialties";
    return "";
  }

  function syncSpecialtyLists() {
    for (const row of form.querySelectorAll(".skill-row")) {
      const specialty = row.querySelector("[data-field='specialty']");
      if (specialty) specialty.setAttribute("list", specialtyList(fieldValue(row, "name")));
    }
  }

  function occupationalNames() {
    return [...form.querySelectorAll("[data-occupational-skill]")].map((input) => input.value.trim()).filter(Boolean);
  }

  function isCreditName(name) {
    return canonicalSkillName(name) === "信用评级";
  }

  function occupationSelectedInForm() {
    const id = form.querySelector("[data-occupation='id']")?.value.trim() ?? "";
    return id !== "" && id !== "unset";
  }

  function creditRows() {
    return [...form.querySelectorAll(".skill-row")].filter((row) => isCreditName(fieldValue(row, "name")));
  }

  function ensureCreditRow() {
    if (!occupationSelectedInForm() || creditRows().length > 0) return false;
    const row = ensureSkillRow("信用评级");
    const base = row.querySelector("[data-field='base']");
    if (base && base.value.trim() === "") base.value = "0";
    return true;
  }

  function isMythosName(name) {
    return canonicalSkillName(name) === "克苏鲁神话";
  }

  function skillIdentity(name, specialty) {
    return `${name.trim()}\n${specialty.trim()}`;
  }

  function poolStatus(label, pool) {
    return `${label}：${pool.total} / 已用 ${textOrDash(pool.spent)} / 剩余 ${textOrDash(pool.remaining)}`;
  }

  function setStepper(stepper, { hidden, disabled }) {
    if (!stepper) return;
    stepper.hidden = hidden;
    for (const control of stepper.querySelectorAll("button, input")) control.disabled = disabled;
  }

  function applyPointControls() {
    for (const row of form.querySelectorAll(".skill-row")) {
      const mythos = row.dataset.mythos === "true";
      const occupational = row.dataset.occupational === "true";
      const illegalOccupation = row.dataset.illegalOccupation === "true";
      const showOccupation = !mythos && (illegalOccupation || (occupational && (mixPoints || skillView === "occupation")));
      const showInterest = !mythos && (mixPoints || skillView === "interest");
      setStepper(row.querySelector('[data-pool="occupationPoints"]'), {
        hidden: !showOccupation,
        disabled: mythos,
      });
      setStepper(row.querySelector('[data-pool="interestPoints"]'), {
        hidden: !showInterest,
        disabled: mythos,
      });
      setStepper(row.querySelector('[data-pool="growth"]'), {
        hidden: !showGrowth,
        disabled: false,
      });
    }
  }

  function applySkillView() {
    const names = new Set(occupationalNames());
    const lockCredit = occupationSelectedInForm() && creditRows().length <= 1;
    for (const row of form.querySelectorAll(".skill-row")) {
      const name = fieldValue(row, "name").trim();
      const specialty = fieldValue(row, "specialty").trim();
      const creditName = isCreditName(name);
      const occupational = names.has(name) || creditName;
      const points = fieldValue(row, "occupationPoints").trim();
      row.dataset.occupational = occupational ? "true" : "false";
      row.dataset.illegalOccupation = !occupational && /^\d+$/.test(points) && Number(points) > 0 ? "true" : "false";
      row.hidden = skillView === "occupation" ? !occupational : false;
      const remove = row.querySelector("[data-remove-skill]");
      if (remove) remove.hidden = creditName && lockCredit;
      const title = row.querySelector(".skill-title");
      if (title) title.textContent = specialty ? `${name} - ${specialty}` : name;
      const specialtyInput = row.querySelector("[data-field='specialty']");
      if (specialtyInput) {
        const list = specialtyList(name);
        if (list) specialtyInput.setAttribute("list", list);
        else specialtyInput.removeAttribute("list");
      }
    }
    applyPointControls();
  }

  function markPointErrors() {
    let illegal = false;
    for (const row of form.querySelectorAll(".skill-row")) {
      const error = row.querySelector("[data-row-error]");
      const bad = [...row.querySelectorAll(".stepper input")].some((input) => !/^\d+$/.test(input.value.trim()));
      if (error) {
        if (bad) error.textContent = "点数必须是非负整数";
        else if (error.textContent === "点数必须是非负整数") error.textContent = "";
      }
      if (bad) illegal = true;
    }
    return illegal;
  }

  function setSkillView(next) {
    skillView = next === "interest" ? "interest" : "occupation";
    for (const button of document.querySelectorAll("[data-skill-view]")) {
      button.setAttribute("aria-selected", button.dataset.skillView === skillView ? "true" : "false");
    }
    applySkillView();
  }

  function textOrDash(value) {
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  function renderDerived(derived) {
    const stats = document.querySelector("#derived");
    if (stats) {
      const rows = [
        ["生命值", derived?.hp],
        ["重伤线", derived?.majorWound],
        ["魔力", derived?.mp],
        ["SAN上限", derived?.sanMaximum],
        ["移动", derived?.mov],
        ["体格", derived?.build],
        ["伤害加值", derived?.damageBonus],
      ];
      stats.textContent = rows.map(([label, value]) => `${label}：${textOrDash(value)}`).join("\n");
    }
    const ageNote = document.querySelector("#age-note");
    if (ageNote) {
      const age = derived?.age;
      const text = age?.text || age?.reason || "";
      ageNote.textContent = text ? `年龄提示：${text}。属性保持手填的数值。` : "";
    }
    const formula = form.querySelector("[data-occupation='pointFormula']");
    const formulaLabel = formula?.selectedOptions?.[0]?.textContent || "";
    const occupational = occupationalNames();
    const summary = document.querySelector("#occupation-summary");
    if (summary) {
      summary.textContent = [
        `职业名：${form.querySelector("[data-occupation='name']").value.trim() || "未填写"}`,
        `职业点公式：${formulaLabel}`,
        `信用评级：${form.querySelector("[data-occupation='creditMin']").value}–${form.querySelector("[data-occupation='creditMax']").value}`,
        `本职技能：${occupational.join("、") || "未填写"}`,
      ].join("\n");
    }
    const occupationPool = derived?.occupationPoints;
    const interestPool = derived?.interestPoints;
    const poolLines = [];
    if (occupationPool?.message) poolLines.push(occupationPool.message);
    else if (occupationPool?.total != null) poolLines.push(poolStatus("职业点", occupationPool));
    if (interestPool?.total != null) poolLines.push(poolStatus("兴趣点", interestPool));
    const pools = document.querySelector("#point-pools");
    if (pools) pools.textContent = poolLines.join("\n");
    const poolMessages = [];
    if (typeof occupationPool?.remaining === "number" && occupationPool.remaining < 0) {
      poolMessages.push(`职业点超过总额，已用 ${occupationPool.spent} / ${occupationPool.total}`);
    }
    if (typeof interestPool?.remaining === "number" && interestPool.remaining < 0) {
      poolMessages.push(`兴趣点超过总额，已用 ${interestPool.spent} / ${interestPool.total}`);
    }
    if (derived?.credit?.error) poolMessages.push(derived.credit.error);
    for (const skill of derived?.skills || []) {
      if (skill?.occupationPointError && !poolMessages.includes(skill.occupationPointError)) {
        poolMessages.push(skill.occupationPointError);
      }
    }
    const pointErrors = document.querySelector("#point-errors");
    if (pointErrors) pointErrors.textContent = poolMessages.join("\n");
    document.querySelector("#point-status")?.classList.toggle("point-status-error", poolMessages.length > 0);
    const status = document.querySelector("#point-buy-status");
    const endButton = document.querySelector("#end-point-buy");
    if (status && endButton) {
      if (!pointBuy) {
        status.textContent = "";
        endButton.hidden = true;
      } else if (!derived?.pointBuy?.ok) {
        status.textContent = derived?.pointBuy?.message || "";
        endButton.hidden = false;
      } else {
        const usage = derived.pointBuy;
        status.textContent = `已用 ${usage.used} / ${usage.total}，剩余 ${usage.remaining}`;
        endButton.hidden = false;
      }
    }
    const rows = [...form.querySelectorAll(".skill-row")];
    (derived?.skills || []).forEach((skill, index) => {
      const row = rows[index];
      if (!row) return;
      const base = row.querySelector("[data-field='base']");
      if (base && typeof skill.expectedBase === "number") {
        base.value = String(skill.expectedBase);
        base.readOnly = true;
      } else if (base) {
        base.readOnly = false;
      }
      row.dataset.mythos = skill.mythos === true ? "true" : "false";
      const occupationPoints = row.querySelector("[data-field='occupationPoints']");
      const interestPoints = row.querySelector("[data-field='interestPoints']");
      if (skill.mythos) {
        if (occupationPoints) occupationPoints.value = "0";
        if (interestPoints) interestPoints.value = "0";
      }
      const rating = row.querySelector("[data-rating]");
      if (rating) {
        rating.textContent = skill.rating
          ? `成功率：${skill.rating.regular}%  困难 ${skill.rating.hard} / 极难 ${skill.rating.extreme}`
          : "";
      }
      const mythos = row.querySelector("[data-mythos]");
      if (mythos) mythos.textContent = skill.mythosError || "";
      const creditLine = row.querySelector("[data-credit-range]");
      const credit = derived?.credit;
      const creditName = isCreditName(fieldValue(row, "name"));
      if (creditLine) {
        if (creditName && Number.isInteger(credit?.min) && Number.isInteger(credit?.max)) {
          creditLine.hidden = false;
          creditLine.textContent = `信用评级（${credit.min}～${credit.max}）`;
        } else {
          creditLine.hidden = true;
          creditLine.textContent = "";
        }
      }
      const rowError = row.querySelector("[data-row-error]");
      if (rowError) {
        if (skill.occupationPointError) rowError.textContent = skill.occupationPointError;
        else if (creditName && credit?.error) rowError.textContent = credit.error;
        else if (
          rowError.textContent === "非本职技能不能分配职业点"
          || rowError.textContent.startsWith("信用评级必须在")
          || rowError.textContent === "选定职业后必须有一条信用评级"
          || rowError.textContent === "信用评级只能有一条"
        ) {
          rowError.textContent = "";
        }
      }
    });
    if (derived?.credit?.error === "选定职业后必须有一条信用评级" && ensureCreditRow()) schedulePreview();
    applySkillView();
    const illegalPoints = markPointErrors();
    saveBlocked = poolMessages.length > 0 || illegalPoints;
    const submit = form.querySelector("button[type='submit']");
    if (submit) submit.disabled = saveBlocked;
  }

  async function refreshPreview() {
    syncSpecialtyLists();
    const response = await fetch("/api/characters/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(collect()),
    });
    if (!response.ok) return;
    const body = await response.json().catch(() => ({}));
    renderDerived(body.derived);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      refreshPreview().catch(() => {});
    }, 200);
  }

  function appendRow(target, className, fields, removeAttribute) {
    const row = document.createElement("tr");
    row.className = className;
    for (const field of fields) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.dataset.field = field.name;
      if (field.integer) input.dataset.integer = "true";
      input.value = field.value ?? "";
      cell.append(input);
      row.append(cell);
    }
    const action = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset[removeAttribute] = "true";
    button.textContent = "删除";
    action.append(button);
    row.append(action);
    target.append(row);
  }

  function createStepper(label, field, value, { hidden = false, disabled = false } = {}) {
    const wrap = document.createElement("label");
    wrap.className = "stepper";
    wrap.dataset.pool = field;
    wrap.hidden = hidden;
    wrap.append(document.createTextNode(`${label} `));
    const minus = document.createElement("button");
    minus.type = "button";
    minus.dataset.step = "-1";
    minus.textContent = "-";
    minus.disabled = disabled;
    const input = document.createElement("input");
    input.dataset.field = field;
    input.dataset.integer = "true";
    input.inputMode = "numeric";
    input.value = value;
    input.disabled = disabled;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.dataset.step = "1";
    plus.textContent = "+";
    plus.disabled = disabled;
    wrap.append(minus, input, plus);
    return wrap;
  }

  function createSkillArticle({ name = "", specialty = "", base = "", growth = "0", occupationPoints = "0", interestPoints = "0" } = {}) {
    const mythos = isMythosName(name);
    const article = document.createElement("article");
    article.className = "skill-row";
    article.dataset.occupational = "false";
    article.dataset.mythos = mythos ? "true" : "false";
    const header = document.createElement("header");
    header.className = "skill-head";
    const nameInput = document.createElement("input");
    nameInput.dataset.field = "name";
    nameInput.setAttribute("list", "skill-names");
    nameInput.value = name;
    const specialtyInput = document.createElement("input");
    specialtyInput.dataset.field = "specialty";
    specialtyInput.value = specialty;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeSkill = "true";
    remove.textContent = "删除";
    header.append(nameInput, specialtyInput, remove);
    const title = document.createElement("p");
    title.className = "skill-title";
    const rating = document.createElement("p");
    rating.dataset.rating = "true";
    const credit = document.createElement("p");
    credit.dataset.creditRange = "true";
    credit.hidden = true;
    const mythosLine = document.createElement("p");
    mythosLine.dataset.mythos = "true";
    const baseLine = document.createElement("label");
    baseLine.className = "base-line";
    baseLine.append(document.createTextNode("基础值 "));
    const baseInput = document.createElement("input");
    baseInput.dataset.field = "base";
    baseInput.dataset.integer = "true";
    baseInput.inputMode = "numeric";
    baseInput.value = base;
    baseLine.append(baseInput);
    const error = document.createElement("p");
    error.className = "errors";
    error.dataset.rowError = "true";
    article.append(
      header,
      title,
      rating,
      credit,
      mythosLine,
      baseLine,
      createStepper("职业点", "occupationPoints", occupationPoints, { hidden: mythos, disabled: mythos }),
      createStepper("兴趣点", "interestPoints", interestPoints, { hidden: true, disabled: mythos }),
      createStepper("成长", "growth", growth, { hidden: true }),
      error,
    );
    return article;
  }

  function ensureSkillRow(name, specialty = "") {
    const key = skillIdentity(name, specialty);
    const existing = [...form.querySelectorAll(".skill-row")].find((row) => {
      return skillIdentity(fieldValue(row, "name"), fieldValue(row, "specialty")) === key;
    });
    if (existing) return existing;
    const row = createSkillArticle({ name, specialty });
    document.querySelector("#skill-rows")?.append(row);
    return row;
  }

  function ensureOccupationalChip(name) {
    const trimmed = name.trim();
    if (!trimmed || isMythosName(trimmed)) return;
    const exists = occupationalNames().includes(trimmed);
    if (exists) return;
    document.querySelector("#occupational-skills")?.append(occupationalSkillRow(trimmed));
  }

  function removeOccupationalChipIfUnused(name) {
    const still = [...form.querySelectorAll(".skill-row")].some((row) => fieldValue(row, "name").trim() === name);
    if (still) return;
    for (const input of form.querySelectorAll("[data-occupational-skill]")) {
      if (input.value.trim() === name) input.closest(".occupational-row")?.remove();
    }
  }

  function stepPoint(button) {
    const row = button.closest(".skill-row");
    const input = button.closest(".stepper")?.querySelector("[data-field]");
    const error = row?.querySelector("[data-row-error]");
    if (!input || input.disabled) return;
    if (!/^\d+$/.test(input.value.trim())) {
      if (error) error.textContent = "点数必须是非负整数";
      return;
    }
    const next = Number(input.value.trim()) + Number(button.dataset.step);
    input.value = String(next < 0 ? 0 : next);
    if (error) error.textContent = "";
    refreshPreview().catch(() => {});
  }

  function optionValues(id) {
    return [...document.querySelectorAll(`#${id} option`)].map((option) => option.value).filter((value) => value !== "");
  }

  function fillSkillPicker() {
    const select = document.querySelector("#skill-picker-list");
    if (!select) return;
    const query = document.querySelector("#skill-search")?.value.trim().toLowerCase() ?? "";
    const current = select.value;
    select.replaceChildren();
    for (const name of optionValues("skill-names")) {
      if (query && !name.toLowerCase().includes(query)) continue;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function syncPickerSpecialty() {
    const specialty = document.querySelector("#skill-picker-specialty");
    if (!specialty) return;
    const list = specialtyList(document.querySelector("#skill-picker-list")?.value || "");
    if (list) specialty.setAttribute("list", list);
    else specialty.removeAttribute("list");
  }

  function occupationalSkillRow(name) {
    const row = document.createElement("div");
    row.className = "occupational-row";
    const input = document.createElement("input");
    input.dataset.occupationalSkill = "true";
    input.setAttribute("list", "skill-names");
    input.value = name;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.removeRow = "true";
    button.textContent = "删除";
    row.append(input, button);
    return row;
  }

  function setOccupationalSkills(names) {
    const box = document.querySelector("#occupational-skills");
    if (!box) return;
    box.replaceChildren();
    for (const name of names) box.append(occupationalSkillRow(name));
  }

  document.querySelector("#occupation-choice")?.addEventListener("change", () => {
    const id = document.querySelector("#occupation-choice").value;
    const found = occupations.find((item) => item.id === id);
    const text = document.querySelector("#occupation-skill-text");
    if (!found) {
      if (text) text.textContent = "";
      return;
    }
    form.querySelector("[data-occupation='id']").value = found.id;
    form.querySelector("[data-occupation='name']").value = found.name;
    form.querySelector("[data-occupation='pointFormula']").value = found.pointFormula;
    form.querySelector("[data-occupation='creditMin']").value = found.creditMin == null ? "" : String(found.creditMin);
    form.querySelector("[data-occupation='creditMax']").value = found.creditMax == null ? "" : String(found.creditMax);
    const names = Array.isArray(found.occupationalSkills) ? found.occupationalSkills : [];
    setOccupationalSkills(names);
    if (text) text.textContent = found.skillText || "";
    for (const name of names) ensureSkillRow(name);
    ensureSkillRow("信用评级");
    applySkillView();
    schedulePreview();
  });

  document.querySelector("#add-occupational-skill")?.addEventListener("click", () => {
    document.querySelector("#occupational-skills")?.append(occupationalSkillRow(""));
    schedulePreview();
  });

  function weaponRowFields(weapon = {}) {
    return WEAPON_ROW_FIELDS.map((name) => ({
      name,
      integer: name === "quantity",
      value: weapon[name] == null ? "" : String(weapon[name]),
    }));
  }

  function fillWeaponChoices() {
    const category = document.querySelector("#weapon-category")?.value ?? "";
    const select = document.querySelector("#weapon-choice");
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "请选择";
    select.append(blank);
    weapons.forEach((weapon, index) => {
      if (category && weapon.type !== category) return;
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = weapon.name;
      select.append(option);
    });
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }

  document.querySelector("#weapon-category")?.addEventListener("change", fillWeaponChoices);

  document.querySelector("#add-catalog-weapon")?.addEventListener("click", () => {
    const raw = document.querySelector("#weapon-choice")?.value ?? "";
    if (!/^\d+$/.test(raw)) return;
    const weapon = weapons[Number(raw)];
    if (!weapon) return;
    appendRow(document.querySelector("#weapon-rows"), "weapon-row", weaponRowFields(weapon), "removeRow");
  });

  document.querySelector("#add-weapon")?.addEventListener("click", () => {
    appendRow(document.querySelector("#weapon-rows"), "weapon-row", weaponRowFields(), "removeRow");
  });

  document.querySelector("#add-item")?.addEventListener("click", () => {
    appendRow(document.querySelector("#item-rows"), "item-row", [{ name: "name" }], "removeRow");
  });

  document.querySelector("#add-spell")?.addEventListener("click", () => {
    appendRow(document.querySelector("#spell-rows"), "spell-row", [{ name: "name" }], "removeRow");
  });

  form.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !form.contains(button)) return;
    if (button.dataset.step != null) {
      event.preventDefault();
      stepPoint(button);
      return;
    }
    if (button.dataset.removeSkill != null) {
      const row = button.closest(".skill-row");
      const name = row ? fieldValue(row, "name").trim() : "";
      const locked = Boolean(row) && isCreditName(name) && occupationSelectedInForm() && creditRows().length <= 1;
      if (!locked) {
        row?.remove();
        if (name) removeOccupationalChipIfUnused(name);
        ensureCreditRow();
      }
    }
    if (button.dataset.removeRow != null) button.closest("tr, .occupational-row")?.remove();
    if (button.dataset.removeSkill != null || button.dataset.removeRow != null) {
      applySkillView();
      schedulePreview();
    }
  });

  for (const button of document.querySelectorAll("[data-skill-view]")) {
    button.addEventListener("click", () => setSkillView(button.dataset.skillView));
  }
  document.querySelector("#mix-points")?.addEventListener("change", (event) => {
    mixPoints = event.currentTarget.checked;
    applyPointControls();
  });
  document.querySelector("#show-growth")?.addEventListener("change", (event) => {
    showGrowth = event.currentTarget.checked;
    applyPointControls();
  });
  document.querySelector("#choose-skill")?.addEventListener("click", () => {
    const error = document.querySelector("#skill-picker-error");
    if (error) error.textContent = "";
    const search = document.querySelector("#skill-search");
    if (search) search.value = "";
    const specialty = document.querySelector("#skill-picker-specialty");
    if (specialty) specialty.value = "";
    const custom = document.querySelector("#skill-picker-custom");
    if (custom) custom.value = "";
    fillSkillPicker();
    syncPickerSpecialty();
    document.querySelector("#skill-picker")?.showModal();
  });
  document.querySelector("#skill-search")?.addEventListener("input", () => {
    fillSkillPicker();
    syncPickerSpecialty();
  });
  document.querySelector("#skill-picker-list")?.addEventListener("change", syncPickerSpecialty);
  document.querySelector("#skill-picker-close")?.addEventListener("click", () => {
    document.querySelector("#skill-picker")?.close();
  });
  document.querySelector("#skill-picker-add")?.addEventListener("click", () => {
    const error = document.querySelector("#skill-picker-error");
    const custom = document.querySelector("#skill-picker-custom")?.value.trim() ?? "";
    const selected = document.querySelector("#skill-picker-list")?.value ?? "";
    const name = custom || selected;
    const specialty = document.querySelector("#skill-picker-specialty")?.value.trim() ?? "";
    if (!name) {
      if (error) error.textContent = "请选择技能或填写自定义技能名";
      return;
    }
    const key = skillIdentity(name, specialty);
    const duplicate = [...form.querySelectorAll(".skill-row")].some((row) => {
      return skillIdentity(fieldValue(row, "name"), fieldValue(row, "specialty")) === key;
    });
    if (duplicate) {
      if (error) error.textContent = "这个技能已经在列表里";
      return;
    }
    ensureSkillRow(name, specialty);
    if (skillView === "occupation" && name !== "信用评级") ensureOccupationalChip(name);
    if (isMythosName(name) && skillView === "occupation") setSkillView("interest");
    else applySkillView();
    document.querySelector("#skill-picker")?.close();
    refreshPreview().catch(() => {});
  });

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.closest?.(".stepper")) {
      const error = field.closest(".skill-row")?.querySelector("[data-row-error]");
      if (error) error.textContent = /^\d+$/.test(field.value.trim()) ? "" : "点数必须是非负整数";
    }
    if (field.closest?.(".skill-row") || field.matches?.("[data-occupational-skill]")) applySkillView();
    schedulePreview();
  });
  form.addEventListener("change", (event) => {
    const chip = event.target.matches?.("[data-occupational-skill]") ? event.target : null;
    if (chip && chip.value.trim()) ensureSkillRow(chip.value.trim());
    if (chip || event.target.closest?.(".skill-row")) applySkillView();
    schedulePreview();
  });

  form.querySelector("#armor-enabled")?.addEventListener("change", () => {
    const fields = form.querySelector("#armor-fields");
    if (fields) fields.hidden = !form.querySelector("#armor-enabled").checked;
  });

  const rollsDialog = document.querySelector("#rolls-dialog");
  document.querySelector("#open-rolls")?.addEventListener("click", () => {
    document.querySelector("#roll-error").textContent = "";
    document.querySelector("#roll-results").replaceChildren();
    rollsDialog?.showModal();
  });
  document.querySelector("#close-rolls")?.addEventListener("click", () => rollsDialog?.close());

  document.querySelector("#start-rolls")?.addEventListener("click", async () => {
    const error = document.querySelector("#roll-error");
    const count = integerOrRaw(document.querySelector("#roll-count").value.trim());
    const response = await fetch("/api/characteristics/rolls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      error.textContent = body.message || "骰点失败";
      return;
    }
    error.textContent = "";
    const results = document.querySelector("#roll-results");
    results.replaceChildren();
    const keys = [
      ["str", "力量"],
      ["dex", "敏捷"],
      ["pow", "意志"],
      ["con", "体质"],
      ["app", "外貌"],
      ["edu", "教育"],
      ["siz", "体型"],
      ["int", "智力"],
    ];
    for (const set of body.sets || []) {
      const box = document.createElement("section");
      box.className = "roll-set";
      const text = document.createElement("p");
      const derived = set.derived || {};
      const luckLine = typeof set.luck === "number" ? `幸运：${set.luck}` : `幸运：${set.luckNote}`;
      const withLuck = typeof set.totalWithLuck === "number" ? String(set.totalWithLuck) : "—";
      const statLine = (slice) => slice.map(([key, label]) => `${label}：${set[key]}`).join("  ");
      text.textContent = [
        statLine(keys.slice(0, 4)),
        statLine(keys.slice(4)),
        luckLine,
        `总值：${set.total}    总值含运：${withLuck}`,
        `生命值：${textOrDash(derived.hp)}  理智：${textOrDash(derived.initialSan)}  魔力：${textOrDash(derived.mp)}  移动：${textOrDash(derived.mov)}（${derived.movNote || ""}）`,
        `体格：${textOrDash(derived.build)}  伤害加值：${textOrDash(derived.damageBonus)}  重伤线：${textOrDash(derived.majorWound)}`,
      ].join("\n");
      const use = document.createElement("button");
      use.type = "button";
      use.textContent = "使用此方案";
      use.addEventListener("click", () => {
        for (const [key] of keys) {
          const input = form.querySelector(`[data-section="characteristics"][name="${key}"]`);
          if (input) input.value = String(set[key]);
        }
        if (typeof set.luck === "number") {
          const luck = form.querySelector(`[data-section="characteristics"][name="luck"]`);
          if (luck) luck.value = String(set.luck);
        }
        if (typeof set.derived?.initialSan === "number") {
          const initialSan = form.querySelector("#initialSan");
          if (initialSan) initialSan.value = String(set.derived.initialSan);
        }
        rollsDialog?.close();
        results.replaceChildren();
        refreshPreview().catch(() => {});
      });
      box.append(text, use);
      results.append(box);
    }
  });

  const pointBuyDialog = document.querySelector("#point-buy-dialog");
  document.querySelector("#open-point-buy")?.addEventListener("click", () => {
    document.querySelector("#point-buy-error").textContent = "";
    document.querySelector("#point-buy-total").value = "";
    document.querySelector("#point-buy-luck").checked = false;
    pointBuyDialog?.showModal();
  });
  document.querySelector("#point-buy-cancel")?.addEventListener("click", () => pointBuyDialog?.close());
  document.querySelector("#point-buy-confirm")?.addEventListener("click", () => {
    const raw = document.querySelector("#point-buy-total").value.trim();
    const error = document.querySelector("#point-buy-error");
    if (!/^[1-9]\d*$/.test(raw)) {
      error.textContent = "购点总额必须是正整数";
      return;
    }
    pointBuy = {
      total: Number(raw),
      includeLuck: document.querySelector("#point-buy-luck").checked,
    };
    pointBuyDialog?.close();
    refreshPreview().catch(() => {});
  });
  document.querySelector("#end-point-buy")?.addEventListener("click", () => {
    pointBuy = null;
    refreshPreview().catch(() => {});
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errors = document.querySelector("#errors");
    try {
      await refreshPreview();
    } catch {
      errors.textContent = "派生值暂时算不出来";
      return;
    }
    if (saveBlocked) {
      const rowError = [...form.querySelectorAll("[data-row-error]")].map((item) => item.textContent.trim()).filter(Boolean).join("\n");
      errors.textContent = [document.querySelector("#point-errors")?.textContent, rowError].filter(Boolean).join("\n") || "点数不合法，不能保存";
      return;
    }
    const response = await fetch(form.dataset.url, {
      method: form.dataset.method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(collect()),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const lines = Array.isArray(body.errors) ? body.errors.map((item) => item.path + "：" + item.message) : [];
      errors.textContent = lines.join("\n") || body.message || "保存失败";
      return;
    }
    location.href = "/investigators/" + encodeURIComponent(body.id) + "/edit?saved=1";
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((item) => {
        item.setAttribute("aria-selected", item === button ? "true" : "false");
      });
      document.querySelectorAll("[data-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== button.dataset.tab;
      });
      button.scrollIntoView({ inline: "nearest", block: "nearest" });
    });
  });

  ensureCreditRow();
  applySkillView();
  refreshPreview().catch(() => {});
}
