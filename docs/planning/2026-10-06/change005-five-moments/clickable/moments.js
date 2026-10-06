/* 合成 UI 合同：仅内存状态。禁止文件、网络、模型、持久化、定时模拟运行。 */
'use strict';
const $ = id => document.getElementById(id);
const button = (label, action, primary = false) => `<button class="btn btn-sm ${primary ? 'btn-primary' : ''}" type="button" data-action="${action}">${label}</button>`;
const card = (title, body, actions = '') => `<article class="analysis-card"><h2>${title}</h2>${body}<div class="card-actions">${actions}</div></article>`;
const badge = (label, state = '') => `<span class="badge ${state}">${label}</span>`;
let scene = 'meaning';
let originFocus = null;
let revisionSelected = '尚未选择';
let simulatedSaved = false;
let newTask = false;
const statusText = {
  meaning: '等待业务澄清 · 订单金额与净销售额不能混用', plan: '方案待执行 · 口径已澄清（样例）',
  running: '部分成果 · 退款关联异常，受影响步骤已暂停', results: '成果待检查 · 数值已核验，原因仍不确定',
  reuse: '查找可用方案 · 不执行、不复制旧结论', impact: '修改预览 · 尚未重算', compare: '新版本已核验（样例）· 尚未作正式决定',
  reopen: '已保存后重开 · 没有自动续跑', unknown: '结果待对账 · 不自动重发', stopped: '已停止（样例）· 旧有效成果保留', partial: '部分成果 · 已取消退款分支，不代表原问题已完成', adopted: '新任务已建立（样例）· 当前事实待重新检查'
};
function meaning() {
  return card('先确认销售的含义', `<p>你问“最近四周老客销售下降了，要不要发优惠券？”资料同时包含订单金额与退款额，我们需要确认你关注的指标。</p><div class="meaning-grid"><div><span>销售指标 · 待确认</span><strong>订单金额，还是扣退款后的净销售额？</strong></div><div><span>人群 · 合成已确认来源</span><strong>项目会员定义 v2；本次需检查适用性</strong></div><div><span>期间 · 候选，待本次确认</span><strong>最近四个完整自然周 vs 前四周</strong></div><div><span>修改作用域</span><strong>仅本任务，不修改长期企业口径</strong></div></div><p class="limit">冲突解决前不计算依赖指标。生产没有项目定义时必须标待确认，不能沿用样例。</p>`, button('查看定义来源', 'context') + button('修改口径', 'edit-meaning') + button('本次采用上述人群／期间及净销售额', 'accept-meaning', true));
}
function plan() {
  return card('准备怎样回答这个问题', `<ol class="business-steps"><li>核验销售变化 ${badge('待开始', 'neutral')}</li><li>比较会员分组、商品与渠道 ${badge('待开始', 'neutral')}</li><li>检查退款归属与金额 ${badge('待开始', 'neutral')}</li><li>检查优惠券效果证据 ${badge('缺资料 · 未执行', 'wait')}</li></ol><p>候选解释：高价值会员购买减少、退款变化。需要各期人数／金额、退款关联以及支持和反例。</p><p class="limit">没有发券及核销资料，不能估计优惠券增量效果。分组贡献也不等于原因。</p>`, button('查看方法和证据需要', 'plan-detail') + button('调整分析重点', 'edit-plan') + button('查看执行中异常样例', 'running', true));
}
function running() {
  return card('退款关联异常，相关结论暂不发布', `<ol class="business-steps"><li>订单金额复核 ${badge('已核验')}</li><li>订单金额分组对账 ${badge('已核验')}</li><li>退款归属检查 ${badge('等待确认', 'wait')}</li><li>净销售额及其解释 ${badge('暂停 · 尚未核验', 'wait')}</li><li>优惠券增量效果 ${badge('缺资料 · 未执行', 'neutral')}</li></ol><p>同一退款可能重复关联订单。只保留不依赖该关联的订单金额事实；不能发布净销售额或退款原因主张。</p><p class="limit">影响范围不确定时扩大暂停，不会为了显示进度继续使用可疑结果。</p>`, button('检查关联规则', 'mapping') + button('资料与外发记录', 'materials') + button('取消退款分支', 'cancel-branch'));
}
function results() {
  return card('净销售额下降，变化集中在高价值会员', `<span class="badge">计算已核验</span><div class="metric-strip"><div><strong>90 万元</strong><span>本期净销售额</span></div><div><strong>−10%</strong><span>相对前四周</span></div></div><p>检查：总额复算、分组金额对账；高价值会员 70 → 55 万元，其他会员 30 → 35 万元。</p><p class="limit">支持定位下降，不支持判定原因。尚不能区分需求变化与供给不足；发券效果未检验，不能据此全面加优惠。</p>`, button('查看这条发现的证据', 'evidence') + button('提出异议', 'objection') + button('仅看高价值会员', 'impact', true)) + card('优惠券会改善销售吗？', `<p>${badge('证据不足', 'wait')} 尚无合格发券／核销及对照资料，未执行效果估计。没有反证不等于原因已成立。</p>`, button('查看尚缺证据', 'missing'));
}
function impact() {
  return card('从“全部老客”改为“高价值会员”', `<p>本次采用已有明确分组定义，不增加新资料或模型权限。取消渠道分析，将退款检查聚焦此分组。</p><div class="comparison"><table><thead><tr><th>影响项</th><th>修改后怎样处理</th></tr></thead><tbody><tr><td>分组筛选及 IR 参数</td><td>新计划加入高价值会员筛选；被删除渠道步骤不得执行</td></tr><tr><td>指标／图表／发现／报告</td><td>原全体净额与相应文字标历史；当前相关内容待重算</td></tr><tr><td>原始结构与通用质量检查</td><td>只有来源、检查与依赖身份均未变才复用；否则扩大重算</td></tr></tbody></table></div><p class="limit">预览不是执行；未出新结果前不会显示新数字。只改表达无需重算。</p>`, button('返回原成果', 'results') + button('接受修改 · 查看新计划', 'apply-change', true));
}
function compare() {
  return card('新旧范围不同，结论使用方式也不同', `<div class="comparison"><table><thead><tr><th>版本</th><th>前期 → 本期</th><th>变化及适用范围</th></tr></thead><tbody><tr><td>v1 · 全部老客</td><td>100 → 90 万元</td><td>−10%；原总体范围，保留为历史</td></tr><tr><td>v2 · 高价值会员</td><td>70 → 55 万元</td><td>−21.43%；仅适用于此分组</td></tr></tbody></table></div><p>新计划／筛选、计算和独立核验各有自己的版本。分组变化不是因果证明，不能混用两个范围的分母。</p><p class="limit">两个版本均不能证明发券有效。采用结果不是正式业务决定，不产生行动。</p><p id="choice">当前版本选择：${revisionSelected}</p>`, button('查看新版本依据', 'evidence-v2') + button('采用新版本', 'select-new', true) + button('保留原版本', 'select-old'));
}
function reuse() {
  return card('上次的方案可以帮助开始这次分析', `<p>来源：同项目“老客销售变化”用户确认方案 v1（合成）。本页查看不计算，不外发旧资料。</p><div class="meaning-grid"><div><span>可沿用</span><strong>有来源的口径、检查步骤、报告结构</strong></div><div><span>必须重查</span><strong>新期间、当前资料、分组、方法适用性、授权</strong></div><div><span>不会继承</span><strong>旧数字、原因结论、核验、决定／预期</strong></div><div><span>效力</span><strong>独立新任务；不是长期资产升级或自动学习</strong></div></div>`, button('查看可沿用的方案', 'reuse-detail') + button('沿用此方案 · 新建任务', 'adopt', true));
}
function show(next) {
  scene = next;
  $('scene').value = Array.from($('scene').options).some(o => o.value === scene) ? scene : '';
  $('workspace').hidden = true; $('thread').hidden = false;
  $('title').textContent = newTask ? '新一期老客销售变化 · 新任务' : '老客销售变化';
  $('status').textContent = statusText[scene] || '合成审核状态';
  const greeting = document.createElement('div'); greeting.className = 'message-user';
  greeting.textContent = newTask ? '沿用上次方案分析新一期，重新验证当前事实。' : '最近四周老客销售下降了，是什么原因？要不要发优惠券？';
  $('thread').replaceChildren(greeting);
  const body = document.createElement('div'); body.className = 'message';
  const renderers = {meaning, plan, running, results, impact, compare, reuse};
  if (renderers[scene]) body.innerHTML = renderers[scene]();
  else if (scene === 'reopen') body.innerHTML = card('已保存的任务 · 等待显式继续', '<p>旧口径、计划、已完成检查、消费记录仍可查看。刷新／重启未发新请求。继续前先核验权限、输入与在途状态。</p>', button('查看保存范围', 'execution') + button('查看恢复后检查样例', 'running', true));
  else if (scene === 'unknown') body.innerHTML = card('一次请求结果待对账', '<p>未取得确定回执。不是成功，也不是可直接重试的失败。先读回同一操作；未经对账不能发布结果或发送新请求。</p>', button('查看请求记录与处理路径', 'unknown-detail'));
  else if (scene === 'stopped') body.innerHTML = card('已停止 · 保留已核验部分', '<p>本样例表示已取得停止结束回执。生产需真实阻断后续步骤／出站及迟到正式发布，受理不等于物理结束。</p>', button('查看执行记录', 'execution') + button('重开保存状态', 'reopen'));
  else if (scene === 'partial') body.innerHTML = card('退款分支已取消 · 部分成果', '<p>保留合法订单金额事实；净销售额与退款解释不发布。原优惠券问题尚未回答，取消不代表完成。</p>', button('查看已保留部分', 'execution') + button('补资料并修正方案', 'mapping'));
  else if (scene === 'adopted') body.innerHTML = card('新任务已建立 · 资料与事实重新检查', '<p>采用来源已记录。新一期退款列的含义尚未确认，仅询问这一差异；未复制旧数值、核验、权限或人的选择。</p>', button('查看口径差异', 'context') + button('查看待执行新计划', 'plan-detail'));
  $('thread').append(body); $('thread').scrollTop = 0;
}
function panel(title, html) {
  originFocus = document.activeElement;
  $('thread').hidden = true; $('workspace').hidden = false;
  $('workspace-heading').textContent = title; $('workspace-body').innerHTML = html; $('workspace').focus();
}
function detail(title, html) {
  originFocus = document.activeElement; $('drawer-title').textContent = title; $('detail').innerHTML = html;
  $('drawer').hidden = false; $('drawer').classList.add('visible'); $('details').setAttribute('aria-expanded', 'true'); $('detail').focus();
}
const actions = {
  context: () => detail('口径、来源与适用性', '<h3>净销售额</h3><p>订单金额 − 合格归属退款额；单位：万元。关联异常时不使用此结果。</p><h3>老客与时间</h3><p>项目已确认定义 v2（仅为合成来源）；两个四周窗口、同一规则。生产应显示真实版本或待确认。</p><p>本次采用不修改企业长期定义。没有来源不能宣称已掌握标准。</p>'),
  'edit-meaning': () => panel('修改本次口径', '<p>候选来自所选资料，非长期定义发布。必要含义冲突需解决，其他适用确认复用。</p><label class="field">销售指标<select id="metric"><option value="net">扣退款后的净销售额</option><option value="gross">订单金额（不代表净额）</option></select></label><p>人群／期间同卡片，当前仅修改指标；不同指标影响计算、图表和报告。确认保存本次快照，不自动改企业标准。</p>' + button('采用此口径 · 查看影响', 'metric-change', true)),
  'metric-change': () => { const metric = $('metric').value; panel('本次口径变更影响', `<p>选择：${metric === 'net' ? '净销售额；需退款资格与关联检查' : '订单金额；不再声称已核实净销售额下降'}。</p><p>相关指标／图表／报告须按本次定义计算；这不是新结果。</p>` + button('返回查看可读方案', 'plan', true)); },
  'accept-meaning': () => show('plan'),
  'plan-detail': () => detail('方案与证据需要', '<h3>核验 → 定位 → 检查 → 判断限制</h3><p>资料：当前选定订单、会员及退款快照。步骤必须对应实际 IR、输入与工具。</p><p>分组对账支持定位；退款关联检查支撑净额资格。发券记录及合格对照缺失，不执行增量估计。</p><p>候选假设：购买减少／退款变化，待证据检查。支持和反证可以并存；本页不宣称原因成立。</p>'),
  'edit-plan': () => panel('调整分析重点', '<label class="field">你的修改<textarea id="plan-edit" rows="3">先不要分析渠道，重点看高价值会员和退款。</textarea></label><p>静态审核：只展示上述固定修改，不理解任意文本。生产应理解实际意图、澄清缺口并变更真正计划。</p>' + button('查看上述样例的影响', 'impact', true)),
  mapping: () => panel('检查退款关联 · 保留有效部分', '<p>问题：同一退款记录关联多个订单，可能重复计算。原始文件只读；修正后生成新映射／快照版本。</p><p>可补唯一标识或明确业务关联规则；没有依据时保持暂停。订单金额不依赖退款，可保留；净销售额必须重新检查。</p>' + button('取消退款分支', 'cancel-branch') + button('查看补正后执行样例', 'results')),
  materials: () => detail('资料、权限与出站记录', '<p>计算：本机受控工具。原件只读；派生与报告另存。</p><p>快速主任务所选资料必要明细／结构／结果可在有效授权内供获准模型读取；严格零明细外发延期。主模型MiniMax-M3、备用MiMo Flash沿用配置。</p><p>生产记录精确接收方、实际资料／范围、时间及请求状态；不暴露Key。此审核稿没有真实出站记录，未发请求。</p><p>未选文件、凭据和任意路径禁止；子任务仍需精确子集。累计持续计量，不设累计上限；主备共用一次额外请求。</p>'),
  evidence: () => detail('该条发现的证据', '<h3>全体净销售额 · 合成 v1</h3><p>前期100万元、本期90万元；本期较前期−10%。高价值70→55，其他30→35；分组加总匹配总体。</p><div role="img" aria-label="合成净销售额前期100万元，本期90万元"><span>前期 100</span><div class="chart-bar" style="width:100%"></div><span>本期 90</span><div class="chart-bar" style="width:90%"></div></div><p>来源：本例会员／订单／退款快照；净额口径、方案v1、计算Run及独立复算身份（均为合成，不编造真实hash）。</p><p>支持：范围内金额及分组对账。未取得：需求与供给解释的反证。方法前提：退款唯一合法归属。</p><p><strong>限制：计算一致不是因果证明，尚不能支持发券效果。</strong></p>'),
  'evidence-v2': () => detail('新版本分组证据', '<h3>高价值会员 · 合成 v2</h3><p>筛选真实生效要求：高价值组；前期70、本期55万元，−21.43%。仅此组，不代表全体下降率。</p><p>独立核验与新计划／来源版本应对应。没有优惠券效果证据，不推断增量收益。此样例尚无真实运行记录。</p>'),
  objection: () => panel('针对这条发现提出异议', '<p>绑定：全体老客净销售额发现 · v1。不是对整篇报告无来源地重写。</p><label class="field">意见<textarea rows="3">请只看高价值会员，检查判断是否仍成立。</textarea></label><p>仅改表达不重算；改变事实或范围先预览影响。此按钮展示固定样例，不处理自由文本。</p>' + button('查看上述异议的影响', 'impact', true)),
  missing: () => detail('证据不足 · 优惠券增量效果', '<p>需要可信发券／核销、对象、期间及适用对照／识别条件。未提供不等于效果为0，也不等于效果成立。</p><p>当前可交付销售变化及限制，不自动执行促销，不凭前后变化作因果判断。</p>'),
  'apply-change': () => panel('方案 v2 已形成 · 成果仍待重算', '<p>移除：渠道分析。新增筛选：高价值会员。保留：合法来源检查及该分组退款关联检查。</p><p>旧发现／图表／相关报告段落标历史；当前对应结果待计算。来源和依赖未变的结构检查才能复用；未能证明则扩大重算。</p><div class="dialog-note">这是合成状态，不发任务。生产应实际执行新IR和独立核验，失败／停止不显示下面的新数字。</div>' + button('查看合成核验完成后的新旧对照', 'compare', true)),
  'select-new': () => { revisionSelected = '新版本 v2 · 不创建正式决定'; show('compare'); },
  'select-old': () => { revisionSelected = '原版本 v1 · 历史范围，未回答新范围'; show('compare'); },
  'reuse-detail': () => detail('历史方案可复用范围', '<p>已由用户确认的口径、核验步骤和报告结构可以作为当前候选；来源任务、版本与采用记录可查。</p><p>当前输入／授权／方法前提重新验证。失权或不适用引用拒绝，不自动发外部模型。没有可用旧方案时正常新建。</p><p>不是新资产发布，不声明Teach或学习效果。旧数字、原因、核验、Decision／Expected不继承。</p>'),
  adopt: () => { newTask = true; show('adopted'); },
  'cancel-branch': () => show('partial'),
  execution: () => detail('执行及保存范围', '<p>展示实际业务步骤、工具、计算／核验和持久调用记录。代码成功、独立核验和原因判断分别显示。</p><p>只保留当前有效且身份匹配的部分。停止后不得发新请求／正式发布迟到结果；重启不自动续跑。</p><p>此稿无真实请求或保存回执；按钮只改变审核内存。</p>'),
  'unknown-detail': () => detail('结果待对账 · 下一步', '<p>读回同一逻辑操作的物理请求／工具／保存回执。确定已完成时读取现有结果；确认失败且安全时按剩余机会处理；仍未知保持围栏。</p><p>不能清账、换操作ID或新Attempt盲重试。此审核只展示路径，没有真实对账或可点击执行命令。</p>')
};
document.addEventListener('click', event => {
  const control = event.target.closest('[data-action]'); if (!control) return;
  const action = control.dataset.action;
  if (actions[action]) actions[action](); else if (statusText[action]) show(action);
});
$('scene').addEventListener('change', () => { newTask = false; show($('scene').value); });
$('new').onclick = () => { newTask = false; show('reuse'); };
$('current').onclick = () => { newTask = false; show('meaning'); };
$('history').onclick = () => show('reuse');
$('stop').onclick = () => show('stopped');
$('save').onclick = () => { simulatedSaved = true; $('status').textContent = '审核内存已标记保存 · 无后台回执，刷新会丢失'; };
$('back').onclick = () => { $('workspace').hidden = true; $('thread').hidden = false; if (originFocus?.isConnected) originFocus.focus(); };
function closeDrawer() { $('drawer').hidden = true; $('drawer').classList.remove('visible'); $('details').setAttribute('aria-expanded', 'false'); if (originFocus?.isConnected) originFocus.focus(); else $('details').focus(); }
$('close').onclick = closeDrawer;
$('details').onclick = () => { if ($('details').getAttribute('aria-expanded') === 'true') closeDrawer(); else actions.context(); };
document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!$('workspace').hidden) $('back').click(); else if (!$('drawer').hidden) closeDrawer(); } });
$('composer').addEventListener('submit', event => { event.preventDefault(); const text = $('message').value.trim(); if (!text) return; $('status').textContent = '审核稿不理解任意文本，未提交任务／调用模型。请使用固定场景查看行为。'; const note = document.createElement('p'); note.className = 'message-user'; note.textContent = text; $('thread').append(note); $('message').value = ''; });
function mode(pro) { $('quick-view').hidden = pro; $('pro-view').hidden = !pro; document.body.dataset.contractSurface = pro ? 'pro' : 'quick'; $('professional').classList.toggle('active', pro); $('quick').classList.toggle('active', !pro); $('professional').setAttribute('aria-pressed', String(pro)); $('quick').setAttribute('aria-pressed', String(!pro)); }
$('quick').onclick = () => mode(false); $('professional').onclick = () => mode(true);
show(scene); actions.context(); $('main').focus();
