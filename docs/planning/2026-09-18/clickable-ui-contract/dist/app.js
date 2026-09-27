const steps = [
  '新建分析案例',
  '导入并理解数据',
  '确认假设与计划',
  '运行分析',
  '查看证据与判断',
  '比较候选并保存'
];

const failureScenarios = [
  { id: 1, title: '文件格式不受支持', detail: 'orders.xlsx 不是首切片支持的 UTF-8 CSV。该文件不会被快照。', safe: '已有案例历史和另一份有效文件保持不变。', action: '替换 orders.csv', target: '返回“导入并理解数据”的草稿检查。', tone: 'danger' },
  { id: 2, title: 'ID 缺失或引用不存在', detail: '发现 3 条订单缺少 order_id，另有 1 条订单引用了不存在的 member_id。', safe: '草稿字段映射和问题计数保持可见。', action: '修正并重新选择文件', target: '返回导入检查，阻塞问题清零后才能继续。', tone: 'danger' },
  { id: 3, title: '时间、币种或金额无效', detail: '发现 2 条非 CNY 记录与 1 条无法解释的时间。此限制不可覆盖。', safe: '原文件不会被修改，案例历史保持安全。', action: '修正源文件', target: '重新执行草稿导入检查。', tone: 'danger' },
  { id: 4, title: '业务确认尚未完成', detail: '数据使用授权、字段映射、期间或可审查问题仍有一项未确认。', safe: '文件保持已选择，但不会产生 Ready 修订。', action: '完成缺失确认', target: '所有确认通过后进入 Ready。', tone: 'warning' },
  { id: 5, title: '拒绝模型发送', detail: '用户取消了本次外部模型发送。没有发生网络活动。', safe: '本地表单、数据和当前步骤保持不变。', action: '继续手工填写', target: '回到原表单，不阻塞主流程。', tone: 'info' },
  { id: 6, title: '模型服务暂不可用', detail: '模拟 provider 未返回草稿；任何模型内容均未被接受。', safe: '调用前的文字与本地状态保持不变。', action: '使用手工路径', target: '回到同一页面，也可重新发起一次新的披露。', tone: 'warning' },
  { id: 7, title: '本地计算失败', detail: '主计算未完成，因此没有生成新的 Finding。', safe: '数据快照、Ready 修订与历史结果保持安全。', action: '创建新的重试 Run', target: '案例保持 Needs attention，直到新 Run 成功。', tone: 'danger' },
  { id: 8, title: '双重验证结果不一致', detail: 'SQL 与独立 Python 复算结果不一致；系统拒绝生成 Finding。', safe: '两份结果身份与差异只在技术详情中展示。', action: '重试或创建新修订', target: '差异不能被人工覆盖；一致后才进入 Review。', tone: 'danger' },
  { id: 9, title: '用户取消运行', detail: '当前 Run 已终止并记录为 Cancelled。', safe: '快照、修订与此前 Finding 保持安全。', action: '新建重试 Run', target: '首次结果进入 Needs attention；已完成案例维持 Completed。', tone: 'warning' },
  { id: 10, title: '运行超过时间限制', detail: '当前 Run 已终止；超时不会在后台继续计算。', safe: '数据与历史不变，没有新 Finding。', action: '检查后重试', target: '首次结果进入 Needs attention；已完成案例维持 Completed。', tone: 'warning' },
  { id: 11, title: '进程中断后重新打开', detail: '上次 Running Run 被识别为已中断，不会自动恢复。', safe: '最后一个稳定状态与中断记录仍可查看。', action: '明确发起重试', target: '以新的 Run 身份重新执行。', tone: 'warning' },
  { id: 12, title: '快照或证据完整性异常', detail: '读取到的字节与已记录指纹不一致，运行和接受动作均被阻止。', safe: '可读历史保留；损坏字节不会被当作有效证据。', action: '创建新快照与修订', target: '新修订回到 Draft；旧修订保持 integrity_blocked。', tone: 'danger' },
  { id: 13, title: '已完成案例的重跑失败', detail: '最新重跑失败，但不会覆盖此前已经接受的 Finding。', safe: '原 Finding、Decision Closure 与 Completed 状态继续有效。', action: '关闭或再次重试', target: '案例仍然是 Completed。', tone: 'warning' }
];

const state = {
  step: 1,
  unlocked: 1,
  theme: 'dark',
  caseName: '会员复购变化诊断',
  question: '当前期会员复购率是否低于对比期？哪些会员分组值得优先验证？',
  context: '最近两个月复购表现出现波动，需要先判断变化是否真实，再决定验证方向。',
  alternatives: '会员结构变化、活动周期差异、订单状态口径变化。',
  authorityConfirmed: false,
  issuesConfirmed: false,
  planConfirmed: false,
  assistedQuestion: false,
  running: false,
  runProgress: 0,
  runTimer: null,
  runFailed: false,
  findingAccepted: false,
  closure: 'compare',
  preferred: 'reactivation',
  candidateReason: '该方向紧贴高价值沉睡会员，验证周期短，且不把结构贡献误解为因果。',
  insufficientReason: '',
  completed: false,
  rerun: false,
  pendingRerunFinding: false,
  evidenceOpen: false,
  scenariosOpen: false,
  modalOpen: false,
  lastFocused: null
};

