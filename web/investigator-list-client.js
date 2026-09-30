const search = document.querySelector("#archive-search");
const sort = document.querySelector("#archive-sort");
const shelf = document.querySelector("#archive-cards");
const cards = [...document.querySelectorAll("[data-archive-card]")];
const collator = new Intl.Collator("zh-CN", { numeric: true });
function refreshArchive() {
  const query = search.value.trim().toLocaleLowerCase("zh-CN");
  const sorted = [...cards].sort((a, b) => sort.value === "name" ? collator.compare(a.dataset.name, b.dataset.name) : b.dataset.updated.localeCompare(a.dataset.updated));
  let count = 0;
  for (const card of sorted) {
    card.hidden = !card.dataset.search.includes(query);
    if (!card.hidden) count += 1;
    shelf.append(card);
  }
  document.querySelector("#archive-count").textContent = query ? `找到 ${count} / ${cards.length} 份档案` : `共 ${cards.length} 份档案`;
  document.querySelector("#no-search-results").hidden = cards.length === 0 || count !== 0;
}
search.addEventListener("input", refreshArchive);
sort.addEventListener("change", refreshArchive);
document.querySelector("#clear-search").addEventListener("click", () => { search.value = ""; refreshArchive(); search.focus(); });
const importDialog = document.querySelector("#import-dialog");
document.querySelector("#open-import").addEventListener("click", () => { document.querySelector("#import-errors").textContent = ""; importDialog.showModal(); });
document.querySelector("#close-import").addEventListener("click", () => importDialog.close());
document.querySelectorAll(".card-menu").forEach(menu => menu.addEventListener("toggle", () => { if (menu.open) document.querySelectorAll(".card-menu").forEach(other => { if (other !== menu) other.open = false; }); }));
document.addEventListener("click", event => { document.querySelectorAll(".card-menu[open]").forEach(menu => { if (!menu.contains(event.target)) menu.open = false; }); });
document.addEventListener("keydown", event => { if (event.key === "Escape") document.querySelectorAll(".card-menu[open]").forEach(menu => { menu.open = false; menu.querySelector("summary").focus(); }); });
