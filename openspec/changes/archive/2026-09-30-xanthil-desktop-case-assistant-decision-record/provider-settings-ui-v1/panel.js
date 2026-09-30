(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { saved: false, invalid: false, editing: true, tested: false, testing: false, generation: 0, message: '', tone: '', opener: null, lastResult: 'none' };
  const busy = () => $('busyTask').checked;
  const locked = () => $('storageResult').value === 'locked';
  const available = () => state.saved && !state.invalid && !locked();
  const show = (id, yes) => $(id).classList.toggle('hidden', !yes);
  function feedback(message = '', tone = '') { state.message = message; state.tone = tone; render(); }
  function clearInput() { $('apiKey').value = ''; $('apiKey').type = 'password'; $('toggleKey').textContent = '显示'; $('toggleKey').setAttribute('aria-label', '显示输入的 API Key'); }
  function cancelPending() { state.generation++; state.testing = false; state.tested = false; }
  function render() {
    const ready = available(), status = locked() && state.saved ? '钥匙串不可用' : state.invalid ? '凭据失效' : state.saved ? '模型已配置' : '模型未配置';
    $('globalStatus').textContent = status;
    $('globalSettings').setAttribute('aria-label', `模型接入，${status}`);
    $('globalSettings').querySelector('.status-dot').className = `status-dot ${ready ? 'green' : state.invalid ? 'red' : 'amber'}`;
    $('railProvider').textContent = ready ? 'Xiaomi Token Plan / MiMo 2.6 Pro' : status;
    $('assistantTitle').textContent = ready ? '模型已接入，请确认本次任务' : '先配置模型，再开始讨论';
    $('assistantCopy').textContent = ready ? '核对逐字任务文本、Case 数据子集与所选历史后，再开始本次任务。' : '接入 Xiaomi Token Plan 后，你可以核对本次任务的外发内容并开始。';
    $('assistantCTA').textContent = $('railCTA').textContent = ready ? '查看任务授权' : state.saved ? '检查模型接入' : '配置模型';
    $('composerStatus').textContent = `${ready ? 'Xiaomi Token Plan · MiMo 2.6 Pro' : status} · 任务内容尚未发送`;
    $('panelBadge').textContent = state.testing ? '测试中' : locked() ? '暂不可用' : state.invalid ? '凭据失效' : state.saved ? '已启用' : '未配置';
    $('panelBadge').className = `state-badge ${ready ? 'green' : state.invalid ? 'red' : 'amber'}`;
    $('activeNotice').textContent = busy() ? '任务正在运行或等待回复。请先停止任务，再测试、更换或删除 Key。' : locked() ? '无法访问系统钥匙串。请解锁或允许 Xanthil 访问后重试；不会改用明文保存。' : state.invalid && !state.editing ? '已保存的 Key 未通过验证。请检查账户后重新测试，或更换 Key。' : '';
    show('activeNotice', !!$('activeNotice').textContent);
    show('keyEditor', state.editing); show('savedKey', state.saved && !state.editing);
    $('feedback').textContent = state.message; $('feedback').className = `feedback ${state.tone}${state.message ? '' : ' hidden'}`;
    const blocked = busy() || locked();
    $('testConnection').disabled = blocked || state.testing || (state.editing && !$('apiKey').value.trim());
    $('testConnection').textContent = state.testing ? '正在测试…' : '测试连接';
    show('cancelTest', state.testing); $('testMeta').textContent = state.saved && !state.editing ? ({ success: '上次测试通过 · 重开不会自动测试', invalid: '最近测试：凭据失效', network: '最近测试：网络不可用 · 配置保留', quota: '最近测试：额度不足 · 配置保留', timeout: '最近测试：超时 · 配置保留', cancelled: '最近测试已取消 · 配置保留', none: '已保存配置 · 尚未测试' }[state.lastResult]) : '不会自动测试或重试';
    $('saveKey').disabled = blocked || state.testing || !state.tested;
    show('saveKey', state.editing); show('done', !state.editing); show('cancelEdit', state.editing);
    show('deleteKey', state.saved); $('deleteKey').disabled = blocked || state.testing;
    $('replaceKey').disabled = blocked || state.testing; $('apiKey').disabled = blocked || state.testing; $('fillDemo').disabled = blocked || state.testing;
  }
  function openSettings(event) {
    state.opener = event?.currentTarget ?? $('globalSettings'); cancelPending(); clearInput(); state.editing = !state.saved; state.message = ''; state.tone = ''; render(); $('settings').showModal();
    if (state.editing && !busy() && !locked()) $('apiKey').focus();
  }
  function closeSettings() { cancelPending(); clearInput(); state.message = ''; $('settings').close(); render(); state.opener?.focus(); }
  $('globalSettings').addEventListener('click', openSettings);
  for (const id of ['assistantCTA', 'railCTA']) $(id).addEventListener('click', e => available() ? $('taskDialog').showModal() : openSettings(e));
  $('closeTask').onclick = () => $('taskDialog').close();
  for (const id of ['closeSettings', 'done']) $(id).onclick = closeSettings;
  $('settings').addEventListener('cancel', e => { e.preventDefault(); closeSettings(); });
  $('cancelEdit').onclick = () => { if (state.saved) { cancelPending(); clearInput(); state.editing = false; feedback(); } else closeSettings(); };
  $('replaceKey').onclick = () => { state.editing = true; state.tested = false; clearInput(); feedback('原 Key 将保留到新 Key 测试通过并成功保存。', 'pending'); $('apiKey').focus(); };
  $('apiKey').oninput = () => { state.tested = false; state.message = ''; render(); };
  $('fillDemo').onclick = () => { $('apiKey').value = 'demo-ui-only-not-a-real-key'; state.tested = false; state.message = ''; render(); };
  $('toggleKey').onclick = () => { const visible = $('apiKey').type === 'password'; $('apiKey').type = visible ? 'text' : 'password'; $('toggleKey').textContent = visible ? '隐藏' : '显示'; $('toggleKey').setAttribute('aria-label', `${visible ? '隐藏' : '显示'}输入的 API Key`); };
  $('cancelTest').onclick = () => { if (!state.editing) state.lastResult = 'cancelled'; cancelPending(); clearInput(); feedback('测试已取消，配置未改变。已发出的请求可能已消耗少量额度。', 'pending'); };
  $('testConnection').onclick = () => {
    if ($('testConnection').disabled) return;
    const generation = ++state.generation, result = $('testResult').value, editing = state.editing;
    state.testing = true; state.tested = false; feedback('正在验证接入… 本原型只模拟结果，不会发起网络请求。', 'pending');
    setTimeout(() => {
      if (state.generation !== generation || !$('settings').open) return;
      state.testing = false;
      if (!editing) state.lastResult = result;
      if (result === 'success') { state.tested = editing; if (!editing) state.invalid = false; feedback(editing ? '连接测试通过，尚未保存。点击“保存并启用”后生效。' : '连接测试通过，可以在任务授权后使用。', 'success'); }
      else {
        if (!editing && result === 'invalid') state.invalid = true;
        const text = { invalid: 'Key 无效或无权使用此模型，请检查后重新测试。', network: '无法连接 Xiaomi，请检查网络后重新测试。', quota: 'Token Plan 额度不足，请检查 Xiaomi 账户后重新测试。', timeout: '连接测试超时，请稍后重新测试。' }[result];
        feedback(`${text}${state.saved && editing ? '原 Key 和当前配置保持不变。' : '未开始任何 Case 任务。'}`, 'error');
      }
    }, 900);
  };
  $('saveKey').onclick = () => {
    if ($('saveKey').disabled) return;
    if ($('storageResult').value !== 'success') { feedback(`保存失败，请检查系统钥匙串后重试。${state.saved ? '原 Key 保持不变。' : '新 Key 尚未启用。'}`, 'error'); return; }
    state.saved = true; state.invalid = false; state.lastResult = 'success'; state.editing = false; state.tested = false; clearInput(); feedback('已保存并启用。下次正常打开 Xanthil 可继续使用，任务不会自动开始。', 'success');
  };
  $('deleteKey').onclick = () => { if (!$('deleteKey').disabled) $('deleteDialog').showModal(); };
  $('cancelDelete').onclick = () => $('deleteDialog').close();
  $('confirmDelete').onclick = () => {
    $('deleteDialog').close();
    if (busy() || $('storageResult').value !== 'success') { feedback('删除未完成，已保存的 Key 保持不变。请检查钥匙串后重试。', 'error'); return; }
    cancelPending(); state.saved = false; state.invalid = false; state.editing = true; clearInput(); state.lastResult = 'none'; feedback('本机 Key 已删除。Case、对话和报告保持不变。', 'success'); $('apiKey').focus();
  };
  for (const button of document.querySelectorAll('[data-mode]')) button.onclick = () => { const mode = button.dataset.mode; show('quick', mode === 'quick'); show('professional', mode === 'professional'); for (const b of document.querySelectorAll('.mode-button')) b.classList.toggle('active', b.dataset.mode === mode); };
  $('scenesToggle').onclick = () => $('sceneMenu').classList.toggle('hidden');
  for (const id of ['testResult', 'storageResult', 'busyTask']) $(id).onchange = render;
  $('simulateReopen').onclick = () => { cancelPending(); clearInput(); state.editing = !state.saved; state.message = ''; $('sceneMenu').classList.add('hidden'); openSettings(); };
  $('simulateInvalid').onclick = () => { state.saved = true; state.invalid = true; state.lastResult = 'invalid'; $('sceneMenu').classList.add('hidden'); openSettings(); };
  $('resetDemo').onclick = () => { cancelPending(); state.saved = false; state.invalid = false; state.editing = true; clearInput(); $('testResult').value = 'success'; $('storageResult').value = 'success'; $('busyTask').checked = false; state.lastResult = 'none'; state.message = ''; render(); };
  render();
})();