const workspace = document.querySelector('#workspace');
const stepList = document.querySelector('#step-list');
const overlay = document.querySelector('#overlay');
const modal = document.querySelector('#modal');
const scenarioPanel = document.querySelector('#scenario-panel');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function statusLabel() {
  if (state.completed) return '已完成';
  if (state.findingAccepted) return '待完成';
  if (state.step === 5 || state.pendingRerunFinding) return '待审阅';
  if (state.runFailed) return '需要处理';
  if (state.running) return '运行中';
  if (state.step >= 4) return '已就绪';
  return '草稿';
}

function revisionText() {
  if (state.completed) return '修订 01 · 已完成';
  if (state.step >= 4) return '修订 01 · 已就绪';
  return '修订 01 · 草稿';
}

function syncChrome() {
  document.querySelector('#case-name-top').textContent = state.caseName || '未命名案例';
  document.querySelector('#case-status-label').textContent = statusLabel();
  document.querySelector('#revision-label').textContent = revisionText();
  const bottom = state.running
    ? `模拟运行中 · ${Math.round(state.runProgress)}%`
    : state.runFailed
      ? '最新尝试需要处理 · 历史保持安全'
      : state.completed
        ? '案例已完成 · 历史不可改写（模拟）'
        : '案例已在本机自动保存（模拟）';
  document.querySelector('#bottom-status').textContent = bottom;
}

function renderSteps() {
  stepList.innerHTML = steps.map((label, index) => {
    const number = index + 1;
    const active = number === state.step ? ' is-active' : '';
    const complete = number < state.step || state.completed ? ' is-complete' : '';
    const disabled = number > state.unlocked ? ' disabled' : '';
    const mark = complete ? '✓' : number;
    return `<li><button class="step-button${active}${complete}" type="button" data-step="${number}"${disabled}><span class="step-number">${mark}</span><span class="step-label">${label}</span></button></li>`;
  }).join('');
}

function pageHeader(number, title, description, badge) {
  return `<header class="page-heading">
    <div><span class="eyebrow">步骤 ${number} / 6 · ${steps[number - 1]}</span><h1>${title}</h1><p>${description}</p></div>
    <div class="heading-meta"><span class="status-chip">${badge} · 模拟</span></div>
  </header>`;
}

function stepOne() {
  return `${pageHeader(1, '先说清楚你想验证什么', '从一个业务问题开始。你可以随时修改，Xanthil 不会替你做最终判断。', '草稿')}
    <div class="setup-grid">
      <section class="panel">
        <div class="panel-header"><div><h2>案例基本信息</h2><p class="section-description">使用业务语言即可，不需要填写技术参数。</p></div></div>
        <div class="panel-body field-stack">
          <div class="field"><label for="case-name">案例名称</label><input class="input" id="case-name" data-bind="caseName" value="${escapeHtml(state.caseName)}" autocomplete="off" /></div>
          <div class="field"><label for="case-question">我要验证什么</label><textarea class="textarea" id="case-question" data-bind="question">${escapeHtml(state.question)}</textarea><small>后续会把它整理为固定的复购诊断假设；正式计算规则不会被模型改写。</small></div>
          ${state.assistedQuestion ? '<div class="draft-label"><span>模型草稿 · 未确认</span><strong>已整理问题表达，请你继续检查</strong></div>' : ''}
          <div class="inline-note"><span aria-hidden="true">◎</span><span>外部模型不是必需项。你可以完全通过表单与本地计算完成这个案例。</span></div>
        </div>
        <div class="panel-footer"><button class="button button-secondary" type="button" data-action="assist-question">帮我整理问题</button><button class="button button-primary" type="button" data-action="continue-step-1">开始准备数据</button></div>
      </section>
      <aside class="panel">
        <div class="panel-header"><div><h2>本次任务边界</h2><p class="section-description">第一纵切仅验证一个明确问题。</p></div></div>
        <div class="panel-body mini-list">
          <div class="mini-item"><span class="mini-icon">文</span><div><strong>两份本地 CSV</strong><small>members.csv 与 orders.csv</small></div></div>
          <div class="mini-item"><span class="mini-icon">¥</span><div><strong>CNY · Asia/Shanghai</strong><small>固定币种与时区，避免隐含转换</small></div></div>
          <div class="mini-item"><span class="mini-icon">判</span><div><strong>证据支持人工判断</strong><small>不会执行行动，也不声称业务结果</small></div></div>
        </div>
      </aside>
    </div>`;
}

function fileCard(name, rows, size, columns) {
  return `<article class="file-card"><div class="file-symbol">CSV</div><div class="file-copy"><strong>${name}</strong><span>${rows} 行 · ${size} · UTF-8</span><small>${columns}</small></div><span class="status-chip status-success">已读取 · 模拟</span></article>`;
}

