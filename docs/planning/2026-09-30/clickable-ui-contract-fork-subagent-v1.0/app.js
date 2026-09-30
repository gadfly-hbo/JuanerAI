(() => {
  'use strict';
  // Only this synthetic attachment owns this key. No production state or API is used.
  const KEY = 'juanerai.ui-contract.fork-subagent.v1.synthetic';
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active = (s) => ['Running', 'Waiting'].includes(s);
  const childId = new URLSearchParams(location.search).get('child');
  const childEpoch = new URLSearchParams(location.search).get('session');
  const history = [
    {id:'M-01',role:'user',text:'基于已经确认的证据，比较“对权益到期会员做小范围续费触达”和“本轮暂不行动”。'},
    {id:'M-02',role:'assistant',text:'现有聚合支持检查到期窗口，但渠道归因尚未验证。候选比较应保留这一限制。'},
    {id:'M-03',role:'user',text:'请保留本轮不行动这一替代项，不把模型建议写成已经验证的因果结论。'}
  ];
  const fixtureResult = '候选比较：受控触达试验可用于进一步验证；“本轮不行动”保留为替代项。\n反证与限制：当前聚合无法证明触达导致复购变化，渠道归因未验证。\n建议：在正式流程中由用户重新审阅验证安排。这里没有新的经营事实或独立证据。';
  const initial = () => ({version:1,epoch:crypto.randomUUID(), revision:'r7', decision:'DR-002', eligible:true, provider:true, budget:true, externalBusy:false, failCreate:false, failReturn:false, failAdopt:false, parent:{status:'Succeeded',closed:false,attempts:[],messages:[]},children:[],returns:[],materials:[],notice:''});
  let state, mode = 'quick', tab = 'source', stage = 6, modalAction = null, focusBack = null, toastTimer, storageOK = true, popupFallback = null;
  try { state = JSON.parse(localStorage.getItem(KEY)) || initial(); } catch { state = initial(); storageOK = false; }
  const refresh = () => { if (storageOK) { try { state = JSON.parse(localStorage.getItem(KEY)) || initial(); } catch { storageOK = false; } } };
  const child = () => childEpoch === state.epoch ? state.children.find((c) => c.id === childId) : undefined;
  const stale = (c) => c.revision !== state.revision || c.decision !== state.decision;
  const busy = () => active(state.parent.status) || state.children.some((c) => active(c.status)) || state.externalBusy;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageOK = false; } render(); };
  const resultById = (id) => { for (const c of state.children) { const result = c.results.find((r) => r.id === id); if (result) return {c,result}; } return null; };
  const ownHistoryEntries = (c) => !c ? [] : [
    ...c.messages.map((m,i) => ({id:`${c.id}-M${i + 1}`,attempt:m.attempt,kind:m.role === 'user' ? '用户消息' : m.label.startsWith('只读') ? '只读回执' : '模型消息',label:`${m.label} · Attempt ${c.attempts.find((a) => a.id === m.attempt)?.status || '历史状态未知'} · 已保存历史（不是成功结果）`,text:m.text})),
    ...c.results.map((r) => ({id:r.id,attempt:r.attempt,kind:'完整成功结果',label:'已保存的完整成功结果版本 · Attempt Succeeded',text:r.text}))
  ];
  const sourceStamp = () => `${state.epoch}|${state.revision}|${state.decision}|${state.parent.closed}`;
  const childHref = (id) => {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('child',id); url.searchParams.set('session',state.epoch); return url.href;
  };
  const sourceDetails = (c) => `父对话 P-01 · Case membership-repeat · ${c?.revision || 'r7'} · ${c?.decision || 'DR-002'} · EO-002 · report v2`;
  const btn = (action, label, cls = 'secondary-button', id = '', disabled = false) => `<button class="${cls}" data-action="${action}"${id ? ` data-id="${esc(id)}"` : ''}${disabled ? ' disabled' : ''}>${label}</button>`;
  const badge = (status) => `<span class="state-badge ${['Succeeded','Adopted','Returned'].includes(status) ? 'green' : ['Failed','Cancelled','Interrupted','Expired'].includes(status) ? 'red' : status === 'Pending' || active(status) ? 'amber' : 'neutral'}">${esc(({Ready:'待授权',Running:'运行中 · Running',Waiting:'等待回答 · Waiting',Succeeded:'成功 · Succeeded',Failed:'失败 · Failed',Cancelled:'已停止 · Cancelled',Interrupted:'已中断 · Interrupted',Pending:'待审 · 未采纳',Adopted:'已采纳为对话材料',Declined:'已拒绝 · 历史保留',Returned:'已回流',Expired:'来源已过期'})[status] || status)}</span>`;
  function announce(text) { $('#announcement').textContent = text; $('#announcement').classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#announcement').classList.add('hidden'), 5000); }
  function error(text) { $('#dialogError').textContent = text; $('#dialogError').classList.remove('hidden'); return false; }
  function dialog(title, body, confirm, action) {
    if ($('#dialog').open) $('#dialog').close();
    focusBack = document.activeElement;
    $('#dialogTitle').textContent = title; $('#dialogBody').innerHTML = body;
    $('#dialogError').classList.add('hidden'); $('#dialogConfirm').textContent = confirm || '知道了';
    $('#dialogConfirm').disabled = false; modalAction = action || (() => true); $('#dialog').showModal();
  }
  function info(title, body) { dialog(title, `<div class="generic-body">${body}</div>`, '知道了'); }
  function eligibility(c = null, checkBusy = true) {
    if (!storageOK) return '浏览器存储不可用。请通过本机静态服务器打开，允许此合成附件的本地存储。';
    if (childId && !child()) return '子对话不存在或演示已经重置。请返回父窗口。';
    if (c?.closed) return '子会话已关闭。请从父会话树显式重新打开；任务不会自动恢复。';
    if (state.eligible === false) return 'Case 前置条件不足：缺少有效 Decision Closure。先在专业来源完成该条件。';
    if (state.parent.closed) return '父会话已关闭。请显式重新打开父会话；任务不会自动恢复。';
    if (stale(c || {revision:'r7',decision:'DR-002'})) return '来源 revision 或正式决定基线已变化。旧历史保留，当前操作已阻断。';
    if (checkBusy && busy()) return '另一个模型任务正在运行或等待。请先显式结束当前任务，再重新授权；不会排队启动。';
    return '';
  }
  function stopOne(c, status = 'Cancelled', reason = '用户显式停止。迟到返回不会恢复执行。') {
    if (active(c.status)) { c.status = status; c.reason = reason; const a = c.attempts.at(-1); if (a) a.status = status; }
  }
  function recover() {
    stopOne(state.parent, 'Interrupted', '页面关闭或重开中断了原 Attempt。必须新授权。');
    state.children.forEach((c) => { stopOne(c, 'Interrupted', '窗口关闭或应用重开；原 Attempt 不自动恢复。'); if (c.type === 'Subagent' && c.status === 'Succeeded') c.results.filter((r) => !state.returns.some((x) => x.id === r.id)).forEach((r) => r.returnStatus = 'recovery'); });
  }
  // Loading the root represents application reopen; loading a child represents that window reopen.
  if (!childId) recover(); else if (child()) { stopOne(child(), 'Interrupted', '子窗口重开；原 Attempt 已中断。'); child().closed = false; }
  persist();

  function message(role, label, body) { return `<article class="message ${role === 'user' ? 'user-message' : 'assistant-message'}"><div class="message-meta"><span>${esc(label)}</span></div><p>${esc(body)}</p></article>`; }
  function render() {
    const c = child();
    const target = c || state.parent;
    document.title = c ? `${c.type} ${c.id} · Xanthil UI Contract` : '会员复购决策 · Xanthil UI Contract';
    $('#quickView').classList.toggle('hidden', mode !== 'quick'); $('#professionalView').classList.toggle('hidden', mode !== 'professional');
    $$('.mode-button').forEach((b) => { const selected = b.dataset.action === mode; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); });
    const query = $('#search').value.trim().toLowerCase();
    $('#sessionTree').innerHTML = `<p class="group-label">当前 Case · r7</p><button class="session-item ${!c ? 'selected' : ''}" data-action="parent"><span class="session-title">会员复购决策</span><span class="session-source">P-01 · 根 Case Assistant</span><span class="session-meta">${state.parent.closed ? '已关闭' : esc(state.parent.status)}</span></button>${state.children.filter((x) => `${x.type} ${x.id} ${x.task}`.toLowerCase().includes(query)).map((x) => `<button class="session-item child ${x.id === childId ? 'selected' : ''}" data-action="open-child" data-id="${x.id}"><span class="session-title">${x.type === 'Fork' ? '⑂' : '◇'} ${x.type} · ${x.id}</span><span class="session-source">${esc(x.task)}</span><span class="session-meta">${esc(x.status)}${stale(x) ? ' · 来源过期' : ''} ↗</span></button><a class="text-button child-window-link" href="${esc(childHref(x.id))}" target="_blank" title="浏览器未呈现弹窗时，可直接打开此链接">在独立窗口打开 ${x.type} ${x.id} ↗</a>`).join('')}${!state.children.length ? '<p class="tree-empty">还没有子对话。<br>从下方 Fork 比较另一条思路，或用 Subagent 完成一次检查。</p>' : ''}`;
    $('#conversationTitle').textContent = c ? c.task : '会员复购决策';
    $('#conversationType').textContent = c ? `${c.type} · ${c.id}` : '根 Case Assistant';
    $('#currentStatus').textContent = target.status;
    $('#stopButton').disabled = !active(target.status);
    $('#closeButton').textContent = c ? '关闭并停止' : state.parent.closed ? '重新打开父会话' : '关闭父会话';
    $('#contextIcon').textContent = c ? c.type === 'Fork' ? '⑂' : '◇' : 'C';
    $('#contextTitle').textContent = c ? `${c.type === 'Fork' ? '独立分支讨论 · 手动选择结果回流' : '一次有界检查 · 成功自动回流待审'}` : '从已确认的决定，探索另一条思路';
    $('#contextSubtitle').textContent = c ? `${sourceDetails(c)} · ${c.cut} · ${c.inherit.length} 条选定历史` : 'Case r7 · Completed · accepted Finding · Closure 有效 · final report v2';
    const warning = eligibility(c, false);
    $('#alerts').innerHTML = `${warning ? `<div class="notice error">${esc(warning)}${stale(c || {revision:'r7',decision:'DR-002'}) ? `<div class="result-actions">${btn('rebind','回到根重新绑定','small-button')}</div>` : ''}</div>` : ''}${childId && !c ? '<div class="notice error">此子对话不存在或演示已重置。请返回父窗口。</div>' : ''}${popupFallback ? `<div class="notice">浏览器拦截了独立窗口。<a href="${popupFallback}" target="_blank">点击此处打开子对话 ↗</a>；父对话保持可用。</div>` : ''}${state.notice ? `<div class="notice">${esc(state.notice)}</div>` : ''}`;
    if (c) {
      $('#timeline').innerHTML = `<div class="divider">继承自 P-01 · 截至 ${esc(c.cut)} · 历史快照</div>${c.inherit.map((id) => history.find((h) => h.id === id)).filter(Boolean).map((h) => message(h.role, `来源历史 ${h.id} · 只读继承`, h.text)).join('')}<div class="divider">${c.type} 独立历史</div>${message('user', `${c.id} · 本次任务`, c.task)}${c.messages.map((m) => message(m.role, `${m.attempt} · ${m.label}`, m.text)).join('')}`;
      $('#resultArea').innerHTML = childStatus(c) + c.results.map((r) => resultCard(c, r, true)).join('');
      $('#capabilities').innerHTML = `${btn('parent','← 返回来源对话','capability-chip')}${btn('authorize', c.attempts.length ? '新 Attempt 授权' : '查看子任务授权','capability-chip', '', active(c.status))}<span>单层子对话 · 不派生下一级</span>`;
    } else {
      $('#timeline').innerHTML = history.map((h) => message(h.role, `${h.id} · ${h.role === 'user' ? '你' : 'Case Assistant · MODEL 建议'}`,h.text)).join('') + state.parent.messages.map((m) => message(m.role,`${m.attempt} · ${m.label}`,m.text)).join('');
      $('#resultArea').innerHTML = (active(state.parent.status) ? `<section class="status-panel"><h3>父 Attempt · ${state.parent.status}</h3><p>父任务占用中；Fork / Subagent 不排队、不同时运行。</p></section>` : '') + (state.returns.length ? state.returns.map((x) => { const pair = resultById(x.id); return pair ? resultCard(pair.c,pair.result,false,x) : ''; }).join('') : '<div class="empty-result">子结果回流后会在这里等待审阅。<br>查看、采纳或拒绝都由你决定。</div>');
      $('#capabilities').innerHTML = `${btn('fork','⑂ Fork','capability-chip')}${btn('subagent','◇ Subagent','capability-chip')}${btn('authorize','继续父对话 · 新授权','capability-chip')}<span>${busy() ? '任务占用中 · 请先结束' : '单层 · 顺序执行'}</span>`;
    }
    $('#composerInput').disabled = !!(state.parent.closed || (childId && !c));
    $('#composerNote').textContent = active(target.status)
      ? 'Fake / synthetic · 发送当前可见文本即确认它在本 Attempt 原授权范围内；新增数据、工具、来源或上限须先停止，再新授权。'
      : 'Fake Provider / synthetic · 每次发送仅包含已披露文本与选定材料 · 无真实外发';
    renderDrawer(c); renderScenarios(c);
    $('#stageList').innerHTML = ['Question framing','Hypothesis design','Data preparation','循证分析','Decision closure','Execution feedback'].map((name,i) => `<li class="${stage === i+1 ? 'active' : ''}"><span>${i+1}</span><button data-action="stage" data-id="${i+1}"><strong>${name}</strong><small>已完成 · 保留来源</small></button></li>`).join('');
  }
  function childStatus(c) {
    if (active(c.status)) return `<section class="status-panel"><div class="draft-heading"><h3>${c.type} 任务</h3>${badge(c.status)}</div><p>${c.status === 'Waiting' ? '需要你确认：本次只检查已有聚合中的反证与限制，可以吗？模型执行计时已暂停；等待截止继续。请在输入区回答。' : '正在检查获准材料。这里是合成状态，使用右下角场景控件推进。'}</p><p>演示上限：6 轮 / 执行 300 秒 / 等待 24 小时 / ¥2.00 · 实际费用 ¥0</p>${btn('stop','停止本次任务','danger-button')}</section>`;
    if (c.status === 'Ready') return `<section class="status-panel"><h3>子对话已创建 · 尚未授权</h3><p>本地创建没有模型调用。先确认自己的任务、选定历史、数据与上限。</p>${btn('authorize','查看子任务授权','primary-button')}</section>`;
    if (['Failed','Cancelled','Interrupted'].includes(c.status)) return `<section class="status-panel"><div class="draft-heading"><h3>本次 Attempt 已终结</h3>${badge(c.status)}</div><p>${esc(c.reason)}</p><p>中断前文本仅为历史。本次没有成功结果或成功回流。</p>${btn('authorize','重新授权 · 新 Attempt','primary-button')}</section>`;
    return '';
  }
  function resultCard(c,r,inChild,returned) {
    const link = state.returns.find((x) => x.id === r.id);
    const disposition = returned?.status || link?.status;
    const status = stale(c) ? 'Expired' : disposition || 'Succeeded';
    return `<article class="result-card ${disposition === 'Adopted' ? 'adopted' : disposition === 'Declined' ? 'declined' : ''}" data-result="${r.id}"><div class="draft-heading"><div><p class="eyebrow">${inChild ? 'SAVED CHILD RESULT' : 'CHILD RESULT · REVIEW REQUIRED'}</p><h3>${c.type} · ${esc(c.task)}</h3><p class="result-meta">${c.id} / ${r.id} · ${r.attempt} · ${c.revision} · ${c.decision}</p></div>${badge(status)}</div><p class="result-body">${esc(r.text)}</p><p class="boundary-line">MODEL · 合成模型建议 · 非独立证据 · 范围：${esc(c.data ? '获准聚合子集与' : '')}${c.inherit.length} 条历史${c.report ? '、报告摘要' : ''}</p>${inChild ? `<p class="result-meta">${link ? '已回流到 P-01 · ' + ({Pending:'待审',Adopted:'已采纳为材料',Declined:'已拒绝'})[link.status] : r.returnStatus === 'failed' ? '回流失败 · 成功结果已保存，父对话没有伪成功项' : r.returnStatus === 'recovery' ? '待回流恢复 · 显式重试，不重新执行模型' : '尚未回流 · 结果只在本子对话'}</p><div class="result-actions">${!link ? btn('return',r.returnStatus === 'failed' || r.returnStatus === 'recovery' ? '重试回流' : '选择此完整结果回流','primary-button',r.id,stale(c) || state.parent.closed) : btn('parent','查看来源对话','secondary-button')}${c.type === 'Fork' ? btn('authorize','继续分支 · 新授权','secondary-button','',active(c.status)) : ''}</div>` : `<p class="result-meta">回流：${c.type === 'Fork' ? '用户手动' : '成功后自动 / 本地重试'} · 当前处理：${({Pending:'待审',Adopted:'已采纳',Declined:'已拒绝'})[disposition]}</p><div class="result-actions">${btn('view-result','查看确切来源','secondary-button',r.id)}${disposition === 'Pending' ? btn('adopt','采纳为父对话材料','primary-button',r.id,stale(c)) + btn('decline','拒绝','secondary-button',r.id,stale(c)) : ''}</div>`}</article>`;
  }
  function renderDrawer(c) {
    const target = c || state.parent;
    const rows = (pairs) => pairs.map(([a,b]) => `<div class="drawer-row"><span>${a}</span><strong>${esc(b)}</strong></div>`).join('');
    const card = (title,html) => `<section class="drawer-card"><h3>${title}</h3>${html}</section>`;
    const panes = {
      source: card('来源身份',rows([['Case','会员复购分析'],['绑定 revision',c?.revision || 'r7'],['当前 revision',state.revision],['绑定决定',c?.decision || 'DR-002'],['当前决定',state.decision],['父对话','P-01'],['状态','Completed · Closure 有效']]) + btn('source','查看完整来源','small-button')) + card('正式记录保持',rows([['Evidence / Finding','12 / 4'],['正式决定 / 预期','DR-002 / EO-002'],['报告','v2 · final']]) + '<p>子结果采纳只加入父对话材料，不增加证据或报告版本。</p>'),
      authorization: card('本次授权',rows([['状态',active(target.status) ? '仅本 Attempt 有效' : '下一次运行须新授权'],['Provider / Model',state.provider ? 'Fake / synthetic' : '未配置'],['执行 / 等待',state.budget ? '300 秒 / 24 小时（演示）' : '未配置'],['费用上限','¥2.00（演示）'],['实际模型调用','0']]) + btn('authorize','查看完整授权','small-button')) + card('五项只读业务能力','<p>读取 Case、证据、候选、聚合、报告。仅访问授权所列材料。</p><p>未选历史、原始行、其他 Case、文件、Shell、网络及新权限均排除。</p>'),
      materials: card('父对话材料',state.materials.length ? state.materials.map((id) => { const p = resultById(id); return `<div class="drawer-row"><span>MODEL</span><strong>${esc(id)}${p && stale(p.c) ? ' · 已过期' : ''}</strong></div>`; }).join('') : '<p>尚未采纳子结果。回流项仍待用户审阅。</p>') + card('使用前再次选择','<p>材料加入父对话后，不会自动外发。继续父对话时，逐项选择并确认新 Attempt 授权。</p>'),
      history: card('当前对话 Attempt',target.attempts.length ? target.attempts.map((a) => rows([[a.id,a.status],['已选父材料',(a.materials || []).join('、') || '无'],['已选自身历史 / 结果',(a.ownHistoryIds || []).join('、') || '无']])).join('') : '<p>尚无新 Attempt。父基线 A-00 已完成。</p>') + card('报告版本',`${btn('report','v2 · 当前 final','small-button')}${btn('report-old','v1 · superseded 可读','small-button')}<p>回流与子结果采纳均不升版。</p>`)
    };
    $('#drawerContent').innerHTML = panes[tab];
    $$('.drawer-tab').forEach((b) => { b.classList.toggle('active',b.dataset.tab === tab); b.setAttribute('aria-pressed',String(b.dataset.tab === tab)); });
  }
  function renderScenarios(c) {
    const scenario = (name,label) => btn(`scenario-${name}`,label,'',c?.id || '');
    $('#scenarioMenu').innerHTML = `<strong>仅改变此 UI Contract 的合成状态</strong><p>不会调用模型、访问网络或修改业务记录。</p><h3>父任务与准入</h3>${scenario('parent-running','父 Running')}${scenario('parent-waiting','父 Waiting')}${scenario('parent-end','终结父 Attempt')}${scenario('busy','其他任务占用 / 解除')}${scenario('provider','模型未配置 / 已配置')}${scenario('budget','授权上限缺失 / 恢复')}${scenario('ineligible','来源资格不足 / 恢复')}${scenario('create-fail',`下一次创建失败 ${state.failCreate ? '✓' : ''}`)}<h3>子任务 · 先在独立窗口授权</h3>${scenario('waiting','子任务 Waiting / 追问')}${scenario('success','子任务完整成功（合成）')}${scenario('failure','子任务失败')}${scenario('timeout','等待超时 / 终结')}${scenario('exhausted','预算耗尽 / 终结')}${scenario('late','模拟迟到完成')}${scenario('partial','仅部分文本 · 不能成功回流')}<h3>回流、采纳与来源</h3>${scenario('return-fail',`下一次回流失败 ${state.failReturn ? '✓' : ''}`)}${scenario('adopt-fail',`下一次采纳失败 ${state.failAdopt ? '✓' : ''}`)}${scenario('duplicate','重复回流同一结果')}${scenario('revision','来源 r7 → r8')}${scenario('decision','当前决定 DR-002 → DR-003')}${scenario('parent-message','父对话新增消息（不进入子历史）')}<h3>关闭与恢复</h3>${scenario('reopen','模拟应用重开 · 中断 / 待回流恢复')}${scenario('reopen-parent','重新打开父会话（不执行）')}${scenario('denied','越界读取 / 递归派发拒绝')}${scenario('reset','重置此附件全部合成状态')}`;
  }
  function openChild(id) {
    const url = new URL(childHref(id));
    if (id === childId && child() && !child().closed) { window.focus(); return; }
    // Re-selecting a live named window is navigation only, never a reload of its Attempt.
    const w = window.open('', `xanthil-contract-${state.epoch}-${id}`, 'popup,width=1280,height=820');
    if (!w) { popupFallback = url.href; render(); announce('独立窗口被拦截，请使用页面中的显式链接。'); }
    else { popupFallback = null; if (w.location.href !== url.href || state.children.find((x) => x.id === id)?.closed) w.location.href = url.href; w.focus(); }
  }
  function parentView() {
    if (!childId) { mode = 'quick'; render(); return; }
    if (window.opener && !window.opener.closed) { window.opener.focus(); announce('已返回来源父窗口；子任务状态保持。'); }
    else { const url = new URL(location.href); url.search = ''; const w = window.open(url.href,'xanthil-contract-parent'); if (!w) info('打开来源父对话',`<a href="${url.href}" target="_blank">打开来源 P-01 ↗</a>`); }
  }
  function create(type) {
    const blocked = childId ? '本片仅根 Case Assistant 可以创建子对话。' : eligibility();
    if (blocked) return info('当前不能创建子对话', `<p>${esc(blocked)}</p>`);
    const stamp = sourceStamp();
    dialog(`创建 ${type} · 预览继承范围`, `<p class="modal-lead">仅创建独立子对话。模型运行需要之后在子窗口单独授权。</p><label class="field">${type === 'Fork' ? '本次讨论目的' : '本次有界检查任务'}<textarea id="childTask" required>${type === 'Fork' ? '比较“本轮不行动”的理由与限制' : '检查受控触达候选的反证与限制'}</textarea></label><label class="field">选择父对话历史位置<select id="historyCut">${history.map((h,i) => `<option value="${i}" ${i === 2 ? 'selected' : ''}>${h.id} · ${esc(h.text.slice(0,30))}…</option>`).join('')}</select></label><fieldset class="check-list"><legend>截至该位置，逐项选择继承历史</legend>${history.map((h,i) => `<label data-history-index="${i}"><input name="inherit" type="checkbox" value="${h.id}" checked><span>${h.id} · ${esc(h.text)}</span></label>`).join('')}</fieldset><fieldset class="check-list"><legend>获准材料（可选）</legend><label><input id="includeData" type="checkbox" checked><span>020_clean-r7@sha256:demo-r7<small>字段 cohort、repeat_rate、repeat_revenue；3 行聚合；E-07 / E-11、F-03、L-02 的已保存业务投影；不含原始行。</small></span></label><label><input id="includeReport" type="checkbox" checked><span>report v2 摘要 · DR-002 / EO-002<small>受控续费触达试验；林岚负责；30 天观察窗口；既有分析限制保留。</small></span></label></fieldset><p class="boundary-line">父对话后来增加的消息不会自动进入子历史。取消不创建子对话。</p>`, '创建独立子窗口', () => {
      refresh(); const blockedNow = eligibility(); if (stamp !== sourceStamp() || blockedNow) return error(blockedNow || '来源已变化，请重新预览。');
      const task = $('#childTask').value.trim(); if (!task) return error('请填写明确的任务。');
      if (state.failCreate) { state.failCreate = false; persist(); return error('模拟本地创建失败；没有可用子会话或 Attempt。可以重试。'); }
      const typeCount = state.children.filter((c) => c.type === type).length + 1;
      const id = `${type === 'Fork' ? 'F' : 'S'}-${String(typeCount).padStart(2,'0')}`;
      const c = {id,type,task,revision:'r7',decision:'DR-002',cut:history[Number($('#historyCut').value)].id,inherit:$$('input[name="inherit"]:checked:not(:disabled)').map((n) => n.value),data:$('#includeData').checked,report:$('#includeReport').checked,status:'Ready',attempts:[],messages:[],results:[],closed:false};
      state.children.push(c); persist(); openChild(id); return true;
    });
    $('#historyCut').addEventListener('change', () => { const index = Number($('#historyCut').value); $$('[data-history-index]').forEach((label) => { const input = label.querySelector('input'); input.disabled = Number(label.dataset.historyIndex) > index; if (input.disabled) input.checked = false; label.classList.toggle('history-excluded',input.disabled); }); });
  }
  function authorize() {
    refresh(); const c = child(); const blocked = eligibility(c); if (blocked) return info('当前不能运行', `<p>${esc(blocked)}</p>`);
    const stamp = sourceStamp();
    const task = $('#composerInput').value.trim() || c?.task || '参考我选择的子结果，继续比较当前候选及其限制。';
    const selections = state.materials.map((id) => resultById(id)).filter(Boolean);
    const allowedHistory = c ? c.inherit.map((id) => history.find((h) => h.id === id)).filter(Boolean) : [history[2]];
    const ownChoices = c?.type === 'Fork' ? ownHistoryEntries(c) : [];
    const data = c ? c.data : true; const report = c ? c.report : true;
    dialog(`${c ? c.type + ' 子任务' : '父对话'} · 新 Attempt 授权`, `<p class="modal-lead">独立确认本次授权。实际模型调用为 0；以下预算只用于界面演示，不是生产默认值。</p><div class="payload-preview"><strong>逐字任务文本</strong><p class="payload-text">${esc(task)}</p><strong>来源</strong><p>${esc(sourceDetails(c))}</p><strong>选定历史</strong>${allowedHistory.map((h) => `<p>${h.id} · ${esc(h.text)}</p>`).join('') || '<p>无</p>'}<strong>已选数据与报告</strong><p>${data ? '020_clean-r7@sha256:demo-r7；cohort、repeat_rate、repeat_revenue；3 行聚合；E-07/E-11、F-03、L-02 已保存投影。' : '未选数据，不发送聚合或 Evidence/Finding。'}</p><p>${report ? 'report v2 摘要：受控续费触达试验，责任人林岚，30 天观察窗口，保留渠道归因限制。' : '未选报告，不发送报告摘要。'}</p></div>${!c ? `<fieldset class="check-list"><legend>本次允许外发的已采纳 MODEL 材料</legend>${selections.length ? selections.map(({c:origin,result}) => `<label><input name="material" type="checkbox" value="${result.id}" ${stale(origin) ? 'disabled' : ''}><span>${result.id} · ${origin.type} · ${origin.revision}${stale(origin) ? ' · 已过期，不能外发' : ''}<small>${esc(result.text)}</small></span></label>`).join('') : '<span>无已采纳子结果；不会发送待审或已拒绝结果。</span>'}</fieldset>` : '<p class="boundary-line">子对话既有模型结果不默认外发；本次仅上述继承历史与当前任务文本。</p>'}<div class="grant-grid"><section><h3>Provider / Model 与上限</h3><ul><li>${state.provider ? 'Fake Provider / synthetic' : '未配置模型，无法开始'}</li><li>${state.budget ? '6 轮；执行 300 秒；等待 24 小时；¥2.00' : '硬上限缺失，无法开始'}</li><li>实际费用 ¥0；无真实外发</li></ul></section><section><h3>只读能力与排除</h3><ul><li>读取 Case、证据、候选、聚合、报告（仅已选对象）</li><li>排除未选历史、原始行、其他 Case、整份子历史、文件与工具权限扩张</li><li>无 Web / Shell / 下级派发 / 正式发布</li></ul></section></div><label class="sensitive-confirm"><input id="sensitive" type="checkbox"><span>我已逐项检查上述自由文本与材料，确认本次外发范围。后续每次发送当前可见文本。</span></label>${!state.provider || !state.budget ? `<p class="field-error">模型或硬上限未配置。使用场景面板恢复配置后重新授权。</p>` : ''}`, '确认并开始合成 Attempt', () => {
      refresh(); const now = child(); const why = eligibility(now); if (why || stamp !== sourceStamp()) return error(why || '来源变化，授权已失效。');
      if (!state.provider || !state.budget || !$('#sensitive').checked) return error('请完成模型、上限与自由文本确认。');
      const target = now || state.parent; const id = `${now?.id || 'P'}-A${target.attempts.length + 1}`;
      const materials = $$('input[name="material"]:checked').map((i) => i.value);
      if (materials.some((id) => { const p = resultById(id); return !p || stale(p.c) || !state.materials.includes(id); })) return error('所选材料已变化，请重新查看。');
      const ownHistoryIds = $$('input[name="own-history"]:checked').map((i) => i.value);
      const ownHistory = ownHistoryIds.map((id) => ownChoices.find((item) => item.id === id));
      const currentChoices = ownHistoryEntries(now);
      if (ownHistory.some((item) => !item || JSON.stringify(item) !== JSON.stringify(currentChoices.find((x) => x.id === item.id)))) return error('所选子历史或结果版本已变化，请重新打开授权。');
      target.status = 'Running'; target.closed = false; target.reason = '';
      target.attempts.push({id,status:'Running',task,materials,history:allowedHistory.map((h) => h.id),ownHistoryIds,ownHistory,data,report,revision:'r7',decision:'DR-002'});
      target.messages.push({role:'user',attempt:id,label:'本次已授权文本',text:task});
      $('#composerInput').value = ''; persist(); announce(`已创建 ${id}。请用“UI Contract 场景”推进合成状态。`); return true;
    });
    if (c?.type === 'Fork') {
      $('#dialogBody .payload-preview').insertAdjacentHTML('afterend', `<fieldset class="check-list"><legend>本次选择自身已保存历史 / 完整结果（默认不选）</legend>${ownChoices.length ? ownChoices.map((item) => `<label><input name="own-history" type="checkbox" value="${esc(item.id)}"><span>${esc(item.id)} · ${esc(item.kind)} · ${esc(item.attempt)}<small>${esc(item.label)}</small><small class="payload-text">${esc(item.text)}</small></span></label>`).join('') : '<span>还没有自身历史或结果。</span>'}</fieldset><section class="payload-preview" id="ownPayloadPreview" aria-live="polite"><strong>自身历史外发预览</strong><p>未选择自身历史或结果；本次不会附加这些内容。</p></section>`);
      const note = $$('#dialogBody .boundary-line').find((node) => node.textContent.includes('子对话既有模型结果'));
      if (note) note.textContent = '父分叉继承项仍按上方清单披露。自身消息、回执和完整结果只有逐项选中才外发；未选项与整份子历史均排除。中断前文本可选为历史，不成为成功结果。';
      $$('input[name="own-history"]').forEach((input) => input.addEventListener('change', () => {
        const selected = $$('input[name="own-history"]:checked').map((n) => ownChoices.find((item) => item.id === n.value));
        $('#ownPayloadPreview').innerHTML = `<strong>自身历史外发预览 · ${selected.length} 项</strong>${selected.length ? selected.map((item) => `<p><strong>${esc(item.id)} · ${esc(item.kind)} · ${esc(item.attempt)}</strong><br>${esc(item.label)}</p><p class="payload-text">${esc(item.text)}</p>`).join('') : '<p>未选择自身历史或结果；本次不会附加这些内容。</p>'}`;
        $('#sensitive').checked = false; $('#dialogConfirm').disabled = true;
      }));
    }
    $('#dialogConfirm').disabled = true;
    $('#dialogBody').insertAdjacentHTML('beforeend','<p class="boundary-line">沿用能力：Case 决策与预期 v1.0 · Prompt case-decision@1.0（合成引用，仅查看；不新增或编辑 Skill / Prompt）。</p>');
    $('#sensitive').addEventListener('change', () => { $('#dialogConfirm').disabled = !$('#sensitive').checked || !state.provider || !state.budget; });
  }
  function returnResult(id, isAutomatic = false) {
    const pair = resultById(id); if (!pair) return '没有完整成功结果，不能回流。';
    const {c,result} = pair;
    if (state.returns.some((x) => x.id === id)) return '此结果已经回流；未追加重复项。';
    const blocked = eligibility(c,false); if (blocked) return blocked;
    if (state.failReturn) { state.failReturn = false; result.returnStatus = 'failed'; persist(); return '回流失败。成功结果仍在子对话；可以本地重试。'; }
    state.returns.push({id,status:'Pending',mode:isAutomatic ? 'automatic' : 'manual-or-retry',reviewDecision:state.decision});
    result.returnStatus = 'returned'; persist(); return '已回流到 P-01，等待用户审阅；父模型未启动。';
  }
  function review(id, action) {
    const pair = resultById(id); if (!pair) return;
    const {c,result} = pair; const stamp = sourceStamp();
    if (action === 'view-result') return info(`确切来源 · ${result.id}`, `<p>${esc(sourceDetails(c))}</p><p>子对话 ${c.type} ${c.id} · ${result.attempt} · 截至 ${c.cut}</p><p>MODEL · 已保存成功结果 · 非独立证据</p><p class="payload-text">${esc(result.text)}</p>${btn('open-child','打开独立子窗口 ↗','secondary-button',c.id)}`);
    const why = eligibility(c,false); if (why) return info('当前结果不可处理',`<p>${esc(why)}</p>`);
    dialog(action === 'adopt' ? '采纳为父对话材料' : '拒绝此子结果', `<p class="modal-lead">${action === 'adopt' ? '将此确切结果版本加入 P-01 的 MODEL 材料。不会启动模型或修改 Evidence、Finding、正式决定、预期及报告。' : '保留子结果和拒绝历史；该结果不进入父对话材料。'}</p><div class="payload-preview"><strong>${esc(result.id)} · ${c.type} ${c.id}</strong><p>${esc(sourceDetails(c))}</p><p class="payload-text">${esc(result.text)}</p></div>`,action === 'adopt' ? '确认采纳这个版本' : '确认拒绝', () => {
      refresh(); const current = state.returns.find((x) => x.id === id); const p = resultById(id);
      if (!p || sourceStamp() !== stamp || stale(p.c)) return error('来源或正式决定已变化，请重新查看。此次未写入任何材料。');
      const blockedNow = eligibility(p.c,false);
      if (blockedNow) return error(`${blockedNow} 此次未写入任何材料。`);
      if (current?.status !== 'Pending') { announce('此结果已经处理，未重复追加。'); return true; }
      if (state.failAdopt) { state.failAdopt = false; persist(); return error('模拟本地保存失败：结果仍待审，材料未增加。可以重试。'); }
      current.status = action === 'adopt' ? 'Adopted' : 'Declined';
      if (action === 'adopt' && !state.materials.includes(id)) state.materials.push(id);
      persist(); announce(action === 'adopt' ? '已加入 MODEL 材料。Evidence 12 / Finding 4 / DR-002 / EO-002 / report v2 保持。' : '已拒绝。来源和历史保留。'); return true;
    });
  }
  function complete(c) {
    if (!c || !active(c.status)) return announce('迟到完成已拒绝：当前没有可完成的活动子 Attempt。');
    if (stale(c) || state.parent.closed) { stopOne(c,'Interrupted','来源过期或父会话关闭；本次不能生成成功结果。'); persist(); return; }
    const a = c.attempts.at(-1); c.status = 'Succeeded'; a.status = 'Succeeded';
    const r = {id:`${c.id}-R${c.results.length + 1}`,attempt:a.id,text:fixtureResult,returnStatus:'none'}; c.results.push(r);
    c.messages.push({role:'assistant',attempt:a.id,label:'MODEL · 合成完整结果已保存',text:'结构与来源校验通过（UI 场景）。完整结果见下方。'});
    if (c.data) c.messages.push({role:'assistant',attempt:a.id,label:'只读业务回执 · 合成完成',text:'读取获准聚合 020_clean-r7@sha256:demo-r7；3 行；来源 E-07 / E-11、F-03、L-02。此回执没有新增证据。'});
    persist(); if (c.type === 'Subagent') announce(returnResult(r.id,true));
  }
  function scenario(name) {
    refresh(); const c = child() || state.children.find((x) => active(x.status)) || state.children.at(-1);
    if (['waiting','success','failure','timeout','exhausted','partial'].includes(name) && (!c || !active(c.status))) return announce('请先创建子对话，并在独立子窗口确认任务授权。');
    if (['parent-running','parent-waiting'].includes(name)) {
      if (busy() && !active(state.parent.status)) return announce('已有子任务或接入占用，不能制造第二个活动任务。');
      state.parent.status = name === 'parent-running' ? 'Running' : 'Waiting';
    }
    if (name === 'parent-end') { stopOne(state.parent,'Cancelled','场景：用户结束父 Attempt。'); }
    if (name === 'busy') state.externalBusy = !state.externalBusy;
    if (name === 'provider') state.provider = !state.provider;
    if (name === 'budget') state.budget = !state.budget;
    if (name === 'ineligible') { state.eligible = state.eligible === false; if (!state.eligible) { stopOne(state.parent,'Interrupted','来源资格失效。'); state.children.forEach((x) => stopOne(x,'Interrupted','来源资格失效。')); } }
    if (name === 'create-fail') state.failCreate = !state.failCreate;
    if (name === 'waiting') { c.status = 'Waiting'; c.attempts.at(-1).status = 'Waiting'; c.messages.push({role:'assistant',attempt:c.attempts.at(-1).id,label:'需要用户回答 · 合成追问',text:'只检查当前获准聚合中的反证与限制，可以吗？'}); }
    if (name === 'success') return complete(c);
    if (name === 'failure') stopOne(c,'Failed','合成 Provider 失败。没有完整结果，也没有成功回流。');
    if (name === 'timeout') stopOne(c,'Failed','等待截止已到期。任务终结，没有成功结果。');
    if (name === 'exhausted') stopOne(c,'Failed','本次硬预算已耗尽。任务终结，没有成功结果。');
    if (name === 'partial') c.messages.push({role:'assistant',attempt:c.attempts.at(-1).id,label:'中间文本 · 非完整成功结果',text:'正在检查限制……此部分文本不能回流或采纳。'});
    if (name === 'late') { if (c && active(c.status)) return announce('这是活动任务；请先停止或关闭，再验证迟到拒绝。'); return complete(c); }
    if (name === 'return-fail') state.failReturn = !state.failReturn;
    if (name === 'adopt-fail') state.failAdopt = !state.failAdopt;
    if (name === 'duplicate') { const r = c?.results.at(-1); return announce(r ? returnResult(r.id) : '没有成功结果，不能回流。'); }
    if (name === 'revision' || name === 'decision') {
      if (name === 'revision') state.revision = 'r8'; else state.decision = 'DR-003';
      stopOne(state.parent,'Interrupted','来源已变化，当前授权失效。'); state.children.forEach((x) => stopOne(x,'Interrupted','来源已变化，当前授权失效。'));
      state.notice = name === 'revision' ? '场景：来源 r7 → r8。旧 r7 历史可读，回流、采纳和外发已阻断。' : '场景：当前决定基线变为 DR-003；旧 DR-002 材料不可继续使用。';
    }
    if (name === 'parent-message') state.parent.messages.push({role:'user',attempt:'本地历史',label:'父对话新增 · 未外发',text:'这是创建子对话之后追加的父消息；它不会进入已创建子对话的继承快照。'});
    if (name === 'reopen') { recover(); state.notice = '已模拟重开：活动 Attempt → Interrupted；成功但未回流的 Subagent → 待回流恢复。没有自动模型运行。'; }
    if (name === 'reopen-parent') { state.parent.closed = false; state.notice = '父会话已重新打开。历史保持；继续任务需要新授权。'; }
    if (name === 'denied') return info('已拒绝 · 超出授权', '<p>原始行、其他 Case、未选历史、任意文件、网络和递归派发均不在本次范围。</p><p>本 UI 没有这些执行能力。模型调用为 0；没有新增结果、材料或报告。</p>');
    if (name === 'reset') return dialog('重置此合成附件', '<p class="modal-lead">仅清除本附件的合成父子历史、结果与材料，恢复 r7 / DR-002 / v2。请先关闭其他子窗口。不会清除其他站点或 Change 002 状态。</p>', '重置合成状态', () => { state = initial(); popupFallback = null; persist(); return true; });
    persist(); announce('已应用合成场景。');
  }
  document.addEventListener('click', (event) => {
    const b = event.target.closest('[data-action], [data-tab]'); if (!b || b.disabled) return;
    if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
    const action = b.dataset.action, id = b.dataset.id;
    if (action === 'dismiss') { $('#dialog').close(); return; }
    refresh();
    if (action.startsWith('scenario-')) return scenario(action.slice(9));
    if (action === 'quick' || action === 'professional') { mode = action; render(); return; }
    if (action === 'stage') { stage = Number(id); $('#stageTitle').textContent = b.querySelector('strong').textContent; render(); return; }
    if (action === 'fork' || action === 'subagent') return create(action === 'fork' ? 'Fork' : 'Subagent');
    if (action === 'open-child') return openChild(id);
    if (action === 'parent') return parentView();
    if (action === 'rebind') { if (childId) return parentView(); return info('从根重新绑定当前来源', '<p>旧子对话保持原 revision 和正式决定基线。请通过既有根 Case Assistant 流程关联当前来源，逐项重新确认用户自写约束并创建新子对话。</p><p>本附件只展示导航与过期阻断；不模拟全套重新关联，也不把旧模型结果、Evidence / Finding、报告或子材料带入新来源。</p>'); }
    if (action === 'authorize') return authorize();
    if (action === 'return') return announce(returnResult(id));
    if (['view-result','adopt','decline'].includes(action)) return review(id,action);
    if (action === 'source') return info('来源与固定继承范围', `<p>${esc(sourceDetails(child()))}</p><p>当前来源：${state.revision} / ${state.decision}。当前窗口绑定：${child()?.revision || 'r7'} / ${child()?.decision || 'DR-002'}。</p><p>${child() ? `分叉点 ${child().cut}；已选历史 ${child().inherit.join('、') || '无'}。` : '仅根 P-01 可以创建子对话。'}</p><p>原始行、其他 Case 和未选择的历史没有继承。父后续消息不会自动追加到子上下文。</p>`);
    if (action === 'report' || action === 'report-old') return info(action === 'report' ? '报告 v2 · final · 当前' : '报告 v1 · superseded · 可读',`<p>${action === 'report' ? 'DR-002 / EO-002 · 受控续费触达试验；责任人林岚；30 天观察窗口。' : '原始分析报告、Evidence 与 Finding；不含后续正式决定。'}</p><p>子结果回流和采纳均未修改此报告。本附件不模拟正式发布或导出。</p>`);
    if (action === 'stop') { const t = child() || state.parent; stopOne(t); persist(); return announce('本 Attempt 已停止。迟到返回被拒绝。'); }
    if (action === 'close') {
      if (!childId && state.parent.closed) { state.parent.closed = false; persist(); return; }
      const c = child(); return dialog(c ? '关闭此子会话' : '关闭父会话及活动子任务', `<p class="modal-lead">${c ? '活动子 Attempt 将中断，未使用授权失效。已保存成功结果和回流状态保留。' : '父会话及其 Running / Waiting 子任务将一并中断，未使用授权失效。历史和成功结果保留。'}重新打开不会自动执行。</p>`, '确认关闭并停止', () => { refresh(); const current = child(); if (current) { stopOne(current,'Interrupted','用户关闭子窗口。'); current.closed = true; } else { stopOne(state.parent,'Interrupted','用户关闭父会话。'); state.parent.closed = true; state.children.forEach((x) => { stopOne(x,'Interrupted','父会话关闭，子任务已中断。'); x.closed = true; }); } persist(); if (current) { window.close(); announce('子会话已关闭。如浏览器未关闭窗口，可手动关闭标签页。'); } return true; });
    }
    if (action === 'send') {
      const t = child() || state.parent, text = $('#composerInput').value.trim(); if (!text) return announce('请先填写任务或回答。');
      if (!active(t.status)) return authorize();
      const why = eligibility(child(),false); if (why) return announce(why);
      const a = t.attempts.at(-1); if (!a) return announce('这是仅用于阻断演示的父状态。请先终结，再创建真实的合成 Attempt。');
      if (!state.provider || !state.budget || a.revision !== state.revision || a.decision !== state.decision) { stopOne(t,'Interrupted','模型配置、上限或来源已失效。须重新授权。'); persist(); return announce('当前授权已失效；本次文本未发送。'); }
      t.messages.push({role:'user',attempt:a.id,label:'用户确认在原授权范围内的可见回答',text}); t.status = 'Running'; a.status = 'Running'; $('#composerInput').value = ''; persist(); announce('回答已记录于原 Attempt；上下文、数据、工具与限额未扩大。');
    }
  });
  $('#dialogForm').addEventListener('submit', (event) => { event.preventDefault(); if ($('#dialogConfirm').disabled) return; const action = modalAction; if (action && action() !== false) $('#dialog').close(); });
  $('#dialog').addEventListener('close', () => {
    modalAction = null;
    if (focusBack?.isConnected) focusBack.focus();
    else {
      const sameAction = focusBack?.dataset.action;
      const replacement = sameAction && $$('[data-action]').find((b) => b.dataset.action === sameAction && b.dataset.id === focusBack.dataset.id && !b.disabled);
      (replacement || $('#composerInput')).focus();
    }
  });
  $('#search').addEventListener('input',render);
  window.addEventListener('storage', (event) => { if (event.key === KEY) { refresh(); render(); } });
  window.addEventListener('beforeunload', (event) => {
    refresh(); const c = child();
    const needsConfirm = childId ? c && active(c.status) : active(state.parent.status) || state.children.some((x) => active(x.status));
    if (needsConfirm) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('pagehide', () => {
    refresh(); const c = child(); if (childId) { if (c) stopOne(c,'Interrupted','子窗口关闭或刷新；本次 Attempt 已终结。'); } else recover();
    try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { /* Storage failure is already visible during normal actions. */ }
  });
})();
