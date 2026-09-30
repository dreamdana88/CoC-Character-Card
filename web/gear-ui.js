// Equipment editing uses the same server-rendered templates as saved records.
function setupGear(form, weapons, onChange) {
  const dialog = document.getElementById("weapon-catalog-dialog");
  const search = document.getElementById("weapon-search");
  const category = document.getElementById("weapon-category");
  const opener = document.getElementById("open-weapon-catalog");
  const entries = [...dialog.querySelectorAll("[data-weapon-entry]")];
  function filter() {
    const query = search.value.trim().toLowerCase();
    for (const entry of entries) entry.hidden = Boolean((category.value && entry.dataset.category !== category.value) || (query && !entry.dataset.search.includes(query)));
    const count = entries.filter(entry => !entry.hidden).length;
    document.getElementById("weapon-result-count").textContent = `找到 ${count} 件武器`;
    document.getElementById("weapon-no-results").hidden = count > 0;
  }
  function updateEmpty() { document.getElementById("weapon-empty").hidden = Boolean(form.querySelector("#weapon-rows .weapon-row")); }
  function append(kind, values = {}, focus = true) {
    const row = document.getElementById(`${kind}-template`).content.firstElementChild.cloneNode(true);
    for (const field of row.querySelectorAll("[data-field]")) field.value = values[field.dataset.field] == null ? "" : String(values[field.dataset.field]);
    document.getElementById(`${kind}-rows`).append(row);
    updateEmpty();
    onChange();
    if (focus) row.querySelector("input").focus();
    return row;
  }
  opener.addEventListener("click", () => { document.getElementById("weapon-added").textContent = ""; filter(); dialog.showModal(); search.focus(); });
  document.getElementById("close-weapon-catalog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener.focus());
  dialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); dialog.close(); } });
  search.addEventListener("input", filter);
  category.addEventListener("change", filter);
  dialog.addEventListener("click", event => {
    const button = event.target.closest("[data-add-catalog-weapon]");
    if (!button) return;
    const weapon = weapons[Number(button.dataset.addCatalogWeapon)];
    if (!weapon) return;
    append("weapon", weapon, false);
    document.getElementById("weapon-added").textContent = `已加入：${weapon.name}。可继续查阅并加入其他武器。`;
  });
  document.getElementById("add-weapon").addEventListener("click", () => append("weapon"));
  form.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-row]");
    const row = button?.closest(".weapon-row, .named-record");
    if (!row) return;
    row.remove(); updateEmpty(); onChange();
  });
  filter(); updateEmpty();
}