function stepTwo() {
  const ready = state.authorityConfirmed && state.issuesConfirmed;
  return `${pageHeader(2, '导入并确认数据口径', '先确认文件、字段与处理方式，再创建不可变的本地快照。', ready ? '可继续' : '待确认')}
    <div class="screen-stack">
      <section class="panel">
        <div class="panel-header"><div><h2>本地文件</h2><p class="section-description">演示文件仅包含合成数据，不会读取你电脑上的真实文件。</p></div><button class="button button-secondary" type="button" data-action="preview-failure" data-scenario="1">查看文件错误</button></div>
        <div class="panel-body file-grid">${fileCard('members.csv', '4,820', '312 KB', 'member_id · member_group')}${fileCard('orders.csv', '18,624', '1.8 MB', 'order_id · member_id · paid_at · amount · status · currency')}</div>
      </section>

      <div class="two-column">
        <section class="panel">
          <div class="panel-header"><div><h2>字段映射</h2><p class="section-description">系统建议已确认，原始字符串不会自动修剪或转成数字。</p></div><span class="status-chip status-success">7 / 7 已映射</span></div>
          <div class="panel-body mapping-list">
            ${[['会员 ID','members.member_id'],['会员分组','members.member_group'],['订单 ID','orders.order_id'],['会员 ID','orders.member_id'],['支付时间','orders.paid_at'],['实付金额','orders.amount'],['有效状态','paid · completed']].map(([a,b]) => `<div class="mapping-row"><span>${a}</span><strong>${b}</strong><span aria-hidden="true">↔</span></div>`).join('')}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><div><h2>比较范围</h2><p class="section-description">两个期间按本地自然日计算，天数相同且不重叠。</p></div></div>
          <div class="panel-body field-stack">
            <div class="period-row"><div><span>对比期</span><strong>2026-05-01 — 2026-05-31</strong><small>31 个自然日</small></div><div><span>当前期</span><strong>2026-07-01 — 2026-07-31</strong><small>31 个自然日</small></div></div>
            <div class="issue-box"><div><span class="issue-count">3</span><div><strong>可审查问题</strong><small>2,416 行在期间外；38 条相同支付时间；2 个额外列被忽略。</small></div></div><button class="button button-quiet" type="button" data-action="preview-failure" data-scenario="4">查看处理方式</button></div>
          </div>
        </section>
      </div>

      <section class="panel confirmation-panel">
        <div class="panel-body checkbox-stack">
          <label class="check-row"><input type="checkbox" data-bind="authorityConfirmed" ${state.authorityConfirmed ? 'checked' : ''}/><span><strong>我有权将这两份本地数据用于本次分析</strong><small>这项确认只记录本次分析权限，不代表所有权或更广泛的复用许可。</small></span></label>
          <label class="check-row"><input type="checkbox" data-bind="issuesConfirmed" ${state.issuesConfirmed ? 'checked' : ''}/><span><strong>我理解并接受以上记录处理方式</strong><small>期间外与未选状态记录会被排除；相同时间按原始订单 ID 的 UTF-8 字节顺序处理。</small></span></label>
        </div>
        <div class="panel-footer"><button class="button button-quiet" type="button" data-action="back">返回</button><button class="button button-primary" type="button" data-action="continue-step-2" ${ready ? '' : 'disabled'}>创建本地快照并继续</button></div>
      </section>
    </div>`;
}

function stepThree() {
  return `${pageHeader(3, '确认假设与分析计划', '看清楚系统将算什么、不能证明什么，再发起本地分析。', state.planConfirmed ? '已确认' : '待确认')}
    <div class="screen-stack">
      <section class="hypothesis-card">
        <div class="hypothesis-mark">H1</div>
        <div class="hypothesis-main"><span class="eyebrow">固定正式假设</span><h2>当前期会员复购率低于对比期</h2><p>你可以补充业务背景与其他解释，但首切片不会把问题改成另一种计算。</p></div>
        <span class="status-chip">描述性比较</span>
      </section>

      <div class="two-column wide-left">
        <section class="panel">
          <div class="panel-header"><div><h2>分析计划</h2><p class="section-description">所有规则都以业务语言展示。</p></div><button class="button button-secondary" type="button" data-action="assist-question">帮我整理问题</button></div>
          <div class="panel-body plan-list">
            <div class="plan-row"><span class="plan-number">1</span><div><strong>分别计算两个期间</strong><p>活跃会员、复购会员、复购率与复购收入。</p></div></div>
            <div class="plan-row"><span class="plan-number">2</span><div><strong>使用双重本地验证</strong><p>主计算与独立复算必须完全一致，否则不会生成 Finding。</p></div></div>
            <div class="plan-row"><span class="plan-number">3</span><div><strong>查看会员分组贡献</strong><p>只解释结构贡献，不把它称作因果、增量或行动效果。</p></div></div>
            <div class="plan-row"><span class="plan-number">4</span><div><strong>由你接受结果与完成案例</strong><p>系统提供证据、反证与候选，最终判断保留在人。</p></div></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><div><h2>判断规则</h2><p class="section-description">不会暗中加入显著性或样本量阈值。</p></div></div>
          <div class="panel-body verdict-rules">
            <div class="rule rule-confirmed"><strong>Confirmed</strong><span>当前期复购率更低，且双重验证一致</span></div>
            <div class="rule rule-rejected"><strong>Rejected</strong><span>当前期等于或高于对比期</span></div>
            <div class="rule rule-inconclusive"><strong>Inconclusive</strong><span>任一期间没有活跃会员</span></div>
            <div class="limitation-box"><strong>不能证明</strong><p>统计显著性、业务因果、行动效果或真实 Outcome。</p></div>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-body split-form">
          <div class="field"><label for="business-context">业务背景</label><textarea class="textarea compact" id="business-context" data-bind="context">${escapeHtml(state.context)}</textarea></div>
          <div class="field"><label for="alternatives">反证与其他解释</label><textarea class="textarea compact" id="alternatives" data-bind="alternatives">${escapeHtml(state.alternatives)}</textarea></div>
        </div>
        <div class="panel-footer"><label class="inline-check"><input type="checkbox" data-bind="planConfirmed" ${state.planConfirmed ? 'checked' : ''}/> 我已确认数据范围、判断规则与限制</label><button class="button button-primary" type="button" data-action="continue-step-3" ${state.planConfirmed ? '' : 'disabled'}>确认计划并准备运行</button></div>
      </section>
    </div>`;
}

