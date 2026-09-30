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
    const occupational = [...form.querySelectorAll("[data-occupational-skill]")].map((input) => input.value.trim()).filter(Boolean);
    const pool = derived?.occupationPoints;
    const occupationLine = pool?.message
      ? pool.message
      : pool?.total != null
        ? `职业点总额 ${pool.total}，已用 ${textOrDash(pool.spent)}，剩余 ${textOrDash(pool.remaining)}`
        : "";
    const summary = document.querySelector("#occupation-summary");
    if (summary) {
      summary.textContent = [
        `职业名：${form.querySelector("[data-occupation='name']").value.trim() || "未填写"}`,
        `职业点公式：${formulaLabel}`,
        `信用评级：${form.querySelector("[data-occupation='creditMin']").value}–${form.querySelector("[data-occupation='creditMax']").value}`,
        `本职技能：${occupational.join("、") || "未填写"}`,
        occupationLine,
      ].filter(Boolean).join("\n");
    }
    const pools = document.querySelector("#point-pools");
    if (pools) {
      const lines = [];
      if (occupationLine) lines.push(occupationLine);
      const interest = derived?.interestPoints;
      if (interest?.total != null) {
        lines.push(`兴趣点总额 ${interest.total}，已用 ${textOrDash(interest.spent)}，剩余 ${textOrDash(interest.remaining)}`);
      }
      pools.textContent = lines.join("\n");
    }
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
      const occupationPoints = row.querySelector("[data-field='occupationPoints']");
      const interestPoints = row.querySelector("[data-field='interestPoints']");
      if (occupationPoints && interestPoints) {
        occupationPoints.readOnly = skill.mythos === true;
        interestPoints.readOnly = skill.mythos === true;
        if (skill.mythos) {
          occupationPoints.value = "0";
          interestPoints.value = "0";
        }
      }
      const rating = row.querySelector("[data-rating]");
      if (rating) {
        rating.textContent = skill.rating
          ? `${skill.rating.regular} / ${skill.rating.hard} / ${skill.rating.extreme}`
          : "";
      }
      const mythos = row.querySelector("[data-mythos]");
      if (mythos) mythos.textContent = skill.mythosError || "";
    });
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

  document.querySelector("#add-skill")?.addEventListener("click", () => {
    const row = document.createElement("tr");
    row.className = "skill-row";
    for (const field of [
      ["name", ""],
      ["specialty", ""],
      ["base", ""],
      ["growth", "0"],
      ["occupationPoints", "0"],
      ["interestPoints", "0"],
    ]) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.dataset.field = field[0];
      if (field[0] !== "name" && field[0] !== "specialty") input.dataset.integer = "true";
      if (field[0] === "name") input.setAttribute("list", "skill-names");
      input.value = field[1];
      cell.append(input);
      row.append(cell);
    }
    const rating = document.createElement("td");
    rating.dataset.rating = "true";
    const mythos = document.createElement("td");
    mythos.dataset.mythos = "true";
    const action = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.removeSkill = "true";
    button.textContent = "删除";
    action.append(button);
    row.append(rating, mythos, action);
    document.querySelector("#skill-rows")?.append(row);
    schedulePreview();
  });

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
    setOccupationalSkills(Array.isArray(found.occupationalSkills) ? found.occupationalSkills : []);
    if (text) text.textContent = found.skillText || "";
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
    if (!button) return;
    if (button.dataset.removeSkill != null) button.closest(".skill-row")?.remove();
    if (button.dataset.removeRow != null) button.closest("tr, .occupational-row")?.remove();
    if (button.dataset.removeSkill != null || button.dataset.removeRow != null) schedulePreview();
  });

  form.addEventListener("input", schedulePreview);
  form.addEventListener("change", schedulePreview);

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

  refreshPreview().catch(() => {});
}
