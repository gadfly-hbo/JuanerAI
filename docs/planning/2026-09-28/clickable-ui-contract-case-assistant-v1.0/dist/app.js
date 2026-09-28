(() => {
  const initialTaskText = '基于已经确认的证据，帮我比较“对权益到期会员做小范围续费触达”和“本轮暂不行动”，最后形成可审阅的决策草案。';
  const makeDefaultDraft = () => ({
    type: 'candidate',
    rationale: '复购下滑集中在权益到期窗口；证据支持先验证小范围触达，而不是全面推广。',
    owner: '林岚 · 会员运营',
    evidence: 'Evidence E-07 / E-11 · Finding F-03 · 限制 L-02',
    alternatives: '本轮不行动；扩大到所有沉默会员（因证据不足不采用）',
    limitations: '渠道归因未验证；触达疲劳仅有聚合口径',
    baseline: '到期窗口 30 日复购率 18.4% · Evidence E-07',
    metric: '权益到期会员 / 30 日复购率',
    expected: '方向：提升；范围：+2～4 个百分点；仍需受控验证',
    window: '首轮触达后 30 天',
    guardrail: '退订率不高于基线 +0.5pp；单会员补贴不超过批准额度',
    resultSource: 'CRM 复购事件聚合 · Owner：数据运营',
    evaluation: '林岚在窗口结束后复盘停止、调整或扩大'
  });
  const makeDraftForRevision = (revision) => {
    const draft = makeDefaultDraft();
    if (revision === 'r8') {
      draft.evidence = 'Evidence E-13 / E-15 · Finding F-05 · 限制 L-04';
      draft.baseline = '到期窗口 30 日复购率 19.1% · Evidence E-13';
      draft.limitations = '渠道归因已补齐；触达疲劳仍只有聚合口径';
    }
    return draft;
  };
  const payloadForRevision = (revision) => revision === 'r8'
    ? '020_clean-r8@sha256:demo-r8 · fields: cohort, repeat_rate, repeat_revenue · aggregate rows 4；Evidence E-13/E-15；Finding F-05；final report r8-v1 摘要。'
    : '020_clean-r7@sha256:demo-r7 · fields: cohort, repeat_rate, repeat_revenue · aggregate rows 3；Evidence E-07/E-11；Finding F-03；final report v1 摘要。';

  const state = {
    mode: 'quick',
    attempt: 'unapproved',
    attemptNumber: 1,
    attempts: [{ id: 'A-01', status: '未开始' }],
    draft: 'none',
    adopted: false,
    boundRevision: 'r7',
    currentRevision: 'r7',
    blocker: null,
    adoptionShouldFail: false,
    timers: [],
    activeTab: 'grant',
    authContext: 'initial',
    lastUserMessage: '',
    draftData: makeDefaultDraft(),
    isRevisionDraft: false,
    formalVersions: [],
    actualMessages: [],
    actualReceipts: [],
    authReuse: { messages: [], receipts: [] },
    staleKind: null,
    currentDecisionVersion: null,
    revisionBaseDecision: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const timeline = $('#timeline');
  const scroll = $('#conversationScroll');
  const authDialog = $('#authorizationDialog');
  const genericDialog = $('#genericDialog');
  const adoptDialog = $('#adoptDialog');
  const editDialog = $('#editDialog');
  const rejectDialog = $('#rejectDialog');
  const revisionDialog = $('#revisionDialog');
  const attemptId = () => `A-${String(state.attemptNumber).padStart(2, '0')}`;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function setMode(mode) {
    state.mode = mode;
    $('#quickView').classList.toggle('hidden', mode !== 'quick');
    $('#professionalView').classList.toggle('hidden', mode !== 'professional');
    $$('.mode-button').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  }

  function openGeneric(title, html) {
    $('#genericTitle').textContent = title;
    $('#genericBody').innerHTML = html;
    genericDialog.showModal();
  }

  function clearTimers() {
    state.timers.forEach(window.clearTimeout);
    state.timers = [];
  }

  function setAttemptHistory(status) {
    const current = state.attempts.find((item) => item.id === attemptId());
    if (current) current.status = status;
  }

  function addMessage(role, label, body) {
    const article = document.createElement('article');
    article.className = `message dynamic ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    article.innerHTML = `<div class="message-meta"><span>${escapeHtml(label)}</span><span>Attempt ${attemptId()} · 刚刚</span></div><p>${escapeHtml(body)}</p>`;
    timeline.append(article);
    scroll.scrollTop = scroll.scrollHeight;
  }

  function addToolReceipt(name, summary, denied = false) {
    const details = document.createElement('details');
    details.className = 'tool-receipt dynamic';
    details.open = true;
    details.innerHTML = `<summary><span>${denied ? '⊘' : '✓'} ${escapeHtml(name)}</span><span>${denied ? '已拒绝 · 超出任务授权' : '只读 · 完成'}</span></summary><div>${escapeHtml(summary)}<br>来源：会员复购分析 · revision ${state.boundRevision} · payload 审计记录已规范化保存。</div>`;
    timeline.append(details);
    if (!denied) state.actualReceipts.push(`${attemptId()}/T-${String(state.actualReceipts.length + 1).padStart(2, '0')}「${name}」：${summary}`);
    scroll.scrollTop = scroll.scrollHeight;
  }

  function updateStatus(label, tone = 'amber') {
    $('#attemptStatus').textContent = label;
    $('#railStatusText').textContent = label;
    $('#railStatus').className = `status-dot ${tone}`;
  }

  function renderAuthorization() {
    $('#grantSource').textContent = `会员复购分析 · ${state.boundRevision} · Completed`;
    $('#grantTitle').textContent = `确认 Attempt ${attemptId()} 的任务授权`;
    $('#grantProvider').textContent = state.blocker === 'provider' ? '未授权' : 'UI Contract Fake Provider';
    $('#grantTurns').textContent = state.blocker === 'budget' ? '缺失：未配置' : '最多 6 轮';
    $('#grantWait').textContent = state.blocker === 'budget' ? '缺失：未配置' : '最多 24 小时（演示值）';
    const blocker = $('#grantBlocker');
    blocker.classList.toggle('hidden', !state.blocker);
    if (state.blocker === 'provider') blocker.innerHTML = '<strong>Provider 未授权</strong><span>必须先由用户批准 Provider / Model；不能开始 Attempt。</span>';
    if (state.blocker === 'budget') blocker.innerHTML = '<strong>硬上限不完整</strong><span>模型轮次与等待截止时间都必须有确切值；不能开始 Attempt。</span>';
    if (state.authContext === 'continue') {
      const currentFormal = state.formalVersions.at(-1);
      const hasRevisionBaseline = Boolean(state.revisionBaseDecision && currentFormal);
      $('#grantTaskHeading').textContent = '新 Attempt 将逐字重发的产品消息';
      $('#grantTaskText').textContent = state.authReuse.messages.length ? state.authReuse.messages.join('\n') : '无产品消息被选择重发。';
      $('#grantTaskNote').textContent = '只重发上方逐字消息；没有自动重发整段对话。';
      $('#grantDataDetails').textContent = hasRevisionBaseline
        ? `${payloadForRevision(state.boundRevision)}；当前正式决定 ${currentFormal.decision} / ${currentFormal.outcome} / 报告 ${currentFormal.report} 摘要。`
        : payloadForRevision(state.boundRevision);
      const receiptList = state.authReuse.receipts.length
        ? state.authReuse.receipts.map((receipt) => `<li>${escapeHtml(receipt)}</li>`).join('')
        : '<li>无已发生且被选择的工具回执</li>';
      const reportSummary = hasRevisionBaseline
        ? `当前正式 ${escapeHtml(currentFormal.decision)} / ${escapeHtml(currentFormal.outcome)} / 报告 ${escapeHtml(currentFormal.report)} 摘要。`
        : `${state.boundRevision === 'r8' ? 'final report r8-v1' : 'final report v1'} 摘要。`;
      const revisionExclusions = hasRevisionBaseline ? '、基于旧正式基线的草案和模型文本' : '';
      $('#grantHistoryDetails').innerHTML = `<p><strong>外发消息：</strong>${state.authReuse.messages.length} 条（上方逐字列出）。</p><p><strong>外发规范化回执：</strong></p><ul>${receiptList}</ul><p><strong>报告：</strong>${reportSummary}</p><p><strong>排除：</strong>Pi transcript、未发生或未选择的回执、附件、路径和其他 Session 历史${revisionExclusions}。</p>`;
    } else if (state.authContext === 'rebind') {
      $('#grantTaskHeading').textContent = '重新绑定后逐字外发的用户文本';
      $('#grantTaskText').textContent = `${initialTaskText}\n用户约束：${state.lastUserMessage}`;
      $('#grantTaskNote').textContent = '只有这两条用户文本被重新确认；旧 revision 的模型文本不会携带。';
      $('#grantDataDetails').textContent = payloadForRevision(state.boundRevision);
      $('#grantHistoryDetails').innerHTML = '<p><strong>外发：</strong>上方两条用户文本；r8 的 E-13/E-15、F-05 与 final report r8-v1 摘要。</p><p><strong>明确排除：</strong>r7 的 E-07/E-11、F-03、report v1、A-01 工具结果、模型文本及 Pi transcript。</p>';
    } else if (state.authContext === 'decision-rebind') {
      $('#grantTaskHeading').textContent = '基于当前正式决定重新开始';
      $('#grantTaskText').textContent = initialTaskText;
      $('#grantTaskNote').textContent = `同一 revision 的当前决定已更新为 ${state.currentDecisionVersion}；旧草案与模型文本不会携带。`;
      $('#grantDataDetails').textContent = `${payloadForRevision(state.boundRevision)}；当前正式决定 ${state.currentDecisionVersion} 摘要。`;
      $('#grantHistoryDetails').innerHTML = `<p><strong>外发：</strong>上方初始任务、r7 授权数据及 ${escapeHtml(state.currentDecisionVersion)} 摘要。</p><p><strong>明确排除：</strong>基于“无当前正式决定”生成的旧草案、旧模型文本、旧工具回执及 Pi transcript。</p>`;
    } else {
      $('#grantTaskHeading').textContent = '初始任务文本 · 逐字外发';
      $('#grantTaskText').textContent = initialTaskText;
      $('#grantTaskNote').textContent = '后续只有你在 Composer 点击“发送”的可见文本会逐字发给同一 Provider。';
      $('#grantDataDetails').textContent = payloadForRevision(state.boundRevision);
      $('#grantHistoryDetails').innerHTML = '<p><strong>外发：</strong>无旧消息或工具回执；仅发送上述初始任务与 r7 授权数据。</p><p><strong>排除：</strong>Pi transcript、未选择报告版本、附件、路径和其他 Session 历史。</p>';
    }
    $('#confirmAuthorization').disabled = Boolean(state.blocker) || !$('#sensitiveConfirm').checked;
  }

  function openAuthorization() {
    $('#sensitiveConfirm').checked = false;
    renderAuthorization();
    authDialog.showModal();
  }

  function showPromptInfo() {
    openGeneric('Prompt 信息 · 只读', '<p><strong>版本：</strong>case-decision@1.0</p><p><strong>用途：</strong>基于一个 Completed Case 的已保存候选，补齐 Decision Record 与 Expected Outcome。</p><p><strong>输入边界：</strong>仅任务授权中逐项列出的业务投影。</p><p><strong>输出约束：</strong>只能提交待采纳草案；不得宣称已决定、已写入或已执行。</p><p>本 Change 不提供 Prompt 编辑或导入。</p>');
  }

  function decisionLabel(type) {
    return {
      candidate: '选择已有候选：受控续费触达试验',
      'no-action': '本轮明确不行动',
      defer: '暂缓决定，等待重新评估触发条件'
    }[type];
  }

  function renderDraftData() {
    const data = state.draftData;
    $('#decisionChoice').textContent = decisionLabel(data.type);
    $('#decisionRationale').textContent = data.rationale;
    $('#decisionOwner').textContent = `${data.owner} / 采纳时记录`;
    $('#decisionAlternatives').textContent = data.alternatives;
    $('#decisionLimitations').textContent = data.limitations;
    $('#expectedBaseline').textContent = data.type === 'candidate' ? data.baseline : '不适用：当前决定不执行候选行动';
    $('#expectedMetric').textContent = data.type === 'candidate' ? data.metric : '不适用：在重新评估触发前不观察行动结果';
    $('#expectedValue').textContent = data.type === 'candidate' ? data.expected : `不适用原因：${data.expected}`;
    $('#expectedWindow').textContent = data.window;
    $('#expectedGuardrail').textContent = data.type === 'candidate' ? data.guardrail : '不适用：未执行行动';
    $('#resultSource').textContent = data.type === 'candidate' ? data.resultSource : '不适用：重新评估时另行确认';
    $('#evaluationOwner').textContent = data.evaluation;
    $('#evidenceReferences').textContent = data.evidence;
  }

  function updateEditBranch() {
    const type = $('input[name="decisionType"]:checked').value;
    const candidate = type === 'candidate';
    $$('.candidate-only').forEach((label) => label.classList.toggle('hidden', !candidate));
    $('#branchRequirements').textContent = candidate
      ? '选择已有候选：全部 Decision Record 与 Expected Outcome 字段必填。'
      : `${type === 'no-action' ? '不行动' : '暂缓'}：理由、责任人、证据、替代项、限制、不适用原因、重新评估触发和评价责任人必填；行动基线、指标、Guardrail 与未来结果来源记为不适用。`;
  }

  function syncEditFormFromDraft() {
    const data = state.draftData;
    $(`input[name="decisionType"][value="${data.type}"]`).checked = true;
    $('#editRationale').value = data.rationale;
    $('#editOwner').value = data.owner;
    $('#editEvidence').value = data.evidence;
    $('#editAlternatives').value = data.alternatives;
    $('#editLimitations').value = data.limitations;
    $('#editBaseline').value = data.baseline;
    $('#editMetric').value = data.metric;
    $('#editExpected').value = data.expected;
    $('#editWindow').value = data.window;
    $('#editGuardrail').value = data.guardrail;
    $('#editResultSource').value = data.resultSource;
    $('#editEvaluation').value = data.evaluation;
    updateEditBranch();
  }

  function renderDrawer() {
    const historyRows = state.attempts.map((item) => `<div class="drawer-row"><span>${item.id}</span><strong>${item.status}</strong></div>`).join('');
    const reportRows = [...state.formalVersions].reverse().map((item, index) => `<div class="drawer-row"><span>${item.report}</span><strong>${index === 0 ? '当前' : 'superseded'} · ${escapeHtml(decisionLabel(item.data.type))}</strong></div>`).join('');
    const panels = {
      grant: `<div class="drawer-panel"><div class="drawer-card"><h3>任务级授权</h3><div class="drawer-row"><span>来源</span><strong>会员复购分析 · ${state.boundRevision}</strong></div><div class="drawer-row"><span>Provider / Model</span><strong>${state.blocker === 'provider' ? '未授权' : 'Fake / synthetic'}</strong></div><div class="drawer-row"><span>执行 / 等待</span><strong>${state.blocker === 'budget' ? '缺失' : '300s / 24h（演示）'}</strong></div><div class="drawer-row"><span>费用</span><strong>¥2.00（演示）</strong></div><div class="drawer-callout">授权会列出逐字文本、精确 subset 和实际外发历史；本页面不调用真实模型。</div></div><button class="primary-button drawer-auth">查看完整授权</button></div>`,
      source: `<div class="drawer-panel"><div class="drawer-card"><h3>来源 Case</h3><div class="drawer-row"><span>Case</span><strong>会员复购分析</strong></div><div class="drawer-row"><span>绑定 revision</span><strong>${state.boundRevision}</strong></div><div class="drawer-row"><span>当前 revision</span><strong>${state.currentRevision}</strong></div><div class="drawer-row"><span>Case 状态</span><strong>Completed</strong></div><div class="drawer-row"><span>Decision Closure</span><strong>有效 · 不改写</strong></div></div><div class="drawer-card"><h3>权威边界</h3><p>来源 Completed revision 是业务事实。新决定只追加版本；对话、工具摘要和 Pi session 都不能覆盖它。</p></div></div>`,
      capability: `<div class="drawer-panel"><div class="drawer-card"><h3>Case 决策与预期 v1.0</h3><p>只用于比较已保存候选、补齐 Decision Record 与 Expected Outcome，并提交待采纳草案。</p><div class="drawer-row"><span>Prompt</span><strong>case-decision@1.0</strong></div><button class="secondary-button prompt-info">查看 Prompt 信息</button></div><div class="drawer-card"><h3>未启用</h3><ul><li>Fork · Preview</li><li>Subagent · Preview</li><li>Prompt 编辑</li><li>自定义 Skill</li><li>Web / Shell / 行动执行</li></ul></div></div>`,
      history: `<div class="drawer-panel"><div class="drawer-card"><h3>Attempt 历史</h3>${historyRows}</div><div class="drawer-card"><h3>报告版本</h3>${reportRows}<div class="drawer-row"><span>v1</span><strong>${state.formalVersions.length ? 'superseded · 可读' : '当前 final'}</strong></div>${state.formalVersions.length ? '' : '<p>草案阶段未创建新报告。</p>'}</div></div>`
    };
    $('#drawerContent').innerHTML = panels[state.activeTab];
    $('.drawer-auth')?.addEventListener('click', openAuthorization);
    $('.prompt-info')?.addEventListener('click', showPromptInfo);
  }

  function renderReportHistory() {
    const versionButtons = [...state.formalVersions].reverse().map((item, index) => `<button type="button" data-report-version="${item.report}">${item.report} · ${index === 0 ? '当前' : 'superseded · 可读'} · ${escapeHtml(decisionLabel(item.data.type))}</button>`).join('');
    $('#reportHistory').innerHTML = `${versionButtons}<button type="button" data-report-version="v1">v1 · ${state.formalVersions.length ? 'superseded · 可读' : 'final · 当前'}</button>`;
  }

  function renderState() {
    $('#stopButton').disabled = !['running', 'waiting'].includes(state.attempt);
    $('#continueButton').disabled = !['stopped', 'failed', 'interrupted', 'wait-timeout'].includes(state.attempt);
    const budgetText = {
      unapproved: `Attempt ${attemptId()} · 需要任务授权`,
      running: '剩余 4/6 轮 · 执行 00:18/05:00 · ¥0.31/¥2.00（演示）',
      waiting: '等待用户 · 执行计时已暂停 · 等待截止剩余 23:58（演示）',
      stopped: `${attemptId()} 已停止 · 继续将创建新 Attempt`,
      failed: 'Provider 失败 · Case 未改变',
      completed: `${attemptId()} 已完成 · 等待用户审阅`
    };
    $('#budgetIndicator').textContent = budgetText[state.attempt] || `${attemptId()} 已中断 · Case 未改变`;
    $('#draftCard').classList.toggle('hidden', state.draft === 'none' || (state.draft === 'adopted' && !state.isRevisionDraft));
    $('#adoptedCard').classList.toggle('hidden', !state.adopted || state.isRevisionDraft);
    $('#staleNotice').classList.toggle('hidden', state.draft !== 'stale');
    $('#draftSource').textContent = `草案 v1 · Attempt ${attemptId()} · 来源 revision ${state.boundRevision}`;
    const immutableDraft = state.draft === 'stale' || state.draft === 'rejected' || (state.adopted && !state.isRevisionDraft);
    $('#adoptDraft').disabled = immutableDraft;
    $('#editDraft').disabled = immutableDraft;
    $('#rejectDraft').disabled = immutableDraft;
    $('#cancelPendingRevision').classList.toggle('hidden', !state.isRevisionDraft);
    if (state.draft === 'stale') {
      $('#draftBadge').className = 'state-badge red';
      $('#draftBadge').textContent = '已过期 · 禁止采纳';
      const decisionConflict = state.staleKind === 'decision';
      $('#staleTitle').textContent = decisionConflict ? '当前正式决定已变化，草案已过期' : '来源已变化，草案已过期';
      $('#staleCopy').textContent = decisionConflict
        ? `草案基于“无当前正式决定”，同一 revision ${state.boundRevision} 现已有 ${state.currentDecisionVersion}。请查看变化并创建新 Attempt。`
        : `草案基于 ${state.boundRevision}，当前 Case 为 ${state.currentRevision}。请查看变化并创建新 Attempt。`;
      $('#viewChanges').textContent = decisionConflict ? `查看无记录 → ${state.currentDecisionVersion}` : `查看 ${state.boundRevision} → ${state.currentRevision} 变化`;
      $('#rebindCurrent').textContent = decisionConflict ? '基于当前正式决定重新开始' : `基于 ${state.currentRevision} 重新开始`;
    } else if (state.draft === 'rejected') {
      $('#draftBadge').className = 'state-badge red';
      $('#draftBadge').textContent = '已拒绝 · Case 未改变';
    } else if (state.draft !== 'none' && (state.isRevisionDraft || !state.adopted)) {
      $('#draftBadge').className = 'state-badge amber';
      $('#draftBadge').textContent = state.isRevisionDraft ? '修订草案 · 未产生新版本' : '待采纳 · 无业务写入';
    }
    $('#professionalRevision').textContent = state.currentRevision;
    $('#railSource').textContent = `来源：会员复购分析 · ${state.boundRevision}`;
    $('#sourceLink').textContent = `会员复购分析 · revision ${state.boundRevision} ↗`;
    $('#boundSourceSummary').textContent = state.boundRevision === 'r8'
      ? '已绑定 revision r8：14 条已验证证据、5 个已采纳 Finding、1 项分析限制。'
      : '已绑定 revision r7：12 条已验证证据、4 个已采纳 Finding、2 项分析限制。';
    renderDraftData();
    renderAuthorization();
    renderDrawer();
  }

  function startAttempt() {
    clearTimers();
    if (state.authContext === 'continue') state.actualMessages = [...state.authReuse.messages];
    else if (state.authContext === 'rebind') state.actualMessages = [initialTaskText, `用户约束：${state.lastUserMessage}`];
    else state.actualMessages = [initialTaskText];
    state.actualReceipts = [];
    state.blocker = null;
    state.attempt = 'running';
    setAttemptHistory('运行中');
    updateStatus('运行中', 'green');
    addMessage('assistant', 'Case Assistant · 建议', '任务授权已记录。我先读取已验证证据和限制，然后会追问一个仍缺失的决策条件。');
    renderState();
    const receiptSummary = state.boundRevision === 'r8'
      ? '返回获准的 Evidence E-13/E-15、Finding F-05、限制 L-04 及 final report r8-v1 摘要。'
      : '返回获准的 Evidence E-07/E-11、Finding F-03、2 条限制及 final report v1 摘要。';
    state.timers.push(setTimeout(() => addToolReceipt('读取已验证证据', receiptSummary), 450));
    state.timers.push(setTimeout(() => {
      addMessage('assistant', 'Case Assistant · 建议', '若试验未达到预期，你希望由谁在 30 天窗口结束时决定停止、调整或扩大？');
      state.attempt = 'waiting';
      setAttemptHistory('等待用户');
      updateStatus('等待用户', 'amber');
      renderState();
    }, 900));
  }

  function finishAfterUserAnswer() {
    state.attempt = 'running';
    setAttemptHistory('运行中');
    updateStatus('运行中', 'green');
    renderState();
    state.timers.push(setTimeout(() => {
      addToolReceipt('校验草案完整性', 'Decision Record 与 Expected Outcome 必填语义完整；计划结果来源与评价责任人已提供。');
      state.attempt = 'completed';
      if (state.revisionBaseDecision) state.isRevisionDraft = true;
      state.draft = 'pending';
      setAttemptHistory('已完成 · 草案待审');
      updateStatus('草案待审', 'amber');
      renderState();
      scroll.scrollTop = scroll.scrollHeight;
    }, 650));
  }

  function stopAttempt() {
    if (!['running', 'waiting'].includes(state.attempt)) return;
    clearTimers();
    state.attempt = 'stopped';
    setAttemptHistory('已停止');
    updateStatus('已停止', 'red');
    addMessage('assistant', '系统状态', `Attempt ${attemptId()} 已停止。不会发生新的模型轮次或工具调用，来源 Case 没有改变。`);
    renderState();
  }

  function continueAttempt() {
    state.authReuse = { messages: [...state.actualMessages], receipts: [...state.actualReceipts] };
    state.attemptNumber += 1;
    state.attempts.push({ id: attemptId(), status: '等待授权' });
    state.attempt = 'unapproved';
    state.blocker = null;
    state.authContext = 'continue';
    updateStatus('等待新授权', 'amber');
    renderState();
    const receiptText = state.authReuse.receipts.length ? `${state.authReuse.receipts.length} 条实际完成的规范化工具回执` : '无工具回执（停止前没有工具完成）';
    const currentFormal = state.revisionBaseDecision ? state.formalVersions.at(-1) : null;
    const baselineText = currentFormal
      ? `当前正式 ${escapeHtml(currentFormal.decision)} / ${escapeHtml(currentFormal.outcome)} / 报告 ${escapeHtml(currentFormal.report)} 摘要`
      : `revision ${escapeHtml(state.boundRevision)} 的当前报告摘要`;
    openGeneric('继续将创建新 Attempt', `<p>不会恢复 Pi 内部会话。新 Attempt ${attemptId()} 的授权将逐项显示：</p><ul><li>重发：${state.authReuse.messages.length} 条逐字用户消息</li><li>重发：${receiptText}</li><li>来源：${baselineText}</li><li>排除：Pi transcript、未发生/未选择历史、任意附件与路径${currentFormal ? '、基于旧正式基线的草案与模型文本' : ''}</li></ul><p><strong>关闭本说明后，请打开“查看完整授权”确认。</strong></p>`);
  }

  function reset() {
    clearTimers();
    Object.assign(state, {
      attempt: 'unapproved',
      attemptNumber: 1,
      attempts: [{ id: 'A-01', status: '未开始' }],
      draft: 'none',
      adopted: false,
      boundRevision: 'r7',
      currentRevision: 'r7',
      blocker: null,
      adoptionShouldFail: false
    });
    state.authContext = 'initial';
    state.lastUserMessage = '';
    state.draftData = makeDefaultDraft();
    state.isRevisionDraft = false;
    state.formalVersions = [];
    state.actualMessages = [];
    state.actualReceipts = [];
    state.authReuse = { messages: [], receipts: [] };
    state.staleKind = null;
    state.currentDecisionVersion = null;
    state.revisionBaseDecision = null;
    timeline.querySelectorAll('.dynamic').forEach((node) => node.remove());
    updateStatus('等待授权', 'amber');
    $('#reportVersion').textContent = 'v1';
    $('#reportNote').textContent = 'final · 当前';
    $('#professionalDecision').classList.add('hidden');
    renderReportHistory();
    $('#proAssistantTitle').textContent = '用 Case Assistant 记录正式决定';
    $('#proAssistantCopy').textContent = '在独立快速会话中比较已保存候选、补齐责任与预期结果。Agent 只能形成待采纳草案。';
    $('#professionalDecisionTitle').textContent = '受控续费触达试验';
    $('#professionalDecisionSummary').textContent = 'Decision Record DR-002 与 Expected Outcome EO-002 已绑定 revision r7。';
    $('#professionalOwner').textContent = '林岚';
    $('#professionalWindow').textContent = '30 天';
    $('#professionalReport').textContent = 'v2';
    renderState();
  }

  $$('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $$('[data-action="open-professional"]').forEach((button) => button.addEventListener('click', () => setMode('professional')));
  $$('[data-action="open-quick"]').forEach((button) => button.addEventListener('click', () => setMode('quick')));
  $('#openAuthorization').addEventListener('click', openAuthorization);
  $('#sensitiveConfirm').addEventListener('change', renderAuthorization);
  $('#confirmAuthorization').addEventListener('click', () => { authDialog.close(); startAttempt(); });
  $('#viewPrompt').addEventListener('click', showPromptInfo);
  $('#stopButton').addEventListener('click', stopAttempt);
  $('#continueButton').addEventListener('click', continueAttempt);
  $('#sendButton').addEventListener('click', () => {
    const input = $('#composerInput');
    const text = input.value.trim();
    if (!text) return;
    if (state.attempt === 'unapproved') { openAuthorization(); return; }
    if (!['running', 'waiting'].includes(state.attempt)) {
      openGeneric('需要新 Attempt', '<p>当前 Attempt 已终结。继续发送会先创建并确认新的任务授权。</p>');
      return;
    }
    addMessage('user', '你 · 逐字发送到 Fake Provider', text);
    state.lastUserMessage = text;
    state.actualMessages.push(text);
    input.value = '';
    if (state.attempt === 'waiting') finishAfterUserAnswer();
  });

  $$('input[name="decisionType"]').forEach((radio) => radio.addEventListener('change', updateEditBranch));
  $('#editDraft').addEventListener('click', () => {
    $('#editError').classList.add('hidden');
    syncEditFormFromDraft();
    editDialog.showModal();
  });
  $('#saveDraftEdit').addEventListener('click', () => {
    const type = $('input[name="decisionType"]:checked').value;
    const sharedRequired = ['#editRationale', '#editOwner', '#editEvidence', '#editAlternatives', '#editLimitations', '#editExpected', '#editWindow', '#editEvaluation'];
    const candidateRequired = ['#editBaseline', '#editMetric', '#editGuardrail', '#editResultSource'];
    const required = type === 'candidate' ? [...sharedRequired, ...candidateRequired] : sharedRequired;
    if (required.some((selector) => !$(selector).value.trim())) { $('#editError').classList.remove('hidden'); return; }
    state.draftData = {
      type,
      rationale: $('#editRationale').value.trim(),
      owner: $('#editOwner').value.trim(),
      evidence: $('#editEvidence').value.trim(),
      alternatives: $('#editAlternatives').value.trim(),
      limitations: $('#editLimitations').value.trim(),
      baseline: $('#editBaseline').value.trim(),
      metric: $('#editMetric').value.trim(),
      expected: $('#editExpected').value.trim(),
      window: $('#editWindow').value.trim(),
      guardrail: $('#editGuardrail').value.trim(),
      resultSource: $('#editResultSource').value.trim(),
      evaluation: $('#editEvaluation').value.trim()
    };
    renderDraftData();
    $('#draftBadge').textContent = '待采纳 · 经用户修改';
    editDialog.close();
    openGeneric('已保存用户修改', '<p>确定性完整性检查通过。Agent 不会自动覆盖你的字段；来源 Completed revision 与正式记录仍未改变。</p>');
  });

  $('#rejectDraft').addEventListener('click', () => rejectDialog.showModal());
  $('#confirmReject').addEventListener('click', () => {
    rejectDialog.close();
    state.draft = 'rejected';
    updateStatus('草案已拒绝', 'red');
    renderState();
    openGeneric('草案已拒绝', '<p>拒绝记录已保留。<strong>来源 Completed revision、Decision Record 和报告版本都没有改变。</strong></p>');
  });

  $('#adoptDraft').addEventListener('click', () => {
    const next = state.formalVersions.length + 2;
    const previousReport = next === 2 ? 'v1' : `v${next - 1}`;
    $('#adoptionWriteSummary').innerHTML = `<p>成功后将一次性追加：</p><ul><li>Decision Record DR-00${next} · ${escapeHtml(decisionLabel(state.draftData.type))}</li><li>Expected Outcome EO-00${next}</li><li>报告版本 v${next}（${previousReport} 成为可读 superseded history）</li></ul><p><strong>不改变：</strong>来源 Completed revision ${escapeHtml(state.boundRevision)}、原 Finding 与 Decision Closure。</p>`;
    adoptDialog.showModal();
  });
  $('#confirmAdoption').addEventListener('click', () => {
    adoptDialog.close();
    if (state.adoptionShouldFail) {
      state.adoptionShouldFail = false;
      openGeneric('采纳失败 · 零半成功', '<p>模拟持久化事务失败。草案仍为待采纳；来源 Completed revision、Decision Record、Expected Outcome 与报告版本全部未改变。可以安全重试。</p>');
      return;
    }
    state.adopted = true;
    state.isRevisionDraft = false;
    state.attempt = 'completed';
    state.draft = 'adopted';
    const formalNumber = state.formalVersions.length + 2;
    const reportVersion = `v${formalNumber}`;
    state.formalVersions.push({
      decision: `DR-00${formalNumber}`,
      outcome: `EO-00${formalNumber}`,
      report: reportVersion,
      sourceRevision: state.boundRevision,
      adoptedBy: '本地用户',
      adoptedAt: '10:06',
      data: { ...state.draftData }
    });
    state.currentDecisionVersion = `DR-00${formalNumber}`;
    state.revisionBaseDecision = null;
    updateStatus('已采纳', 'green');
    $('#reportVersion').textContent = reportVersion;
    $('#reportNote').textContent = `${formalNumber === 2 ? 'v1' : `v${formalNumber - 1}`} superseded · 可读`;
    $('#professionalDecision').classList.remove('hidden');
    $('#professionalDecisionTitle').textContent = decisionLabel(state.draftData.type);
    $('#professionalDecisionSummary').textContent = `Decision Record DR-00${formalNumber} 与 Expected Outcome EO-00${formalNumber} 已绑定 revision ${state.boundRevision}；决定类型：${state.draftData.type === 'candidate' ? '选择已有候选' : state.draftData.type === 'no-action' ? '不行动' : '暂缓'}。`;
    $('#professionalOwner').textContent = state.draftData.owner;
    $('#professionalWindow').textContent = state.draftData.window;
    $('#professionalReport').textContent = reportVersion;
    $('#adoptedSummary').textContent = `由本地用户于 10:06 采纳 · 来源 revision ${state.boundRevision} · 报告 ${reportVersion} 已创建，旧版本保留。`;
    renderReportHistory();
    $('#proAssistantTitle').textContent = 'Decision Record 已采纳';
    $('#proAssistantCopy').textContent = `正式 ${decisionLabel(state.draftData.type)}、Expected Outcome 与报告 ${reportVersion} 已追加；来源 ${state.boundRevision} 仍为 Completed，原 Closure 未改写。`;
    renderState();
    scroll.scrollTop = scroll.scrollHeight;
  });

  $('#startDecisionRevision').addEventListener('click', () => {
    const currentFormal = state.formalVersions.at(-1);
    const nextNumber = state.formalVersions.length + 2;
    $('#revisionDialogCopy').textContent = `当前 ${currentFormal?.decision || 'Decision Record'}、${currentFormal?.outcome || 'Expected Outcome'} 与报告 ${currentFormal?.report || 'v2'} 保持有效。创建只会产生待审修订草案；取消不会生成 DR-00${nextNumber} / EO-00${nextNumber} 或报告 v${nextNumber}。`;
    revisionDialog.showModal();
  });
  $('#cancelDecisionRevision').addEventListener('click', () => {
    revisionDialog.close();
    const currentFormal = state.formalVersions.at(-1);
    const nextNumber = state.formalVersions.length + 2;
    openGeneric('修订已取消 · 无新版本', `<p>当前正式 ${escapeHtml(currentFormal?.decision || 'Decision Record')}、${escapeHtml(currentFormal?.outcome || 'Expected Outcome')} 与报告 ${escapeHtml(currentFormal?.report || 'v2')} 保持不变；没有创建草案、DR-00${nextNumber} / EO-00${nextNumber} 或报告 v${nextNumber}。</p>`);
  });
  $('#createDecisionRevision').addEventListener('click', () => {
    revisionDialog.close();
    const currentFormal = state.formalVersions.at(-1);
    if (currentFormal) state.draftData = { ...currentFormal.data };
    state.revisionBaseDecision = currentFormal?.decision || null;
    state.isRevisionDraft = true;
    state.draft = 'pending';
    state.attempt = 'completed';
    updateStatus('决定修订草案待审', 'amber');
    renderState();
    $('#draftBadge').textContent = '修订草案 · 未产生新版本';
    setMode('quick');
    scroll.scrollTop = scroll.scrollHeight;
  });
  $('#cancelPendingRevision').addEventListener('click', () => {
    const currentFormal = state.formalVersions.at(-1);
    if (currentFormal) state.draftData = { ...currentFormal.data };
    state.isRevisionDraft = false;
    state.draft = 'adopted';
    state.revisionBaseDecision = null;
    updateStatus('已采纳', 'green');
    renderState();
    openGeneric('修订草案已取消', `<p>未生成新的 Decision Record、Expected Outcome 或报告版本。当前正式记录与报告 ${escapeHtml(currentFormal?.report || 'v2')} 保持不变。</p>`);
  });
  $('#reportHistory').addEventListener('click', (event) => {
    const button = event.target.closest('[data-report-version]');
    if (!button) return;
    const version = button.dataset.reportVersion;
    if (version === 'v1') {
      openGeneric(state.adopted ? '报告 v1 · superseded · 可读' : '报告 v1 · 当前 final', `<p>原 final report：会员复购分析结论、Evidence 与 Finding。它不包含本 Change 的正式决定，内容未被改写。</p><p>${state.adopted ? '被 v2 取代只改变“当前版本”指向；v1 继续可读和可追踪。' : '尚未采纳决定，因此它仍是当前报告。'}</p>`);
      return;
    }
    const record = state.formalVersions.find((item) => item.report === version);
    if (!record) return;
    const isCurrent = state.formalVersions.at(-1)?.report === version;
    openGeneric(`报告 ${version} · ${isCurrent ? '当前' : 'superseded · 可读'}`, `<p><strong>固定来源：</strong>revision ${escapeHtml(record.sourceRevision)} · ${escapeHtml(record.decision)} · ${escapeHtml(record.outcome)}</p><p><strong>采纳：</strong>${escapeHtml(record.adoptedBy)} · ${escapeHtml(record.adoptedAt)}</p><p><strong>正式决定：</strong>${escapeHtml(decisionLabel(record.data.type))}</p><p><strong>理由：</strong>${escapeHtml(record.data.rationale)}</p><p><strong>责任人：</strong>${escapeHtml(record.data.owner)}</p><p><strong>Evidence / Finding：</strong>${escapeHtml(record.data.evidence)}</p><p><strong>替代项：</strong>${escapeHtml(record.data.alternatives)}</p><p><strong>限制 / 未知：</strong>${escapeHtml(record.data.limitations)}</p><p><strong>基线：</strong>${escapeHtml(record.data.type === 'candidate' ? record.data.baseline : '不适用')}</p><p><strong>对象 / 指标：</strong>${escapeHtml(record.data.type === 'candidate' ? record.data.metric : '不适用')}</p><p><strong>预期 / 不适用原因：</strong>${escapeHtml(record.data.expected)}</p><p><strong>观察窗口 / 触发：</strong>${escapeHtml(record.data.window)}</p><p><strong>Guardrail：</strong>${escapeHtml(record.data.type === 'candidate' ? record.data.guardrail : '不适用')}</p><p><strong>结果来源：</strong>${escapeHtml(record.data.type === 'candidate' ? record.data.resultSource : '不适用')}</p><p><strong>评价安排：</strong>${escapeHtml(record.data.evaluation)}</p><p>其他报告版本保持可读。</p>`);
  });

  $('#viewChanges').addEventListener('click', () => {
    if (state.staleKind === 'decision') {
      openGeneric(`当前决定变化 · 无记录 → ${state.currentDecisionVersion}`, `<p>同一 Completed revision ${escapeHtml(state.boundRevision)} 未改变，但另一个 Session 已采纳 ${escapeHtml(state.currentDecisionVersion)} 并成为当前正式决定。</p><p><strong>旧草案基线已失效。</strong>必须基于当前正式决定创建新 Attempt；旧模型文本与工具回执不携带。</p>`);
      return;
    }
    openGeneric('来源变化 r7 → r8', '<p>r8 是新的 Completed 分析 revision，Evidence、Finding 与 final report 身份已变化。</p><p><strong>旧 r7 的 Evidence、报告、工具结果和模型文本不会带入新 Attempt。</strong>只有用户自写约束可在新授权中逐项确认。</p>');
  });
  $('#rebindCurrent').addEventListener('click', () => {
    const decisionConflict = state.staleKind === 'decision';
    if (!decisionConflict) state.boundRevision = state.currentRevision;
    const currentFormal = state.formalVersions.at(-1);
    state.draftData = decisionConflict && currentFormal ? { ...currentFormal.data } : makeDraftForRevision(state.boundRevision);
    state.revisionBaseDecision = decisionConflict && currentFormal ? currentFormal.decision : null;
    state.draft = 'none';
    state.attemptNumber += 1;
    state.attempts.push({ id: attemptId(), status: '等待重新授权' });
    state.attempt = 'unapproved';
    state.authContext = decisionConflict ? 'decision-rebind' : 'rebind';
    state.staleKind = null;
    updateStatus('等待重新授权', 'amber');
    renderState();
    openAuthorization();
  });

  $$('.drawer-tab').forEach((tab) => tab.addEventListener('click', () => {
    state.activeTab = tab.dataset.tab;
    $$('.drawer-tab').forEach((item) => item.classList.toggle('active', item === tab));
    renderDrawer();
  }));
  $$('.preview-chip').forEach((button) => button.addEventListener('click', () => {
    const isFork = button.dataset.preview === 'fork';
    openGeneric(`${isFork ? 'Fork' : 'Subagent'} · Preview`, `<p><strong>本 Change 不执行此能力。</strong></p><p>点击不会创建 Session、Attempt、工具调用或任何结果。未来启用顺序为 Fork 先于 Subagent，且两者都需要新的产品 Change 与 UI Gate。</p>`);
  }));

  $('#linkCaseButton').addEventListener('click', () => openGeneric('关联一个 Case', '<p>只列出具有 accepted Finding、有效 Decision Closure、Completed 状态和 final report 的 revision。</p><p>当前合成原型固定选择：<strong>会员复购分析 · revision r7 · Completed</strong>。Review 等其他状态会逐项显示缺失条件。</p>'));
  $('#scenarioToggle').addEventListener('click', () => $('#scenarioMenu').classList.toggle('hidden'));
  $('#scenarioReset').addEventListener('click', reset);
  $('#scenarioStop').addEventListener('click', () => { reset(); startAttempt(); state.timers.push(setTimeout(stopAttempt, 620)); });
  $('#scenarioProviderMissing').addEventListener('click', () => { reset(); state.blocker = 'provider'; renderState(); openAuthorization(); });
  $('#scenarioBudgetMissing').addEventListener('click', () => { reset(); state.blocker = 'budget'; renderState(); openAuthorization(); });
  $('#scenarioStale').addEventListener('click', () => {
    if (state.isRevisionDraft) clearTimers(); else reset();
    state.blocker = null;
    state.lastUserMessage = state.lastUserMessage || '由林岚在 30 天窗口结束时决定停止、调整或扩大。';
    state.attempt = 'completed';
    state.draft = 'stale';
    state.currentRevision = 'r8';
    state.staleKind = 'revision';
    setAttemptHistory('已完成 · 草案过期');
    updateStatus('草案已过期', 'red');
    renderState();
    scroll.scrollTop = scroll.scrollHeight;
  });
  $('#scenarioDecisionStale').addEventListener('click', () => {
    if (state.isRevisionDraft) clearTimers(); else reset();
    const formalNumber = state.formalVersions.length + 2;
    const currentData = state.formalVersions.at(-1)?.data || makeDraftForRevision(state.boundRevision);
    const currentRecord = {
      decision: `DR-00${formalNumber}`,
      outcome: `EO-00${formalNumber}`,
      report: `v${formalNumber}`,
      sourceRevision: state.boundRevision,
      adoptedBy: '另一 Session 的本地用户',
      adoptedAt: '10:02',
      data: { ...currentData }
    };
    state.formalVersions.push(currentRecord);
    state.adopted = true;
    state.attempt = 'completed';
    state.draft = 'stale';
    state.currentDecisionVersion = currentRecord.decision;
    state.staleKind = 'decision';
    $('#reportVersion').textContent = currentRecord.report;
    $('#reportNote').textContent = `${formalNumber === 2 ? 'v1' : `v${formalNumber - 1}`} superseded · 可读`;
    $('#professionalDecision').classList.remove('hidden');
    $('#professionalDecisionTitle').textContent = decisionLabel(currentRecord.data.type);
    $('#professionalDecisionSummary').textContent = `${currentRecord.decision} 与 ${currentRecord.outcome} 已绑定 revision ${currentRecord.sourceRevision}；由另一 Session 采纳。`;
    $('#professionalOwner').textContent = currentRecord.data.owner;
    $('#professionalWindow').textContent = currentRecord.data.window;
    $('#professionalReport').textContent = currentRecord.report;
    $('#adoptedSummary').textContent = `由另一 Session 的本地用户于 ${currentRecord.adoptedAt} 采纳 · 来源 revision ${currentRecord.sourceRevision} · 报告 ${currentRecord.report} 已创建，旧版本保留。`;
    $('#proAssistantTitle').textContent = '当前正式决定已由另一 Session 更新';
    $('#proAssistantCopy').textContent = `${currentRecord.decision}、${currentRecord.outcome} 与报告 ${currentRecord.report} 可读；旧草案必须重基后才能提交下一版本。`;
    renderReportHistory();
    setAttemptHistory('已完成 · 当前决定变化导致草案过期');
    updateStatus('草案已过期', 'red');
    renderState();
    scroll.scrollTop = scroll.scrollHeight;
  });
  $('#scenarioProviderError').addEventListener('click', () => {
    clearTimers();
    state.attempt = 'failed';
    setAttemptHistory('Provider 失败');
    updateStatus('Provider 失败', 'red');
    addMessage('assistant', '系统状态', 'Provider 请求失败。Attempt 已终结，来源 Case 没有改变；可以查看原因后创建新 Attempt。');
    renderState();
  });
  $('#scenarioAdoptionFailure').addEventListener('click', () => {
    reset();
    state.attempt = 'completed';
    state.draft = 'pending';
    state.adoptionShouldFail = true;
    setAttemptHistory('已完成 · 草案待审');
    updateStatus('草案待审 · 将演示采纳失败', 'amber');
    renderState();
    scroll.scrollTop = scroll.scrollHeight;
  });

  renderState();
})();