const runStages = ['验证不可变快照', '准备本地计算', '运行主计算', '运行独立复算', '整理证据与判断'];

function stepFour() {
  const currentStage = Math.min(runStages.length - 1, Math.floor(state.runProgress / 20));
  return `${pageHeader(4, state.runFailed ? '本次尝试需要处理' : '运行本地分析', '过程以业务阶段展示；技术日志不会遮住你真正需要做的判断。', state.runFailed ? 'Needs attention' : state.running ? '运行中' : 'Ready')}
    <div class="run-layout">
      <section class="run-card ${state.runFailed ? 'is-failed' : ''}">
        <div class="run-orbit" aria-hidden="true"><div class="run-core">${state.runFailed ? '!' : state.running ? Math.round(state.runProgress) : '▶'}</div></div>
        <div class="run-copy">
          <span class="eyebrow">Run · run_demo_01</span>
          <h2>${state.runFailed ? '没有生成新的分析结果' : state.running ? runStages[currentStage] : '准备好后开始运行'}</h2>
          <p>${state.runFailed ? '数据快照与此前历史保持安全。重试会创建一个新的 Run，不会覆盖失败记录。' : state.running ? '正在执行明确标注的模拟过程，不会读取真实文件或启动真实计算。' : '预计用时约 8 秒（模拟）。运行期间可以取消。'}</p>
          <div class="progress-track" role="progressbar" aria-label="模拟运行进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(state.runProgress)}"><span style="width:${state.runProgress}%"></span></div>
          <div class="run-actions">
            ${state.runFailed ? '<button class="button button-primary" type="button" data-action="retry-run">创建新的重试 Run</button><button class="button button-secondary" type="button" data-action="preview-failure" data-scenario="7">查看失败说明</button>' : state.running ? '<button class="button button-secondary" type="button" data-action="cancel-run">取消运行</button>' : '<button class="button button-primary" type="button" data-action="start-run">开始模拟运行</button><button class="button button-quiet" type="button" data-action="back">返回检查计划</button>'}
          </div>
        </div>
      </section>
      <section class="panel run-stages">
        <div class="panel-header"><div><h2>本次运行</h2><p class="section-description">每个阶段都必须明确结束。</p></div></div>
        <div class="panel-body stage-list">${runStages.map((label, index) => {
          const start = index * 20;
          const done = state.runProgress >= start + 20;
          const active = state.running && state.runProgress >= start && state.runProgress < start + 20;
          return `<div class="stage-row ${done ? 'is-done' : active ? 'is-active' : ''}"><span>${done ? '✓' : index + 1}</span><div><strong>${label}</strong><small>${done ? '已完成 · 模拟' : active ? '进行中 · 模拟' : '等待'}</small></div></div>`;
        }).join('')}</div>
      </section>
    </div>`;
}

function metric(label, comparison, current, delta, tone = '') {
  return `<article class="metric-card ${tone}"><span>${label}</span><div class="metric-values"><div><small>对比期</small><strong>${comparison}</strong></div><div><small>当前期</small><strong>${current}</strong></div></div><p>${delta}</p></article>`;
}

