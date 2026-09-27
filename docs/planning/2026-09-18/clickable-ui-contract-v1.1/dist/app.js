/* PX-2026-006 静态 Demo · 快速 / 专业双模式交互逻辑
 * 全部为前端静态模拟：无真实文件、模型、Python、Skill/Prompt/Fork/Subagent 调用，无网络请求。
 * 异步守护：每个模拟任务带 status 与对象身份检查，旧回调不得覆盖较新的显式用户状态。
 */
(function () {
  'use strict';
  const D = window.DEMO_DATA;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- 状态 ---------------- */
  const state = {
    mode: 'quick',                 // 'quick' | 'pro'
    view: 'main',                  // 快速模式内当前对话：'main' | 'fork' | 'subagent'
    session: null,                 // 快速 Session 对象
    sessions: [],                  // 全部 Session（含专业基线），带 mode 徽标
    bgTasks: [],                   // 后台任务（切到专业模式后仍运行）
    seq: 0
  };
  state.sessions.push({ id: D.proSession.id, name: D.proSession.name, mode: 'pro', status: 'idle' });

  /* ---------------- 工具 ---------------- */
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function scrollThread() { const th = $('#thread'); th.scrollTop = th.scrollHeight; }
  function chip(cls, text) { return `<span class="chip ${cls}">${text}</span>`; }

  /* ---------------- 模式切换 ---------------- */
  function setMode(mode, opts) {
    state.mode = mode;
    document.body.dataset.mode = mode;
    $('#mode-quick').classList.toggle('active', mode === 'quick');
    $('#mode-pro').classList.toggle('active', mode === 'pro');
    $('#mode-quick').setAttribute('aria-selected', String(mode === 'quick'));
    $('#mode-pro').setAttribute('aria-selected', String(mode === 'pro'));
    // roving tabindex：仅当前 tab 可 Tab 到达，另一枚靠方向键到达
    $('#mode-quick').tabIndex = mode === 'quick' ? 0 : -1;
    $('#mode-pro').tabIndex = mode === 'pro' ? 0 : -1;
    $('#view-quick').hidden = mode !== 'quick';
    $('#view-pro').hidden = mode !== 'pro';
    $('#status-mode').textContent = mode === 'quick' ? '快速模式' : '专业模式';
    $('#mode-memory-note').textContent = `已记忆：${D.user} · ${D.project} → ${mode === 'quick' ? '快速模式' : '专业模式'}`;
    $('#btn-new-session').textContent = mode === 'quick' ? '＋ 新建快速 Session' : '＋ 新建专业 Session（本 Demo 只读基线）';
    $('#btn-new-session').disabled = mode !== 'quick';
    $('#sb-sessions-h').textContent = mode === 'quick' ? '快速 Session' : '专业 Session';
    renderSessionList();
    renderBg(); // 模式切换后同步后台 pill 可见性（运行中切专业模式可观察）
    if (!opts || !opts.silent) {
      toast(mode === 'quick'
        ? '已切回快速模式：Session 类型、历史、目录与运行结果保持不变'
        : '已切到专业模式：快速 Session 的运行任务在后台继续，可随时返回');
    }
  }

  /* ---------------- 会话树（同模式过滤；快速模式含独立子对话节点） ---------------- */
  /* 最小共享判定：子对话是否已有真实结果。
   * 约束所有证据 ID（E-301/E-302）呈现：只有 hasResult 为真才登记证据 ID，
   * 运行中只显示任务身份与状态，失败/取消永不显示证据 ID（fail closed）。 */
  function hasResult(o) { return !!o && o.status === 'done'; }
  function convoOf(sess, convo) {
    return convo === 'fork' ? sess.fork : convo === 'subagent' ? sess.subagent : null;
  }
  function childStatus(sess, convo) {
    const o = convoOf(sess, convo);
    if (!o) return '';
    if (convo === 'fork') {
      if (!hasResult(o)) return '运行中';
      return o.reflowed ? '已回流' : '有结果 · 待回流';
    }
    if (!hasResult(o)) {
      if (o.status === 'running') return '运行中';
      return o.status === 'failed' ? '失败' : '已取消';
    }
    if (o.reflow === 'ok') return '已回流';
    if (o.reflow === 'failed') return '回流失败 · 可重试';
    return '完成 · 自动回流中';
  }
  function renderSessionList() {
    const ul = $('#sb-session-list');
    ul.innerHTML = '';
    const list = state.sessions.filter(s => s.mode === state.mode);
    if (!list.length) {
      ul.appendChild(el(`<li class="sb-empty fine">${state.mode === 'quick'
        ? '尚无快速 Session。新建 Session 会为其独立创建三个目录。'
        : '专业模式基线 Session 见 PX-2026-004。'}</li>`));
      return;
    }
    list.forEach(s => {
      if (state.mode === 'pro') {
        const li = el(`<li><button class="sb-item sb-sess active" type="button">
          <span class="dot dot-idle" aria-hidden="true"></span> ${s.name}
          <span class="sb-meta">专业</span></button></li>`);
        ul.appendChild(li);
        return;
      }
      // 快速模式：主对话 + 独立子对话节点（Fork / Subagent），可来回切换
      const mainDot = s.status === 'running' ? 'dot-run' : s.status === 'ready' ? 'dot-ok' : 'dot-idle';
      ul.appendChild(el(`<li><button class="sb-item sb-sess ${state.view === 'main' ? 'active' : ''}" type="button" data-convo="main">
        <span class="dot ${mainDot}" aria-hidden="true"></span> ${s.name}
        <span class="sb-meta">快速 · 主对话</span></button></li>`));
      if (s.fork) {
        ul.appendChild(el(`<li class="tree-child"><button class="sb-item ${state.view === 'fork' ? 'active' : ''}" type="button" data-convo="fork">
          ⑂ Fork F-01 <span class="sb-meta">${childStatus(s, 'fork')}</span></button></li>`));
      }
      if (s.subagent) {
        ul.appendChild(el(`<li class="tree-child"><button class="sb-item ${state.view === 'subagent' ? 'active' : ''}" type="button" data-convo="subagent">
          ⚙ Subagent S-01 <span class="sb-meta">${childStatus(s, 'subagent')}</span></button></li>`));
      }
    });
  }

  /* ---------------- 对话视图切换（主 / Fork / Subagent，历史互不串） ---------------- */
  function switchConvo(name) {
    state.view = name;
    $('#convo-main').hidden = name !== 'main';
    $('#convo-fork').hidden = name !== 'fork';
    $('#convo-subagent').hidden = name !== 'subagent';
    renderSessionList();
  }

  /* ---------------- Fork / Subagent 入口解锁与可见提示 ---------------- */
  function missingSteps() {
    const s = state.session;
    const miss = [];
    if (!s || !s.approved.has('A-01')) miss.push('A-01 批准');
    if (!s || !s.analyzed) miss.push('发送一次分析');
    return miss;
  }
  function updateEntryHints() {
    const miss = missingSteps();
    const unlocked = miss.length === 0;
    const hint = unlocked ? '' : `未解锁 · 缺少：${miss.join(' + ')}`;
    $('#fork-hint').textContent = hint;
    $('#subagent-hint').textContent = hint;
    $('#btn-fork').classList.toggle('locked', !unlocked);
    $('#btn-subagent').classList.toggle('locked', !unlocked);
  }
  function lockedEntry(kind) {
    const miss = missingSteps();
    toast(`${kind} 尚未解锁 · 缺少：${miss.join(' + ')}`);
    const h = $(kind === 'Fork' ? '#fork-hint' : '#subagent-hint');
    h.classList.add('flash');
    setTimeout(() => h.classList.remove('flash'), 900);
  }

  /* ---------------- 后台任务 ---------------- */
  function renderBg() {
    const running = state.bgTasks.filter(t => t.status === 'running');
    $('#sb-bg-section').hidden = state.bgTasks.length === 0;
    const ul = $('#sb-bg-list'); ul.innerHTML = '';
    state.bgTasks.forEach(t => {
      const map = { running: ['dot-run', '运行中'], done: ['dot-ok', '已完成'], failed: ['dot-fail', '失败'], cancelled: ['dot-cancel', '已取消'] };
      const [dot, label] = map[t.status];
      const li = el(`<li><button class="sb-item sb-run" type="button" data-bg="${t.id}">
        <span class="dot ${dot}" aria-hidden="true"></span> ${t.name} <span class="sb-meta">${label}</span></button></li>`);
      ul.appendChild(li);
    });
    const showPill = state.mode === 'pro' && running.length > 0;
    $('#bg-pill').hidden = !showPill;
    $('#bg-pill-count').textContent = String(running.length);
    $('#status-run').textContent = running.length ? `后台运行中 ×${running.length}` : '空闲';
  }

  /* ---------------- 失败路径 1：Session 创建（三目录 Gate） ---------------- */
  const DIRS = ['010_draw', '020_clean', '060_reports'];
  let createGen = 0; // 单调代次：过期回调零副作用
  function createSession() {
    // in-flight 锁：已有可用 Session 或创建进行中时，重复触发直接拒绝
    if (state.session || state.creating) { toast('已有可用 Session 或创建进行中；如需重放请先重置（⌘K → 重置演示）'); return; }
    const failDir = $('#toggle-fail-dir').checked;
    state.creating = true;
    const gen = ++createGen;
    const sid = 'q-' + (++state.seq);
    const card = el(`<div class="card-inline create-card">
      <div class="ci-head"><span class="ci-name">新建快速 Session「会员复购变化诊断」</span>${chip('chip-run', '创建目录中')}</div>
      <ol class="dir-steps" role="list">
        ${DIRS.map(d => `<li data-dir="${d}"><span class="dot dot-idle" aria-hidden="true"></span> <code>${d}/</code> <span class="fine dstat">等待</span></li>`).join('')}
      </ol>
    </div>`);
    $('#thread-empty').hidden = true;
    $('#thread').appendChild(card);
    scrollThread();

    let i = 0;
    function step() {
      if (gen !== createGen) return; // 过期代次：零副作用
      const row = card.querySelector(`li[data-dir="${DIRS[i]}"]`);
      const isFailTarget = failDir && DIRS[i] === '020_clean';
      row.querySelector('.dstat').textContent = '创建中';
      row.querySelector('.dot').className = 'dot dot-run';
      setTimeout(() => {
        if (gen !== createGen) return; // 过期代次：零副作用，不覆盖较新状态
        if (isFailTarget) {
          state.creating = false;
          row.querySelector('.dstat').textContent = '失败（模拟）';
          row.querySelector('.dot').className = 'dot dot-fail';
          card.querySelector('.chip').outerHTML = chip('chip-fail', '创建失败');
          card.appendChild(el(`<div class="err-card" role="alert">
            <p><strong>失败路径 1：目录创建不完整。</strong><code>020_clean/</code> 创建失败（模拟：磁盘权限错误）。</p>
            <p class="fine">fail closed：整条 Session 创建失败，不产生可进入的残缺 Session，也不保留伪成功状态；已创建的目录将回滚（模拟）。原始数据未受影响。</p>
            <div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="btn-create-retry">取消勾选失败后重试</button></div>
          </div>`));
          $('#btn-create-retry').addEventListener('click', () => {
            $('#toggle-fail-dir').checked = false;
            card.remove();
            createSession();
          });
          scrollThread();
          return;
        }
        row.querySelector('.dstat').textContent = '已创建';
        row.querySelector('.dot').className = 'dot dot-ok';
        i++;
        if (i < DIRS.length) { step(); return; }
        // 三目录全部成功 → Session 可用
        state.creating = false;
        card.querySelector('.chip').outerHTML = chip('chip-ok', 'Session 可用');
        card.appendChild(el(`<p class="fine">三个目录均已就绪；本 Session 独立拥有 <code>010_draw</code>、<code>020_clean</code>、<code>060_reports</code>。</p>`));
        state.session = {
          id: sid, name: '会员复购变化诊断', mode: 'quick', status: 'ready',
          dirs: { '010_draw': [], '020_clean': [], '060_reports': [] },
          approved: new Set(), approvedOnce: false,
          attached: false, processed: false, analyzed: false,
          skill: null, prompt: null,
          fork: null, subagent: null, report: null,
          pending: [] // 回流到主对话的待处理结果（唯一性按 srcId 守卫）
        };
        state.sessions.push(state.session);
        $('#composer-wrap').hidden = false;
        updateEntryHints();
        renderSessionList(); renderDrawer(); scrollThread();
        $('#composer-input').focus();
      }, 450);
    }
    step();
  }

  /* ---------------- 附件：拖入原始文件 → 010_draw ---------------- */
  function attachFile(name) {
    const s = state.session;
    if (!s) return;
    if (s.dirs['010_draw'].some(f => f.name === name)) { toast('该文件已登记到 010_draw'); return; }
    const meta = D.rawFiles[name];
    s.dirs['010_draw'].push({ name, id: meta.id, meta: meta.meta });
    s.attached = true;
    $('#thread').appendChild(el(`<div class="card-inline">
      <div class="ci-head"><span class="ci-name">附件已拦截并登记</span>${chip('chip-local', '010_draw · 模型不可见')}</div>
      <p>▦ <strong>${name}</strong> <span class="fine">${meta.meta} · 本地标识 ${meta.id}</span></p>
      <p class="fine">原始文件只登记到本 Session 的 <code>010_draw/</code>，<strong>不会发送给模型</strong>。要用于分析，请先显式运行本地处理生成聚合产物。</p>
      <div class="actions">
        <button class="btn btn-primary btn-sm" type="button" data-act="run-process">运行本地处理</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="try-raw">失败路径 2：尝试把原始文件发送给模型</button>
      </div>
    </div>`));
    renderDrawer(); scrollThread();
  }

  /* ---------------- 失败路径 2：越过数据边界 ---------------- */
  function blockCard(title, reason, fixLabel, fixAct) {
    $('#thread').appendChild(el(`<div class="card-inline card-blocked">
      <div class="ci-head"><span class="ci-name">${title}</span>${chip('chip-block', '已阻断')}</div>
      <div class="err-card" role="alert">
        <p><strong>失败路径 2：越过数据边界。</strong>${reason}</p>
        <p class="fine">fail closed：请求未发出，不产生任何分析结果。</p>
      </div>
      <div class="actions"><button class="btn btn-primary btn-sm" type="button" data-act="${fixAct}">修复：${fixLabel}</button></div>
    </div>`));
    scrollThread();
  }

  /* ---------------- 本地处理：生成 020_clean 聚合产物 ---------------- */
  let procGen = 0; // 单调代次：过期回调零副作用
  function runProcess() {
    const s = state.session;
    // in-flight 锁：未登记附件、已处理或处理进行中时，重复触发直接拒绝
    if (!s || !s.attached || s.processed || s.processing) return;
    s.processing = true;
    const gen = ++procGen;
    s.status = 'running'; renderSessionList();
    const card = el(`<div class="card-inline" id="process-card">
      <div class="ci-head"><span class="ci-name">本地处理 · 显式运行</span>${chip('chip-run', '运行中')}</div>
      <ol class="dir-steps" role="list">
        <li data-p="extract"><span class="dot dot-run" aria-hidden="true"></span> 提取：读取 010_draw 中 ${s.dirs['010_draw'].length} 个文件 <span class="fine dstat">运行中</span></li>
        <li data-p="clean"><span class="dot dot-idle" aria-hidden="true"></span> 清洗：去重与口径对齐 <span class="fine dstat">等待</span></li>
        <li data-p="agg"><span class="dot dot-idle" aria-hidden="true"></span> 聚合：生成按周×会员层复购汇总 <span class="fine dstat">等待</span></li>
      </ol>
      <p class="fine">本地处理 · 未发送给模型。本 Demo 未运行真实 Python。</p>
    </div>`);
    $('#thread').appendChild(card); scrollThread();
    const steps = ['extract', 'clean', 'agg']; let i = 0;
    function step() {
      setTimeout(() => {
        if (gen !== procGen || state.session !== s) return; // 过期代次 / Session 已更换：零副作用
        const row = card.querySelector(`li[data-p="${steps[i]}"]`);
        row.querySelector('.dstat').textContent = '完成';
        row.querySelector('.dot').className = 'dot dot-ok';
        i++;
        if (i < steps.length) {
          const nxt = card.querySelector(`li[data-p="${steps[i]}"]`);
          nxt.querySelector('.dstat').textContent = '运行中';
          nxt.querySelector('.dot').className = 'dot dot-run';
          step(); return;
        }
        // 完成：写入 020_clean
        s.processing = false;
        const agg = D.aggArtifact;
        s.dirs['020_clean'].push({ name: agg.name, id: agg.id, meta: agg.meta, approved: false });
        s.processed = true; s.status = 'ready';
        card.querySelector('.chip').outerHTML = chip('chip-ok', '成功');
        card.appendChild(el(`<div class="preview">
          <p class="fine">新增聚合产物（预览前 3 行 · 合成数据）：</p>
          ${aggTable(agg.preview)}
        </div>`));
        renderSessionList(); renderDrawer(); scrollThread();
        showApproval();
      }, 500);
    }
    step();
  }

  function aggTable(rows) {
    const [head, ...body] = rows;
    return `<table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  /* ---------------- 一次性模型可见性确认 ---------------- */
  function showApproval() {
    const s = state.session;
    if (!s || $('#approval-card')) return; // 唯一确认卡：重入不产生第二张
    const agg = D.aggArtifact;
    $('#thread').appendChild(el(`<div class="card-inline card-approval" id="approval-card">
      <div class="ci-head"><span class="ci-name">新聚合产物首次使用 · 模型可见性确认</span>${chip('chip-wait', '待确认')}</div>
      <p><code>020_clean/${agg.name}</code>（${agg.id}）尚未对模型可见。批准后，本 Session 后续复用<strong>不再重复打扰</strong>；原始数据始终不可见。</p>
      <div class="actions">
        <button class="btn btn-primary btn-sm" type="button" data-act="approve">批准 A-01 对模型可见</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="approve-later">暂不批准</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="try-unapproved">失败路径 2：未经确认直接发送</button>
      </div>
    </div>`));
    scrollThread();
  }

  function approveAgg() {
    const s = state.session;
    const card = $('#approval-card');
    if (!s || s.approved.has('A-01')) return;
    s.approved.add('A-01'); s.approvedOnce = true;
    const item = s.dirs['020_clean'].find(x => x.id === 'A-01');
    if (item) item.approved = true;
    if (card) {
      card.querySelector('.chip').outerHTML = chip('chip-ok', '已批准');
      card.querySelector('.actions').remove();
      card.appendChild(el('<p class="fine">A-01 已对本 Session 的模型可见；本 Session 内复用不再重复确认。</p>'));
    }
    $('#composer-boundary').textContent = '模型可见边界：仅已批准聚合数据（A-01）';
    $('#status-boundary').textContent = '仅已批准聚合数据（A-01）';
    updateEntryHints();
    renderDrawer(); scrollThread();
    toast('已批准 A-01；现在可以选择 Skill / Prompt 并发送分析请求');
  }

  /* ---------------- 层叠弹层与统一焦点栈 ----------------
   * 嵌套打开/逐层关闭时焦点恢复到正确触发项；aria-modal 层带 Tab 焦点陷阱。 */
  const layerStack = []; // { sel, trigger, focusSel, modal, hide }
  let pickerKind = null;

  function pushLayer(cfg) {
    // 同层幂等：同一 sel 已打开时，快捷键/双击/重复调用不得再次入栈；
    // 保留首次打开时的触发项（后续重复触发的 activeElement 可能已在该层内部，不能作为恢复目标）
    const idx = layerStack.findIndex(x => x.sel === cfg.sel);
    if (idx >= 0) {
      cfg.trigger = layerStack[idx].trigger || cfg.trigger;
      layerStack.splice(idx, 1);
    }
    layerStack.push(cfg);
    const first = cfg.focusSel ? $(cfg.sel + ' ' + cfg.focusSel) : null;
    if (first) first.focus();
  }
  function closeLayer(sel) {
    const idx = layerStack.map(x => x.sel).lastIndexOf(sel);
    if (idx < 0) return;
    const [entry] = layerStack.splice(idx, 1);
    entry.hide();
    const prev = layerStack[layerStack.length - 1];
    if (prev) {
      const f = prev.focusSel ? $(prev.sel + ' ' + prev.focusSel) : null;
      if (f) { f.focus(); return; }
    }
    if (entry.trigger && document.contains(entry.trigger)) entry.trigger.focus();
  }
  function closeTopLayer() {
    const top = layerStack[layerStack.length - 1];
    if (top) closeLayer(top.sel);
  }
  // Tab 焦点陷阱：只作用于栈顶 aria-modal 层，正反向 Tab 均不逃逸
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const top = [...layerStack].reverse().find(x => x.modal);
    if (!top) return;
    const veil = $(top.sel);
    if (!veil || veil.hidden) return;
    const focusables = $$('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])', veil)
      .filter(x => !x.disabled && x.getClientRects().length > 0);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (!veil.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------------- Skill / Prompt 显式选择 ---------------- */
  function openPicker(kind, trigger) {
    pickerKind = kind;
    const items = kind === 'skill' ? D.skills : D.prompts;
    $('#picker-title').textContent = kind === 'skill' ? '显式选择 Skill' : '显式选择 Prompt';
    $('#picker-body').innerHTML = `<ul class="insp-list" role="listbox" aria-label="${kind === 'skill' ? 'Skill 列表' : 'Prompt 列表'}">
      ${items.map(it => `<li><button class="picker-item" type="button" role="option" aria-selected="${it.current}" data-id="${it.id}">
        <strong>${it.name}</strong> ${chip(it.current ? 'chip-ok' : 'chip-wait', it.version + (it.current ? ' · 当前' : ''))}<br>
        <span class="fine">${it.scope}</span></button></li>`).join('')}</ul>`;
    $('#picker-veil').hidden = false;
    pushLayer({ sel: '#picker-veil', trigger, focusSel: '.picker-item', modal: true, hide: () => { $('#picker-veil').hidden = true; } });
    $$('.picker-item').forEach(btn => btn.addEventListener('click', () => {
      const s = state.session; if (!s) return closePicker();
      const items2 = pickerKind === 'skill' ? D.skills : D.prompts;
      items2.forEach(i => i.current = i.id === btn.dataset.id);
      const picked = items2.find(i => i.id === btn.dataset.id);
      if (pickerKind === 'skill') { s.skill = picked; $('#chip-skill-name').textContent = `${picked.name} ${picked.version}`; }
      else { s.prompt = picked; $('#chip-prompt-name').textContent = `${picked.name} ${picked.version}`; }
      closePicker();
      toast(`已显式选择 ${pickerKind === 'skill' ? 'Skill' : 'Prompt'}：${picked.name} ${picked.version}（不真实执行）`);
    }));
  }
  function closePicker() { closeLayer('#picker-veil'); }

  /* ---------------- 发送分析请求 ---------------- */
  function sendMessage() {
    const s = state.session;
    if (!s) return;
    const text = $('#composer-input').value.trim() || '基于已批准的聚合产物，分析华东区高价值会员近 90 天复购率下滑的驱动因素，要求循证。';
    // 边界检查：未批准 → 阻断（失败路径 2）
    if (!s.approved.has('A-01')) {
      $('#thread').appendChild(el(`<div class="msg msg-user"><div class="msg-role">${D.user}</div><div class="msg-body">${escapeHtml(text)}</div></div>`));
      if (!s.processed) blockCard('模型请求已阻断', '输入引用的 <code>010_draw</code> 原始数据或未聚合内容不允许发送给模型。', '运行本地处理', 'run-process');
      else blockCard('模型请求已阻断', '<code>020_clean/weekly_repurchase_by_tier.agg</code>（A-01）尚未完成首次模型可见性确认。', '完成一次可见性确认', 'approve');
      $('#composer-input').value = '';
      return;
    }
    if (s.analyzed) { toast('本 Demo 只演示一次完整分析；可重置后重放'); return; }
    if (!s.skill || !s.prompt) { toast('请先在 Composer 附近显式选择 Skill 与 Prompt'); openPicker(!s.skill ? 'skill' : 'prompt', !s.skill ? $('#chip-skill') : $('#chip-prompt')); return; }
    s.analyzed = true;
    $('#composer-input').value = '';
    $('#thread').appendChild(el(`<div class="msg msg-user"><div class="msg-role">${D.user}</div><div class="msg-body">${escapeHtml(text)}</div></div>`));
    const a = D.analysis;
    const card = el(`<div class="msg msg-agent">
      <div class="msg-role">数分助手 ${chip('chip-off', '离线')} ${chip('chip-agg', a.visibleChip)}</div>
      <div class="msg-body">
        <p class="fine">本次输入<strong>只引用已批准的 020_clean（A-01）</strong> · Skill：${s.skill.name} ${s.skill.version} · Prompt：${s.prompt.name} ${s.prompt.version} · <button class="evi-link" type="button" data-act="open-drawer">在辅助抽屉核对数据与产物</button></p>
        <p>${a.text}</p>
        ${a.hypotheses.map(h => `<div class="hypo"><div class="hypo-head">
          <span class="hypo-id">${h.id}</span><span class="hypo-text">${h.text}</span>${chip('chip-' + h.status, h.label)}
        </div><div class="hypo-evi"><span class="fine">${h.evi}</span></div></div>`).join('')}
      </div>
    </div>`);
    $('#thread').appendChild(card);
    $('#btn-report').disabled = false;
    updateEntryHints();
    scrollThread();
  }
  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------------- Fork / Subagent：两类独立子对话（v0.2） ---------------- */
  function openFork(trigger) {
    $('#fork-scope-block').hidden = true;
    $('#fork-inherit-raw').checked = false;
    $('#fork-veil').hidden = false;
    pushLayer({ sel: '#fork-veil', trigger, focusSel: '#btn-fork-create', modal: true, hide: () => { $('#fork-veil').hidden = true; } });
  }
  function closeFork() { closeLayer('#fork-veil'); }

  let forkGen = 0; // 单调代次：过期回调零副作用
  function createFork() {
    const s = state.session;
    if (!s || s.fork) return;
    if ($('#fork-inherit-raw').checked) {
      $('#fork-scope-block').hidden = false; // 扩大范围被阻止，要求重新确认
      return;
    }
    closeFork();
    s.fork = { id: 'F-01', type: 'Fork', status: 'running', reflowed: false, adopt: undefined };
    // 独立子对话：独立标题、历史、继承范围与返回入口
    const th = $('#thread-fork');
    th.innerHTML = '';
    $('#fork-foot').innerHTML = '';
    th.appendChild(el(`<div class="msg msg-user"><div class="msg-role">${D.user}</div><div class="msg-body">在继承的 A-01 子集上探索替代假设「促销节奏变化」。</div></div>`));
    const runCard = el(`<div class="card-inline" id="fork-run-card">
      <div class="ci-head"><span class="ci-name">分支分析（Mock）</span>${chip('chip-run', '运行中')}</div>
      <div class="bar bar-sm"><span class="bar-fill"></span></div>
      <p class="fine">只使用继承的已批准聚合子集 A-01；<code>010_draw</code> 原始数据不参与。结果不会自动送回来源对话。</p>
    </div>`);
    th.appendChild(runCard);
    renderSessionList(); renderDrawer();
    switchConvo('fork');
    const fork = s.fork;
    const gen = ++forkGen;
    setTimeout(() => {
      if (gen !== forkGen || state.session !== s || s.fork !== fork) return; // 过期代次：零副作用
      fork.status = 'done';
      runCard.querySelector('.chip').outerHTML = chip('chip-ok', '已产生结果');
      const bar = runCard.querySelector('.bar'); if (bar) bar.remove();
      runCard.appendChild(el(`<div class="sa-result">
        <p><strong>Mock 结果 ${D.forkResult.eviId}：</strong>${D.forkResult.eviText}</p>
        <p>${D.forkResult.conclusion}</p>
        <p class="fine">结果保留在本对话；只有你点击「回流到来源对话」后，来源对话才会出现待处理结果。</p>
      </div>`));
      $('#fork-foot').innerHTML = `<div class="actions">
        <button class="btn btn-primary btn-sm" type="button" data-fork-act="reflow">回流到来源对话</button>
        <span class="fine">回流只是把结果送到来源对话待处理，<strong>不等于采纳</strong>；重复回流不会创建第二张卡。</span>
      </div>`;
      renderSessionList(); renderDrawer();
    }, 1500);
  }

  /* Fork 手动回流：幂等，重复触发不产生第二张待处理卡 */
  function reflowFork() {
    const s = state.session;
    if (!s || !s.fork || !hasResult(s.fork)) return;
    if (s.pending.some(r => r.srcId === 'F-01')) { toast('已回流：来源对话已有唯一待处理结果，不重复创建'); return; }
    s.fork.reflowed = true;
    addPendingCard({ srcId: 'F-01', srcType: 'Fork', method: '手动', eviId: D.forkResult.eviId, eviText: D.forkResult.eviText });
    const btn = $('#fork-foot [data-fork-act="reflow"]');
    if (btn) btn.outerHTML = chip('chip-ok', '已回流到来源对话');
    renderSessionList(); renderDrawer();
    toast('已回流到来源对话：出现一张待处理结果（不等于采纳）');
  }

  let subGen = 0; // 单调代次：过期回调零副作用
  function runSubagent() {
    const s = state.session;
    if (!s || s.subagent) return;
    const failRun = $('#toggle-fail-subagent').checked;
    const task = { id: 'bg-' + (++state.seq), name: 'Subagent S-01 · 权益到期证据核验', status: 'running', reflow: 'none', adopt: undefined };
    s.subagent = task;
    state.bgTasks.push(task);
    // 独立子对话：类型、任务状态、来源对话、继承范围、独立历史与返回路径
    const th = $('#thread-subagent');
    th.innerHTML = '';
    $('#subagent-foot').innerHTML = '';
    th.appendChild(el(`<div class="card-inline" id="sa-run-card">
      <div class="ci-head"><span class="ci-name">S-01 · 权益到期证据核验</span>${chip('chip-run', '运行中')}</div>
      <p class="fine">有界任务：只在继承的已批准聚合子集（A-01）上复核权益到期分布，返回证据摘要；<code>010_draw</code> 不参与。成功后自动回流到来源对话。</p>
      <div class="bar bar-sm"><span class="bar-fill"></span></div>
      <div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-sa-act="cancel">取消 Subagent</button></div>
    </div>`));
    renderBg(); renderSessionList(); renderDrawer();
    switchConvo('subagent');
    toast('Subagent 已启动；可切到专业模式观察后台继续运行');
    const gen = ++subGen;
    setTimeout(() => {
      if (gen !== subGen || state.session !== s || s.subagent !== task || task.status !== 'running') return; // 过期代次/已取消：零副作用
      const card = $('#sa-run-card');
      const bar = card.querySelector('.bar'); if (bar) bar.remove();
      const acts = card.querySelector('.actions'); if (acts) acts.remove();
      if (failRun) {
        task.status = 'failed';
        card.querySelector('.chip').outerHTML = chip('chip-fail', '失败');
        card.appendChild(el(`<div class="err-card" role="alert">
          <p><strong>失败路径 3：Subagent 失败（模拟）。</strong>原因（合成）：继承切片缺少权益到期标记字段，核验未完成。</p>
          <p class="fine">fail closed：不伪造核验结果、不回流；主 Session 可继续，既有批准范围与主报告链不被扩大。</p>
        </div>`));
      } else {
        task.status = 'done';
        card.querySelector('.chip').outerHTML = chip('chip-ok', '成功');
        card.appendChild(el(`<div class="sa-result">
          <p><strong>返回证据摘要 ${D.subagentResult.eviId}：</strong>${D.subagentResult.eviText}</p>
          <p>${D.subagentResult.conclusion}</p>
          <p class="fine">原始数据未离开本机；结果已登记来源（Subagent S-01）。</p>
        </div>`));
        attemptAutoReflow('自动');
      }
      renderBg(); renderSessionList(); renderDrawer();
      if (state.mode === 'pro') toast(`快速模式后台任务${failRun ? '失败' : '完成'}：Subagent S-01`);
    }, 3200);
  }

  /* Subagent 自动回流 / 幂等重试：最终最多一张待处理卡 */
  function attemptAutoReflow(method) {
    const s = state.session;
    const task = s && s.subagent;
    if (!task || !hasResult(task)) return;
    if (s.pending.some(r => r.srcId === 'S-01')) { // 幂等：已有唯一待处理卡
      task.reflow = 'ok';
      renderSubagentFoot(); renderDrawer();
      return;
    }
    if (method === '自动' && $('#toggle-fail-reflow').checked) {
      task.reflow = 'failed'; // 结果保留在子对话；来源对话不出现伪成功结果
      renderSubagentFoot(); renderDrawer();
      toast('Subagent 自动回流失败（模拟）：结果保留在子对话，可重试回流');
      return;
    }
    task.reflow = 'ok';
    addPendingCard({ srcId: 'S-01', srcType: 'Subagent', method, eviId: D.subagentResult.eviId, eviText: D.subagentResult.eviText });
    renderSubagentFoot(); renderDrawer();
    if (state.view !== 'main') toast(`Subagent 结果已${method}回流到来源对话（待处理，不等于采纳）`);
  }
  function retryReflow() {
    const s = state.session;
    const task = s && s.subagent;
    if (!task || task.reflow !== 'failed') return; // 幂等：非失败态不动作
    task.reflow = 'retrying';
    renderSubagentFoot();
    const gen = ++subGen;
    setTimeout(() => {
      if (gen !== subGen || state.session !== s || s.subagent !== task) return;
      if (task.reflow !== 'retrying') return;
      attemptAutoReflow('重试'); // 成功后状态「已回流」且按钮消失；重复重试由 srcId 守卫保持唯一
    }, 900);
  }
  function renderSubagentFoot() {
    const s = state.session;
    const task = s && s.subagent;
    const foot = $('#subagent-foot');
    if (!task || !hasResult(task)) { foot.innerHTML = ''; return; }
    if (task.reflow === 'ok') {
      foot.innerHTML = `<p>${chip('chip-ok', '已回流到来源对话')} <span class="fine">成功态不提供手动回流；来源对话恰有一张待处理结果。</span></p>`;
    } else if (task.reflow === 'failed') {
      foot.innerHTML = `<div class="err-card" role="alert">
        <p><strong>自动回流失败/超时（模拟）。</strong>结果保留在本对话；来源对话未出现伪成功结果。</p>
        <div class="actions"><button class="btn btn-primary btn-sm" type="button" data-sa-act="retry">重试回流</button></div>
      </div>`;
    } else if (task.reflow === 'retrying') {
      foot.innerHTML = `<p>${chip('chip-run', '重试回流中…')}</p>`;
    } else {
      foot.innerHTML = `<p>${chip('chip-run', '自动回流中…')}</p>`;
    }
  }

  function cancelSubagent() {
    const s = state.session;
    const task = s && s.subagent;
    if (!task || task.status !== 'running') return;
    task.status = 'cancelled'; // 之后的成功/失败回调因 status 检查而失效
    const card = $('#sa-run-card');
    card.querySelector('.chip').outerHTML = chip('chip-cancel', '已取消');
    const bar = card.querySelector('.bar'); if (bar) bar.remove();
    const acts = card.querySelector('.actions'); if (acts) acts.remove();
    card.appendChild(el(`<div class="err-card" role="note">
      <p><strong>失败路径 3：Subagent 已取消。</strong>无任何结果产物，不回流。</p>
      <p class="fine">主 Session 可继续；既有批准范围与主报告链不被扩大。</p>
    </div>`));
    renderBg(); renderSessionList(); renderDrawer();
  }

  /* ---------------- 来源对话的待处理结果：查看 / 采纳 / 不采纳 ---------------- */
  function addPendingCard(r) {
    const s = state.session;
    s.pending.push(r);
    const card = el(`<div class="card-inline pending-card" id="pending-${r.srcId}">
      <div class="ci-head"><span class="ci-name">待处理结果 · ${r.eviId}</span>${chip('chip-wait', '待采纳决定')}</div>
      <dl class="kv">
        <div><dt>来源</dt><dd>${r.srcType} ${r.srcId}（独立子对话）</dd></div>
        <div><dt>回流方式</dt><dd>${r.method}回流</dd></div>
        <div><dt>证据摘要</dt><dd>${r.eviText}</dd></div>
      </dl>
      <p class="fine">回流不修改主证据、结论或报告；只有「采纳」才进入主报告链。</p>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" type="button" data-pending="view" data-src="${r.srcId}">查看来源对话</button>
        <button class="btn btn-primary btn-sm" type="button" data-pending="adopt" data-src="${r.srcId}">采纳</button>
        <button class="btn btn-ghost btn-sm" type="button" data-pending="reject" data-src="${r.srcId}">不采纳</button>
      </div>
    </div>`);
    $('#thread').appendChild(card);
    if (state.view === 'main') scrollThread();
  }

  function pendingAction(srcId, act) {
    const s = state.session;
    const r = s && s.pending.find(x => x.srcId === srcId);
    if (!r) return;
    if (act === 'view') { switchConvo(srcId === 'F-01' ? 'fork' : 'subagent'); return; }
    if (r.status && r.status !== 'pending') return;
    const card = $('#pending-' + srcId);
    if (act === 'reject') {
      r.status = 'rejected';
      const owner = srcId === 'F-01' ? s.fork : s.subagent;
      if (owner) owner.adopt = false;
      card.querySelector('.ci-head .chip').outerHTML = chip('chip-wait', '未采纳');
      card.querySelector('.actions').remove();
      card.appendChild(el('<p class="fine">未采纳：不进入主证据与报告链；结果保留在来源对话备查。</p>'));
    } else if (act === 'adopt') {
      r.status = 'adopted';
      const owner = srcId === 'F-01' ? s.fork : s.subagent;
      if (owner) owner.adopt = true;
      card.querySelector('.ci-head .chip').outerHTML = chip('chip-ok', '已采纳');
      card.querySelector('.actions').remove();
      let msg = `${r.eviId} 已进入主证据集；来源 ${r.srcType} ${srcId}。`;
      if (s.report) {
        // v0.1 报告升版规则：旧版本被取代，不得声称旧报告已包含新证据
        const prev = s.report.version;
        s.report.version += 1;
        s.report.status = 'draft';
        s.dirs['060_reports'].push({ name: reportFileName(), status: 'draft', version: s.report.version });
        refreshReportCard(`因采纳 ${r.srcType} ${srcId} 证据 ${r.eviId}，报告已升版为 <strong>draft v${s.report.version}</strong>；v${prev} 已被取代，且不包含 ${r.eviId}。`);
        msg += ` 报告同步升版为 draft v${s.report.version}（v${prev} 未包含本证据）。`;
        toast(`已采纳 ${r.eviId}：报告升版为 draft v${s.report.version}，需重新确认 final`);
      } else {
        msg += ' 生成报告时将按来源链纳入。';
      }
      card.appendChild(el(`<p class="fine">${msg}</p>`));
    }
    renderSessionList(); renderDrawer();
  }

  /* ---------------- 报告：draft → final，版本化写入 060_reports ---------------- */
  function reportFileName() {
    const s = state.session;
    return `repurchase_diagnosis_report.v${s.report.version}.${s.report.status}.md`;
  }
  function reportBodyHTML() {
    const s = state.session;
    const adopted = s.pending.filter(r => r.status === 'adopted');
    const adoptedLines = adopted.map(r => {
      const c = r.srcId === 'F-01' ? D.forkResult.conclusion : D.subagentResult.conclusion;
      return `<p>已采纳${r.srcType}证据：${c}（${r.eviId}，来源 ${r.srcType} ${r.srcId}，${r.method}回流）。</p>`;
    }).join('');
    const chainTail = adopted.length ? ' → ' + adopted.map(r => `${r.eviId}（已采纳${r.srcType}）`).join(' → ') : '';
    return `
      <h3>结论（仅收录「已支持」）</h3>
      <p>近 90 天高价值会员复购下滑与<strong>会员权益到期未续费的窗口期集中</strong>显著相关（E-201）。</p>
      ${adoptedLines}
      <h3>反例与限制</h3>
      <ul><li>H1 缺码假设证据不足，不作为结论（E-101）。</li><li>H3 天气假设未证实，不进入报告。</li></ul>
      <p class="fine">来源链：010_draw 原始文件（模型不可见）→ 020_clean/A-01（已批准）→ 分析结论${chainTail}。未采纳的子对话产物不进入本报告链。</p>`;
  }
  function refreshReportCard(notice) {
    const s = state.session;
    const card = $('#report-card');
    if (!s || !s.report || !card) return;
    card.querySelector('.ci-head .chip').outerHTML = chip(s.report.status === 'final' ? 'chip-ok' : 'chip-wait', `${s.report.status} v${s.report.version}`);
    card.querySelector('.report-body').innerHTML =
      (notice ? `<p class="report-notice" role="note">${notice}</p>` : '') + reportBodyHTML();
    card.querySelector('.actions').innerHTML =
      (s.report.status === 'draft' ? '<button class="btn btn-primary btn-sm" type="button" data-act="finalize">确认为 final</button>' : '')
      + '<button class="btn btn-ghost btn-sm" type="button" data-act="print-report">打印报告</button>';
  }
  function genReport() {
    const s = state.session;
    if (!s || !s.analyzed || s.report) return;
    s.report = { version: 1, status: 'draft' };
    s.dirs['060_reports'].push({ name: reportFileName(), status: 'draft', version: 1 });
    const r = D.report;
    $('#thread').appendChild(el(`<div class="card-inline card-report" id="report-card">
      <div class="ci-head"><span class="ci-name">${r.title}</span>${chip('chip-wait', 'draft v1')}</div>
      <p class="fine">${r.meta}</p>
      <div class="report-body"></div>
      <div class="actions no-print"></div>
    </div>`));
    refreshReportCard();
    renderDrawer(); scrollThread();
    toast('报告草稿已出现在对话内，并以 draft v1 写入 Mock 060_reports');
  }

  function finalizeReport() {
    const s = state.session;
    if (!s || !s.report || s.report.status === 'final') return;
    s.report.status = 'final';
    const item = s.dirs['060_reports'].find(x => x.version === s.report.version);
    if (item) { item.status = 'final'; item.name = reportFileName(); }
    refreshReportCard();
    renderDrawer(); scrollThread();
    toast(`报告已确认为 final v${s.report.version}；版本与来源可在辅助抽屉核对`);
  }

  /* ---------------- 辅助抽屉 ---------------- */
  function renderDrawer() {
    const s = state.session;
    $('#drawer-session-name').textContent = s ? `（${s.name}）` : '（未创建 Session）';
    const tree = $('#dirtree'); tree.innerHTML = '';
    if (!s) {
      tree.appendChild(el('<li class="dirtree-empty fine">创建 Session 后，此处显示 <code>010_draw</code> / <code>020_clean</code> / <code>060_reports</code> 的内容。</li>'));
    } else {
      Object.keys(s.dirs).forEach(dir => {
        const items = s.dirs[dir];
        const li = el(`<li><span class="dirname">▸ <code>${dir}/</code></span>
          ${items.length ? `<ul role="list">${items.map(it => `<li>
            <span class="fine">${it.name}</span>
            ${dir === '010_draw' ? chip('chip-local', '模型不可见') : ''}
            ${dir === '020_clean' ? (it.approved ? chip('chip-ok', '已批准') : chip('chip-wait', '未确认')) : ''}
            ${dir === '060_reports' ? chip(it.status === 'final' ? 'chip-ok' : 'chip-wait', it.status) + (s.report && it.version < s.report.version ? chip('chip-wait', '已被取代') : '') : ''}
          </li>`).join('')}</ul>` : '<span class="fine dirtree-empty">（空）</span>'}</li>`);
        tree.appendChild(li);
      });
    }
    const subset = $('#drawer-subset'); subset.innerHTML = '';
    if (s && s.approved.size) {
      subset.appendChild(el(`<li><strong>A-01</strong> weekly_repurchase_by_tier.agg ${chip('chip-ok', '已批准')}<br><span class="fine">本 Session 首次使用已确认；复用不再重复打扰。原始数据（010_draw）不在此子集。</span></li>`));
      if (s.fork) subset.appendChild(el(`<li>Fork F-01 继承：A-01 精确子集 ${chip('chip-fork', '⑂ Fork')}<br><span class="fine">从不继承 010_draw。</span></li>`));
    } else {
      subset.appendChild(el('<li class="fine">无已批准聚合产物；原始数据（010_draw）永远不进入此子集。</li>'));
    }
    const prov = $('#drawer-provenance'); prov.innerHTML = '';
    if (s && s.processed) {
      prov.appendChild(el('<li><strong>A-01</strong> · 来源：本地处理（提取/清洗/聚合），输入 010_draw · 输出 020_clean</li>'));
      const adoptChip = (o) => o.adopt === true ? chip('chip-ok', '已采纳') : o.adopt === false ? chip('chip-wait', '未采纳') : '';
      if (s.fork) {
        const f = s.fork;
        if (hasResult(f)) {
          // 仅结果产生后登记 E-301
          const st = f.reflowed ? chip('chip-ok', '已手动回流') : chip('chip-wait', '有结果 · 待回流');
          prov.appendChild(el(`<li><strong>${D.forkResult.eviId}</strong> · 来源：Fork F-01（独立子对话，基于 A-01 子集） ${st} ${adoptChip(f)}</li>`));
        } else {
          prov.appendChild(el(`<li>Fork F-01（独立子对话） ${chip('chip-run', '运行中')}<br><span class="fine">尚无结果；证据 ID 在结果产生后登记。</span></li>`));
        }
      }
      if (s.subagent) {
        const t = s.subagent;
        if (hasResult(t)) {
          // 仅任务成功后登记 E-302；自动回流失败发生在成功之后，结果仍在子对话，可显示
          const st = t.reflow === 'ok' ? chip('chip-ok', '已回流（自动/重试）')
            : t.reflow === 'failed' ? chip('chip-fail', '自动回流失败 · 可重试')
            : chip('chip-run', '完成 · 回流中');
          prov.appendChild(el(`<li><strong>${D.subagentResult.eviId}</strong> · 来源：Subagent S-01（独立任务对话，基于 A-01 子集） ${st} ${adoptChip(t)}</li>`));
        } else {
          // 运行中/失败/取消：只有任务身份与状态，永不显示证据 ID（fail closed）
          const st = t.status === 'running' ? chip('chip-run', '运行中')
            : t.status === 'failed' ? chip('chip-fail', '失败')
            : chip('chip-cancel', '已取消');
          prov.appendChild(el(`<li>Subagent S-01（独立任务对话） ${st}<br><span class="fine">无结果产物；不登记证据 ID，不回流。</span></li>`));
        }
      }
    } else {
      prov.appendChild(el('<li class="fine">暂无产物。</li>'));
    }
    const reps = $('#drawer-reports'); reps.innerHTML = '';
    if (s && s.report) {
      [...s.dirs['060_reports']].reverse().forEach(it => {
        const superseded = it.version < s.report.version;
        reps.appendChild(el(`<li><strong>v${it.version}</strong> ${it.name} ${chip(it.status === 'final' ? 'chip-ok' : 'chip-wait', it.status)}${superseded ? chip('chip-wait', `已被 v${s.report.version} 取代`) : ''}<br><span class="fine">${superseded ? '历史版本，不含后续采纳的子任务证据。' : '当前版本；先在对话内出现，再版本化写入 060_reports；来源可核对。'}</span></li>`));
      });
    } else {
      reps.appendChild(el('<li class="fine">暂无报告。</li>'));
    }
  }

  function toggleDrawer(show, trigger) {
    const d = $('#drawer');
    const willShow = typeof show === 'boolean' ? show : d.hidden;
    if (willShow === !d.hidden) return; // 状态不变
    if (willShow) {
      d.hidden = false;
      $('#btn-drawer').setAttribute('aria-expanded', 'true');
      renderDrawer();
      pushLayer({ sel: '#drawer', trigger, focusSel: '#btn-drawer-close', modal: false,
        hide: () => { d.hidden = true; $('#btn-drawer').setAttribute('aria-expanded', 'false'); } });
    } else if (layerStack.some(x => x.sel === '#drawer')) {
      closeLayer('#drawer');
    } else {
      d.hidden = true;
      $('#btn-drawer').setAttribute('aria-expanded', 'false');
      if (trigger && document.contains(trigger)) trigger.focus();
    }
  }

  /* ---------------- 全局搜索（跨模式 + 模式徽标 + 键盘导航） ---------------- */
  let paletteIdx = -1;
  function openPalette(trigger) {
    $('#palette-veil').hidden = false;
    renderPalette('');
    const input = $('#palette-input'); input.value = '';
    pushLayer({ sel: '#palette-veil', trigger, focusSel: '#palette-input', modal: true, hide: () => { $('#palette-veil').hidden = true; } });
  }
  function closePalette() { closeLayer('#palette-veil'); }
  function setPaletteActive(i) {
    const btns = $$('.palette-item');
    if (!btns.length) { paletteIdx = -1; return; }
    paletteIdx = ((i % btns.length) + btns.length) % btns.length;
    btns.forEach((b, j) => b.classList.toggle('active', j === paletteIdx));
    btns[paletteIdx].scrollIntoView({ block: 'nearest' });
  }
  function renderPalette(q) {
    const ul = $('#palette-list'); ul.innerHTML = '';
    const all = state.sessions.filter(s => !q || s.name.includes(q));
    const items = all.map(s => ({ label: s.name, mode: s.mode }));
    items.push({ label: '重置演示状态', mode: null, act: 'reset' });
    items.forEach((it, idx) => {
      const li = el(`<li><button class="palette-item" type="button" role="option" data-idx="${idx}">
        ${it.mode ? chip(it.mode === 'quick' ? 'chip-quick' : 'chip-pro', it.mode === 'quick' ? '快速' : '专业') : chip('chip-wait', '命令')}
        ${it.label}</button></li>`);
      const btn = li.querySelector('button');
      btn.addEventListener('mouseenter', () => setPaletteActive(idx));
      btn.addEventListener('click', () => {
        if (it.act === 'reset') { location.reload(); return; }
        closePalette();
        if (it.mode !== state.mode) setMode(it.mode, { silent: true });
        toast(`已定位到${it.mode === 'quick' ? '快速' : '专业'} Session：${it.label}（Session 类型不变，无升级/降级入口）`);
      });
      ul.appendChild(li);
    });
    setPaletteActive(0);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    $('#mode-quick').addEventListener('click', e => setMode('quick'));
    $('#mode-pro').addEventListener('click', e => setMode('pro'));
    // 模式 tablist：左右方向键切换并移动焦点（自动激活）
    $('.mode-switch').addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = state.mode === 'quick' ? 'pro' : 'quick';
      setMode(next);
      (next === 'quick' ? $('#mode-quick') : $('#mode-pro')).focus();
    });
    $('#bg-pill').addEventListener('click', () => setMode('quick'));
    $('#sb-bg-list').addEventListener('click', () => setMode('quick'));
    $('#btn-new-session').addEventListener('click', createSession);
    $('#btn-new-session-main').addEventListener('click', createSession);
    $('#btn-send').addEventListener('click', sendMessage);
    $('#composer-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendMessage(); }
    });
    $('#chip-skill').addEventListener('click', e => openPicker('skill', e.currentTarget));
    $('#chip-prompt').addEventListener('click', e => openPicker('prompt', e.currentTarget));
    $('#btn-picker-close').addEventListener('click', closePicker);
    $('#picker-veil').addEventListener('click', e => { if (e.target.id === 'picker-veil') closePicker(); });
    $('#btn-fork').addEventListener('click', e => {
      const s = state.session;
      if (missingSteps().length) { lockedEntry('Fork'); return; } // 可见反馈，不静默、不创建空子对话
      if (s && s.fork) { switchConvo('fork'); return; }
      openFork(e.currentTarget);
    });
    $('#btn-subagent').addEventListener('click', () => {
      const s = state.session;
      if (missingSteps().length) { lockedEntry('Subagent'); return; }
      if (s && s.subagent) { switchConvo('subagent'); return; }
      runSubagent();
    });
    $('#btn-fork-close').addEventListener('click', closeFork);
    $('#fork-veil').addEventListener('click', e => { if (e.target.id === 'fork-veil') closeFork(); });
    $('#fork-inherit-raw').addEventListener('change', e => { $('#fork-scope-block').hidden = !e.target.checked; });
    $('#btn-fork-create').addEventListener('click', createFork);
    $('#btn-report').addEventListener('click', genReport);
    // 子对话视图切换（侧栏会话树节点 + 子对话「返回来源对话」）
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-convo]');
      if (b) switchConvo(b.dataset.convo);
    });
    // Fork 子对话动作（手动回流）
    $('#fork-foot').addEventListener('click', e => {
      const b = e.target.closest('[data-fork-act]');
      if (b && b.dataset.forkAct === 'reflow') reflowFork();
    });
    // Subagent 子对话动作（取消 / 重试回流）
    $('#convo-subagent').addEventListener('click', e => {
      const b = e.target.closest('[data-sa-act]');
      if (!b) return;
      if (b.dataset.saAct === 'cancel') cancelSubagent();
      else if (b.dataset.saAct === 'retry') retryReflow();
    });
    $('#btn-drawer').addEventListener('click', e => toggleDrawer(undefined, e.currentTarget));
    $('#btn-drawer-close').addEventListener('click', () => toggleDrawer(false));
    $('#btn-palette').addEventListener('click', e => openPalette(e.currentTarget));
    $('#palette-veil').addEventListener('click', e => { if (e.target.id === 'palette-veil') closePalette(); });
    $('#palette-input').addEventListener('input', e => renderPalette(e.target.value.trim()));
    // 全局搜索键盘导航：↑↓ 移动高亮，Enter 执行高亮项
    $('#palette-input').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteActive(paletteIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteActive(paletteIdx - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const btns = $$('.palette-item');
        if (btns[paletteIdx]) btns[paletteIdx].click();
      }
    });

    // 线程内联卡动作（事件委托）
    $('#thread').addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'run-process') runProcess();
      else if (act === 'try-raw') blockCard('模型请求已阻断', '附件位于 <code>010_draw</code>，属于原始数据，<strong>不会发送给模型</strong>；该请求未发出，不产生分析结果。', '运行本地处理生成聚合产物', 'run-process');
      else if (act === 'try-unapproved') blockCard('模型请求已阻断', 'A-01 是新产生的 <code>020_clean</code> 聚合产物，首次用于模型前必须完成一次显式确认。', '完成一次可见性确认', 'approve');
      else if (act === 'approve') approveAgg();
      else if (act === 'approve-later') toast('已暂缓批准；发送分析请求前可随时回到该卡完成确认');
      else if (act === 'open-drawer') toggleDrawer(true, btn);
      else if (act === 'finalize') finalizeReport();
      else if (act === 'print-report') window.print();
    });

    // 主对话待处理结果卡动作：查看 / 采纳 / 不采纳
    $('#thread').addEventListener('click', e => {
      const btn = e.target.closest('[data-pending]');
      if (btn) pendingAction(btn.dataset.src, btn.dataset.pending);
    });

    // 拖入 Mock 文件（真实拖放 + 键盘等价）
    const composer = $('#composer');
    $$('.mock-file').forEach(mf => {
      mf.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', mf.dataset.file); });
      mf.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); attachFile(mf.dataset.file); } });
    });
    composer.addEventListener('dragover', e => { e.preventDefault(); composer.classList.add('drag-over'); });
    composer.addEventListener('dragleave', () => composer.classList.remove('drag-over'));
    composer.addEventListener('drop', e => {
      e.preventDefault(); composer.classList.remove('drag-over');
      const name = e.dataTransfer.getData('text/plain');
      if (D.rawFiles[name]) attachFile(name);
    });

    // 键盘：Esc 逐层关闭栈顶弹层；快捷键
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeTopLayer(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(document.activeElement); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); toggleDrawer(undefined, document.activeElement); }
    });
  }

  /* ---------------- 初始化 ---------------- */
  bind();
  setMode('quick', { silent: true }); // 首次进入默认快速模式
  renderDrawer();
  renderBg();
})();
