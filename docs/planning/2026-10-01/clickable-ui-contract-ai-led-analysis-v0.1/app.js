'use strict';
// Product UI Contract only. Deterministic, in-memory simulation; no real engine or model.
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oldProfessional = '../../2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/index.html';
const fullProfessional = '../../2026-09-18/clickable-ui-contract-v1.1/dist/professional/index.html';
const collaborationContract = '../../2026-09-30/clickable-ui-contract-fork-subagent-v1.0/index.html';
const periods = ['8月1–7日 对比 8–14日', '8月8–14日 对比 15–21日'];
const stageNames = ['新建分析', '数据准备', '本地处理', '循证分析', '分析报告', '执行反馈'];
const steps = ['核对资料和已确认口径', '形成受限分析计划', '完成本地 SQL 主算', '用 Python 独立复算', '整理发现与待审报告'];
const statusLabels = { blocked: '资料不符合分析资格', unsupported: '需缩小问题', blank: '尚未开始', ready: '待授权', missing: '等待资料', semantic: '等待业务口径', running: '分析中', review: '系统已验证 · 待你审阅', failed: '需要处理', interrupted: '已中断', closed: '任务已关闭', completed: '已完成 · 人工已确认', evidence: '待补充证据' };
let sequence = 0;
let timer = null;
let returnFocus = null;
let modalKind = '';
let pendingScope = null;
let scopeComment = null;
let pendingComment = null;
let grantMode = 'analysis';
let finalDraft = null;
let expectedCache = {};
let expectedChoice = '';
let state;
function resetState(scenario = 'normal') {
  clearTimeout(timer); sequence += 1;
  state = { scenario, mode: 'quick', status: 'blank', request: '', files: false, orders: false, semantic: scenario !== 'semantic', grouped: scenario === 'group', period: 0, step: -1, attempt: 0, spent: 0, usedSteps: 0, verified: false, verifiedAttempt: null, reports: [], current: null, comments: [], events: [], authorization: null, grantSequence: 0, taskGrantActive: false, publicationError: false, publicationReadback: false, resumeVerified: false, formal: null, closedFrom: null, notice: '', recovered: false };
  pendingScope = null; scopeComment=null; pendingComment=null; grantMode='analysis'; finalDraft = null; expectedCache={}; expectedChoice=''; $('failPublication').checked = false; render();
}
function log(text) { state.events.push({ text, time: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }); }
function button(action, label, primary = false, disabled = false) { return `<button class="${primary ? 'primary' : 'secondary'}-button" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`; }
function labelForState() { return statusLabels[state.status]; }
function requiredSteps() { if(grantMode==='comment')return 1; return state.verified && pendingScope === null ? 1 : 5; }
function grantValidity() {
  const grant=state.authorization;
  if(!grant || !state.taskGrantActive)return {valid:false,reason:'任务授权未生效，或已因停止／关闭而封闭'};
  if(Date.now()>=grant.expiresAt)return {valid:false,reason:'任务授权已超过演示截止时间'};
  if(pendingScope!==null || grant.period!==state.period || grant.grouped!==state.grouped || !state.files || !state.orders || !state.semantic)return {valid:false,reason:'来源、期间、方法或语义范围需要重新确认'};
  if(state.usedSteps+requiredSteps()>12 || state.spent+requiredSteps()*.05>1.20001)return {valid:false,reason:'累计剩余额度不足以完成所需工作'};
  return {valid:true,reason:'相同两份合成来源、范围与语义；任务有效期内，累计剩余额度足够'};
}
function canComment() { return state.status === 'review' && state.current && !state.current.final; }
function eligible() { return state.status === 'completed' && state.formal && state.formal.accepted && state.formal.closure && state.current.final; }
function announce(text) { state.notice = text; render(); }
function render() {
  $('status').textContent = labelForState(); $('railStatus').textContent = labelForState();
  $('taskTitle').textContent = state.request ? '会员复购分析' : '从一个问题开始';
  $('railTitle').textContent = state.request ? '会员复购分析' : '新分析任务';
  $('stopButton').disabled = state.status !== 'running';
  document.querySelectorAll('[data-action="quick"], [data-action="professional"]').forEach((node) => { const active = node.dataset.action === state.mode; node.classList.toggle('active', active); node.setAttribute('aria-pressed', String(active)); });
  $('mainContent').innerHTML = state.mode === 'professional' ? professionalView() : quickView();
  $('contextContent').innerHTML = contextView();
  $('leftHistory').innerHTML = state.reports.length ? `<p class="group-label">本任务报告历史</p>${state.reports.map((r) => `<button class="history-link" data-history="${r.version}">报告 v${r.version} · ${r.final ? '正式版' : '待审历史'}<br><span class="muted">${periods[r.period]}</span></button>`).join('')}` : '';
}
function quickView() {
  if (state.status === 'blank') return `<section class="intro"><div class="orb" aria-hidden="true">✦</div><p class="eyebrow">你的业务问题</p><h2>这次，你想弄清楚什么？</h2><p>把问题和资料交给我。我们先核实发生了什么，再讨论下一步。</p></section><section class="task-entry"><label for="request"><strong>你的业务问题</strong></label><textarea id="request" placeholder="例如：最近会员复购似乎下降，帮我核实变化，并建议下一步。"></textarea><div class="actions end">${button('send', '开始这项分析', true)}</div><p class="muted">请只使用虚构文本。本页不会接触真实文件或模型。</p></section><p class="section-label">试试这样开始</p><div class="examples"><button data-example="最近会员复购似乎下降，帮我核实变化，并建议下一步。">核实复购是否下降 ↗</button><button data-example="比较两期会员复购，并查看匿名A/B组的收入变化贡献。">查看分组贡献 ↗</button></div>`;
  let html = `<div class="user-question"><small>你 · 当前任务</small>${escapeHtml(state.request)}</div>`;
  if (state.notice) html += `<div class="notice" role="status">${escapeHtml(state.notice)}</div>`;
  if (state.status === 'unsupported') return html + `<section class="surface"><h2>先确认可以回答的部分</h2><p>我可以核实两期总体复购变化。原问题中的新客筛选、因果或外部研究不会被执行，也不会生成虚构答案。</p>${button('narrow-task','改为核实两期总体变化',true)}</section>`;
  if (state.status === 'blocked') return html + `<section class="notice error"><h2>两期合计没有有效订单，不能开始分析</h2><p>本地准备检查：两期筛选合计 0 个有效行。资料资格未通过，未创建分析运行／模型尝试，也没有分析发现、分析收尾或正式报告。</p><p>请补充覆盖所选期间且满足合法状态的资料，或明确调整为资料已覆盖的合法期间。系统不会猜期间或状态，也不会把空数据包装成证据不足报告。</p><p class="muted">本固定空数据回放停在资料阻断；评审其他路径可使用上方场景工具开始独立任务。</p></section>`;
  if (state.status === 'closed') return html + `<section class="surface"><h2>任务已关闭</h2><p>本页内存中的资料、已完成验证与历史仍可查看。重开不会自动调用模型。</p>${button('reopen', '重新打开任务', true)}</section>`;
  if (!state.files || !state.orders) html += `<section class="surface"><h2>先提供本次分析的资料</h2><p>需要会员资料和订单明细，才能区分活跃会员与复购会员。</p><p>添加文件只允许对本次所选资料作本地格式、角色、字段和覆盖检查；不授权计算、模型使用或外发，也不读取其他目录。</p><div class="file-row"><span>members.csv · 合成会员资料</span><span>${state.files ? '已添加' : '未添加'}</span></div><div class="file-row"><span>orders.csv · 合成订单资料</span><span>${state.orders ? '已添加' : '缺少'}</span></div><div class="actions">${button('add-files', state.files ? '添加缺少的合成订单文件' : '添加两份合成示例文件', true)}</div><p class="muted">演示操作：添加预置虚构资料，没有真实文件选择器。</p>${state.files ? '<p class="muted">目前仅确认会员资料可读；没有订单不能判断复购变化。可保留任务稍后补充。</p>' : ''}</section>`;
  else if (!state.semantic) html += `<section class="surface"><h2>你希望比较哪两个期间？</h2><p>配置演示 member-repurchase-context v1：会员／订单角色映射已确认，有效状态映射为 PAID，CNY / Asia/Shanghai 已确定；仅缺本次比较期间。我不能替你选择“最近”的含义。无需重填已知映射。</p><label class="field" for="semanticPeriod">比较期间<select id="semanticPeriod"><option value="">请选择</option><option value="0">${periods[0]}</option><option value="1">${periods[1]}</option></select></label>${button('semantic', '确认这个业务口径', true)}</section>`;
  else if (state.status === 'ready') html += `<section class="surface"><span class="badge">资料已备齐</span><h2>可以开始核实复购变化了</h2><p>我会比较${periods[state.period]}的活跃会员、复购率和复购收入${state.grouped ? '，再核对匿名 A / B 组的收入变化贡献' : ''}。完成独立复算后，为你整理发现、限制和建议。</p><p class="muted">口径来自本合成场景已配置规则；不预设一定下降。全过程可停止。</p>${button('authorize', '查看任务授权并开始', true)}</section>`;
  if (state.status === 'running') html += `<section class="surface"><span class="badge">模型尝试 ${state.attempt} · 合成连续运行</span><h2>正在${steps[Math.max(0,state.step)]}</h2><p>${state.resumeVerified ? `复用 E-${state.verifiedAttempt} 的有效 G1 验证身份；只恢复失败的报告步骤，前四步未重新执行。` : '授权范围内连续推进，你无需选择内部节点。'}</p><ol class="progress-list">${steps.map((s,i) => `<li class="${i < state.step ? 'done' : i === state.step ? 'current' : ''}"><span class="step-dot">${i < state.step ? '✓' : i + 1}</span>${s}${i === state.step ? '…' : ''}</li>`).join('')}</ol><p class="muted">这是步骤进度模拟，没有执行真实 SQL、Python 或 IR。</p></section>`;
  if (state.status === 'failed' || state.status === 'interrupted') html += `<section class="notice ${state.status === 'failed' ? 'error' : ''}"><h2>${state.status === 'interrupted' ? '任务已中断，等待你的选择' : state.verified ? '报告生成未完成' : '计算结果未通过一致性校验'}</h2><p>${state.verified ? '已完成的本地验证仍有效；报告或表达整理尚未完成。不会把未完成输出标为正式报告。' : '资料和已确认口径仍保留；本次尚无可发布的验证结论。主算／复算不一致时，不采用任何一方数字。'}</p><p>原模型尝试已结束。你明确继续后，后台先核验原任务授权的来源、范围、有效期与剩余额度；仍有效就沿用，失效才重新授权。失败本身不撤销授权，累计消耗不清零。</p>${button('recover', '继续未完成工作', true)}</section>`;
  if (state.verified) html += resultView();
  if (state.current) html += reportView(state.current, false);
  if (canComment()) html += commentView();
  if (state.status === 'review') html += `<section class="surface"><h3>由你作最后判断</h3><p>报告已准备好。你可以确认有限结论并选择下一步，也可以只保存分析结论，或要求更多证据。</p>${button('review', '审阅结论与下一步', true)}</section>`;
  if (state.status === 'evidence') html += `<section class="notice"><h3>已记下你的补证要求</h3><p>分析发现未接受、分析收尾未完成、没有正式决定。待审报告仍可查阅。</p>${button('return-review', '返回报告继续审阅')}</section>`;
  if (state.status === 'completed') html += `<section class="notice success"><h3>${state.formal.decision ? '你的选择已记录' : '分析结论已保存'}</h3><p>有限分析发现已由你接受，分析收尾已完成，正式报告已追加。${state.formal.decision ? '正式决定 / 事前预期已记录。' : '没有创建正式决定 / 事前预期。'}</p><p>这不授权或执行任何业务行动。</p></section><section class="surface"><h3>需要比较另一条思路？</h3><p>当前任务已满足已完成、已接受的分析发现、分析收尾和正式报告条件。以下链接打开 003 独立完整界面交互约定；不会继承本页状态或自动启动子任务。</p><div class="actions"><a href="${collaborationContract}" target="_blank" rel="noopener">比较另一思路 / 检查反证 ↗</a><a href="${oldProfessional}" target="_blank" rel="noopener">既有个案助手 ↗</a></div></section>`;
  return html;
}
function resultData() {
  if (state.scenario === 'zero') return {before:50,after:null,active:[200,0],repeats:[100,0],revenue:[20000,0],delta:null,money:-20000,insufficient:true,finding:'比较期活跃会员200、复购会员100、复购率50%；当前期活跃会员0、复购会员0，复购率不可计算，率变化为 N/A。'};
  if (state.period === 1) return { before:40, after:45, repeats:[80,90], revenue:[16000,18000], delta:5, money:2000, finding:'复购率从 40% 上升至 45%，增加 5 个百分点。' };
  if (state.scenario === 'flat') return { before:50, after:50, repeats:[100,100], revenue:[20000,20000], delta:0, money:0, finding:'两期复购率均为 50%，当前证据不支持“复购下降”。' };
  return { before:50, after:40, repeats:[100,80], revenue:[20000,16000], delta:-10, money:-4000, finding:'复购率从 50% 下降至 40%，减少 10 个百分点。' };
}
function resultView() {
  const d = resultData();
  if (d.insufficient) return `<section class="notice"><h2>当前证据不足以比较复购率</h2><p>比较期活跃200、复购100、复购率50%、复购收入CNY20,000；当前期活跃0、复购0、收入CNY0，当前率不可计算、率变化N/A。双期合计仍有有效订单，允许核实有限不足；M2不适用。不能把零分母显示成0%或率下降。</p><p>系统已核实这一限制；${state.formal?'已人工接受此限制':'尚未人工接受'}。可补充有有效订单的期间资料，或审阅并保存有限结论。</p>${button('evidence-detail','查看限制依据')}</section>`;
  return `<section class="surface"><div class="report-heading"><h2>${d.delta < 0 ? '复购确实下降了' : d.delta === 0 ? '这次没有发现复购下降' : '新期间的复购率有所回升'}</h2><span class="badge verified">系统验证 · 合成</span></div><p>${d.finding}两期各有 200 位活跃会员。</p><div class="metrics"><div class="metric"><span>本期复购率</span><strong>${d.after}%</strong><small>${d.repeats[1]} / 200 位</small></div><div class="metric"><span>较比较期</span><strong>${d.delta > 0 ? '+' : ''}${d.delta} 个百分点</strong><small>${d.before}% → ${d.after}%</small></div><div class="metric"><span>复购收入变化</span><strong>${d.money > 0 ? '+' : ''}${d.money.toLocaleString('zh-CN')}</strong><small>CNY · 第 2 笔及以后订单</small></div></div><p class="muted">仅验证两期变化，不证明变化原因，也不证明任何策略有效。人工尚未接受的发现不得标为正式决定。</p><button class="text-button" data-action="evidence-detail">查看主算 / 复算与来源 ↗</button></section>`;
}
function newReport(short = false) {
  const report = { version: state.reports.length + 1, attempt: state.attempt, evidenceAttempt: state.verifiedAttempt, period: state.period, grouped: state.grouped, data: resultData(), short, final: false, commentCount: state.comments.length };
  state.reports.push(report); state.current = report;
}
function reportView(r, history) {
  const d = r.data;
  if (d.insufficient) return `<article class="surface"><h2>会员复购分析：证据不足</h2><p>报告 v${r.version} · ${periods[r.period]} · ${r.final?'正式版 · 人工仅接受限制':'待审草稿'}</p><p>${d.finding}不能得出变化幅度、原因或候选偏好。</p><p>分析收尾不足路线：比较期有有效订单，当前期没有活跃会员；因此当前复购率与率变化不可计算、M2不适用，需补充当前期覆盖后才可比较。无推荐偏好。</p>${history?'<p class="history-note">只读历史快照。</p>':''}<button class="text-button" data-evidence-report="${r.version}">查看 E-${r.evidenceAttempt}-LIMIT 依据</button>${r.final?`<h3>人工审阅记录</h3><p>${escapeHtml(r.formal.summary)}</p><p>审阅人 ${escapeHtml(r.formal.actor)}；接受的仅是证据不足限制。${r.formal.decision?`理由：${escapeHtml(r.formal.rationale)}；责任人：${escapeHtml(r.formal.owner)}；N/A：${escapeHtml(r.formal.expected)}；触发：${escapeHtml(r.formal.trigger)}`:'无正式决定 / 事前预期。'}</p>`:''}</article>`;
  return `<article class="surface report-body"><div class="report-heading"><div><p class="eyebrow">分析报告 · 合成数据</p><h2>会员复购变化与下一步</h2><p class="muted">报告 v${r.version} · ${periods[r.period]} · 模型尝试 ${r.attempt}</p></div><span class="badge ${r.final ? 'verified' : ''}">${r.final ? '正式版 · 人工确认' : '待审草稿'}</span></div>${history ? '<p class="history-note">历史快照只读；不因新期间、点评或正式判断而改写。</p>' : ''}<h3>01 / 核实结果</h3><p>${d.finding}${r.short ? '' : ` 比较期为 ${d.repeats[0]} / 200，本期为 ${d.repeats[1]} / 200。复购收入由 CNY ${d.revenue[0].toLocaleString('zh-CN')} 变为 CNY ${d.revenue[1].toLocaleString('zh-CN')}。`}</p>${r.short ? `<p>复购会员：${d.repeats[0]}/200 → ${d.repeats[1]}/200；复购收入：CNY ${d.revenue[0]} → ${d.revenue[1]}。</p>` : ''}<button class="text-button" data-evidence-report="${r.version}">E-${r.evidenceAttempt}-M1 · 数据与复算回链 ↗</button>${r.grouped ? `<h3>02 / 匿名分组贡献</h3><div class="table-wrap"><table><thead><tr><th>匿名组</th><th>比较期收入</th><th>本期收入</th><th>变化 CNY</th></tr></thead><tbody>${d.money === 0 ? '<tr><td>A</td><td>12,000</td><td>12,000</td><td>0</td></tr><tr><td>B</td><td>8,000</td><td>8,000</td><td>0</td></tr><tr><td>总体</td><td>20,000</td><td>20,000</td><td>0</td></tr>' : r.period === 0 ? '<tr><td>A</td><td>12,000</td><td>9,000</td><td>−3,000</td></tr><tr><td>B</td><td>8,000</td><td>7,000</td><td>−1,000</td></tr><tr><td>总体</td><td>20,000</td><td>16,000</td><td>−4,000</td></tr>' : '<tr><td>A</td><td>9,000</td><td>10,500</td><td>+1,500</td></tr><tr><td>B</td><td>7,000</td><td>7,500</td><td>+500</td></tr><tr><td>总体</td><td>16,000</td><td>18,000</td><td>+2,000</td></tr>'}</tbody></table></div><p class="muted">组收入变化之和与总体一致。此节是本地确定性M2报告绑定，组级材料未获准外发，模型未读取。组别是匿名演示标签；这不是复购率因果贡献。</p>` : ''}<h3>局限与可选下一步</h3><p>两期描述性比较不能解释原因。可补充会员反馈来核查原因，或先不行动／暂缓并设复评条件；候选仅供审阅，未执行。</p>${r.final ? `<h3>人工审阅记录</h3><p>${escapeHtml(r.formal.summary)}</p><p>审阅人：${escapeHtml(r.formal.actor)}。接受本页列明的有限分析发现；分析收尾完成。路线：${escapeHtml(r.formal.closureRoute)}。</p>${r.formal.decision ? `<p>决定理由：${escapeHtml(r.formal.rationale)}<br>责任人：${escapeHtml(r.formal.owner)}<br>预期 / N/A：${escapeHtml(r.formal.expected)}<br>时间或复评触发：${escapeHtml(r.formal.trigger)}</p>` : '<p>仅保存分析结论，无正式决定 / 事前预期。</p>'}<p class="muted">正式记录为本页内存模拟；不是业务行动权限。</p>` : ''}</article>`;
}
function commentView() { return `<section class="surface"><h3>对报告说说你的想法</h3><p class="muted">点评绑定当前报告 v${state.current.version}，旧点评不会移到新版本。</p><label class="field" for="commentSection">针对哪一部分<select id="commentSection"><option>核实结果</option><option>局限与下一步</option><option>整份报告</option></select></label><label class="field" for="commentText">你的点评<textarea id="commentText" placeholder="例如：简短一点；改用另外两个期间；只看上月新客；为什么下降？"></textarea></label><p class="muted">以上输入框就是本条完整文本预览，可在提交前逐字检查。仅本条勾选后可由本次 AI 使用。</p><label class="checkline"><input id="commentConsent" type="checkbox">让本次 AI 使用这条点评文本；我已检查其中的敏感内容</label><div class="actions">${button('comment', '提交点评', true)}</div><div class="examples"><button data-comment-example="简短一点，但保留数字和来源。">简短一点</button><button data-comment-example="改用另外两个期间。">换个期间</button><button data-comment-example="只看上月新客。">只看新客</button><button data-comment-example="为什么下降？">追问原因</button></div></section>`; }
function contextView() {
  return `<details class="context-block" open><summary>资料与业务口径</summary><p>语义配置：member-repurchase-context v1（演示）；会员／订单角色与 PAID 状态映射已配置。</p><p>${state.files ? '✓ members.csv · 合成' : '尚无资料'}${state.orders ? '<br>✓ orders.csv · 合成' : ''}</p><p>${state.semantic ? periods[state.period] : '期间待确认'}<br>CNY · Asia/Shanghai<br>有效状态 PAID（演示已配置，非生产默认）</p><p>分母：期内 ≥1 笔有效订单会员。分子：期内 ≥2 笔。复购收入：每位会员第 2 笔及以后有效订单金额。</p></details><details class="context-block"><summary>分析计划与方法</summary><p>${state.grouped ? 'M1 总体比较 + M2 匿名分组收入贡献' : 'M1 总体比较'}</p><p>核对范围 → 本地计算 → 独立复算 → 发现与报告。用户不需要操作 IR 或六个阶段。</p><p>这是方法与流程的可读模拟；没有真实 IR 执行。</p><button class="text-button" data-action="plan">查看计划详情</button></details><details class="context-block"><summary>授权与本次用量</summary><p>${state.authorization ? `任务授权 A-${state.authorization.id} · ${grantValidity().valid ? '同范围任务授权有效' : '当前不可准入'}<br>演示服务商 / 合成模型` : '未产生模型任务授权'}</p><p>跨模型尝试累计：CNY ${state.spent.toFixed(2)}<br>任务演示上限 CNY 1.20；不是生产默认或实际费用。</p><button class="text-button" data-action="authorization-detail">查看授权记录</button></details><details class="context-block"><summary>证据与正式状态</summary><p>${state.verified ? `E-${state.verifiedAttempt}-${state.scenario==='zero'?'LIMIT · 单期零分母不足':'M1 · 合成主算/复算一致'}` : '尚无本次已验证结论'}<br>分析发现：${state.formal ? '人工已接受所列有限项' : '未人工接受'}<br>分析收尾：${state.formal ? '完成' : '未完成'}<br>正式决定：${state.formal?.decision ? '已记录' : '无'}</p>${button('evidence-detail', '查看证据')}</details><details class="context-block"><summary>历史与点评 (${state.comments.length})</summary>${state.events.map(e => `<p>${escapeHtml(e.time)} · ${escapeHtml(e.text)}</p>`).join('') || '<p>开始任务后显示记录。</p>'}${state.comments.map(c => `<p>报告 v${c.version} / ${escapeHtml(c.section)}<br>“${escapeHtml(c.text)}”<br>${escapeHtml(c.outcome)}</p>`).join('')}</details><details class="context-block"><summary>专业能力与协作</summary><p>技能 / 提示词 / 六阶段专业流程仍保留。${eligible() ? '当前已具备 003 入口资格。' : '尚不满足已完成 + 已接受发现 + 分析收尾 + 正式报告；不能发起 分支对话 / 子任务。'}</p><button class="text-button" data-action="professional">查看专业视图</button><p><a href="${fullProfessional}" target="_blank" rel="noopener">既有完整专业界面 ↗</a></p></details>`;
}
function professionalView() { return `<section class="surface"><p class="eyebrow">专业视图</p><h2>同一任务的专业视图</h2><p>模式切换仅改变视图；不把未完成任务改造成已完成的个案助手，也不终止运行。</p><ol class="stage-strip">${stageNames.map((s,i) => `<li><span>${i+1}</span>${s}</li>`).join('')}</ol><p>当前任务：${labelForState()}。${state.verified ? '合成计算已通过系统验证。' : '尚未产生本次系统验证结果。'}</p><div class="actions">${button('plan','查看分析计划 / 技能 / 提示词')}${button('quick','返回任务',true)}</div></section><section class="surface"><h3>保留完整专业路径</h3><p>这些独立历史附件保留原六阶段、数据映射、三辅助、专业记录与报告能力；本增量检查视图没有取代它们。打开链接不会迁移本任务状态。</p><p><a href="${fullProfessional}" target="_blank" rel="noopener">完整六阶段专业界面约定 ↗</a></p><p><a href="${oldProfessional}" target="_blank" rel="noopener">变更 002 · 专业 / 个案助手 ↗</a></p>${eligible() ? `<p><a href="${collaborationContract}" target="_blank" rel="noopener">变更 003 · 比较另一思路 / 检查反证 ↗</a></p>` : '<p class="muted">分支对话 / 子任务：本任务资格未满足，入口尚不可用。</p>'}</section>${state.current ? reportView(state.current,false) : ''}`; }
function openDialog(title, body, kind = '') {
  returnFocus = document.activeElement; modalKind = kind;
  $('dialogContent').innerHTML = `<div class="dialog-head"><h2 id="dialogTitle">${title}</h2><button class="icon-button" data-action="dismiss" aria-label="关闭对话框">×</button></div>${body}`;
  if (!$('modal').open) $('modal').showModal();
}
function closeDialog() { $('modal').close(); }
$('modal').addEventListener('cancel', () => {pendingScope=null;scopeComment=null;pendingComment=null;grantMode='analysis';});
$('modal').addEventListener('close', () => { if($('modal').open)return; if (returnFocus?.isConnected) returnFocus.focus(); else $('taskTitle').setAttribute('tabindex','-1'), $('taskTitle').focus(); modalKind = ''; });
function showAuthorization(recovery = false, commentOnly = false) {
  grantMode=commentOnly?'comment':'analysis';
  if (state.scenario === 'empty' || !state.files || !state.orders || !state.semantic || state.status === 'running' || state.status === 'closed') return;
  const targetPeriod = pendingScope ?? state.period;
  const outgoingComment=commentOnly?pendingComment:(pendingScope!==null?scopeComment:null);
  const remaining = Math.max(0,1.2-state.spent);
  if (state.usedSteps + requiredSteps() > 12) { openDialog('累计演示上限已用尽', `<p>本任务已使用 ${state.usedSteps} / 12 个合成步骤，剩余不足本次需要的 ${requiredSteps()} 步模型尝试；不自动扩额。已验证结果及历史仍可查看。评审者可从上方场景工具开始独立回放。</p>`); return; }
  openDialog(recovery ? '原授权不可复用 · 确认新的任务授权' : '开始前，确认这次任务', `<p>目的：${escapeHtml(state.request)}</p>${outgoingComment ? `<details class="surface"><summary>本次唯一选定点评（请检查敏感内容；其余旧点评默认排除）</summary><p>v${outgoingComment.version} / ${escapeHtml(outgoingComment.section)}：${escapeHtml(outgoingComment.text)}</p></details>` : ''}<section class="surface"><h3>本次读取的两份资料</h3><label class="checkline"><input type="checkbox" checked disabled>members.csv · 合成会员资料</label><label class="checkline"><input type="checkbox" checked disabled>orders.csv · 合成订单资料</label><p>${periods[targetPeriod]} · Asia/Shanghai · CNY<br>有效状态 PAID；分母 ≥1 笔，分子 ≥2 笔；复购收入计第 2 笔及以后。</p><p>原始 CSV 行、member_id / order_id、原始群组值、绝对路径及 010_draw 留在本地。</p></section><section class="surface"><h3>允许的工作与模型可见内容</h3><p>本模型尝试：${commentOnly?'仅处理上方重新选定的本条点评；不重算既有结果。':state.verified&&pendingScope===null?'只检查原证据身份仍有效并恢复未完成报告；不重算有效 G1。':'创建本范围的资料快照、计划、计算和验证。'}<br>允许的本地范围：读取所选两份资料、校验和快照、固定 M1${state.grouped ? ' / M2' : ''} 主算与复算、生成本任务报告。</p><p>外发类别：上方明确选定的本次需求与已勾选点评文本（未来新点评必须逐条选择；未选点评不外发）；已确认期间、币种、时区、指标定义与方法标识；受控角色及类型结构（不含原列名／样值）；获准总体计数、比率、金额；总体一致性结果、有限总体分析发现、限制、剔除组级段落的当前任务总体报告摘要。本演示尚未批准组级披露：匿名 A/B 聚合、组级分析发现和包含组值的点评／段落只留本地；M2数值由本地确定性报告绑定和显示，模型不能声称读过。小群体／屏蔽规则尚未闭合，仅匿名不构成外发权限。仅同来源、同计划／版本且通过准入的这些系统材料可供本次连续工作使用；这不授权未来自由文本。含敏感内容且无法安全准入的材料停留本地。</p><p>不含原始行、任意历史、其他任务、任意 SQL / Shell / 网络工具。不能执行业务行动。</p><p><strong>演示服务商 / 合成模型</strong> · 本附件完全不外发；此处演示生产授权应披露的边界。</p></section><section class="surface"><h3>资源和结束条件</h3><p>演示：任务总上限 CNY 1.20 / 12 个合成步骤；单次模型尝试最多 5 步、60 秒；这不是任务授权期限。任务授权本次演示为确认起15分钟，准确截止随授权保存；生产期限待确认，不以此设默认。跨模型尝试已用 ${state.usedSteps} / 12 步、已计 CNY ${state.spent.toFixed(2)}，余额 CNY ${remaining.toFixed(2)}，不会因恢复清零。数值仅用于演示，不是生产默认。</p><p>授权只覆盖当前目的、两份资料和所示期间；当前任务人工完成、用户停止／关闭、应用重开、超过任务截止或实质范围改变会封闭授权；失败本身只结束模型尝试，不自动撤销任务授权；模型尝试生成待审报告后，同范围任务授权可继续有效，但每条新增点评仍需选择。增加来源、期间、接收方、操作或上限须重新授权；无无限自动重试。</p></section><label class="checkline"><input id="consent" type="checkbox">我有权将这两份本地数据用于本次分析，并明确选择以上需求与已勾选点评文本、所列受准入系统材料用于本次任务；我理解这是合成授权演示。</label><p id="dialogError" class="form-error" role="alert"></p><div class="actions dialog-actions">${button('dismiss','取消')}${button('grant',commentOnly?'确认授权并处理本条点评':'确认授权并连续分析',true,remaining < requiredSteps() * .05)}</div>`, 'authorization');
}
function startRun(reuseGrant=false) {
  if(state.scenario==='empty'){closeDialog();state.status='blocked';render();return;}
  if (!reuseGrant && !$('consent')?.checked) { $('dialogError').textContent = '请明确勾选本次资料与文本授权；取消不会开始任务。'; return; }
  if (state.spent + requiredSteps() * .05 > 1.20001 || state.usedSteps + requiredSteps() > 12) { $('dialogError').textContent='累计演示额度或步骤不足，不能启动新模型尝试；不会自动扩额。'; return; }
  if(reuseGrant && !grantValidity().valid){showAuthorization(true);return;}
  const selectedComment=pendingComment || (pendingScope!==null?scopeComment:null);
  if (pendingScope !== null) { state.period = pendingScope; pendingScope = null; state.current = null; state.formal = null; state.verified = false; finalDraft=null; expectedCache={}; expectedChoice=''; log('采用新期间；旧报告只读保留，不再回答新问题。'); }
  state.attempt += 1;
  if(!reuseGrant){state.grantSequence+=1;state.taskGrantActive=true;state.authorization={id:state.grantSequence,period:state.period,purpose:state.request,spentAtStart:state.spent,grouped:state.grouped,comment:selectedComment,expiresAt:Date.now()+15*60*1000};}
  log(`模型尝试 ${state.attempt} ${reuseGrant?'沿用有效':'使用新'}任务授权 A-${state.authorization.id}；来源／范围／期限／累计余额检查通过。`);
  if(grantMode==='comment') {const comment=pendingComment;pendingComment=null;grantMode='analysis';log(`模型尝试 ${state.attempt} 重新授权本条点评，未重算有效资料。`);closeDialog();if(comment)processComment(comment);return;}
  state.resumeVerified=state.verified; state.status='running'; state.step=state.resumeVerified ? 4 : 0; state.notice=''; state.publicationError=false;
  log(`本次只恢复所需工作；新模型尝试不等于新任务授权。`); closeDialog(); render();
  const token = ++sequence;
  function next() {
    if (sequence !== token || state.status !== 'running') return;
    if(!state.taskGrantActive || Date.now()>=state.authorization.expiresAt){interrupt('任务授权到期或被封闭，已停止后续步骤；有效资料保留，继续需重新授权。');return;}
    state.spent = Math.round((state.spent + .05) * 100) / 100; state.usedSteps += 1;
    if (state.step === 3 && state.scenario === 'mismatch' && !state.recovered) { state.status='failed'; state.verified=false; state.current=null; log('主算 / 复算不一致；没有发布分析发现。'); render(); return; }
    if (state.step === 3) { state.verified=true; state.verifiedAttempt=state.attempt; log('本地合成结果通过独立复算模拟。'); }
    if (state.step === 4) {
      if (state.scenario === 'model' && !state.recovered) { state.status='failed'; log('模型报告步骤失败；已验证结果保留。'); }
      else { newReport(); state.status='review'; log(`报告 v${state.current.version} 已准备，等待人工审阅。`); }
      render(); return;
    }
    state.step += 1; render(); timer=setTimeout(next,1400);
  }
  timer=setTimeout(next,1400);
}
function interrupt(reason) { if (state.status !== 'running') return; clearTimeout(timer); sequence+=1; state.status='interrupted'; state.taskGrantActive=false; state.notice=reason; log('模型尝试中断；授权终结，没有后续自动步骤。'); render(); }
function showEvidence(report = null) {
  if (!state.verified && !report) { openDialog('证据状态','<p>本次尚无可发布的已验证结果；资料缺失、停止或一致性失败不能产生已验证分析发现。</p>'); return; }
  const d=report?.data ?? resultData(); const p=report?.period ?? state.period; const id=report?.evidenceAttempt ?? state.verifiedAttempt;
  if(d.insufficient){openDialog(`E-${id}-LIMIT · 资料限制`, '<p>合成本地检查／复算一致：比较期活跃200、复购100、复购率50%、复购收入CNY20,000；当前期活跃0、复购0、复购收入CNY0。双期合计有有效行。当前率不可计算、率变化N/A，M2不适用；没有用0%代替未知。</p><p>本地资料有效，但不能支持两期复购变化判断。不是主算／复算不一致的执行失败；没有原因或策略偏好。</p>');return;}
  openDialog(`E-${id}-M1 · 合成证据`, `<p>来源：本次所选 members.csv + orders.csv 的合成快照 S-${id}，绑定${periods[p]}。此身份仅存在于本页模拟。</p><div class="table-wrap"><table><thead><tr><th>指标</th><th>比较期</th><th>本期</th></tr></thead><tbody><tr><td>活跃会员</td><td>200</td><td>200</td></tr><tr><td>复购会员</td><td>${d.repeats[0]}</td><td>${d.repeats[1]}</td></tr><tr><td>复购率</td><td>${d.before}%</td><td>${d.after}%</td></tr><tr><td>复购收入 CNY</td><td>${d.revenue[0]}</td><td>${d.revenue[1]}</td></tr></tbody></table></div><p>SQL 主算与 Python 复算的上述值完全一致（合成预置，非实际执行）。比率差 ${d.delta} 个百分点，收入差 CNY ${d.money}。</p><p>PAID 为演示已配置有效状态；原始行不展示、不外发。该证据不包含因果判断或行动效果。</p>`);
}
function handleComment() {
  if (!canComment()) return;
  const text=$('commentText').value.trim(); if (!text) { announce('请填写具体点评。'); return; }
  if (state.publicationError) { announce('正式记录结果正在恢复；先读回并完成或取消恢复，再修改报告。'); return; }
  const selected=$('commentConsent').checked;
  const c={version:state.current.version, section:$('commentSection').value, text, selected, outcome:''}; state.comments.push(c);
  if(!selected){c.outcome='仅本地保存，未授权 AI 使用；未分类、改报告或重算。';announce(c.outcome);return;}
  if(!grantValidity().valid){pendingComment=c;c.outcome='本条已选择；任务授权已失效，等待重新授权。';showAuthorization(false,true);return;}
  processComment(c);
}
function processComment(c) {
  if(!grantValidity().valid){announce('任务授权已失效，未处理点评。请重新选择本条文本及授权。');return;}
  if(state.usedSteps+1>12||state.spent+.05>1.20001){c.outcome='累计演示额度不足，点评仅保存本地；未分类或改报告。';announce(c.outcome);return;}
  state.usedSteps+=1;state.spent=Math.round((state.spent+.05)*100)/100;
  const text=c.text;
  log(`用户明确选择使用报告 v${c.version} 的本条点评；模拟分类，不外发。`);
  if (/新客|新会员|筛选|因果|为什么|原因/.test(text)) { c.outcome=/新客|新会员|筛选/.test(text) ? '本期不支持新增人群筛选；未创建计划或派发任务。' : '现有描述性方法不能识别因果。建议补会员访谈等证据；未派发新的分析。'; announce(c.outcome); return; }
  if (/期间|时间|日期/.test(text)) { c.outcome='提出期间调整，等待影响确认和新授权。'; showScope(c); render(); return; }
  if (/简短|精简|缩短/.test(text)) { c.outcome='仅缩短表达，保留所有数值、定义、来源和限制。'; newReport(true); log(`表达修订追加报告 v${state.current.version}；事实不变。`); announce('已缩短表达并追加新版本；旧报告与点评仍在历史中。此处为本地预设文字变换，无模型调用。'); return; }
  c.outcome='暂不能可靠识别本次修改意图；未改动报告或派发任务。'; announce('已保存点评。请说明要简短表达、修改比较期间，还是指出某条证据的问题。');
}
function showScope(comment) { scopeComment=comment;openDialog('调整比较期间', `<p>支持两个已覆盖的、等长且不重叠的 7 日期间组合。变更将创建新分析尝试，旧报告保留。</p><label class="field" for="newPeriod">新的期间<select id="newPeriod"><option value="0" ${state.period===0?'selected':''}>${periods[0]}</option><option value="1" ${state.period===1?'selected':''}>${periods[1]}</option></select></label><div class="scope-grid"><section class="surface"><h3>当前</h3><p>${periods[state.period]}</p></section><section class="surface"><h3>变更后的影响</h3><p>重建本次范围的快照、计算、复算和报告。旧结论只回答旧期间，不沿用为新结论。</p></section></div><p id="dialogError" class="form-error" role="alert"></p><div class="actions">${button('dismiss','取消')}${button('save-scope','检查变更并查看新授权',true)}</div>`, 'scope'); }
function closureComparison() {
  if(resultData().insufficient) return '<section class="surface"><h3>分析收尾：证据不足路线</h3><p>理由：比较期活跃200、复购100，当前期活跃0；当前率和率变化不可计算，M2不适用。仅接受此资料限制；没有候选偏好，需补充覆盖有效订单的资料。</p></section>';
  return `<section class="surface"><h3>分析收尾：候选比较</h3><p class="muted">下列是本附件固定合成候选，展示合法比较所需内容；不创建新的生产候选或行动权限。</p>
  <article><h4>候选 C1 · 补充会员反馈以核查原因</h4><p><strong>行动：</strong>整理自愿反馈与可核对问题清单，提交人工复核。<br><strong>证据：</strong>E-${state.verifiedAttempt}-M1 确认两期变化，但不能证明原因。<br><strong>条件：</strong>后续获得独立资料权限及人工负责；本任务不采集反馈。<br><strong>反证／风险：</strong>自选样本可能有偏差，反馈不能单独证明因果。<br><strong>预期：</strong>得到可追溯的待核查问题，减少原因未知，不承诺复购提升。</p></article>
  <article><h4>候选 C2 · 等待下一等长期间后复核</h4><p><strong>行动：</strong>记录复评窗口，后续对新的获准资料重做同口径比较。<br><strong>证据：</strong>当前只有两个期间，不足以识别稳定趋势。<br><strong>条件：</strong>明确复评责任人和日期，新资料另行授权。<br><strong>反证／风险：</strong>延后可能错过及时发现问题的机会；更多期间仍不自动证明因果。<br><strong>预期：</strong>得到新的可比指标，判断当前变化是否持续；不承诺业务改善。</p></article>
  <p><strong>合成建议偏好：C1。</strong>理由：当前缺口是原因证据，先整理可核查问题可缩小未知；这不是策略有效结论，你可以选择 C2、不行动或暂缓。</p></section>`;
}
function reviewDialog() {
  if (!canComment()) return;
  if(state.publicationError && !state.publicationReadback){openDialog('先确认上次记录是否生效',`<p>正式提交已锁定；读回前不能重复提交。草稿仍保留。</p>${button('readback','读回正式状态',true)}`,'publication-error');return;}
  const d=finalDraft || {};expectedCache=d.choice?{[d.choice]:{...d}}:{};expectedChoice='';
  const field=(id,label,placeholder='')=>`<label class="field" for="${id}">${label}<input id="${id}" type="text" value="${escapeHtml(d[id]||'')}" placeholder="${placeholder}"></label>`;
  const insufficient=resultData().insufficient;
  openDialog('确认你接受的结论与下一步', `
    <section class="surface"><h3>本次可接受的有限发现</h3>
    <p>F-${state.verifiedAttempt}-${insufficient?'LIMIT':'M1'}：${resultData().finding}${insufficient?'':`复购收入变化 CNY ${resultData().money}。`}</p>
    ${state.grouped&&!insufficient?`<p>F-${state.verifiedAttempt}-M2：匿名 A/B 组收入变化之和等于总体；不包含因果推断。</p>`:''}
    <p>不接受未证实原因、策略有效或任何未列明的分析发现。来源报告 v${state.current.version}。</p></section>
    ${closureComparison()}
    <label class="field" for="reviewActor">本次审阅人<input id="reviewActor" type="text" value="${escapeHtml(d.actor||'')}" placeholder="填写你的演示姓名或角色"></label>
    <label class="field" for="decisionChoice">你的选择<select id="decisionChoice">
    <option value="">请选择下一步（仅保存分析时可不选）</option>
    ${insufficient?'':`<option value="candidate" ${d.choice==='candidate'?'selected':''}>C1 · 补充会员反馈以核查原因</option><option value="candidate2" ${d.choice==='candidate2'?'selected':''}>C2 · 下一等长期间复核</option>`}
    <option value="none" ${d.choice==='none'?'selected':''}>本轮不行动</option><option value="defer" ${d.choice==='defer'?'selected':''}>暂缓决定</option></select></label>
    <div id="decisionFields" class="hidden">
    <label class="field" for="rationale">决定理由<textarea id="rationale" placeholder="为什么作出这个选择">${escapeHtml(d.rationale||'')}</textarea></label>
    <label class="field" for="owner">后续／复评责任人<input id="owner" type="text" value="${escapeHtml(d.owner||'')}" placeholder="谁负责后续或复评"></label>
    ${insufficient?'':`<section class="surface hidden" id="candidateExpected"><h3>候选的事前预期</h3><p id="expectedSourceSummary"></p><p class="muted">以下字段共同构成事前预期；记录之前尚无实际结果。仅保存分析／不行动／暂缓时不要求填写。</p>
    <div class="notice" id="expectedDraftSummary"></div>
    <p class="muted">先检查来源和待审建议。下面只需补清尚未知的方向、目标和时段；责任人／触发条件在同一审阅内填写。正式提交前仍须满足全部适用字段。</p>
    <label class="field" for="direction">你认可的变化方向<select id="direction"><option value="">请选择</option><option value="increase" ${d.direction==='increase'?'selected':''}>增加</option><option value="decrease" ${d.direction==='decrease'?'selected':''}>减少</option><option value="maintain" ${d.direction==='maintain'?'selected':''}>保持在范围内</option></select></label>
    ${field('target','你认可的目标值或区间','当前资料不能替你决定业务目标')}
    ${field('window','观察时段','具体起止或明确事件窗口，当前未知')}
    <details id="expectedDetails"><summary>查看或编辑完整建议、护栏及其他条件</summary>
    <p class="muted">建议来自下述固定合成候选与本次证据，仍待人确认。可修改或不用该建议；基线的事实来源保持可查，依赖不代替护栏。</p>
    ${field('observedObject','事前预期观测对象','明确后续实际观察对象')}
    ${field('metric','目标指标','填写与候选相符、可观察的指标')}
    ${field('baseline','带来源的基线，或未知／不适用及原因','未知不能编造')}
    ${field('source','观察数据来源','后续来源尚须独立获准')}
    ${field('evaluation','评价方式','如何对照目标判断达到／未达到')}
    ${field('uncertainty','不确定性','说明预期尚未验证及可能偏差')}
    ${field('dependencies','依赖条件','资料准入／观察条件')}
    ${field('guardrails','护栏：不得突破的条件，或 N/A 及原因','明确约束／停止条件；不适用须人填写 N/A 和理由')}
    </details><div class="actions">${button('reject-expected','不用此建议，保留工作自行修改')}</div>
    </section>`}
    <label class="field hidden" id="naExpected" for="expected">不行动／暂缓时：N/A 及不适用原因<textarea id="expected" placeholder="明确写 N/A 和原因；选择候选时无需填">${escapeHtml(d.expectedNotes||'')}</textarea></label>
    <label class="field" for="trigger">目标时间或复评触发条件<input id="trigger" type="text" value="${escapeHtml(d.trigger||'')}" placeholder="何时或什么事件发生后检查"></label>
    </div>
    <label class="checkline"><input id="acceptFindings" type="checkbox">我明确接受上方列明的有限分析发现（不足时仅认可限制），已检查所示分析收尾路线、理由／候选比较及条件反证，并确认完成本次分析收尾。</label>
    <label class="checkline hidden" id="decisionConfirmation"><input id="confirmDecision" type="checkbox">如记录选择，我确认以上理由、责任、完整事前预期或 N/A 和触发条件构成我的正式决定 / 事前预期；我已检查并认可当前显示的待审建议及自己补充的字段；这不授权业务行动。</label>
    <p class="muted">“记录选择”一并保存所示接受、合法分析收尾、正式决定 / 事前预期和追加正式报告。“只保存分析”不创建正式决定 / 事前预期。“需要更多证据”不产生这些正式效果。</p>
    <p id="dialogError" class="form-error" role="alert"></p><div class="actions dialog-actions">${button('need-evidence','需要更多证据')}${button('save-analysis','只保存分析结论')}${button('publish','记录选择并完成审阅',true)}</div>`, 'review');
  syncDecisionFields();
}
function expectedSuggestion(choice) {
  const common={uncertainty:'两期描述不能识别原因；未来观察可能有样本偏差或资料不足，事前预期尚未验证。',dependencies:'后续资料须独立获准，责任人能在所确认时段获得可复核材料。',guardrails:'复用本次已展示的边界：不把描述性结果说成因果，不外发原始行或身份信息；来源或权限超出时停止并另行确认。',suggestionRejected:false};
  return choice==='candidate'
    ? {...common,observedObject:'后续独立获准的会员反馈材料（尚未采集）',metric:'可追溯的有效反馈条数',source:'C1 候选所需的后续获准反馈，尚未获得',evaluation:'人工核对反馈来源与有效性，再与用户确认的目标数量比较；不能据此单独证明因果。'}
    : {...common,observedObject:'后续等长比较期间的活跃会员（≥1笔有效订单）',metric:'同口径会员复购率',source:'C2 候选所需的后续获准会员／订单资料，尚未获得',evaluation:'沿用本次受限口径和独立验证，比较后续指标与用户确认目标，并保留证据。'};
}
function syncDecisionFields() {
  const choice=$('decisionChoice')?.value||'';const candidate=choice.startsWith('candidate');
  if(expectedChoice && expectedChoice!==choice && expectedChoice.startsWith('candidate')){
    const previous=captureFinalDraft();previous.choice=expectedChoice;expectedCache[expectedChoice]=previous;
  }
  $('decisionFields')?.classList.toggle('hidden',!choice);
  $('candidateExpected')?.classList.toggle('hidden',!candidate);
  $('naExpected')?.classList.toggle('hidden',!choice||candidate);
  $('decisionConfirmation')?.classList.toggle('hidden',!choice);
  if(candidate && $('baseline')) {
    if(expectedChoice!==choice){
      const draft=expectedCache[choice]||expectedSuggestion(choice);
      for(const id of ['observedObject','metric','source','evaluation','uncertainty','dependencies','guardrails','direction','target','window'])if($(id))$(id).value=draft[id]||'';
      $('candidateExpected').dataset.rejected=String(Boolean(draft.suggestionRejected));
    }
    $('baseline').readOnly=true;
    $('baseline').value=choice==='candidate'
      ? `未知：反馈尚未采集，没有反馈指标基线；E-${state.verifiedAttempt}-M1 仅包含会员复购，不能作为反馈基线。`
      : `E-${state.verifiedAttempt}-M1：本期活跃会员200位、复购会员${resultData().repeats[1]}位，同口径复购率${resultData().after}%；其他新指标基线未知，因本次没有对应观测。`;
    const rejected=$('candidateExpected').dataset.rejected==='true';
    $('expectedDraftSummary').innerHTML=rejected?'<strong>你未采用原建议。</strong><p>已保留个人输入，请展开补齐自己的预期；未形成正式记录。</p>':`<strong>待你确认的建议 · 来源：合成候选 ${choice==='candidate'?'C1':'C2'}、E-${state.verifiedAttempt}-M1 与现有数据边界</strong><p>观测对象：${escapeHtml($('observedObject').value)}<br>指标：${escapeHtml($('metric').value)}<br>基线：${escapeHtml($('baseline').value)}<br>护栏：${escapeHtml($('guardrails').value)}</p><p>目标、方向、时段和责任人尚需你明确；以上不是已接受的事前预期或实际结果。</p>`;
  }
  expectedChoice=choice;
  if($('expectedSourceSummary')) $('expectedSourceSummary').textContent=`本次源观测对象为两期活跃会员，每期200位；复购率 ${resultData().before}% → ${resultData().after}%。C1反馈基线未知，不以会员复购率冒充反馈基线；C2只可在同口径下引用本次事实。`;
}
document.addEventListener('change',(event)=>{if(event.target.id==='decisionChoice'||event.target.closest('#candidateExpected'))syncDecisionFields();});
document.addEventListener('input',(event)=>{if(event.target.closest('#candidateExpected'))syncDecisionFields();});
function captureFinalDraft() {
  const value=(id)=>$(id)?.value.trim()||'';
  const d={choice:value('decisionChoice'),actor:value('reviewActor'),rationale:value('rationale'),owner:value('owner'),expectedNotes:value('expected'),trigger:value('trigger'),metric:value('metric'),direction:value('direction'),target:value('target'),window:value('window'),source:value('source'),evaluation:value('evaluation'),observedObject:value('observedObject'),baseline:value('baseline'),uncertainty:value('uncertainty'),dependencies:value('dependencies'),guardrails:value('guardrails'),suggestionRejected:$('candidateExpected')?.dataset.rejected==='true'};
  const directions={increase:'增加',decrease:'减少',maintain:'保持在范围内'};
  d.expected=d.choice.startsWith('candidate')?`观测对象：${d.observedObject}；带来源基线：${d.baseline}；不确定性：${d.uncertainty}；依赖：${d.dependencies}；护栏：${d.guardrails}；指标：${d.metric}；方向：${directions[d.direction]||'未选'}；目标／区间：${d.target}；观察时段：${d.window}；来源：${d.source}；评价：${d.evaluation}；责任人：${d.owner}`:d.expectedNotes;
  return d;
}
function publish(decision) {
  if(state.scenario==='empty')return;
  if (!canComment() || modalKind !== 'review') return;
  if(state.publicationError && !state.publicationReadback){$('dialogError').textContent='先读回上次发布状态，再重新确认；当前不允许提交。';return;}
  const d=captureFinalDraft(); finalDraft=d;
  if (!$('acceptFindings').checked || !d.actor) { $('dialogError').textContent='请填写审阅人，并明确接受所列有限分析发现和分析收尾；“继续”等模糊文字不构成批准。'; return; }
  if (decision && (!d.choice || !d.rationale || !d.owner || !d.expected || !d.trigger || !$('confirmDecision').checked)) { $('dialogError').textContent='记录选择需要明确选择、理由、责任人、预期或 N/A、复评条件，以及决定确认。'; return; }
  if (decision && !d.choice.startsWith('candidate') && (!/N\/A/i.test(d.expected) || d.expected.replace(/N\/A/ig,'').trim().length < 2)) { $('dialogError').textContent='不行动或暂缓时，请明确写 N/A 及预期不适用的原因，并填写复评责任和触发条件。'; return; }
  if (decision && d.choice.startsWith('candidate') && (!d.metric||!d.direction||!d.target||!d.window||!d.source||!d.evaluation||!d.observedObject||!d.baseline||!d.uncertainty||!d.dependencies||!d.guardrails)) { $('dialogError').textContent='候选的事前预期仍缺适用内容；已展开完整建议，请补齐所缺字段或选择其他出口。';$('expectedDetails').open=true; return; }
  if(decision && d.choice.startsWith('candidate') && /^N\s*\/\s*A[\s:：。]*$/i.test(d.guardrails)){$('dialogError').textContent='护栏不适用时必须说明 N/A 的原因，不能隐式省略或只写 N/A。';return;}
  if (decision && resultData().insufficient && d.choice.startsWith('candidate')) { $('dialogError').textContent='证据不足路线没有候选偏好；请补证、仅保存限制，或明确不行动／暂缓。'; return; }
  if ($('failPublication').checked) {
    $('failPublication').checked=false; state.publicationError=true; state.publicationReadback=false; log('正式记录发布失败；全部正式效果均未生效，草稿保留。');
    closeDialog(); render();
    openDialog('正式记录没有生效', `<div class="notice error"><p>模拟最终发布失败。分析发现接受记录、分析收尾、正式决定 / 事前预期和正式报告均未生效；没有半成功。</p></div><p>你填写的草稿已留在本页内存。可以读回当前状态，再显式重试；不会自动调用模型或重复追加记录。</p><div class="actions">${button('readback','先读回正式状态',true)}</div>`, 'publication-error'); return;
  }
  const summary=decision ? ({candidate:'选择候选 C1：补充会员反馈以核查原因。',candidate2:'选择候选 C2：下一等长期间复核。',none:'本轮不行动。',defer:'暂缓决定，按触发条件复评。'}[d.choice]) : '只保存分析结论；未作出正式决定。';
  const formal={...d,summary,decision,accepted:true,closure:true,closureRoute:resultData().insufficient?'证据不足：零分母，仅接受限制，无偏好':'C1 / C2 完整合成比较；唯一有理由偏好 C1'};
  const r={...state.current,version:state.reports.length+1,final:true,formal};
  state.formal=formal; state.current=r; state.reports.push(r); state.status='completed'; state.taskGrantActive=false; state.publicationError=false; state.notice='';
  log(`正式审阅成功，追加正式报告 v${r.version}；${decision?'正式决定 / 事前预期已记录':'没有正式决定 / 事前预期'}。`); closeDialog(); render();
}
document.addEventListener('click', (event) => {
  const el=event.target.closest('button, a'); if (!el) return;
  if (el.dataset.example) { $('request').value=el.dataset.example; $('request').focus(); return; }
  if (el.dataset.commentExample) { $('commentText').value=el.dataset.commentExample; $('commentText').focus(); return; }
  if (el.dataset.history) { const report=state.reports.find(r=>r.version===Number(el.dataset.history)); if(report)openDialog(`报告 v${report.version} · 历史只读`, reportView(report,true)); return; }
  if (el.dataset.evidenceReport) { showEvidence(state.reports.find(r=>r.version===Number(el.dataset.evidenceReport))); return; }
  const action=el.dataset.action; if (!action) return;
  switch(action) {
    case 'quick': case 'professional': state.mode=action; render(); break;
    case 'current': state.mode='quick'; render(); break;
    case 'narrow-task': state.request='核实两期会员总体复购变化，说明证据及限制。';state.status='missing';state.notice='你已明确缩小问题；原超范围要求没有被执行。';log('用户明确将问题缩小为两期总体比较。');render();break;
    case 'context': { const hidden=$('workspace').classList.toggle('context-hidden'); $('contextToggle').textContent=hidden?'展开上下文':'收起上下文'; $('contextToggle').setAttribute('aria-expanded',String(!hidden)); break; }
    case 'reset': openDialog('重新开始场景回放','<p>将清空本页合成任务、点评和历史，应用所选场景。不会改变其他附件或业务数据。</p><div class="actions">'+button('dismiss','取消')+button('confirm-reset','重置本页演示',true)+'</div>'); break;
    case 'confirm-reset': closeDialog(); resetState($('scenario').value); break;
    case 'send': { const request=$('request').value.trim(); if (!request) { $('request').setCustomValidity('先描述你想核实的问题。'); $('request').reportValidity(); $('request').oninput=()=> $('request').setCustomValidity(''); return; } state.request=request; if (/新客|新会员|因果|为什么|原因|预测|联网/.test(request)) { state.status='unsupported'; state.notice='当前资料与方法只能核实两期变化及支持的分组收入贡献，不能新增人群筛选或识别因果。'; render(); return; } state.grouped=state.scenario!=='zero'&&state.scenario!=='empty'&&(state.scenario==='group'||/分组|A\/B|贡献/.test(request)); state.status='missing'; log('用户创建分析任务；尚无模型调用。'); render(); break; }
    case 'add-files': if (state.scenario==='missing' && !state.files) {state.files=true;state.orders=false;state.status='missing';} else {state.files=true;state.orders=true;state.status=state.scenario==='empty'?'blocked':state.semantic?'ready':'semantic';} log(state.orders?'已添加两份合成资料。':'仅收到合成会员资料，订单缺失。'); render(); break;
    case 'semantic': if($('semanticPeriod').value===''){$('semanticPeriod').focus();return;}state.period=Number($('semanticPeriod').value);state.semantic=true;state.status='ready';log('用户明确比较期间。');render();break;
    case 'authorize': showAuthorization(); break;
    case 'grant': startRun(); break;
    case 'stop': interrupt('你已停止本次工作。没有自动重试；迟到步骤不会恢复任务。'); break;
    case 'close': openDialog('关闭这项任务？',`<p>${state.status==='running'?'当前分析将停止并记为已中断。':''}已有资料和历史保留在本页内存；重开不自动执行。</p><div class="actions">${button('dismiss','继续查看')}${button('confirm-close','关闭并停止',true)}</div>`); break;
    case 'confirm-close': if(state.status==='running')interrupt('关闭时停止了运行。');state.closedFrom=state.status;state.status='closed';state.taskGrantActive=false;log('关闭任务并终结任务授权。');closeDialog();render();break;
    case 'reopen':state.status=state.closedFrom||'interrupted';state.notice='已重开。任务授权已失效；只查看和本地记录不调用模型，处理新点评或继续中断工作需重新选择文本并授权。';log('重开任务，仅恢复视图。');render();break;
    case 'recover': {
      grantMode='analysis';state.recovered=true;
      const check=grantValidity();log(`用户显式继续：后台核验任务授权。结果：${check.reason}。`);
      if(check.valid)startRun(true);
      else {state.notice=`继续前需重新授权：${check.reason}。有效资料与累计消耗保留。`;render();showAuthorization(true);}
      break;
    }
    case 'dismiss':pendingScope=null;scopeComment=null;pendingComment=null;grantMode='analysis';closeDialog();break;
    case 'evidence-detail':showEvidence();break;
    case 'comment':handleComment();break;
    case 'save-scope': {const next=Number($('newPeriod').value); if(next===state.period){pendingScope=null;scopeComment=null;closeDialog();announce('期间没有变化（NO_CHANGE）。当前报告、分析发现与授权身份均未变更，没有重算。');return;}pendingScope=next;closeDialog();showAuthorization();break;}
    case 'review':reviewDialog();break;
    case 'reject-expected': {
      const suggested=expectedSuggestion($('decisionChoice').value);
      for(const id of ['observedObject','metric','source','evaluation','uncertainty','dependencies','guardrails']){
        if($(id).value.trim()===(suggested[id]||'').trim())$(id).value='';
      }
      $('candidateExpected').dataset.rejected='true';$('expectedDetails').open=true;syncDecisionFields();break;
    }
    case 'publish':publish(true);break;
    case 'save-analysis':publish(false);break;
    case 'need-evidence':finalDraft=captureFinalDraft();state.status='evidence';state.formal=null;state.notice='你要求补充证据；没有接受结论、关闭分析或创建决定。';log('人工选择需要更多证据，无正式效果。');closeDialog();render();break;
    case 'return-review':state.status='review';state.notice='';render();break;
    case 'retry-publication':closeDialog();reviewDialog();break;
    case 'readback':state.publicationReadback=true;log('读回确认没有正式效果，可显式重试同一草稿。');openDialog('正式状态读回',`<p>分析发现接受记录：未记录<br>分析收尾：未完成<br>正式决定 / 事前预期：无<br>正式报告：无<br>待审草稿：报告 v${state.current.version} 保留。</p><p>读回没有写入或调用模型。</p>${button('retry-publication','回到草稿重新确认',true)}`,'publication-error');break;
    case 'authorization-detail':openDialog('本任务授权记录',state.authorization?`<p>A-${state.authorization.id} · ${periods[state.authorization.period]}</p><p>目的：${escapeHtml(state.authorization.purpose)}</p><p>本次点评：${state.authorization.comment?escapeHtml(state.authorization.comment.text):'无；旧点评默认排除'}。旧点评仍在历史可查，不自动再次外发。</p><p>所选资料：members.csv、orders.csv（合成）。演示服务商 / 合成模型。原始行留本地，仅所披露的问题、语义、受控结构及总体摘要／验证／报告类别可见；组级材料和M2段落仅本地绑定显示，未批准外发。</p><p>开始前累计 CNY ${state.authorization.spentAtStart.toFixed(2)}；当前累计 CNY ${state.spent.toFixed(2)}。${state.status==='running'?'模型尝试正在运行。':'模型尝试已终结。'}${grantValidity().valid?' 同范围任务授权仍有效；失败后的显式继续可沿用，每条新点评须单独选择文本。':` 当前不可准入：${grantValidity().reason}；后台核验后必要时重新授权。`}<br>任务授权截止（演示）：${new Date(state.authorization.expiresAt).toLocaleString('zh-CN')}；与模型尝试 60秒限制分开。</p>`:'<p>尚无授权；模型未运行。</p>');break;
    case 'plan':openDialog('分析计划 / 技能 / 提示词信息',`<p>已配置会员复购方法（合成展示）：${state.grouped?'M1 总体比较 + M2 分组收入贡献':'M1 总体比较'}。从任务问题选择受支持方法，普通用户不编排节点。</p><p>期间：${state.period===0?'[2026-08-01, 2026-08-08) / [2026-08-08, 2026-08-15)':'[2026-08-08, 2026-08-15) / [2026-08-15, 2026-08-22)'}，Asia/Shanghai。</p><p>固定方法负责主算 / 独立复算。提示词作用：解释问题、整理获准证据和表达报告；不能决定事实、改写数字或扩权限。这里只展示意图，不声称已生成／执行真实 IR。计划准入／实际执行前／结果发布前的检查、预算记录及整体正式提交由后台负责，不增加用户审批步骤。仅 M1 未执行 M2 必须由真实工程证据验证，本模拟不能证明。</p><p>技能与提示词的既有完整界面仍可检查：</p><p><a href="${fullProfessional}" target="_blank" rel="noopener">完整专业模式 ↗</a></p>`);break;
  }
});
window.addEventListener('beforeunload', (event) => { if(state.status==='running'){event.preventDefault();event.returnValue='';} });
resetState();