function stepFive() {
  return `${pageHeader(5, '证据显示复购率确实下降', '先看核心证据、反证与限制，再决定是否接受这次分析结果。', state.findingAccepted ? 'Finding 已接受' : 'Review')}
    <div class="screen-stack">
      <section class="verdict-banner">
        <div class="verdict-icon">↓</div>
        <div><span class="eyebrow">H1 · CONFIRMED</span><h2>当前期会员复购率低于对比期</h2><p>下降 3.5 个百分点。两套本地计算结果一致，但这不是显著性或因果结论。</p></div>
        <span class="status-chip status-warning">描述性判断</span>
      </section>

      <section class="metric-grid">
        ${metric('活跃会员', '3,240', '3,118', '减少 122 人 · −3.8%')}
        ${metric('复购会员', '1,069', '920', '减少 149 人 · −13.9%', 'metric-primary')}
        ${metric('会员复购率', '33.0%', '29.5%', '下降 3.5 个百分点', 'metric-primary')}
        ${metric('复购收入', '¥482,160', '¥421,780', '减少 ¥60,380 · −12.5%')}
      </section>

      <div class="evidence-grid">
        <section class="panel">
          <div class="panel-header"><div><h2>支持证据</h2><p class="section-description">直接支持当前判断的已验证事实。</p></div></div>
          <div class="panel-body evidence-list">
            <div class="evidence-item supports"><span>01</span><div><strong>复购率下降 3.5 个百分点</strong><p>当前期 29.5%，对比期 33.0%；双重计算一致。</p></div></div>
            <div class="evidence-item supports"><span>02</span><div><strong>复购会员下降快于活跃会员</strong><p>复购会员减少 13.9%，活跃会员仅减少 3.8%。</p></div></div>
            <div class="evidence-item supports"><span>03</span><div><strong>复购收入同步下降</strong><p>减少 ¥60,380，与会员复购变化方向一致。</p></div></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><div><h2>反证、其他解释与限制</h2><p class="section-description">防止把描述性变化误判成原因。</p></div></div>
          <div class="panel-body evidence-list">
            <div class="evidence-item cautions"><span>!</span><div><strong>高价值会员规模变化有限</strong><p>部分分组的活跃会员数稳定，可能不是普遍性下降。</p></div></div>
            <div class="evidence-item cautions"><span>?</span><div><strong>活动与渠道未进入本次数据</strong><p>无法排除活动节奏或获客结构造成的期间差异。</p></div></div>
            <div class="evidence-item cautions"><span>≠</span><div><strong>不能推导行动效果</strong><p>本结果没有评估任何触达策略或真实 Outcome。</p></div></div>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-body acceptance-row"><div><strong>${state.findingAccepted ? '你已接受本次分析结果' : '接受前请确认'}</strong><p>${state.findingAccepted ? 'Finding 接受记录已追加，但尚未选择下一步候选，也没有批准任何行动。' : '接受表示你认可这份证据可用于下一步候选比较，不表示批准行动。'}</p></div><div class="accept-actions"><button class="button button-secondary" type="button" data-action="assist-evidence">帮我解释证据</button><button class="button button-primary" type="button" data-action="accept-finding" ${state.findingAccepted ? 'disabled' : ''}>${state.findingAccepted ? '已接受 Finding' : '接受本次分析结果'}</button></div></div>
      </section>
    </div>`;
}

function candidateCard(id, title, basis, risk, condition, metric) {
  const selected = state.preferred === id;
  return `<label class="candidate-card ${selected ? 'is-selected' : ''}"><div class="candidate-head"><input type="radio" name="preferred" value="${id}" ${selected ? 'checked' : ''}/><div><span class="draft-label-inline">人工候选</span><h3>${title}</h3></div></div><dl><div><dt>证据依据</dt><dd>${basis}</dd></div><div><dt>反证或风险</dt><dd>${risk}</dd></div><div><dt>适用条件</dt><dd>${condition}</dd></div><div><dt>未来验证指标</dt><dd>${metric}</dd></div></dl></label>`;
}

function completedPanel() {
  return `<section class="completion-card"><div class="completion-mark">✓</div><span class="eyebrow">DECISION CASE COMPLETED · 模拟</span><h1>这个分析案例已经完整保存</h1><p>Finding 与 Decision Closure 已分别记录。优先验证不等于批准行动；后续任何执行都需要新的授权。</p><div class="completion-summary"><div><span>判断</span><strong>H1 Confirmed</strong></div><div><span>闭环</span><strong>${state.closure === 'compare' ? '两项候选 · 1 项优先验证' : '证据不足 · 暂不选择'}</strong></div><div><span>历史</span><strong>修订 01 · Run 01</strong></div></div><div class="completion-actions"><button class="button button-primary" type="button" data-action="reopen-case">重新打开案例</button><button class="button button-secondary" type="button" data-action="rerun">用同一快照重跑</button><button class="button button-secondary" type="button" data-action="export">导出案例报告</button></div></section>`;
}

