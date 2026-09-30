function navigateCardAction(url) {
  window.dispatchEvent(new Event("card-action-navigate"));
  location.href = url;
}

document.getElementById("logout")?.addEventListener("click", async () => {
  try {
    const response = await fetch("/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error(`登出失败（HTTP ${response.status}）`);
    navigateCardAction("/");
  } catch (error) { showCardActionError(error.message); }
});

function showCardActionError(message) {
  window.dispatchEvent(new Event("card-action-failed"));
  const output = document.getElementById("library-error");
  if (output) output.textContent = message;
  else alert(message);
}

document.querySelectorAll("[data-delete]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!confirm("删除这张调查员卡？此操作不能撤销。")) return;
    button.disabled = true;
    try {
      const response = await fetch("/api/characters/" + encodeURIComponent(button.dataset.delete), { method: "DELETE" });
      if (response.ok) navigateCardAction("/investigators");
      else {
        const body = await response.json();
        showCardActionError(body.message || `删除失败（HTTP ${response.status}）`);
      }
    } catch (error) { showCardActionError(`删除失败：${error.message}`); }
    finally { button.disabled = false; }
  });
});

document.querySelectorAll("[data-duplicate]").forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const response = await fetch("/api/characters/" + encodeURIComponent(button.dataset.duplicate) + "/duplicate", { method: "POST" });
      const body = await response.json();
      if (response.ok && body.id) navigateCardAction("/investigators/" + encodeURIComponent(body.id) + "/edit?copied=1");
      else showCardActionError(body.message || `复制失败（HTTP ${response.status}）`);
    } catch (error) { showCardActionError(`复制失败：${error.message}`); }
    finally { button.disabled = false; }
  });
});

document.getElementById("import-card")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const importForm = event.currentTarget;
  const errors = document.getElementById("import-errors");
  const file = importForm.querySelector("input[type=file]")?.files?.[0];
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
  const submit = importForm.querySelector("button[type=submit]");
  if (errors) errors.textContent = "";
  if (submit) submit.disabled = true;
  try {
  const response = await fetch("/api/characters/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (response.ok && body.id) {
    navigateCardAction("/investigators/" + encodeURIComponent(body.id) + "/edit");
    return;
  }
  const details = Array.isArray(body.errors) ? body.errors.map((error) => error.message).filter(Boolean).join("\n") : "";
  if (errors) errors.textContent = details || body.message || "导入失败";
  } catch (error) {
    if (errors) errors.textContent = `导入失败：${error.message}`;
  } finally { if (submit) submit.disabled = false; }
});

