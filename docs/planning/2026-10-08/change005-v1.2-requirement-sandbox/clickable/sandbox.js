/* 合成 UI 状态示例，不是生产 Runtime、分析或存储。 */
(() => {
  'use strict';
  const aims = {
    explain: { label: '解释近期会员效果变化', question: '同口径下，复购变化在哪里？', method: '先比较两期复购，再检查适用分组', evidence: '会员与订单、合法两期及同一复购口径', use: '解释已观察到的变化；不直接判断调整方案能带来多少收益' },
    priority: { label: '判断先调查权益还是触达', question: '现有证据更值得先查哪条解释？', method: '先核实变化，再对照权益使用／触达线索；不足处保留待查', evidence: '同口径复购，及获准权益使用／触达记录；只有订单不足以比较两条解释', use: '帮助确定调查重点，不把相关性当成因果或行动效果' }
  };
  function makeState(scene = 'complex') {
    const state = { scene, mode: 'quick', aim: scene === 'simple' ? 'explain' : 'priority', version: 1, reviewed: null, prior: [], status: 'draft', blocked: '', preview: false, expanded: false, tab: 'meaning', drawer: true, messages: [], notice: '', snapshot: null, saveState: 'unsaved', failSave: scene === 'savefail', title: '会员效果分析', question: '最近会员效果不好，先调整权益还是触达？', scope: '当前项目会员 · 8月与9月（样例）', ready: true, clarifyOnly: scene === 'saveonly', uncertainPurpose: !['simple', 'changed', 'stopped', 'unknown'].includes(scene) };
    if (scene === 'simple') { state.question = '按已经确定的复购口径比较8月和9月，只解释变化。'; state.reviewed = 1; }
    if (scene === 'missing') state.blocked = '缺少权益使用与触达记录。可先核实复购变化，但不能据此决定哪种原因成立。';
    if (scene === 'conflict') state.blocked = '你说的“会员”包含注册用户，当前资料说明只含付费会员。需要明确这次对象，不能自动替你选。';
    if (scene === 'changed') { state.prior = [{ version: 1, aim: 'explain', reviewed: true }]; state.version = 2; }
    if (scene === 'stopped') state.status = 'stopped';
    if (scene === 'unknown') state.status = 'unknown';
    if (scene === 'new-direct' || scene === 'new-clarify') { state.title = '新分析任务'; state.question = ''; state.ready = false; state.clarifyOnly = scene === 'new-clarify'; }
    if (scene === 'savefail') { state.saveState = 'failed'; state.notice = '自动保存失败（审核样例）。当前编辑仍保留，未标已保存；可重试，不开始分析。'; }
    return state;
  }
  function saveSnapshot(state) {
    if (state.failSave) { state.saveState = 'failed'; return; }
    state.snapshot = JSON.stringify({ aim: state.aim, version: state.version, reviewed: state.reviewed, prior: state.prior, question: state.question, title: state.title, ready: state.ready, blocked: state.blocked, uncertainPurpose: state.uncertainPurpose, clarifyOnly: state.clarifyOnly, scope: state.scope, messages: state.messages });
    state.saveState = 'saved';
  }
  function changeAim(state, aim) {
    if (!aims[aim]) return;
    state.uncertainPurpose = false;
    if (state.aim === aim) { state.notice = '调查目的没有实质变化，保留当前版本及仍有效的审阅。'; return; }
    state.prior.push({ version: state.version, aim: state.aim, reviewed: state.reviewed === state.version });
    state.aim = aim; state.version += 1; state.reviewed = null;
    state.notice = '调查目的、方法与证据需求已改变。旧版保留，当前框架需要整体审阅；未启动分析。';
  }
  function act(state, action) {
    if (action === 'explain' || action === 'priority') return changeAim(state, action);
    if (action === 'preview') { state.preview = !state.preview; return; }
    if (action === 'framework') { state.expanded = true; return; }
    if (action === 'back') { state.expanded = false; return; }
    if (action === 'noop') { state.notice = '仅调整表达：业务框架未变，版本与有效审阅保留。'; return; }
    if (action === 'save') {
      saveSnapshot(state);
      state.notice = state.saveState === 'failed' ? '保存失败样例：保留当前编辑，未标已保存。可重试，不开始分析。' : '框架已保存到本页内存，未开始分析。生产须持久保存并有实际回执；本页刷新会丢失。'; return;
    }
    if (action === 'retry-save') { state.failSave = false; saveSnapshot(state); state.notice = '重试保存到本页内存成功，当前编辑保留；没有开始分析。生产按实际服务回执反馈。'; return; }
    if (action === 'reopen') {
      if (!state.snapshot) { state.notice = '当前没有内存保存记录，请先保存框架。'; return; }
      const life = state.status; Object.assign(state, JSON.parse(state.snapshot)); state.status = life;
      state.notice = '已读回保存的样例框架；停止／待对账状态保留，不自动执行。'; return;
    }
    if (action === 'review') {
      if (!state.ready || state.blocked || state.uncertainPurpose) { state.notice = '当前仍有关键问题未明确。可以保存草稿，不能冒称完整框架已审阅。'; return; }
      state.reviewed = state.version; state.notice = '当前框架已整体审阅（内存样例）；这不创建证据、正式决定或执行授权。'; return;
    }
    if (action === 'start') {
      if (state.status === 'unknown') { state.notice = '结果待对账，不能发起可能重复的分析。生产先核实原任务状态。'; return; }
      if (!state.ready || state.blocked || state.uncertainPurpose || state.reviewed !== state.version) { state.notice = '暂不能开始：先处理关键缺口并整体审阅当前框架。没有发出运行请求。'; return; }
      state.status = 'admission-preview'; state.tab = 'execution'; state.drawer = true;
      state.notice = '仅展示接续位置：后台先核验现有授权与资格，再让当前方案进入实际执行。本页未发出请求、未计算或生成结果。'; return;
    }
    if (action === 'stop') { if (state.status !== 'unknown') state.status = 'stopped'; state.notice = '停止交互样例：无后台任务。生产须关闭新执行准入并保留已有调用记录；重开不自动运行。'; return; }
    if (action === 'narrow') { state.blocked = ''; changeAim(state, 'explain'); state.notice = '明确缩小为同口径复购比较，不回答权益或触达因果。生产仍须核验当前资料资格及授权。'; return; }
    if (action === 'resolve') { state.blocked = ''; state.scope = '付费会员 · 8月与9月（用户选择，样例）'; state.prior.push({ version: state.version, aim: state.aim, reviewed: state.reviewed === state.version }); state.version += 1; state.reviewed = null; state.notice = '按你的选择更新对象范围；这不是独立核验事实，需与实际资料核对。'; return; }
    if (action === 'materials') { state.tab = 'materials'; state.drawer = true; }
  }
  globalThis.SandboxDemo = { makeState, act, saveSnapshot, aims };
  if (typeof document === 'undefined') return;
  let state = makeState();
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const button = (action, label, primary = false) => `<button class="btn btn-sm ${primary ? 'btn-primary' : ''}" type="button" data-action="${action}">${label}</button>`;
  function preview() {
    return `<section class="sandbox-preview"><h3>预演不同答案 <span class="badge wait">尚未分析 · 待验证</span></h3><p>只说明答案会影响什么，不模拟概率、业务数字或经营收益。</p><div class="answer-branch"><h3>可能支持：变化与权益使用线索一致</h3><p>需要：同口径变化及可比较的权益使用记录。</p><p>影响：优先深入核对权益覆盖与使用情况；不能据此宣称权益调整有效。</p></div><div class="answer-branch"><h3>可能反证：变化并不集中在权益相关群体</h3><p>需要：适用分组和反向证据，排除口径／人群改变。</p><p>影响：降低这条解释的调查优先级，检查触达或其他线索；不等于已证明触达导致变化。</p></div><div class="answer-branch"><h3>可能证据不足：记录不足以区分两条解释</h3><p>需要：补充获准权益／触达记录，或明确缩小问题。</p><p>影响：先完成可支持的描述比较，保留未回答的问题；不能强行推荐调整权益或触达。</p></div><p class="source-note">以上为任务级模型候选的合成展示，不是 Finding／正式决定。选择重点不是选择真相。</p></section>`;
  }
  function framework() {
    const a = aims[state.aim];
    return `<article class="analysis-card"><div class="framework-heading"><h2>需求与分析框架</h2><span class="badge neutral">版本 ${state.version} · ${state.reviewed === state.version ? '已整体审阅（样例）' : '待审阅／可继续修改'}</span></div><div class="framework-summary"><div><h3>希望回答</h3><p>${a.question}</p></div><div><h3>用途</h3><p>${a.use}</p></div><div><h3>对象与比较</h3><p>${escape(state.scope)}</p></div><div><h3>指标口径</h3><p>两期会员复购，同一会员与订单口径；关键歧义由后台核对。</p></div><div><h3>调查方法</h3><p>${a.method}</p></div><div><h3>必要资料与证据</h3><p>${a.evidence}</p></div></div><p class="source-note">诉求：用户陈述 · 期间／目录：合成资料 · 权益／触达解释：模型待验证候选。尚无独立核验的分析事实。</p><p class="limit">即使框架已审阅，执行仍需有效授权、实际数据资格和受支持方法；不承诺因果或行动收益。</p><div class="card-actions">${button('explain', '重点：解释变化')}${button('priority', '重点：先调查哪一条')}${button('noop', '仅改措辞（审核示例）')}${button('review', '审阅当前框架')}</div>${state.prior.length ? `<section class="framework-history"><h3>变更影响与历史</h3>${state.prior.map(p => `<p>版本 ${p.version}：${aims[p.aim].label} · ${p.reviewed ? '旧审阅保留，不适用当前变化' : '原草稿保留'}</p>`).join('')}<p>当前版本 ${state.version}：${a.label}。只有变化涉及的分析计划／证据要求需要重新检查，历史成果不覆写。</p></section>` : ''}${state.preview ? preview() : ''}<div class="card-actions">${button('save', '保存框架，暂不分析')}${button('reopen', '读回已保存框架')}${button('start', '按此方案开始分析', true)}</div></article>`;
  }
  function renderDetail() {
    const a = aims[state.aim];
    const contents = {
      meaning: `<h3>业务理解与来源</h3><p>${a.label}</p><p>${escape(state.scope)}</p><p>“会员效果不好”是用户陈述，尚不是核验事实。权益／触达为待验证候选。</p><p>${escape(state.blocked || '无已知口径阻断（合成示例），生产按获准来源检查。')}</p>`,
      plan: `<h3>当前方案 · 版本 ${state.version}</h3><p>${a.method}</p><p>${a.evidence}</p><p>目的／证据要求必须真正改变 Context、Contract 与 IR 的实际消费。这里未生成或执行生产 IR。</p><p>框架审阅：${state.reviewed === state.version ? '当前有效（样例）' : '当前未审阅'}</p>`,
      materials: '<h3>资料与权限</h3><p>当前只有合成目录，无实际文件、模型授权或凭据。</p><p>生产复用任务的有效材料／模型／工具许可，必要时补授权；不每次 Attempt 重新批准。</p><p>选中材料中的必要明细可在有效许可内外发；未选文件、任意路径、凭据禁止出站。只整理也不能外发未获准材料。</p>',
      evidence: '<h3>还没有真实分析证据</h3><p>预演与用户陈述不是核验事实，不纳入 Finding 或报告的有据结论。</p><p>后续真实数值沿用 R3 按项目说明：原始独立核验／派生公式／部分覆盖／探索未核验／失败或待对账／不适用，不统一涂绿。</p>',
      execution: `<h3>受控接续</h3><p>当前：${statusLabel()}</p><p>这里没有实际运行请求。生产：核验有效授权 → 使用当前框架／计划 → 受控工具 → 本地真实计算与适用独立核验 → 可回链成果。</p><p>保存／刷新／切换／服务重启不自动发起运行；关闭网页不等于停止已启动任务。UNKNOWN先对账。</p><p>原请求＋一次额外请求，备用共用；累计无上限但持久计量，重开不清零。</p>`
    };
    $('detail').innerHTML = contents[state.tab]; $('detail').setAttribute('aria-labelledby', `tab-${state.tab}`);
    document.querySelectorAll('[data-tab]').forEach(el => { const selected = el.dataset.tab === state.tab; el.setAttribute('aria-selected', String(selected)); el.tabIndex = selected ? 0 : -1; });
    $('drawer').hidden = !state.drawer; $('drawer').classList.toggle('visible', state.drawer); $('details').setAttribute('aria-expanded', String(state.drawer));
  }
  function statusLabel() { return ({ draft: state.clarifyOnly ? '只整理需求 · 未运行' : '需求与框架 · 未运行', stopped: '已停止样例 · 重开不自动运行', unknown: '原执行结果待对账 · 不发起重复任务', 'admission-preview': '接续位置预览 · 未发出真实请求' })[state.status]; }
  function render() {
    const a = aims[state.aim];
    $('title').textContent = state.title;
    $('quick').classList.toggle('active', state.mode === 'quick'); $('professional').classList.toggle('active', state.mode === 'pro');
    $('quick').setAttribute('aria-pressed', String(state.mode === 'quick')); $('professional').setAttribute('aria-pressed', String(state.mode === 'pro'));
    $('subtitle').textContent = state.mode === 'pro' ? '专业第一阶段 · 同一任务的需求／框架增量；其余五阶段不变' : '业务理解 → 分析方案 → 执行与核验 → 可信成果';
    const saved = state.saveState === 'failed' ? '自动保存失败 · 当前编辑保留' : state.saveState === 'saved' ? '已自动保存／读回本页内存 · 刷新会丢失' : '本页样例草稿 · 尚未内存保存';
    $('status').innerHTML = `<span class="badge ${state.status === 'unknown' || state.blocked ? 'wait' : 'neutral'}">${statusLabel()}</span><span>框架 ${state.version} · ${state.reviewed === state.version ? '整体审阅有效（样例）' : '草稿'}</span><span class="fine">${saved}</span>${state.saveState === 'failed' ? button('retry-save', '重试保存') : ''}`;
    const user = state.question ? `<div class="message-user">${escape(state.question)}</div>` : '';
    const intro = state.ready ? `<article class="analysis-card"><h2>业务理解／分析方案</h2><p>当前重点：${a.label}。${state.clarifyOnly ? '我们先把问题理清，可以保存后暂不分析。' : '先明确需要怎样的答案，再使用真实资料分析。'}</p>${state.uncertainPurpose ? `<div class="question-context"><h3>这次你更需要什么？</h3><p>是解释已经发生的变化，还是判断下一步先调查权益或触达？这会改变方法和需要的证据。</p><div class="card-actions">${button('explain', '先解释变化')}${button('priority', '先确定调查重点')}</div></div>` : '<p class="source-note">目的已明确（合成示例）。不再强制进入深入讨论。</p>'}<div class="card-actions"><button class="btn btn-sm" type="button" data-action="preview" aria-expanded="${state.preview}" aria-controls="inline-preview">${state.preview ? '收起答案预演' : '预演不同答案'}</button>${button('framework', '查看完整框架')}${button('save', '保存框架，暂不分析')}${button('review', '审阅当前框架')}${button('start', '按此方案开始分析', true)}</div><div id="inline-preview">${state.preview ? preview() : ''}</div></article>` : '<article class="analysis-card"><h2>想回答什么问题？</h2><p>直接说出你的诉求，也可以先补资料。此原型不会对任意输入生成假的模型理解；请使用顶部审核场景检查完整交互。</p></article>';
    const block = state.blocked ? `<section class="state-note"><h2>先处理影响判断的缺口</h2><p>${escape(state.blocked)}</p><div class="card-actions">${state.scene === 'conflict' ? button('resolve', '这次只看付费会员') : button('narrow', '先只核实复购变化')}${button('materials', '查看资料与权限')}${button('save', '保存待补，不分析')}</div></section>` : '';
    const controls = ['stopped', 'unknown'].includes(state.status) ? `<section class="state-note"><h2>${state.status === 'unknown' ? '先对账，不重复执行' : '停止状态保留'}</h2><p>框架可以查看、保存；重开及切换模式不会启动运行。</p>${button('reopen', '读回保存框架')}${state.status === 'stopped' ? button('start', '明确继续分析') : ''}</section>` : '';
    const notice = state.notice ? `<p class="notice-inline" role="note">${escape(state.notice)}</p>` : '';
    $('thread').innerHTML = user + state.messages.map(m => `<div class="message-user">${escape(m)}</div>`).join('') + block + controls + intro + notice;
    const professional = state.mode === 'pro'; const expanded = state.expanded || professional;
    $('thread').hidden = expanded; $('workspace').hidden = !expanded; $('back').hidden = professional;
    $('workspace-heading').textContent = professional ? '第一阶段 · 需求与分析框架' : '需求与分析框架';
    $('workspace-body').innerHTML = (professional ? '<p class="pro-stage-context">这是 PX-004 第一阶段的增量接缝，与快速模式共用当前样例任务／版本。原完整六阶段通过顶部参考链接检查；生产不替换后五阶段。</p>' : '') + block + controls + (state.ready ? framework() : intro) + notice;
    renderDetail(); $('notice').textContent = state.notice;
  }
  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-tab]');
    if (tab) { state.tab = tab.dataset.tab; renderDetail(); return; }
    const el = event.target.closest('[data-action]'); if (!el) return;
    const action = el.dataset.action;
    if (action.startsWith('new-')) { state = makeState(action); $('new-dialog').close(); render(); $('message').focus(); return; }
    act(state, action);
    if (['explain', 'priority', 'noop', 'resolve', 'narrow', 'review'].includes(action)) saveSnapshot(state);
    render();
    if (action === 'framework') $('workspace').focus();
  });
  document.querySelector('.detail-tabs').addEventListener('keydown', event => {
    const tabs = [...document.querySelectorAll('[data-tab]')]; const index = tabs.indexOf(document.activeElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    state.tab = tabs[next].dataset.tab; renderDetail(); tabs[next].focus();
  });
  $('scene').addEventListener('change', () => { state = makeState($('scene').value); render(); });
  $('quick').addEventListener('click', () => { state.mode = 'quick'; render(); });
  $('professional').addEventListener('click', () => { state.mode = 'pro'; render(); });
  $('details').addEventListener('click', () => { state.drawer = !state.drawer; renderDetail(); if (state.drawer) $('detail').focus(); });
  $('close').addEventListener('click', () => { state.drawer = false; renderDetail(); $('details').focus(); });
  $('back').addEventListener('click', () => { act(state, 'back'); render(); document.querySelector('[data-action="framework"]').focus(); });
  $('new').addEventListener('click', () => $('new-dialog').showModal());
  $('cancel-new').addEventListener('click', () => $('new-dialog').close());
  $('current').addEventListener('click', () => { state.expanded = false; render(); });
  $('composer').addEventListener('submit', event => { event.preventDefault(); const text = $('message').value.trim(); if (!text) return; state.messages.push(text); saveSnapshot(state); state.notice = '已显示你的文本。此原型不模拟自由输入的 AI 回答；正式实现须用真实模型理解并更新框架。'; $('message').value = ''; render(); });
  render();
})();