function stepSix() {
  if (state.completed) return completedPanel();
  const compare = state.closure === 'compare';
  const canComplete = compare ? Boolean(state.preferred && state.candidateReason.trim()) : Boolean(state.insufficientReason.trim());
  return `${pageHeader(6, '比较下一步候选并完成案例', '把“值得验证”与“已经批准”明确分开，也可以记录证据不足、暂不选择。', 'Decision Closure')}
    <div class="screen-stack">
      <div class="segmented" role="radiogroup" aria-label="案例闭环方式">
        <label class="${compare ? 'is-selected' : ''}"><input type="radio" name="closure" value="compare" ${compare ? 'checked' : ''}/>比较候选</label>
        <label class="${!compare ? 'is-selected' : ''}"><input type="radio" name="closure" value="insufficient" ${!compare ? 'checked' : ''}/>证据不足 / 暂不选择</label>
      </div>

      ${compare ? `<div class="candidate-grid">
        ${candidateCard('reactivation','验证高价值沉睡会员的轻量召回','高价值组复购收入下降贡献较高','结构贡献不是因果，触达也可能带来打扰','仅面向已同意接收服务通知的沉睡会员','14 天内回访率与退订率')}
        ${candidateCard('benefit','验证复购权益提醒是否被看见','复购会员降幅高于活跃会员降幅','权益本身可能不具吸引力，提醒频率需受控','先做小样本可撤回的消息可理解性验证','提醒打开率与后续复购率')}
      </div>
      <section class="panel"><div class="panel-body split-form"><div class="field"><label for="candidate-reason">为什么优先验证这一项</label><textarea class="textarea compact" id="candidate-reason" data-bind="candidateReason">${escapeHtml(state.candidateReason)}</textarea></div><div class="candidate-safety"><strong>这不是行动批准</strong><p>“优先验证”只记录下一步值得收集什么证据。系统不会发送消息、创建任务或执行策略。</p><button class="button button-secondary" type="button" data-action="assist-candidates">帮我起草候选</button></div></div></section>` : `<section class="panel empty-decision"><div class="panel-body"><div class="empty-symbol">○</div><h2>暂不选择任何候选</h2><p>当证据不足以支持下一步时，明确停止比勉强推荐更可靠。</p><div class="field"><label for="insufficient-reason">记录原因</label><textarea class="textarea compact" id="insufficient-reason" data-bind="insufficientReason" placeholder="例如：样本期间太短，需要补充渠道与活动数据。">${escapeHtml(state.insufficientReason)}</textarea></div></div></section>`}

      <section class="panel"><div class="panel-body closure-summary"><div><span class="status-chip status-success">Finding 已接受</span><strong>${compare ? '至少两项完整候选，最多一项优先验证' : '无优先候选，必须记录停止原因'}</strong><small>完成后将追加 Decision Closure 与案例完成记录，历史不会被改写。</small></div><button class="button button-primary" type="button" data-action="complete-case" ${canComplete ? '' : 'disabled'}>完成分析案例</button></div></section>
    </div>`;
}

function renderWorkspace() {
  const views = [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix];
  workspace.innerHTML = `<div class="content-wrap">${views[state.step - 1]()}</div>`;
  syncChrome();
  renderSteps();
  renderEvidence();
}

function renderEvidence() {
  const content = [
    `<section class="detail-section"><span class="eyebrow">CASE IDENTITY</span><dl class="detail-list"><div><dt>Case</dt><dd>case_demo_01</dd></div><div><dt>Revision</dt><dd>revision_01</dd></div><div><dt>State</dt><dd>${statusLabel()}</dd></div><div><dt>Profile</dt><dd>desktop-free-local · simulated</dd></div></dl></section>`,
    state.step >= 2 ? `<section class="detail-section"><span class="eyebrow">SOURCE SNAPSHOT · 模拟</span><dl class="detail-list"><div><dt>members.csv</dt><dd>sha256: 92e4…8ac1</dd></div><div><dt>orders.csv</dt><dd>sha256: 4bd8…2fe9</dd></div><div><dt>Encoding</dt><dd>UTF-8</dd></div><div><dt>Authority</dt><dd>${state.authorityConfirmed ? 'user_confirmed' : 'pending'}</dd></div></dl></section>` : '',
    state.step >= 3 ? `<section class="detail-section"><span class="eyebrow">METHOD CONTRACT</span><dl class="detail-list"><div><dt>H1</dt><dd>repurchase_rate_current &lt; comparison</dd></div><div><dt>Primary</dt><dd>DuckDB SQL · planned</dd></div><div><dt>Independent</dt><dd>Python · planned</dd></div><div><dt>M2</dt><dd>segment_repeat_revenue_delta</dd></div></dl></section>` : '',
    state.step >= 5 ? `<section class="detail-section"><span class="eyebrow">RUN EVIDENCE · 模拟</span><dl class="detail-list"><div><dt>Run</dt><dd>run_demo_01</dd></div><div><dt>Agreement</dt><dd>exact_match</dd></div><div><dt>Finding</dt><dd>H1_CONFIRMED</dd></div><div><dt>Acceptance</dt><dd>${state.findingAccepted ? 'accepted' : 'pending'}</dd></div></dl></section>` : '',
    `<section class="simulation-boundary"><strong>原型边界</strong><p>本页面不会读取文件、访问网络、启动数据库、调用模型或写入持久记录。所有身份与结果仅为合成演示。</p></section>`
  ].filter(Boolean).join('');
  document.querySelector('#evidence-content').innerHTML = content;
}

