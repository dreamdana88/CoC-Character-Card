// Manual save with stable button geometry and short request-result feedback.
function createEditorState(form) {
  let saving = false;
  let succeeded = false;
  let feedbackTimer;
  const button = document.getElementById("save-card");
  function update() {
    button.disabled = saving;
    button.textContent = saving ? "正在保存…" : succeeded ? "✓ 保存成功" : "保存修改";
    button.dataset.state = saving ? "saving" : succeeded ? "success" : "ready";
    button.setAttribute("aria-busy", String(saving));
  }
  function resetFeedback() { clearTimeout(feedbackTimer); succeeded = false; }
  update();
  return {
    update, get saving() { return saving; },
    begin() { resetFeedback(); saving = true; update(); },
    success() { saving = false; succeeded = true; update(); feedbackTimer = setTimeout(() => { succeeded = false; update(); }, 1400); },
    failure() { resetFeedback(); saving = false; update(); },
  };
}
