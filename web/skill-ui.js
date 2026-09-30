function setupOccupationPicker(selectOccupation) {
  const dialog = document.getElementById('occupation-picker');
  const search = document.getElementById('occupation-search');
  const open = document.getElementById('choose-occupation');
  const entries = [...dialog.querySelectorAll('[data-occupation-result]')];
  function filter() {
    const query = search.value.trim().toLocaleLowerCase('zh-CN');
    for (const entry of entries) entry.hidden = !entry.dataset.search.includes(query);
    const count = entries.filter(entry => !entry.hidden).length;
    document.getElementById('occupation-result-count').textContent = '共 ' + count + ' 个职业';
    document.getElementById('occupation-empty').hidden = count !== 0;
  }
  open.addEventListener('click', () => { search.value = ''; filter(); dialog.showModal(); search.focus(); });
  search.addEventListener('input', filter);
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); entries.find(entry => !entry.hidden)?.querySelector('button').focus(); }
  });
  document.getElementById('occupation-picker-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => open.focus());
  dialog.addEventListener('click', event => {
    const button = event.target.closest('[data-occupation-choice]');
    if (!button) return;
    selectOccupation(button.dataset.occupationChoice);
    dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); return; }
    const current = event.target.closest('[data-occupation-choice]');
    if (!current || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const buttons = entries.filter(entry => !entry.hidden).map(entry => entry.querySelector('button'));
    const index = buttons.indexOf(current);
    buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length].focus();
  });
}

function renderPointPool(key, pool) {
  const card = document.querySelector('[data-point-pool="' + key + '"]');
  const known = typeof pool?.total === 'number' && typeof pool?.spent === 'number';
  card.querySelector('[data-pool-usage]').textContent = known ? pool.spent + ' / ' + pool.total : '无';
  const progress = card.querySelector('progress');
  progress.max = known ? Math.max(1, pool.total) : 1;
  progress.value = known ? Math.max(0, pool.spent) : 0;
  const remaining = card.querySelector('[data-pool-remaining]');
  remaining.textContent = known ? '剩余 ' + pool.remaining : pool?.message || '填写属性后计算';
  card.classList.toggle('pool-overdrawn', typeof pool?.remaining === 'number' && pool.remaining < 0);
  progress.setAttribute('aria-valuetext', known ? '已用 ' + pool.spent + '，总额 ' + pool.total + '，剩余 ' + pool.remaining : remaining.textContent);
}

function revealSkillError(form, row, setSkillView) {
  document.getElementById('sheet-skill-search').value = '';
  setSkillView(row?.dataset.occupational === 'true' ? 'occupation' : 'interest');
  if (!row) { document.getElementById('occupation-edit').open = true; form.querySelector('[data-occupation="creditMin"]').focus(); return; }
  // Show every editable pool so the corrective field is never hidden by a view toggle.
  for (const id of ['mix-points', 'show-growth']) {
    const toggle = document.getElementById(id);
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
  }
  row.tabIndex = -1;
  row.focus({ preventScroll: true });
  row.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