function renderScenarios() {
  scenarioPanel.innerHTML = `<div class="drawer-header"><div><span class="eyebrow">UI GATE · NEGATIVE PATHS</span><h2>13 类失败与恢复</h2></div><button class="icon-button" type="button" aria-label="关闭场景检查" data-action="close-scenarios">×</button></div><p class="scenario-intro">选择任一场景，检查用户看见什么、什么保持安全，以及唯一允许的下一步。</p><div class="scenario-list">${failureScenarios.map(item => `<button class="scenario-row" type="button" data-action="preview-failure" data-scenario="${item.id}"><span class="scenario-number">${String(item.id).padStart(2,'0')}</span><span><strong>${item.title}</strong><small>${item.action} → ${item.target}</small></span><span aria-hidden="true">›</span></button>`).join('')}</div>`;
}

function openScenarios() {
  state.scenariosOpen = true;
  state.lastFocused = document.activeElement;
  renderScenarios();
  scenarioPanel.classList.add('is-open');
  scenarioPanel.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  scenarioPanel.querySelector('button')?.focus();
}

function closeScenarios() {
  state.scenariosOpen = false;
  scenarioPanel.classList.remove('is-open');
  scenarioPanel.setAttribute('aria-hidden', 'true');
  if (!state.modalOpen) overlay.hidden = true;
  state.lastFocused?.focus?.();
}

function openModal(html) {
  state.modalOpen = true;
  state.lastFocused = document.activeElement;
  modal.innerHTML = html;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  modal.querySelector('button, input, textarea')?.focus();
}

function closeModal() {
  state.modalOpen = false;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '';
  if (!state.scenariosOpen) overlay.hidden = true;
  state.lastFocused?.focus?.();
}

function modelDisclosure(kind) {
  const config = {
    question: { title: '发送前确认 · 帮我整理问题', payload: '你的问题原文、业务背景、期间标签与聚合列名', result: '只生成问题表达、显示标题与其他解释的草稿' },
    evidence: { title: '发送前确认 · 帮我解释证据', payload: '已验证的聚合指标、假名分组、方法标签与业务背景', result: '只生成证据解释和限制提示的草稿' },
    candidates: { title: '发送前确认 · 帮我起草候选', payload: '已接受 Finding、限制、聚合证据与业务背景', result: '只生成可编辑候选草稿，不生成 Closure' }
  }[kind];
  openModal(`<div class="modal-header"><span class="eyebrow">逐次数据披露 · 模拟</span><h2 id="modal-title">${config.title}</h2><p>这一步在真实产品中会调用外部模型；本原型不会联网。</p></div><div class="modal-body"><div class="provider-row"><div><span>模拟 Provider</span><strong>示例模型 · 未实际调用</strong></div><span class="status-chip status-warning">外部</span></div><div class="payload-box"><strong>将发送的类别</strong><p>${config.payload}</p><small>不会自动包含原始行、文件内容、绝对路径、会员或订单 ID、原始分组值、凭据或未选择日志。</small></div><div class="payload-box"><strong>允许生成</strong><p>${config.result}</p></div><label class="check-row compact-check"><input type="checkbox" id="free-text-confirm"/><span><strong>我确认上面的用户文字可能包含敏感业务内容</strong><small>已经发送的内容无法撤回。</small></span></label></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="decline-model">不发送，手工继续</button><button class="button button-primary" type="button" data-action="confirm-model" data-kind="${kind}" disabled>确认并生成模拟草稿</button></div>`);
}

function previewFailure(id) {
  const item = failureScenarios.find(entry => entry.id === Number(id));
  if (!item) return;
  if (state.scenariosOpen) closeScenarios();
  openModal(`<div class="modal-header"><span class="eyebrow">失败场景 ${String(item.id).padStart(2,'0')} · 模拟</span><h2 id="modal-title">${item.title}</h2><p>${item.detail}</p></div><div class="modal-body"><div class="failure-state ${item.tone}"><span aria-hidden="true">${item.tone === 'danger' ? '!' : item.tone === 'warning' ? '△' : 'i'}</span><div><strong>没有发生什么</strong><p>没有生成成功 Finding、候选、导出或不存在的历史更新。</p></div></div><div class="recovery-grid"><div><span>保持安全</span><strong>${item.safe}</strong></div><div><span>唯一允许的下一步</span><strong>${item.action}</strong></div><div><span>恢复目标</span><strong>${item.target}</strong></div></div></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">返回原流程</button><button class="button button-primary" type="button" data-action="simulate-recovery" data-scenario="${item.id}">${item.action}</button></div>`);
}

