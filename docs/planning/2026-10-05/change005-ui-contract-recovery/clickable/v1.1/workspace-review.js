/* 纯审核附件：无业务执行、文件读取、模型、网络、计时器或持久化。 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const action = (name, label, primary = false) => `<button type="button" class="btn btn-sm ${primary ? 'btn-primary' : ''}" data-action="${escape(name)}">${escape(label)}</button>`;
  const state = { scenario: 'normal', detail: 'context', mode: 'quick', skill: '按任务推荐', prompt: '专业分析', child: null, childStatus: 'waiting' };
  let focusReturn = null;
  let workspaceReturn = null;
  const revised = () => state.scenario === 'change';
  const version = () => revised() ? 'v2 · 排除新店' : 'v1 · 全部门店';
  const statuses = {
    normal: ['成果待检查（样例）', '业务理解 → 方案 → 执行与核验 → 成果；按实际任务推进'],
    empty: ['尚未开始', '说清问题并提供资料；明确内容不重复确认'],
    missing: ['等待必要资料', '已保留业务理解；没有凭空补数或计算'],
    premise: ['前提需要修正', '数据不支持“全部地区都下降”；可以修正问题继续'],
    running: ['正在执行（样例）', '正在按区域汇总；当前尚无核验完成的报告，不显示虚假百分比'],
    failed: ['执行失败', '准备结果保留；失败的分析尚未形成有效证据'],
    stopped: ['已停止（样例）', '后续工具与迟到发布已封闭；有效成果仍可查看'],
    reopen: ['已重开，未续跑', '服务重启不自动执行；显式继续先核验已有授权'],
    unknown: ['回执未知（UNKNOWN）', '先读回核验；不能直接重发、重算或显示成功'],
    change: ['新范围结果待检查（样例）', '仅重算受影响分析；v1历史保留，不覆盖旧报告']
  };
  const facts = () => revised() ? {before: 80, after: 76, rate: '-5%', east: [50,46], south: [30,30]} : {before: 100, after: 90, rate: '-10%', east: [60,50], south: [40,40]};
  const fields = (items) => `<dl>${items.map(([k,v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl>`;
  const understanding = () => `<h3>业务理解 · ${version()}</h3>${fields([
    ['用户原话', '看看本月销售为什么变化，按区域给我一个能用于经营讨论的结论。'],
    ['分析对象', '所选销售表中的门店与区域，不套用会员复购口径。'],
    ['指标与期间', '净销售额，单位万元；2026年8月与9月。月长不同，不能仅据总额推出日均趋势。'],
    ['资料事实', '表含门店、区域、销售额；门店说明含开业日期。'],
    ['当前范围', revised() ? '同店口径：两期前均已营业的门店。排除新店规则来自本次明确要求。' : '全部门店。新店可能影响可比性，尚不据此作因果主张。'],
    ['未知与限制', '不能仅凭两期比较认定变化原因；区域贡献是算术分解，不是因果。']
  ])}<p class="notice">来源、推断与未知分开；明确的定义后台复用，不要求每次填表或逐项批准。</p>${action('diff', '查看范围修改')}`;
  const plan = () => `<h3>可检查的分析方案 · ${version()}</h3><ol class="ledger">
    <li><strong>核对资料与业务口径</strong><br>检查单位、退货口径、门店映射与期间；只澄清会影响结果的歧义。</li>
    <li><strong>比较总体并分组</strong><br>以${revised() ? '同店' : '全部门店'}范围计算两期总额与区域贡献；检查不可比因素。</li>
    <li><strong>执行、独立核验与解释</strong><br>计划绑定当前资料、语义、参数与代码；核验不通过不发布正式事实。</li>
    <li><strong>形成有据报告</strong><br>明确发现、解释假设与下一步；你可追问或改变范围。</li></ol>
    <p class="notice">自然语言框架与机器计划对应。这里是可审查的方案，不是模型内部思维链。样例不代表动态IR已经运行。</p>
    ${fields([['当前技能', state.skill], ['表达模板', state.prompt], ['执行范围', '只读选定资料／本任务派生区；无网络、安装、凭据或原件写入。']])}
    <details><summary>高级检查：机器计划摘要</summary><p>输入：销售表与门店说明 → 净销售额定义及门店关联 → ${revised() ? '同店筛选' : '全量筛选'} → 按月、区域汇总 → 独立对账 → 报告。生产须绑定确切计划与Run身份，未知操作拒绝。</p></details>${action('diff', '修改分析范围')}`;
  const chart = () => {
    const f = facts();
    return `<svg class="chart" viewBox="0 0 540 240" role="img" aria-label="合成销售比较，${f.before}万元降至${f.after}万元，下降${f.rate}">
      <text x="28" y="28" fill="#4a5568" font-size="14">净销售额（万元） · ${revised() ? '同店' : '全部门店'}</text>
      <line x1="64" y1="190" x2="470" y2="190" stroke="#dfe3ea"/>
      <rect x="134" y="${190-f.before*1.25}" width="82" height="${f.before*1.25}" fill="#b9ccbd" rx="4"/>
      <rect x="322" y="${190-f.after*1.25}" width="82" height="${f.after*1.25}" fill="#277456" rx="4"/>
      <text x="175" y="${180-f.before*1.25}" text-anchor="middle" fill="#1d2433" font-size="18">${f.before}</text>
      <text x="363" y="${180-f.after*1.25}" text-anchor="middle" fill="#1d2433" font-size="18">${f.after}</text>
      <text x="175" y="215" text-anchor="middle" fill="#4a5568" font-size="13">2026年8月</text>
      <text x="363" y="215" text-anchor="middle" fill="#4a5568" font-size="13">2026年9月</text>
    </svg>`;
  };
  const evidence = () => {
    const f = facts();
    return `<h3>总体变化与区域对账 · ${version()}</h3><p class="fine">全部数字为合成UI样例，没有读取、计算或核验真实数据。</p>${chart()}
      <table><caption>合成分组结果 · 单位万元</caption><thead><tr><th>区域</th><th>8月</th><th>9月</th><th>变化额</th></tr></thead><tbody>
      <tr><td>华东</td><td>${f.east[0]}</td><td>${f.east[1]}</td><td>${f.east[1]-f.east[0]}</td></tr>
      <tr><td>华南</td><td>${f.south[0]}</td><td>${f.south[1]}</td><td>0</td></tr>
      <tr><td>合计</td><td>${f.before}</td><td>${f.after}</td><td>${f.after-f.before}</td></tr></tbody></table>
      <h3>可信程度分开看</h3><p><span class="chip chip-ok">已独立核验 · 样例状态</span> 总额与分组变化；生产须由独立计算与同计划来源支持。</p>
      <p><span class="chip chip-wait">AI解释／假设</span> 新店、价格或渠道可能影响变化，目前没有足够资料证明。</p>
      <p><span class="chip chip-run">探索结果 · 未核验</span> 未核验分析可供检查，不能写成正式事实或给整篇报告统一可信印章。</p>${action('report','查看有据报告')}`;
  };
  const fileContent = () => `<h3>资料与允许处理路径</h3>${fields([
    ['销售.xlsx（合成名称）', '快速主任务所需明细可按有效授权供模型理解；实际计算与独立核验仍在本地执行，不承诺明细零外发。'],
    ['门店说明.md（合成名称）', '非表格内容可按已获准材料配置供模型读取；本稿不读取文件。'],
    ['支持类型', 'MD、CSV、PDF、DOC/DOCX、PPT/PPTX、XLSX及图片；具体解析失败如实反馈。'],
    ['原件与派生', '原始资料只读，清理与分析输出单独保存，报告另存。'],
    ['权限差异', '快速主任务允许获准明细的产品选择已确认；实际材料／接收方须绑定有效配置，子任务扩展另核验。不用每次Attempt重新批准。']
  ])}<div class="card-actions">${action('authorization','查看授权差异')}${action('transform','查看变换预览')}</div>`;
  const execution = () => {
    const records = ['读取选定结构，解析单位与关联。', `使用框架对应的计划执行${revised() ? '同店筛选与' : ''}区域汇总。`, '独立对账；事实与解释分别进入报告。'];
    const current = {empty:['尚未开始，无执行记录。'], missing:['结构读取样例已完成；门店开业日期缺失，未开始同店计算。'], failed:['准备样例已保留；关联冲突导致分析失败，未发布新证据。'], running:['结构／口径检查完成（样例）。', '区域汇总进行中（样例）；核验与报告尚未开始。'], unknown:['上次操作回执未知；执行与发布结果需要先只读核验。'], stopped:['停止回执已受理并结束（样例），封闭后续与迟到正式发布。', '之前的有效结果可查看；不因此表示新执行成功。'], reopen:['历史任务已读回（样例），服务重启后未续跑。', '只展示已保存版本，显式继续先核验授权与缺失部分。']};
    return `<h3>执行与恢复 · 合成记录</h3><ol class="ledger">${(current[state.scenario] || records).map((record) => `<li>${escape(record)}</li>`).join('')}</ol><p>记录仅用于审核状态呈现；不是一次真正Agent或工具运行。</p>${fields([
    ['当前状态', statuses[state.scenario][0]], ['授权', '先核验已有有效授权；只在失效或范围变化时补授权。'], ['消费与重试', '不设累计额度上限，持久计量；超时／失败最多自动重试一次，不因重开清零。'], ['关页／刷新', '关页不是停止，已启动任务可在有效授权内继续；刷新只读。'], ['服务重启', '不自动续跑；显式继续只做缺失部分。'], ['UNKNOWN', '先读回核验，不盲目重发或标成功。']
    ])}`;
  };
  function renderDetail() {
    const content = {context: understanding, plan, files: fileContent, evidence, execution};
    $('detail-content').innerHTML = state.scenario === 'empty' ? '<p>尚未建立当前任务或采用资料。开始后这里显示实际口径、方案、资料与记录。</p>' : state.detail === 'evidence' && ['missing','failed','unknown','running'].includes(state.scenario) ? '<p>当前没有可发布的新证据。保留已有工作与失败／未知状态，不用样例填成功；历史成果须按准确身份单独读回。</p>' : content[state.detail]();
    $('detail-content').setAttribute('aria-labelledby', `tab-${state.detail}`);
    document.querySelectorAll('[data-detail]').forEach((button) => {
      const selected = button.dataset.detail === state.detail;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    });
  }
  function setScenario(next) {
    if (!Object.hasOwn(statuses, next)) return;
    state.scenario = next; state.child = null; $('scenario').value = next;
    $('workspace').hidden = true; $('thread').hidden = false;
    render();
  }
  function render() {
    const [status, note] = statuses[state.scenario];
    $('task-title').textContent = state.scenario === 'empty' ? '新建分析' : '销售变化分析';
    $('progress-summary').innerHTML = `<span class="dot ${['failed','unknown'].includes(state.scenario) ? 'dot-fail' : 'dot-ok'}" aria-hidden="true"></span><strong>${escape(status)}</strong><span>${escape(note)}</span>${action('execution','查看记录')}`;
    const f = facts();
    const cards = `<div class="analysis-card"><h2>业务理解</h2><p>比较两期净销售额，按区域定位变化。口径、可比性和未知都有来源，不先问一套指标表。</p><div class="card-actions">${action('context','检查业务理解')}${action('diff','修改范围')}</div></div>
      <div class="analysis-card"><h2>分析方案 <span class="chip chip-local">${version()}</span></h2><p>核对单位与门店 → 总体及区域比较 → 独立对账 → 有据报告。不是每个问题固定执行这四步。</p>${action('plan','展开分析方案')}</div>`;
    const result = `<div class="analysis-card"><h2>销售下降，变化集中在华东</h2><div class="metric-strip"><div><strong>${f.after} 万元</strong><span>9月净销售额</span></div><div><strong>${f.rate}</strong><span>相对8月变化</span></div></div><p>华南持平。区域贡献不是原因证明；下一步可检查门店可比性与渠道。</p><div class="card-meta">核验状态／证据引用均为合成审核表达 · ${version()}</div><div class="card-actions">${action('evidence','查看图表与证据')}${action('report','打开报告')}${action('diff','查看范围修改')}</div></div>`;
    const user = `<div class="message message-user">看看本月销售为什么变化，按区域给我一个能用于经营讨论的结论。</div>`;
    const notices = {
      missing: ['还缺一个影响结果的信息', '门店说明缺开业日期，不能可靠排除新店。你可以补门店资料，或明确先比较全部门店；不要求重填已经明确的指标。', action('files','查看缺少的资料')],
      premise: ['“所有地区都下降”不符合当前资料', '合成样例中华南持平，下降集中在华东。建议改为“哪些区域贡献了变化”；不能为了迎合前提编造结论。', action('normal','查看纠正后的问题（样例）')],
      running: ['区域汇总正在执行（样例）', '结构与口径检查完成，当前执行区域汇总；其后才进行独立对账和报告。可以查看工具记录或显式停止。关页不等于停止，服务重启不自动续跑。', action('execution','检查工具记录')],
      failed: ['分析执行失败，未发布新发现', '合成失败：门店关联冲突。结构检查已保留；不能静默删重后说分析完成。纠正输入或方案后才继续。', action('files','检查资料') + ' ' + action('resume','查看恢复条件')],
      stopped: ['停止完成，成果仍然可读', '合成停止回执：后续推进已封闭；没有新报告正式发布。显式继续会核验原授权与已完成部分，不清账。', action('resume','显式继续（查看条件）')],
      reopen: ['保存的任务已打开，尚未续跑', '服务重启不会自动调用模型或重跑工具。已完成方案与成果可看；继续时后台核验授权与缺失工作。', action('resume','显式继续（查看条件）')],
      unknown: ['无法确认上次操作是否完成', '当前只允许读回核验。不能用“继续”再次发送同一操作，也不把未知回执写成已保存／已成功。', action('readback','查看只读核验')],
      change: ['已改为排除新店 · v2样例', '全部门店100→90（-10%），同店80→76（-5%）。两个范围不同，旧报告保留；不是把标题改掉就算完成重算。', action('diff','查看变更与失效项')]
    };
    if (state.scenario === 'empty') {
      $('thread').innerHTML = `<div class="empty-intro"><h2>你想用数据弄清什么？</h2><p>交给我问题和资料。我们一起把业务含义、分析方法与结果讲清楚。</p><div class="card-actions">${action('normal','打开分析样例')}${action('files','查看资料入口')}</div><p class="fine">常规问答无需硬造分析计划。具体能力或权限不足时如实说明。</p></div>`;
    } else {
      const n = notices[state.scenario];
      $('thread').innerHTML = user + `<div class="message"><div class="message-label">JuanerAI · 合成审核回复</div>${n ? `<section class="state-note"><h2>${n[0]}</h2><p>${n[1]}</p><div class="card-actions">${n[2]}</div></section>` : '<p>先明确净销售额与比较范围，再看区域贡献。结论会区分可核验事实和仍需补证的解释。</p>'}${cards}${['normal','change','premise','stopped','reopen'].includes(state.scenario) ? result : ''}</div>`;
    }
    $('stop').disabled = ['empty','stopped','reopen','unknown'].includes(state.scenario);
    renderDetail();
  }
  function openWorkspace(title, html, focus = document.activeElement) {
    workspaceReturn = focus;
    $('workspace-heading').textContent = title; $('workspace-body').innerHTML = html;
    $('thread').hidden = true; $('workspace').hidden = false; $('workspace').focus();
  }
  function openDialog(title, html) {
    focusReturn = document.activeElement;
    $('dialog-title').textContent = title; $('dialog-body').innerHTML = html;
    if (!$('review-dialog').open) $('review-dialog').showModal();
  }
  function setMode(mode) {
    state.mode = mode;
    $('view-quick').hidden = mode !== 'quick'; $('view-pro').hidden = mode !== 'pro';
    document.body.dataset.contractSurface = mode;
    ['quick','pro'].forEach((key) => {const button = $(`mode-${key}`); const selected = mode === key; button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;});
    if (mode === 'pro') setDrawer(false);
  }
  function setDrawer(open) { $('drawer').hidden = !open; $('drawer-toggle').setAttribute('aria-expanded', String(open)); }
  const childView = () => {
    const kind = state.child === 'fork' ? '分支讨论' : '子任务：检查区域解释';
    openWorkspace(kind, `<p class="subtask-label">独立对话 · 单层人工发起 · ${version()}</p><p>来源：当前任务的确定版本与获准汇总／业务说明。不能默认读取全部项目或表格明细。</p><div class="message message-user">检查“华东下降”的解释有哪些证据缺口。</div><div class="analysis-card"><h3>${state.childStatus === 'failed' ? '子任务失败（样例）' : '待检查的协作意见'}</h3><p>${state.childStatus === 'failed' ? '保留来源及失败，不假称有成果回流。恢复先核验有效授权与已有工作。' : '区域变化只支持算术贡献；若要解释原因，需要价格、渠道或同店资料。'}</p><span class="chip chip-wait">MODEL意见 · 不是独立核验</span></div><p>回流状态：${escape(state.childStatus === 'accepted' ? '已关联采纳（审核内存）；正式Finding／Decision没有变化' : state.childStatus === 'rejected' ? '已拒绝（审核内存）；主任务未改' : state.childStatus === 'stopped' ? '子任务已停止（样例）' : state.childStatus === 'failed' ? '失败，未形成可采纳成果' : '待审，尚未采纳')}</p><div class="card-actions">${state.childStatus === 'waiting' ? action('child-accept','关联采纳（样例）') + action('child-reject','拒绝（样例）') : ''}${action('child-stop','停止子任务（样例）')}${action('child-fail','查看失败路径')}${state.childStatus === 'stopped' || state.childStatus === 'failed' ? action('child-resume','查看子任务恢复条件') : ''}</div>`);
  };
  function handle(name) {
    if (['context','plan','evidence','files','execution'].includes(name)) {
      if (state.scenario === 'empty') {openDialog(name === 'files' ? '添加资料 · 按问题使用' : '尚未建立当前分析', name === 'files' ? '<p>可以提供MD、CSV、PDF、DOC/DOCX、PPT/PPTX、XLSX及图片，不固定文件数量。快速主任务相关明细和文档可按有效授权供模型读取；本地工具实际处理与计算，并独立核验。严格明细零外发能力后续建设；生产接真实选择／解析／授权，本稿没有文件选择或读取。</p>' : '<p>先提出问题与选定必要资料。这里只检查当前任务，不用固定样例填一份尚不存在的业务理解、计划或执行记录。</p>'); return;}
      if (name === 'evidence' && ['empty','missing','failed','unknown','running'].includes(state.scenario)) {openDialog('当前没有新的有效证据', '<p>保留任务实际状态，不把审核图表当作本次运行成果。已有历史版本可以精确读回。</p>'); return;}
      const views = {context: understanding, plan, evidence, files: fileContent, execution};
      openWorkspace({context:'业务理解与口径', plan:'分析框架与执行计划', evidence:'图表与证据', files:'资料与授权', execution:'任务执行记录'}[name], views[name]()); return;
    }
    if (name === 'new') {setMode('quick'); setScenario('empty');}
    else if (name === 'normal') {setMode('quick'); setScenario('normal');}
    else if (name === 'professional') setMode('pro');
    else if (name === 'project') openDialog('本地项目', '<p>华东经营分析 · 合成项目。生产复用既有本地项目及原始／派生／报告目录创建；只有成功保存回执才建立可用任务。</p><p class="notice">本稿不创建目录、不切换真实项目、不访问业务文件。</p>');
    else if (name === 'search') openDialog('会话搜索 · 审核样例', `<p>生产只搜索当前有权限项目；历史任务精确读回，不自动重跑。</p><div class="option-list">${action('normal','销售变化分析 · 打开样例')}${action('professional','会员复购 · 打开专业参考')}${action('history','查看v1历史报告')}</div>`);
    else if (name === 'history') openDialog('v1历史报告（合成）', '<p>全部门店100→90万元，下降10%。范围：全部门店；口径：净销售额；期间：8月／9月。旧版本只读保留，不自动当成同店v2当前结论。</p>');
    else if (name === 'diff') openDialog('修改分析范围', `<p>你的追问：<strong>排除新开的门店，看看同店变化。</strong></p><table><thead><tr><th>项目</th><th>原v1</th><th>候选v2</th></tr></thead><tbody><tr><td>范围</td><td>全部门店</td><td>两期前均已营业门店</td></tr><tr><td>影响</td><td>原结果与报告保留</td><td>重算范围相关汇总／图表／报告</td></tr><tr><td>复用</td><td colspan="2">不变的原始快照、单位及有效准备结果</td></tr></tbody></table><p>生产先核验已用语义与授权；有新材料披露才补授权。表达修改不重算事实。</p>${action('apply-change','查看新范围结果（仅合成预览）', true)}`);
    else if (name === 'apply-change') { $('review-dialog').close(); setScenario('change'); }
    else if (name === 'skill') openDialog('内建技能 · 方法可查', `<p>生产须真正改变计划与工具消费者，不只是换标签。本稿只预览选择。</p><div class="option-list">${action('skill-quality','数据质量检查 v1 · 单位／关联／缺失资格')}${action('skill-group','分组比较 v1 · 总体与分组对账')}${action('skill-report','证据报告 v1 · 事实／解释／限制分开')}</div>`);
    else if (name.startsWith('skill-')) {state.skill = {'skill-quality':'数据质量检查', 'skill-group':'分组比较', 'skill-report':'证据报告'}[name]; $('skill-name').textContent = state.skill; $('review-dialog').close(); openWorkspace('技能如何进入方案', `<p>已选择：${escape(state.skill)}（审核内存）。选择覆盖当前建议；不自动获得新资料／工具权限。</p>${plan()}`); renderDetail();}
    else if (name === 'prompt') openDialog('提示模板 · 不替代口径或权限', `<p>调整表达／协作协议，不改变数据资格、工具授权、核验与正式判断。</p><div class="option-list">${action('prompt-pro','专业分析：证据与限制清晰')}${action('prompt-brief','经营简报：先结论，再证据与下一步')}</div>`);
    else if (name.startsWith('prompt-')) {state.prompt = name === 'prompt-pro' ? '专业分析' : '经营简报'; $('prompt-name').textContent = state.prompt; $('review-dialog').close(); openWorkspace('表达模板预览', `<p>${escape(state.prompt)}已选择（审核内存）。生产应改变真实表达，不触发事实重算或覆盖业务定义。</p>`); renderDetail();}
    else if (name === 'fork' || name === 'subagent') {
      if (['empty','missing','failed','unknown','running','stopped','reopen'].includes(state.scenario)) { openDialog('当前不具备协作启动条件', '<p>先确认任务状态、准确来源与合法材料，再人工发起。停止／重开需显式恢复，UNKNOWN不能通过子任务绕过读回；本稿不执行协作。</p>'); return; }
      state.child = name; state.childStatus = 'waiting';
      openDialog(name === 'fork' ? '人工创建分支讨论' : '人工委派有界子任务', `<p>检查当前${version()}的区域解释。后台先核验现有有效授权，不要求每个Attempt重新批准。</p><p>精确材料：本版本区域汇总、业务口径与获准门店说明；不含表格明细。新增开放材料许可仍待确认，审核点击不会赋予实际权限。</p><p class="notice">单层、顺序执行；子意见待审、不自动采纳或冒充独立验证。</p>${action('child-open','打开独立对话样例', true)}`);
    }
    else if (name === 'child-open') { $('review-dialog').close(); childView(); }
    else if (name.startsWith('child-')) {
      if (name === 'child-resume') {openDialog('子任务恢复条件', '<p>保留来源、状态、计量及重试机会。恢复核验现有授权、已有执行及失败原因，只补缺失工作；不是清零重开。本稿不会恢复真实任务。</p>'); return;}
      state.childStatus = {'child-accept':'accepted', 'child-reject':'rejected', 'child-stop':'stopped', 'child-fail':'failed'}[name] || state.childStatus; childView();
    }
    else if (name === 'report') {
      if (['empty','missing','failed','unknown','running'].includes(state.scenario)) {openDialog('尚无当前有效报告', '<p>不能用样例替代缺失或失败的成果。已有历史版本仍可精确读回；当前任务不得显示完成。</p>'); return;}
      const f = facts();
      openWorkspace('有据报告与人的判断', `<p class="fine">合成报告 · ${version()} · 未实际保存</p><h3>结论</h3><p>净销售额${f.before}→${f.after}万元（${f.rate}），变化来自华东，华南持平。分组对账并不证明原因。</p><h3>依据与限制</h3><p>对应本版数据、口径、计划及区域对账；本稿的“已核验”是状态样例。价格／渠道解释仍属假设。</p><div class="card-actions">${action('evidence','定位证据')}${action('comment','点评报告')}${action('download','查看下载行为')}</div><h3>你的下一步</h3><p>可认可这项分析、要求补证或进一步探索。没有正式业务选择时不强造Decision／Expected。</p>${action('judgment','查看认可与正式决定的区别')}<p class="notice">会员场景仍复用整体人审三出口与Expected护栏；开放任务不套会员Closure。推荐行动不等于现实执行。</p>`);
    }
    else if (name === 'comment') openDialog('报告点评', `<p>“写得简短”只改表达；“排除新店再比较”改变分析范围，须生成新计划和相应重算。旧版本保留。</p><div class="card-actions">${action('expression','查看仅表达修订')}${action('diff','查看范围修改')}</div>`);
    else if (name === 'expression') { $('review-dialog').close(); openWorkspace('仅表达修订 · 事实不重算', `<p>经营简报：销售变化集中在华东，华南持平；原因尚待补证。</p><p class="notice">合成表达预览。实际报告须复用当前有效事实／引用，只增加表达版本；不以模型重写替代核验。</p>`); }
    else if (name === 'judgment') openDialog('分析认可 ≠ 正式业务决定', `<p>开放任务以成果及核验等级已保存、可读回为本轮交付终点；待补证只显示待补证已保存，不显示原目标完成。到此停止本轮自动推进，不要求额外点一次确认。</p><p>认可仅为精确成果版本附加判断，不产生final／Completed、会员Closure、未经核验Finding、Decision／Expected或行动。成果已保存与用户已认可分开；取消不写入，保存失败／UNKNOWN不显示认可成功，先读回同一操作。</p><p>会员保留“仅确认分析／要求补证／记录决定”三个合法出口。仅确认分析按原合同整体保存适用Finding、合法Closure及最终报告；补证／暂不采纳不冒充分析完成；记录决定才按原合同保存Decision及适用Expected。Expected护栏可查看、修改、保存和历史读回，不改变旧整体合法性及原子性。</p><p>合成稿不提交判断或决定，不执行行动。下面仅比较不同回执的可见状态。</p><div class="card-actions">${action('judgment-success','查看成功回执样例')}${action('judgment-failure','查看失败回执样例')}${action('judgment-unknown','查看UNKNOWN样例')}</div>`);
    else if (name.startsWith('judgment-')) {
      const copy = {'judgment-success':['认可已保存（合成回执）', `为${version()}附加用户判断；既有成果保存状态独立，未创建Decision／Expected或自动执行。`], 'judgment-failure':['认可保存失败（样例）', '成果已保存（样例）不代表判断保存成功；未显示用户已认可。保留输入与失败，不自动重复写入。'], 'judgment-unknown':['认可回执未知（UNKNOWN样例）', '成果保存与判断回执分开；不显示认可成功、不重发，先读回同一操作。']};
      const [title, body] = copy[name]; openDialog(title, `<p>${escape(body)}</p><p class="notice">仅合成审核回执，不产生实际判断或权限。</p>`);
    }
    else if (name === 'authorization') openDialog('任务级授权差异 · 一次配置，后台复用', '<p>已明确：快速主任务选定资料中与问题相关的明细可供获准模型读取；本地真实计算与独立核验保留，严格明细零外发延期。不设累计额度上限，超时／失败最多自动重试一次，计量和次数持久保留。后续Change复用有效配置，不逐Attempt重新问。</p><p>后台核验实际材料版本、接收方与有效权限；不自动发送未选项目、凭据、系统文件或任意运行输出。子任务精确材料、新增分析代码纠正规则及主备模型配置仍待采用；主任务许可不自动变成子任务全部资料权限。</p><p class="notice">本稿不读Key、不写配置、不发数据；产品选择不代表真实Provider调用或旧任务恢复。</p>');
    else if (name === 'transform') openDialog('变换预览 · 不改原件', '<p>生产可检查前10行Diff；本次例为单位名称规范化、明确门店关联，不静默删重或改业务口径。预览与全量须绑定同一受检转换身份；全量执行后才形成新的可用结果。缺失映射／行级异常如实报部分完成或失败，不静默回退原值后称成功。</p><table><thead><tr><th>字段</th><th>原值（合成）</th><th>派生表示</th></tr></thead><tbody><tr><td>单位</td><td>万元人民币</td><td>万元（含明确币种来源）</td></tr></tbody></table><p>Diff在本地查看；模型读取任务相关明细另由有效材料许可控制。本稿不读取、修改或保存文件。</p>');
    else if (name === 'save') openDialog('保存与读回', '<p>生产等待后台成功回执，并可重新读回任务／版本／成果；失败或UNKNOWN不能显示“已保存”。本稿没有后端，未保存任何业务状态。</p>');
    else if (name === 'download') openDialog('后端保存 ≠ 下载完成', '<p>生产先定位有效、已保存的报告副本，再发起下载；浏览器发起不证明用户已落盘。本稿不触发文件下载。</p>');
    else if (name === 'resume') openDialog('显式继续 · 后台核验已有授权', '<p>只做缺失部分；复用有效数据／模型／工具许可与已完成结果。授权失效或新增范围才补授权，消费／重试机会不清零，服务重启不自动续跑。</p><p>失败原因未纠正或回执未知不能直接恢复。本稿只展示条件，不执行工具或模型。</p>');
    else if (name === 'readback') openDialog('只读核验，不重复执行', '<p>查询已有运行、保存、提交与消费记录，确认实际结果后才提供下一动作；记录不足继续保持UNKNOWN。不能发一个新Attempt试探上次是否成功。</p>');
    if (name !== 'child-open' && !name.startsWith('child-') && ['new','normal','professional'].includes(name) && $('review-dialog').open) $('review-dialog').close();
  }
  document.addEventListener('click', (event) => {const button = event.target.closest('[data-action]'); if (button) handle(button.dataset.action);});
  document.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => {state.detail = button.dataset.detail; renderDetail();}));
  $('scenario').addEventListener('change', () => {setMode('quick'); setScenario($('scenario').value);});
  $('mode-quick').addEventListener('click', () => setMode('quick'));
  $('mode-pro').addEventListener('click', () => setMode('pro'));
  document.querySelector('.mode-switch').addEventListener('keydown', (event) => {if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {event.preventDefault(); setMode(event.key === 'Home' ? 'quick' : event.key === 'End' ? 'pro' : state.mode === 'quick' ? 'pro' : 'quick'); $(`mode-${state.mode}`).focus();}});
  document.querySelector('.detail-tabs').addEventListener('keydown', (event) => {if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const tabs = [...document.querySelectorAll('[data-detail]')]; const index = tabs.findIndex((tab) => tab.dataset.detail === state.detail); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index+(event.key === 'ArrowRight' ? 1 : -1)+tabs.length)%tabs.length; state.detail = tabs[next].dataset.detail; renderDetail(); tabs[next].focus();});
  $('drawer-toggle').addEventListener('click', () => {setDrawer($('drawer').hidden); if (!$('drawer').hidden) $('drawer-close').focus();});
  $('drawer-close').addEventListener('click', () => {setDrawer(false); $('drawer-toggle').focus();});
  $('dialog-close').addEventListener('click', () => $('review-dialog').close());
  $('review-dialog').addEventListener('close', () => {if (focusReturn?.isConnected) focusReturn.focus();});
  $('back-conversation').addEventListener('click', () => {$('workspace').hidden = true; $('thread').hidden = false; state.child = null; if (workspaceReturn?.isConnected) workspaceReturn.focus(); else $('message').focus();});
  $('stop').addEventListener('click', () => setScenario('stopped'));
  $('composer').addEventListener('submit', (event) => {event.preventDefault(); const value = $('message').value.trim(); if (!value) return; const node = document.createElement('div'); node.className = 'message message-user'; node.textContent = value; $('thread').append(node); const note = document.createElement('p'); note.className = 'fine'; note.textContent = '已显示输入（仅审核内存）。本稿不理解任意文本、不调用模型、不执行或保存；请用审核场景查看约定行为。'; $('thread').append(note); $('workspace').hidden = true; $('thread').hidden = false; $('message').value = ''; node.scrollIntoView({block:'nearest'});});
  document.addEventListener('keydown', (event) => {if (event.key === 'Escape' && !$('review-dialog').open && !$('drawer').hidden) {setDrawer(false); $('drawer-toggle').focus();}});
  setDrawer(!window.matchMedia('(max-width: 950px)').matches);
  render();
})();
