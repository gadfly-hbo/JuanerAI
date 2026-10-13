// Synthetic review-only prototype. No provider, calculation, storage or service.
const $ = id => document.getElementById(id);
const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge = (text, tone = '') => `<span class="review-badge ${tone}">${escapeText(text)}</span>`;
const scenes = {
  normal: {phase:'reviewing', verdict:null, strategy:null, note:'数字样例已核对；正在分别检查结论依据和建议条件。无需逐项批准。'},
  conditional: {phase:'done', verdict:'有支持', strategy:'有条件支持', note:'建议先核查品类A退货原因，不贸然推广；已给职责与费用条件，仅负责人时间未知。只问这一项。'},
  insufficient: {phase:'done', verdict:'证据不足', strategy:'证据不足', note:'“促销减少导致下降”没有活动或合格因果依据。保留变化事实，把原因和增大触达建议移到待补证。'},
  conflict: {phase:'done', verdict:'存在冲突', strategy:'证据不足', note:'“所有品类均下降”与品类B增长反证矛盾。撤下该范围判断，依赖它的全面推广建议不交付为推荐。'},
  strategy: {phase:'done', verdict:'有支持', strategy:'存在冲突', note:'净额变化观察成立；5,000元全面推广违反本任务给定的200元资源约束，不可推荐。'},
  revised: {phase:'done', verdict:'有支持', strategy:'有条件支持', note:'已撤回无依据因果与收益保证，重审保留有限观察和补证试点。旧版、缺口与修订理由仍可查看。'},
  partial: {phase:'done', verdict:'有支持', strategy:'证据不足', numeric:'partial', note:'审查保留有据观察，但未绑定的收益数字仍被数字检查拒绝。结论审查不能把数字partial升级为完整。'},
  changed: {phase:'stale', verdict:null, strategy:null, version:'R2', note:'期间已改变（样例）；当前新期间还没有计算和审查结果。旧R1数字只在历史，不认证R2。'},
  strategyChanged: {phase:'strategy_stale', verdict:'有支持', strategy:null, version:'R2', note:'只改变实施资源条件：数字和有限观察仍适用，建议需要重新审查；不重新计算未变数字。'},
  failed: {phase:'failed', verdict:null, strategy:null, note:'审查超时，无法完成。已有数字事实保留；重要解释和建议是待审草案，不表示证据不足或通过。'},
  stopped: {phase:'stopped', verdict:null, strategy:null, note:'任务已停止（合成已确认）；已保存事实与历史保留。重新打开只读回，必须显式恢复。'},
  unknown: {phase:'unknown', verdict:null, strategy:null, note:'停止效果尚未确认（UNKNOWN）。关闭新准入，不能称已物理停止；未知调用不盲目重放。'},
  savefail: {phase:'done', verdict:'有支持', strategy:'有条件支持', saved:false, note:'新审查仅在当前页面（样例）；后端保存失败。旧版已保存，不能把新版称为可恢复认证。'},
  downloadfail: {phase:'done', verdict:'有支持', strategy:'有条件支持', downloadFailed:true, note:'后端报告与审查已保存（样例），下载失败。仅重试下载，不新增计算或审查。'},
  analysisOnly: {phase:'done', verdict:'有支持', strategy:'不适用', note:'本次只核实变化，没有行动问题。无需生成策略或填写资源表。'}
};
const state = {scene:'normal', data:{...scenes.normal}, mode:'quick', stage:5, tab:'evidence', history:false, report:false, human:false, messages:[], reopened:false, conditionAnswer:'unknown', conditionHistory:[], choice:null};
let returnFocus = null;
const phaseLabel = s => ({reviewing:'审查中',strategy_reviewing:'建议重审中',stale:'需重新审查',strategy_stale:'建议需重新审查',failed:'无法完成',stopping:'停止中',unknown:'结果未知',stopped:'已停止'}[s.phase] || '本版审查完成 · 不等于全报告核实');
const tone = text => text === '有支持' ? 'good' : text === '存在冲突' ? 'bad' : text === '有条件支持' || text === '证据不足' ? 'warn' : '';
function decisionText(type) {
  if (type === 'strategy' && state.data.strategy === '不适用') return '不适用 · 仅分析';
  return state.data[type === 'strategy' ? 'strategy' : 'verdict'] || (state.scene === 'strategyChanged' && type === 'strategy' ? '需重新审查' : phaseLabel(state.data));
}
function reset(scene) {
  state.scene = scene; state.data = {...scenes[scene]}; state.history = false; state.report = false; state.human = false; state.messages = []; state.reopened = false; state.conditionAnswer = 'unknown'; state.conditionHistory = []; state.choice = null;
  $('scene').value = scene; render();
}
function render() {
  const s = state.data, conclusion = decisionText('conclusion'), strategy = decisionText('strategy'), oldOnly = s.phase === 'stale';
  $('status').textContent = `${phaseLabel(s)}（样例） · ${s.note}`;
  $('stop').disabled = ['stopping','stopped','unknown','stale'].includes(s.phase);
  $('advance').disabled = !['reviewing','strategy_reviewing','stopping'].includes(s.phase);
  $('professional-note').hidden = state.mode !== 'professional'; $('stages').hidden = state.mode !== 'professional';
  for (const id of ['quick','professional']) { $(id).classList.toggle('active',state.mode === id); $(id).setAttribute('aria-pressed',String(state.mode === id)); }
  for (const button of document.querySelectorAll('[data-stage]')) { const active = Number(button.dataset.stage) === state.stage; button.classList.toggle('active',active); if (active) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current'); }
  let html = state.history ? historyHtml() : '';
  if (state.mode === 'professional' && state.stage < 4) html += '<div class="empty-state">本阶段沿用原PX-004，没有007新增行为。请查看完整专业参考；本页不伪装已接通数据／计算。</div>';
  else {
    html += `<p class="fine">你：核实两期净销售变化，告诉我依据、限制和下一步；不要把猜测原因当结论。（合成资料／任务）</p>
      <div class="summary-grid"><section class="summary-cell"><span class="fine">数字检查</span><strong>${oldOnly ? '新期间未计算' : s.numeric === 'partial' ? '部分可用 · partial' : '已核对 · 样例'}</strong><p>${oldOnly ? '历史R1不是当前结果' : '本地计算与独立核验的状态，独立于模型判断'}</p></section><section class="summary-cell"><span class="fine">结论依据</span><strong>${escapeText(conclusion)}</strong><p>有限主张；不是因果认证</p></section><section class="summary-cell"><span class="fine">建议条件</span><strong>${escapeText(strategy)}</strong><p>不是人的决定、实际行动或收益保证</p></section></div>`;
    if (!oldOnly) html += `<article class="review-card"><div class="card-line"><h2>净销售下降，变化集中在品类A</h2>${badge('有据数字 · 样例','good')}</div><div class="metric-line"><div><strong>150 元</strong><span>本期净销售额</span></div><div><strong>−10 元</strong><span>相对上期160元</span></div><div><strong>−6.25%</strong><span>同口径变化</span></div></div><p>品类A减少20元，品类B增加10元。该观察不能证明促销、产品或其他因素是原因。</p><button class="inline-link" data-action="evidence">查看数字来源与核验范围</button></article>`;
    html += `<article class="review-card"><div class="card-line"><h2>结论与解释</h2>${badge(conclusion,tone(conclusion))}</div><p>${escapeText(claimText())}</p><p class="fine">${escapeText(s.note)}</p><button class="inline-link" data-action="evidence">查看依据、反证与待补检查</button></article>`;
    if (s.strategy !== '不适用') html += `<article class="review-card"><div class="card-line"><h2>下一步选项</h2>${badge(strategy,tone(strategy))}</div><h3>${escapeText(strategyText())}</h3><p>${oldOnly ? '当前R2没有新期间证据，不提供基于旧数字的建议。历史R1只能在历史／证据详情中参考，不认证R2。' : '依据：品类A减少20元、品类B增加10元，不支持所有品类都下降，也不能证明促销原因。目标是先取得原因证据，再判断是否促销。'}</p>${conditionsHtml()}<button class="inline-link" data-action="plan">查看具体条件、验证安排与备选</button></article>`;
    if (s.numeric === 'partial') html += '<div class="review-note error"><strong>数字检查仍有缺口</strong><p>“预计收益增加30%”没有绑定证据，已拒绝；不进入当前核实结论／推荐。结论审查不能替代数字修复。（合成反例，保留006同类限制）</p></div>';
    if (['failed','stopped','unknown','stale','stopping'].includes(s.phase) || state.scene === 'strategyChanged') html += `<div class="review-note"><strong>${escapeText(phaseLabel(s))}</strong><p>${escapeText(s.note)}</p><div class="actions"><button class="btn btn-sm" data-action="reopen">重新打开 · 只读回</button><button class="btn btn-sm" data-action="resume" ${['unknown','stopping','stale'].includes(s.phase) ? 'disabled' : ''}>显式恢复审查 · 样例</button></div><p class="fine">UNKNOWN需先核清；期间改变需现有执行链重算，不可只重审旧数字。</p></div>`;
    html += `<div class="actions"><button class="btn btn-primary btn-sm" data-action="report">${state.report ? '收起报告' : '展开报告'}</button><button class="btn btn-sm" data-action="history">修订与历史</button><button class="btn btn-sm" data-action="human">人的下一步</button></div>`;
    if (state.report) html += reportHtml();
    if (state.human || state.mode === 'professional' && state.stage === 6) html += humanHtml();
  }
  html += state.messages.map(m=>`<p class="message-user">${escapeText(m)}</p><p class="fine">仅显示你的输入；未执行新分析或审查。请选择审核场景预演。</p>`).join('');
  $('thread').innerHTML = html;
  $('current-session').classList.toggle('active',!state.history); $('history').classList.toggle('active',state.history);
  renderDetail();
}
function claimText() {
  if (state.scene === 'conflict') return '待修订：“所有品类均下降”。品类B+10元构成反证，不能交付这条范围判断。';
  if (state.scene === 'insufficient') return '待补证：“促销减少导致销售下降”。当前只能确认同口径净额变化，缺活动及合格因果证据。';
  if (state.data.phase === 'stale') return '新期间还没有证据；旧R1判断只在历史可查。';
  if (!state.data.verdict) return '有限观察可读；重要原因解释尚未审完，只是待审草案。';
  return '当前两期、所选资料和同一口径下净额下降10元；品类A变化较大。原因仍未证明，不能归因到促销或承诺后续收益。';
}
function strategyText() {
  if (state.data.strategy === '不适用') return '不适用·本次仅分析，不生成行动建议';
  if (state.data.phase === 'stale') return '本版待新期间计算与核验，再判断是否存在可审建议';
  if (state.data.phase === 'strategy_reviewing') return 'S1待重审：3天内投入2小时核查品类A退货原因，费用≤200元';
  if (state.conditionAnswer === 'no' && state.data.phase === 'done' && state.data.strategy === '存在冲突') return '当前不可推荐：3天内的核查安排没有可用时间';
  if (state.scene === 'strategy') return '不推荐：5,000元全面推广（超过给定200元约束）';
  if (['证据不足','存在冲突'].includes(state.data.strategy)) return '先补证／暂缓，不把全面推广当推荐';
  if (!state.data.strategy) return '待审选项：先核实退款归属与分组变化';
  return '3天内投入2小时核查品类A退货原因，费用≤200元；核查前不扩大促销';
}
function conditionsHtml() {
  const s = state.data;
  if (s.strategy !== '有条件支持' && state.conditionHistory.length === 0) return '';
  let html = '<ul class="review-list"><li>已满足（合成）：同口径品类数字已核对；职责与≤200元费用范围由业务说明给定。</li><li>仍不保证：下降原因或核查后的收益；条件来自用户说明，不是独立事实认证。</li></ul>';
  if (s.phase === 'done' && s.strategy === '有条件支持') html += `<div class="review-note"><strong>只差一项：负责人时间</strong><p>品类A负责人能在未来3天安排2小时核查吗？</p><div class="actions"><button class="btn btn-sm" data-action="answer" data-answer="yes">模拟回答：能安排</button><button class="btn btn-sm" data-action="answer" data-answer="no">模拟回答：不能安排</button><button class="btn btn-sm" data-action="answer" data-answer="unknown">模拟回答：还不确定</button></div><p class="fine">时间未知时，S1仅待满足，不可作为当前可采用推荐；可先补证、暂缓或不行动。已有口径／预算不重复问。</p></div>`;
  if (state.conditionHistory.length) html += `<p class="review-version">${escapeText(state.conditionHistory.at(-1))}</p><p class="fine">数字与有限观察仍适用；仅重审建议。回答不是批准，重审不是执行。</p>`;
  if (s.phase === 'done' && s.strategy === '有支持' && state.conditionAnswer === 'yes') html += '<div class="review-note"><strong>现在有一个可选择的下一步</strong><p>S1的核查安排有支持；条件已明确，可选此建议、先补证、暂缓或不行动。不保证原因或收益，不自动排班。</p><button class="btn btn-primary btn-sm" data-action="choose-plan">选择此下一步 · 样例</button></div>';
  if (s.phase === 'done' && state.conditionAnswer === 'no') html += '<div class="review-note"><strong>S1当前不可推荐</strong><p>备选：要求可用资源信息；暂缓到负责人时间可用时再评估；或不行动。不会编造替代负责人或自动延后期限。</p></div>';
  if (state.choice) html += `<p class="message-user">${escapeText(state.choice)}</p><p class="fine">未正式提交Decision／Expected，未排班、未执行行动；原整体人审合同仍适用。</p>`;
  return html;
}
function reportHtml() {
  const s = state.data;
  return `<section class="review-card"><h2>本版报告 · ${escapeText(s.version || 'R1')}（样例）</h2><p>${escapeText(claimText())}</p><p><strong>结论依据：</strong>${escapeText(decisionText('conclusion'))}；<strong>建议条件：</strong>${escapeText(decisionText('strategy'))}。</p><p><strong>下一步：</strong>${escapeText(strategyText())}。${s.strategy === '不适用' ? '可确认分析、补证或暂缓；不追问实施条件。' : s.phase === 'stale' ? '旧R1仅供历史参考，不提供当前建议或资格。' : state.conditionAnswer === 'yes' && s.strategy === '有支持' ? '仅核查安排获得支持；原因／收益仍未证明。' : '关键时间条件未满足／未审时不作可采用推荐。'}</p><p>观察／候选解释／行动选项分开；没有独立因果认证。未解决内容不进入核实结论或正式推荐，数字partial如有继续保留。</p><p class="review-version">合成任务T-demo · 证据E1/E2 · 当前采用口径示意 · ${s.strategy === '不适用' ? '主张C1；行动选项不适用' : '主张C1／选项S1'}；不是006真实任务或真实hash。</p><div class="actions"><button class="btn btn-sm" data-action="save">${s.saved === false ? '重试后端保存 · 样例' : '查看后端保存状态'}</button><button class="btn btn-sm" data-action="download">${s.downloadFailed ? '重试下载 · 样例' : '下载报告 · 样例'}</button></div><p class="fine" id="storage-note">${s.saved === false ? '新版仅在页面，后端未保存（样例）。刷新不保证保留。' : '后端已保存（样例）；本演示实际上不持久化。'} ${s.downloadFailed ? '下载失败不改变已保存报告。' : '此按钮只反馈，不生成文件。'}</p></section>`;
}
function historyHtml() {
  return `<section class="review-card"><h2>修订与审查历史 · 样例</h2><div class="review-history"><strong>原候选</strong><p>“促销减少导致所有品类销售下降；全面推广保证收益增加30%。”</p><p>反例问题：无因果证据、品类B增长反证、资源约束及未绑定收益数字。</p></div><div class="review-history"><strong>有限修订与重审</strong><p>撤回夸大原因／保证，保留净额变化及补证选项。仅有真实证据变化才能改变对应资格；修订不是因果证明。</p></div>${state.conditionHistory.map(item=>`<p class="review-history">${escapeText(item)}</p>`).join('')}<p class="fine">本页是合成对照，不是后台不可变历史证据；旧partial／失败／UNKNOWN不能被“重审完成”抹去。</p><button class="btn btn-sm" data-action="back">返回当前版</button></section>`;
}
function humanHtml() {
  return `<section class="review-card"><h2>人的下一步</h2><p>审查是建议的边界，不是你的签名。确认分析、补证、暂缓或正式选择沿用已有整体人审；限制和未满足条件一并读回。</p><div class="actions"><button class="btn btn-sm" data-action="judgment" data-choice="确认分析">确认分析</button><button class="btn btn-sm" data-action="judgment" data-choice="要求补证">要求补证</button><button class="btn btn-sm" data-action="judgment" data-choice="暂缓">暂缓</button><button class="btn btn-sm" data-action="judgment" data-choice="正式判断入口">正式判断入口</button></div><p id="human-note" class="fine">仅增量位置预演。没有真实Decision／Expected保存或行动执行；原完整合同仍适用。</p></section>`;
}
function renderDetail() {
  const s = state.data;
  const detail = {
    meaning:`<h2>本次业务口径</h2><p>006已接受的精确净销售口径与换版机制继续复用。本合成示例两期同口径160／150元，不是006实际两任务对比。</p><p>净额变化不能自动代表业务量或促销效果。支付／退款完成归属改变需当前资料重绑及真实重算，不由审查改定义。</p>`,
    plan:s.strategy === '不适用' ? '<h2>本次仅分析</h2><p>建议审查不适用；不生成行动选项、时间／费用条件或行动追问。可以确认分析、补证或暂缓。</p>' : s.phase === 'stale' ? '<h2>本版方案待新证据</h2><p>当前R2的新期间未计算／核验，没有当前建议依据或资格。旧R1只可从历史／证据详情参考，不认证R2；须经现有执行链重算后再审查。</p>' : `<h2>建议的条件与备选</h2><p>${escapeText(strategyText())}</p><dl><div><dt>目标／依据</dt><dd>先取得品类A退货原因的可追溯资料，再决定是否促销。A下降20元，B增长10元；不代表原因已知。</dd></div><div><dt>已满足条件（合成业务说明）</dt><dd>同口径数字／品类分组已核对；运营负责该品类的原因核查；费用≤200元，不扩大促销或联系客户。业务条件来自用户说明，不是实际执行授权。</dd></div><div><dt>关键时间条件</dt><dd>${state.conditionAnswer === 'yes' ? '用户合成回答能安排；重审完成前仍不可推荐。' : state.conditionAnswer === 'no' ? '用户合成回答不能安排；3天内安排与资源冲突。' : '未知：负责人能否在未来3天投入2小时。只问这一题，不重复口径或预算。'}</dd></div><div><dt>观察指标／窗口</dt><dd>3天内核查是否完成、原因资料是否可追溯、是否需修订口径／品类差额；差额修订走原真实计算与核验。不是收益承诺、Actual或因果认证。</dd></div><div><dt>代价、风险、停止／备选</dt><dd>最多2小时、≤200元（仅合成例子，不是产品限额）；超费用、资料错配／越权就停止。未得原因资料则报告不足。备选：先补证、暂缓到时间条件可用再评估、不行动；不编造另一负责人。</dd></div></dl><p><strong>当前判定：</strong>${escapeText(decisionText('strategy'))}；条件确认、重审和人的选择是三个不同动作，均不执行行动。</p>`,
    materials:`<h2>资料与授权</h2><p>E1：合成六指标／两期结果；E2：合成分组变化；E3：合成资源条件。没有读取真实资料或模型请求。</p><p>生产审查只读获准必要材料与精确子集；未选资料、任意路径、凭据禁止出站。先复用有效授权，必要时才重新授权，不每Attempt弹窗。</p>`,
    evidence:`<h2>结论的依据与边界</h2>${s.phase === 'stale' ? '<p class="review-note">以下为历史R1证据，不适用于当前新期间R2。当前没有新数字或审查结果。</p>' : ''}<dl><div><dt>支持证据E1／E2（合成）</dt><dd>两期160→150元；品类A100→80，品类B60→70。差额−10元可复核；只是样例，不是本页真实计算。</dd></div><div><dt>反证与替代解释</dt><dd>品类B增加反驳“所有品类下降”；退款归属、期间／资料变更须排查；无活动或因果设计不能归因促销。</dd></div><div><dt>结论判定／未完成</dt><dd>${escapeText(decisionText('conclusion'))}。无独立语义／因果认证，不靠模型同意变真。</dd></div><div><dt>数字检查独立维度</dt><dd>${s.numeric === 'partial' ? 'partial：未绑定收益数字拒绝，语义审查不抹除。' : '样例数字资格不认证解释或策略。'} 新期间／口径必须真实重算。</dd></div></dl>`,
    execution:`<h2>执行与审查记录</h2><p>${escapeText(phaseLabel(s))}（合成）</p><p>生成与评估分离上下文，消费同版真实证据；不是另一个Agent表示同意。拟议一轮初审、至多一次合并修订及重审，待用户确认。</p><p>此原型没有请求，未持久化账本；不能用“0次”推定生产无消耗。生产沿用累计不封顶、持久计量和一次额外物理请求（备用共用）；停止／UNKNOWN／迟到原边界保留。</p><p>关页不是停止；服务重启不自动续跑，重新打开先只读回。历史失败和006限制保留。</p>`
  };
  $('detail').innerHTML = detail[state.tab];
  for (const tab of document.querySelectorAll('[data-tab]')) { const active = tab.dataset.tab === state.tab; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1; }
  $('detail').setAttribute('aria-labelledby',`tab-${state.tab}`);
}
function openDrawer(tab, trigger) {
  if ($('drawer').hidden) returnFocus = trigger || document.activeElement;
  state.tab = tab; $('drawer').hidden = false; $('details').setAttribute('aria-expanded','true'); renderDetail();
  if (window.matchMedia('(max-width:1100px)').matches) { $('main').inert = true; document.querySelector('.sidebar').inert = true; }
  $('detail').focus();
}
function closeDrawer() {
  $('drawer').hidden = true; $('details').setAttribute('aria-expanded','false'); $('main').inert = false; document.querySelector('.sidebar').inert = false;
  if (returnFocus && returnFocus.isConnected) returnFocus.focus(); else $('details').focus();
}
function announce(text) { $('notice').textContent = text; }
$('scene').addEventListener('change',event=>reset(event.target.value));
$('advance').addEventListener('click',()=>{ if (state.data.phase === 'stopping') {state.data.phase='stopped';state.data.note='任务已停止（合成确认）；重新打开不执行。';} else if (state.data.phase === 'reviewing') {state.data={...state.data,...scenes.conditional};if(state.conditionAnswer!=='unknown'){state.data.phase='strategy_reviewing';state.data.strategy=null;state.data.note='沿用已提供的时间条件，建议重审中；不要求重复回答。';}} else if (state.data.phase === 'strategy_reviewing') {state.data.phase='done';state.data.strategy=state.conditionAnswer==='yes'?'有支持':'存在冲突';state.data.note=state.conditionAnswer==='yes'?'时间条件已明确，重审支持此核查安排；原因／收益仍未证明，等待人的选择。':'重审确认当前时间资源不支持S1，不能推荐；可补可用资源信息、暂缓或不行动。';state.conditionHistory.push(`R2：${state.data.strategy}；只改变建议资格，不重算数字、不改有限观察。`);} render(); });
$('stop').addEventListener('click',()=>{state.data.phase='stopping';state.data.verdict=null;state.data.strategy=null;state.data.note='正在确认整个根任务停止；迟到意见不提升成果。尚不能称物理停止。';render();});
$('new').addEventListener('click',()=>{reset('normal');announce('评审样例复位；未新建真实任务。');});
$('current-session').addEventListener('click',()=>{state.history=false;render();});
$('history').addEventListener('click',()=>{state.history=true;render();});
for (const id of ['quick','professional']) $(id).addEventListener('click',()=>{state.mode=id;render();});
for (const button of document.querySelectorAll('[data-stage]')) button.addEventListener('click',()=>{state.stage=Number(button.dataset.stage);render();});
$('details').addEventListener('click',event=>openDrawer(state.tab,event.currentTarget));
$('materials').addEventListener('click',event=>openDrawer('materials',event.currentTarget));
$('close').addEventListener('click',closeDrawer);
for (const tab of document.querySelectorAll('[data-tab]')) tab.addEventListener('click',()=>{state.tab=tab.dataset.tab;renderDetail();tab.focus();});
document.querySelector('.detail-tabs').addEventListener('keydown',event=>{const tabs=[...document.querySelectorAll('[data-tab]')], i=tabs.indexOf(document.activeElement); if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;state.tab=tabs[next].dataset.tab;renderDetail();tabs[next].focus();});
document.addEventListener('keydown',event=>{if($('drawer').hidden)return;if(event.key==='Escape'){closeDrawer();return;}if(event.key==='Tab'&&window.matchMedia('(max-width:1100px)').matches){const list=[...$('drawer').querySelectorAll('button:not([tabindex="-1"]),[tabindex="0"]')],first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
window.addEventListener('resize',()=>{const covered=!$('drawer').hidden&&window.matchMedia('(max-width:1100px)').matches;$('main').inert=covered;document.querySelector('.sidebar').inert=covered;});
$('thread').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  switch(button.dataset.action){
    case 'answer':{
      if(state.data.phase!=='done'||state.data.strategy!=='有条件支持')break;
      const answer=button.dataset.answer;if(!['yes','no','unknown'].includes(answer))break;
      if(answer==='unknown'){state.conditionHistory.push('R1：仍不确定，保留有条件支持；没有重复问卷或自动推荐。');render();announce('保持待条件，未执行或正式批准。');break;}
      state.conditionHistory.push('R1：有限观察有支持；S1有条件支持，负责人时间未知。');state.conditionAnswer=answer;state.choice=null;
      state.data.phase='strategy_reviewing';state.data.strategy=null;state.data.version='R2';state.data.note=`收到合成业务回答“${answer==='yes'?'能安排':'不能安排'}”；仅建议需重审，数字和观察仍适用。`;
      state.conditionHistory.push(`R2输入：用户合成回答${answer==='yes'?'能':'不能'}安排；这是用户提供的条件，不是模型独立事实认证。`);render();break;
    }
    case 'choose-plan':if(state.data.phase==='done'&&state.data.strategy==='有支持'&&state.conditionAnswer==='yes'){state.choice='你选择S1：3天内由品类A负责人投入2小时核查，费用≤200元；合成选择草案，不执行。';state.human=true;render();announce('已显示选择草案，未签署或执行。');}break;
    case 'evidence':openDrawer('evidence',button);break;case 'plan':openDrawer('plan',button);break;
    case 'report':state.report=!state.report;render();break;
    case 'history':state.history=true;render();break;case 'back':state.history=false;render();break;
    case 'human':state.human=!state.human;render();break;
    case 'reopen':state.reopened=true;announce('合成重新打开：仅读回，未启动执行。');break;
    case 'resume':if(!['unknown','stopping','stale'].includes(state.data.phase)){state.data={...state.data,...scenes.normal};render();announce('显式恢复的合成预演；保留已提供条件，生产须核验现有授权。');}break;
    case 'save':if(state.data.saved===false){state.data.saved=true;render();announce('合成保存成功，不重跑审查；本页实际上不持久化。');}else announce('后端已保存状态示意；本演示没有真实持久化。');break;
    case 'download':state.data.downloadFailed=false;render();announce('合成下载反馈；未生成文件，没有重算／重审。');break;
    case 'judgment':$('human-note').textContent=`你选择了“${button.dataset.choice}”（样例）。未正式提交、未生成Decision／Expected、未执行行动；审查限制不改变。`;break;
  }
});
$('composer').addEventListener('submit',event=>{event.preventDefault();const text=$('message').value.trim();if(!text)return;state.messages.push(text);$('message').value='';render();announce('输入已安全显示，未执行新分析。');});
window.reviewDemo = {state,scenes,reset,render,decisionText,openDrawer,closeDrawer};
render();