function toast(message, tone = 'info') {
  const region = document.querySelector('#toast-region');
  const element = document.createElement('div');
  element.className = `toast ${tone}`;
  element.textContent = message;
  region.appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

function setStep(step) {
  state.step = step;
  state.unlocked = Math.max(state.unlocked, step);
  renderWorkspace();
  workspace.scrollTo({ top: 0, behavior: 'smooth' });
  workspace.focus({ preventScroll: true });
}

function startRun() {
  if (state.runTimer) clearInterval(state.runTimer);
  state.running = true;
  state.runFailed = false;
  state.runProgress = 3;
  renderWorkspace();
  state.runTimer = setInterval(() => {
    state.runProgress = Math.min(100, state.runProgress + 9);
    if (state.runProgress >= 100) {
      clearInterval(state.runTimer);
      state.runTimer = null;
      state.running = false;
      state.runProgress = 100;
      state.pendingRerunFinding = state.rerun;
      state.rerun = false;
      toast('模拟运行完成：双重计算结果一致', 'success');
      setStep(5);
      return;
    }
    renderWorkspace();
  }, 280);
}

function cancelRun() {
  if (state.runTimer) clearInterval(state.runTimer);
  state.runTimer = null;
  state.running = false;
  state.runFailed = true;
  state.runProgress = 0;
  renderWorkspace();
  previewFailure(9);
}

function toggleEvidence(open) {
  const drawer = document.querySelector('#evidence-drawer');
  state.evidenceOpen = open ?? !state.evidenceOpen;
  drawer.classList.toggle('is-open', state.evidenceOpen);
  drawer.setAttribute('aria-hidden', String(!state.evidenceOpen));
}

function completeCase() {
  const valid = state.closure === 'compare' ? state.preferred && state.candidateReason.trim() : state.insufficientReason.trim();
  if (!valid) return toast('请先完成当前闭环所需的信息', 'warning');
  state.completed = true;
  toast('模拟：Decision Closure 与完成记录已追加', 'success');
  renderWorkspace();
}

document.addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset.bind && target.type !== 'checkbox') {
    state[target.dataset.bind] = target.value;
    if (target.dataset.bind === 'caseName') syncChrome();
  }
  if (target.id === 'free-text-confirm') {
    modal.querySelector('[data-action="confirm-model"]').disabled = !target.checked;
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.dataset.bind && target.type === 'checkbox') {
    state[target.dataset.bind] = target.checked;
    renderWorkspace();
  }
  if (target.name === 'closure') {
    state.closure = target.value;
    renderWorkspace();
  }
  if (target.name === 'preferred') {
    state.preferred = target.value;
    renderWorkspace();
  }
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;
  if (button.dataset.step) return setStep(Number(button.dataset.step));
  if (action === 'toggle-theme') {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', state.theme === 'light');
  }
  if (action === 'toggle-evidence') toggleEvidence();
  if (action === 'close-evidence') toggleEvidence(false);
  if (action === 'open-scenarios') openScenarios();
  if (action === 'close-scenarios') closeScenarios();
  if (action === 'close-modal') closeModal();
  if (action === 'toggle-nav') document.querySelector('.left-rail').classList.toggle('is-open');
  if (action === 'continue-step-1') {
    state.caseName = document.querySelector('#case-name').value.trim() || '未命名案例';
    state.question = document.querySelector('#case-question').value.trim();
    if (!state.question) return toast('请先写下你要验证的问题', 'warning');
    setStep(2);
  }
  if (action === 'continue-step-2' && state.authorityConfirmed && state.issuesConfirmed) {
    toast('模拟：本地快照已创建，原始文件保持不变', 'success');
    setStep(3);
  }
  if (action === 'continue-step-3' && state.planConfirmed) setStep(4);
  if (action === 'back') setStep(Math.max(1, state.step - 1));
  if (action === 'assist-question') modelDisclosure('question');
  if (action === 'assist-evidence') modelDisclosure('evidence');
  if (action === 'assist-candidates') modelDisclosure('candidates');
  if (action === 'decline-model') { closeModal(); toast('已取消发送：没有发生网络活动，可继续手工完成', 'info'); }
  if (action === 'confirm-model') {
    const kind = button.dataset.kind;
    if (kind === 'question') state.assistedQuestion = true;
    closeModal();
    toast('已生成模拟草稿：仍需你检查和确认', 'success');
    renderWorkspace();
  }
  if (action === 'start-run' || action === 'retry-run') startRun();
  if (action === 'cancel-run') cancelRun();
  if (action === 'accept-finding') {
    state.findingAccepted = true;
    state.pendingRerunFinding = false;
    toast('Finding 接受记录已追加（模拟），尚未批准任何行动', 'success');
    setStep(6);
  }
  if (action === 'complete-case') completeCase();
  if (action === 'reopen-case') { toast('模拟：已从完整历史重新打开案例', 'info'); setStep(6); }
  if (action === 'rerun') { state.rerun = true; state.runProgress = 0; state.runFailed = false; setStep(4); }
  if (action === 'export') toast('模拟导出：正式产品将生成 Markdown 与自包含 HTML', 'success');
  if (action === 'preview-failure') previewFailure(button.dataset.scenario);
  if (action === 'simulate-recovery') {
    const item = failureScenarios.find(entry => entry.id === Number(button.dataset.scenario));
    closeModal();
    toast(`恢复预览：${item.action} → ${item.target}`, 'success');
  }
});

overlay.addEventListener('click', () => {
  if (state.modalOpen) closeModal();
  else if (state.scenariosOpen) closeScenarios();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.modalOpen) closeModal();
    else if (state.scenariosOpen) closeScenarios();
    else if (state.evidenceOpen) toggleEvidence(false);
    document.querySelector('.left-rail').classList.remove('is-open');
  }
});

renderScenarios();
renderWorkspace();
