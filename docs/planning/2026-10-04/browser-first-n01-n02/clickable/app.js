/* DISCUSSION PROTOTYPE. Two structural views of one task, not two engines.
 * Question: can a user co-create a useful framework, then let the system advance the task?
 * Fixed synthetic fixtures only. No filesystem, model, calculation, or production API.
 * All state is in memory; in-page save/reopen is simulated. Refresh resets everything.
 */
const app = document.getElementById('app');
const dialog = document.getElementById('dialog');
const notice = document.getElementById('notice');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const periods = [
  {label:'8 月两个 14 天',base:'2026-08-01 — 08-14',current:'2026-08-15 — 08-28',before:200,after:220},
  {label:'9 月两个 14 天',base:'2026-09-01 — 09-14',current:'2026-09-15 — 09-28',before:220,after:220}
];
const sourceCatalog = [
  {id:'members',name:'会员.xlsx',role:'会员资料',sheets:'会员资料、字段说明',structure:'会员标识：文本；加入时间：日期；字段含义说明',kind:'members'},
  {id:'ordersPrevious',name:'订单上期.csv',role:'对比期订单',structure:'会员标识：文本；订单时间：日期；金额：数值；支付／退款状态：枚举',kind:'orders',coverage:['base']},
  {id:'ordersCurrent',name:'订单本期.csv',role:'本期订单',structure:'会员标识：文本；订单时间：日期；金额：数值；支付／退款状态：枚举',kind:'orders',coverage:['current']},
  {id:'ordersExtra',name:'订单补充.csv',role:'两期补充订单来源',structure:'含两期订单；同规范结构；合并后按已确认口径处理重复记录',kind:'orders',coverage:['base','current']},
  {id:'brief',name:'经营说明.md',role:'业务说明／模型上下文',structure:'普通文档直接阅读；不是规范会员／订单数据',kind:'context'}
];
const defaultSources = ['members','ordersPrevious','ordersCurrent'];
const sourceName = id => sourceCatalog.find(s=>s.id===id)?.name || '未知来源';
function hasRequiredSources(t) {
  const sources=t.files.map(id=>sourceCatalog.find(s=>s.id===id));
  return sources.every(Boolean)&&sources.some(s=>s.kind==='members')&&['base','current'].every(p=>sources.some(s=>s.kind==='orders'&&s.coverage.includes(p)));
}
function sourcesQualified(t) {return hasRequiredSources(t)&&t.prepared&&t.dataQualified&&t.sourceValid;}
const sampleQuestion = '核实 8 月前后两个 14 天会员复购和复购收入有什么变化。';
let serial = 1;
function newTask() { return {id:`DEMO-${serial++}`,question:'',framework:freshFramework(),discoveryInput:'',files:[],stage:'entry',prepared:false,meaningResolved:true,period:0,periodChosen:false,grant:false,textConsent:false,commentConsent:false,verified:false,reports:[],reportId:null,comments:[],messages:[],events:[],note:'',comment:'',review:{owner:'',target:'',guardrail:'',decision:'',rationale:''},result:null,failure:'',failureNext:'none',timer:null,epoch:0,scopeRevision:1,closed:false,scenario:'normal',readOnly:false,disconnected:false,unknown:false,attempts:0,usage:'尚未开始',inflight:'无',download:'未请求下载',grantExpired:false,stopUnknown:false,pendingReview:null,acceptedFinding:null,savedClosure:null,modelOp:null,codeOp:null,documentRead:false,localIssue:'',dataQualified:false,structureReady:false,extractionTrusted:false,transformationTrusted:false,sourceValid:true,materialsValid:true,inputValid:true,configValid:true}; }
const projects = [{id:1,name:'会员经营分析',tasks:[newTask()]}];
let projectId = 1, taskId = projects[0].tasks[0].id;
const initialMode = new URLSearchParams(location.search).get('variant');
let mode = initialMode === 'professional' ? 'professional' : 'simple';
let railOpen = true, toolsOpen = false, inbox = false, dialogKind = '', lastFocus = null;
const project = () => projects.find(p => p.id === projectId);
const task = () => project().tasks.find(t => t.id === taskId);
const period = t => periods[t.period];
const busy = t => ['inspect','structuring','generating','transforming','qualifying','correcting','planning','calculating','verifying','explaining','revising'].includes(t.stage);
const currentReport = t => t.reports.find(r => r.id === t.reportId);
function log(t, text) { t.events.push({text,time:new Date().toLocaleTimeString('zh-CN',{hour12:false})}); }
function toast(text) { notice.textContent=text; notice.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>notice.classList.remove('show'),4200); }
function btn(action,text,cls='',extra='') {
  const t=task(),readActions=['simple','professional','rail','tools','about','dismiss','activity','materials','evidence','scope','reportDetail','history','version','scenarios','loadScenario','refreshRead','reconnect','boundaries','showJourney','showFramework','frameworkHistory','project','task'];
  if(((t.readOnly||t.disconnected)&&!readActions.includes(action))||(t.unknown&&['review','analysisReview','submitReview'].includes(action))||(t.stopUnknown&&['stop','reauthorize','retry','authorize','readUsage'].includes(action)))extra+=' disabled';
  return `<button type="button" data-action="${action}" class="${cls}" ${extra}>${text}</button>`; }
function files(t) { return t.files.map(f=>`<span class="attachment">▤ ${esc(sourceName(f))} <span class="muted">合成</span></span>`).join(''); }
function title(t) { return t.question ? (t.stage==='discovery'?'会员经营 · 需求讨论':'会员经营分析') : '新分析任务'; }
function stageInfo(t) {
  const state = {
    entry:['尚未开始','先聊业务问题，不必提前整理好分析需求。',''],discovery:['正在共同梳理需求','边讨论，边形成可修改的分析框架。','wait'],needData:['等待可用资料','添加多份会员与订单示例，系统按角色识别，不按文件数量准入。选择资料不会启动模型或代码。','wait'],
    inspect:['正在进行本地结构检查','受信本地画像：仅检查格式、工作表、结构和已绑定口径，尚未调用模型或运行生成代码。',''],
    structuring:['正在理解资料结构','演示：有效授权内仅向模型提供普通表头、类型与语义；表格明细留在本地；普通文档按材料范围提供内容。',''],
    generating:['正在准备本地处理代码','演示：生成用于提取、清洗、合并和规范转换的 Python；不改写主算或独立核验器。',''],
    transforming:['正在隔离处理多源资料','演示：源只读，无网络、凭据、任意目录、Shell 或安装权限。',''],
    qualifying:['正在检查转换资格','提取可信、转换可信与指标复算分别确认；资格未通过，不进入 M1。',''],
    correcting:['正在进行唯一一次代码纠正','同一代码准备操作 1 / 1：只依据分类诊断，不发明细或运行原文；不刷新操作次数。',''],
    clarify:['需要你补充分析范围','目前还不知道你想比较哪两个期间；这个答案会影响结果。','wait'],
    meaning:['需要澄清订单含义','示例异常：有效订单的业务含义未确认，暂不计算。','wait'],
    authorize:['分析已准备好，等待授权','请确认本次任务边界；授权后，内部步骤将自动推进。','wait'],
    planning:['正在组织分析计划','演示：按确认的期间和口径，仅安排 M1 总体比较。',''],
    calculating:['正在进行本地计算','执行已选方法。CSV／XLSX 原始明细不会交给模型；普通文档遵循其任务材料范围。',''],
    verifying:['正在核验计算结果','演示：独立复算总体指标；通过前不展示可信发现或报告成功。',''],
    explaining:['演示：事实已核验，正在整理报告','你可以先查看发现；无需等待报告表达全部完成。',''],
    ready:['待审报告已准备好','演示：查看依据，确认分析或保留待补证；修改／重算尚未开放。','done'],
    revising:['正在修改报告表达','仅修改表述，不重新计算、不改写事实和人的判断。',''],
    failed:[t.verified?'报告解释暂未完成':'计算未完成',t.verified?'已核验的发现仍然有效，重试只处理报告解释。':'未产生通过核验的结果。已保存任务范围，可修正后重试。','error'],
    stopped:['已停止并保存','不会继续执行；已完成结果仍保留。继续前检查有效产品配置与本任务绑定；有效决定复用，不因重开再次批准模型权限。','wait'],
    needsEvidence:['已保留你的质疑','任务停在补证处，没有接受发现，也没有产生正式决定。','wait'],
    completed:[t.result?.kind==='choice'?'你的决定已记录':'分析已确认','本次模型授权已结束。记录决定不代表批准或执行现实行动。','done']
  };
  return state[t.stage] || state.entry;
}
function topbar() { return `<header class="topbar"><div class="brand"><span class="brand-mark"><img src="../../../../../apps/desktop/assets/juanerai-logo-slogan.png" alt=""></span><span class="brand-copy"><strong>JuanerAI</strong><small>持续做出更好的决策</small></span><span class="product-name">Xanthil</span></div><nav class="mode-switch" aria-label="工作模式">${btn('simple','简单',mode==='simple'?'active':'',`aria-pressed="${mode==='simple'}"`)}${btn('professional','专业',mode==='professional'?'active':'',`aria-pressed="${mode==='professional'}"`)}</nav><div class="top-actions"><span class="badge prototype-badge">UI合同演示 · 非真实执行</span><span class="avatar" aria-label="演示用户">演</span></div></header>`; }
function rail(t) { return `<aside class="rail ${railOpen?'':'collapsed'}" aria-label="项目和任务"><div class="row spread rail-title">${railOpen?'<strong>项目</strong>':''}${btn('rail',railOpen?'‹':'☰','quiet rail-toggle',`aria-label="${railOpen?'收起项目列表':'展开项目列表'}" aria-expanded="${railOpen}"`)}</div><div class="rail-content">${projects.map(p=>`<button class="project ${p.id===projectId?'selected':''}" data-action="project" data-project="${p.id}" ${busy(t)?'disabled':''}><strong>▱ ${esc(p.name)}</strong><small>${p.tasks.length} 个演示任务 · 本次页面内</small></button>`).join('')}${btn('newProject','＋ 新建项目','quiet',busy(t)?'disabled':'')}<div class="rule"></div><div class="row spread rail-title"><strong>分析任务</strong>${btn('newTask','＋','quiet','aria-label="新建分析任务" '+(busy(t)?'disabled':''))}</div>${project().tasks.map(x=>`<button class="task-link ${x.id===t.id?'current':''}" data-action="task" data-task="${x.id}" ${busy(t)&&x.id!==t.id?'disabled':''}><span>${esc(title(x))}</span><small>${esc(stageInfo(x)[0])}</small></button>`).join('')}<div class="rule"></div>${btn('data','▤ 资料与口径','quiet')}</div><div class="rail-foot">AI 推进任务<br>你掌握关键判断<br><span class="small">当前仅演示 PC 体验</span></div></aside>`; }
function composer(t) {return `<div class="composer"><label for="question">你的业务问题</label><textarea id="question" data-bind="question" placeholder="例如：核实 8 月前后两个 14 天会员复购和复购收入有什么变化？">${esc(t.question)}</textarea><div>${files(t)}</div><div class="composer-footer">${btn('data','＋ 添加资料','quiet')}${btn('start','查看分析方向 →','primary')}</div></div>`;}
function welcome(t) { return `<div class="welcome"><span class="eyebrow">从一个业务问题开始</span><h1>这次，你想弄清什么？</h1><p>不必先写好完整需求。先聊业务目标，再一起确定该分析什么。</p>${composer(t,true)}<div class="example"><span>试一试</span>${btn('example','核实两期会员复购与复购收入变化 ↗')}</div><p class="welcome-note">N01/N02 首试 · 本地固定演示，不调用真实 AI。可用示例回答体验共创，也可直接调整框架；不会真实理解任意输入。请勿输入敏感资料。</p></div>`; }
function status(t) {
  const custom={
    preparationBlocked:['资料准备未通过','未生成可信指标或报告。查看分类原因与处理依据，原来源及失败记录保留。'],
    codeUnknown:['本地代码执行状态未知','先读回原执行；状态未知或仍占槽时，不重跑代码、不新建操作、不使用纠正机会。'],
    blocked:['资料资格不合格','两期筛选后无有效行，无法计算；没有成功报告。请重新选择合格资料；不复用该不合格结果。'],
    modelFailed:['模型解释未完成，等待处理','同一操作自动重试机会已用完或不具备重试条件；已核验事实保留，不通过重跑计算掩盖模型失败。'],
    modelUnknown:['模型请求状态未知，先等待读回','原请求 UNKNOWN 或仍占物理槽，禁止并发补发。成功只读回；确认失败且已释放后才检查唯一自动重试机会。'],
    closureMissing:['收束内容尚不完整','已核验事实与原待审报告可看；缺少有依据的收束内容，不能确认、完成或生成最终报告。请保留待审／补证。'],
    insufficient:['证据不足，暂不能判断总体变化','合格输入在一个期间没有有效分母；保留已核验事实，但不生成 0% 或下降判断。'],
    stopUnknown:['停止请求结果未知','尚未确认后端已停止；禁止重复停止或继续，先读回停止状态。原累计消耗与在途 UNKNOWN 保留。'],
    submitUnknown:['确认结果未知','已阻止重复确认；先读回保存状态，不重发命令。'],
    readonly:['此页只读','另一页面持有控制权；Desktop 与浏览器不能同时写同一项目。'],
    disconnected:['任务服务已断连','这里只显示最后读回状态，当前进度未知；重连只读回，不重发分析或确认。'],
    restarted:['服务已重启，尚未继续','只读回已保存内容，不自动续跑、不新建执行、不重置累计使用。']
  };
  const item=custom[t.stage], [label,desc,cls]=item?[...item,'wait']:stageInfo(t);
  return `<section class="surface state-strip ${cls}" aria-label="任务状态" aria-live="polite"><div class="state-label">${esc(label)}</div><p>${esc(desc)}</p><span class="badge">合成状态演示 · 非真实进度</span>
  ${busy(t)?`<div class="actions">${btn('stop','停止并保存')}</div>`:''}
  ${['preparationBlocked','codeUnknown'].includes(t.stage)?preparationActions(t):''}
  ${t.stage==='failed'?`<div class="actions">${btn('calculationRecovery','查看计算／核验修复说明','primary')}${btn('stop','停止并保存')}</div>`:''}
  ${['stopped','restarted'].includes(t.stage)?`<p>累计：${esc(t.usage)}；在途：${esc(t.inflight)}。不会清零。</p><div class="actions">${t.inflight==='UNKNOWN'?(t.codeOp?.slot?btn('readCodeSuccess','审核演示：读回原执行成功')+btn('readUsage','审核演示：读回原执行失败'):btn('readUsage','先读回在途状态')):''}${btn('reauthorize','检查授权并继续','primary',t.inflight==='UNKNOWN'?'disabled':'')}</div>`:''}
  ${t.stage==='insufficient'?`<div class="actions">${btn('moreEvidence','保留待补证／暂不判断','primary')}</div>`:''}
  ${t.stage==='stopUnknown'?`<div class="actions">${btn('readStop','先读回停止状态','primary')}${btn('stop','停止并保存','','disabled')}${btn('reauthorize','检查授权并继续','','disabled')}</div>`:''}
  ${t.stage==='modelFailed'?`<p>本操作自动重试：${t.modelOp?.autoRetries||0} / 1；记录随原操作保留，不因恢复重新获得次数。</p><div class="actions">${btn('modelRecovery','查看恢复条件')}${btn('stop','停止并保存')}</div>`:''}
  ${t.stage==='modelUnknown'?`<div class="actions">${btn('settleModelFailure','审核演示：读回失败且槽已释放')}${btn('settleModelSuccess','审核演示：读回原请求成功')}${btn('stop','停止并保存')}</div>`:''}
  ${t.stage==='submitUnknown'?`<div class="actions">${btn('readConfirmation','读回确认结果','primary')}${btn('submitReview','确认分析','','disabled')}</div>`:''}
  ${t.stage==='disconnected'?`<div class="actions">${btn('reconnect','重新连接，只读回','primary')}</div>`:''}
  ${t.stage==='blocked'?`<div class="actions">${btn('data','查看资料')}${btn('dismissTask','取消本次尝试')}</div>`:''}
  ${t.stage==='needsEvidence'?`<p>待处理：${esc(t.note||'暂不判断')}</p><div class="actions">${btn('backReport','返回报告检查依据')}</div>`:''}</section>`;
}
function pending(t) {
  if(t.stage==='needData') return `<section class="surface"><div class="section-head"><h2>资料由系统识别，你只补真正缺口</h2><span class="badge warn">等待资料</span></div><p class="muted small">多份来源、一个工作簿的多张表均可组合；本例使用会员工作簿与两个期间的订单；需覆盖两期而不是凑足文件数。不需要逐字段配置。</p><div class="data-needs"><div><strong>会员资料</strong><p>自动识别会员角色与工作表。</p><span class="badge">${t.files.includes('members')?'已选合成工作簿':'需要来源'}</span></div><div><strong>订单资料</strong><p>合并分散订单，核对期间与关联资格。</p><span class="badge">${t.files.some(id=>sourceCatalog.find(s=>s.id===id)?.kind==='orders')?'已选合成订单来源':'需要来源'}</span></div></div>${files(t)}<div class="actions">${btn('data','添加演示资料','primary')}${btn('returnDiscovery','回到需求讨论','quiet')}</div><p class="small muted">首试 M1 贯通 CSV＋XLSX；普通文档可作为同任务上下文直接阅读。旧 Office／图片等尚未接通的读取在本批／S1 收口，不暗换模型。</p></section>`;
  if(t.stage==='clarify') return `<section class="surface"><div class="section-head"><h2>你想比较哪两个期间？</h2><span class="badge">一个必要问题</span></div><p class="muted small">文件包含多个期间；我不会替你决定这次问题的时间范围。</p>${periods.map((p,i)=>`<label class="choice"><span class="row"><input type="radio" name="period" data-bind="period" value="${i}" ${t.periodChosen&&t.period===i?'checked':''}><strong>${p.label}</strong></span><p>${p.base}<br>对比 ${p.current}</p></label>`).join('')}<div class="actions">${btn('confirmPeriod','按这个范围准备分析','primary',!t.periodChosen?'disabled':'')}</div></section>`;
  if(t.stage==='meaning') return '<section class="surface"><h2>有效订单口径待补充</h2><p class="muted small">现行获准合同和已绑定口径尚未明确，不能凭 paid 字段名猜测；当前保留待补状态，不进行计算。本审核附件不提供未接通的口径确认按钮。</p></section>';
  if(t.stage==='authorize') return authorization(t);
  return '';
}
function authorization(t) {
  return `<section class="surface"><div class="section-head"><h2>本次任务边界</h2><span class="badge warn">演示配置 · 非真实授权</span></div>
  <p>已完成受信本地结构检查，尚未生成或运行模型代码。复用已生效的产品配置，后台核验当前任务绑定；不逐字段、逐脚本重复审批。</p>
  <dl class="key-values"><dt>问题与范围</dt><dd>${esc(t.question)}<br>${period(t).base} 对比 ${period(t).current} · 首试 M1 总体比较</dd><dt>本地来源</dt><dd>${t.files.map(sourceName).map(esc).join('、')}；源只读，保留本地项目与来源身份。选择文件不等于外发。</dd><dt>接收方／模型</dt><dd>沿用 Xiaomi Token Plan CN／MiMo 2.6 Pro；已生效配置跨 Change 复用，不重新选择模型。本附件未使实际配置生效。</dd><dt>模型材料</dt><dd>CSV／XLSX：普通表头、结构、类型与语义供模型，明细仅本地 Python 处理；报告可使用已核验 M1 总体聚合／可信摘要。MD／PDF／DOCX／DOC／PPTX／PPT／图片：直接读取，在有效配置及本任务材料范围内将文本内容或图片提供给模型，不强制生成代码或先摘要。混合资料一次按类别覆盖，不逐文件勾选。</dd><dt>本地代码</dt><dd>生成 Python 仅处理 CSV／XLSX 明细的提取、清洗、合并、规范转换；其他文档／图片直接阅读。隔离执行无网络／凭据／任意目录／Shell／安装，源只读。M1／M2 主算仍为 DuckDB，固定独立 Python 只核验指标，不能证明源提取正确。</dd><dt>内容安全</dt><dd>隐私按内容而非扩展名判断；文档／图片不保证安全。凭据密钥禁发，敏感个人信息、表格明细改装为 PDF 等越界内容停止并说明具体缺口，可排除或替换来源。普通文档是模型上下文，不自动成为 M1 量化证据。</dd><dt>使用与恢复</dt><dd>单任务累计调用、Token、运行时间暂不设消费上限，仍记录使用与未知在途。代码准备最多自动纠正 1 次；每个模型请求最多自动重试 1 次，两者分开记录。同一失败不能换标识继续；停止、失效、来源变化不自动纠正；未知先读回。</dd><dt>已有使用</dt><dd>${esc(t.usage)}；在途：${esc(t.inflight)}。单次输入输出保护、超时／取消及来源核验保留。</dd><dt>停止点</dt><dd>到待审／待输入停止；不自动接受分析、形成正式决定或执行业务行动。</dd></dl>
  <div class="caution">关闭网页不是停止。停止或服务重启后不自动续跑；本页只演示内存状态，不授予真实数据、模型、环境或代码执行权限。</div><div class="actions">${btn('authorize','演示：按有效任务授权开始','primary')}${btn('materials','查看处理依据与模型材料','link')}${btn('dismissTask','取消，保留待处理')}</div></section>`;
}
function metrics(t,r=null) { if(t.scenario==='zeroDenominator')return '<div class="metric-row"><div><span>对比期复购率 · 演示</span><strong>不可计算</strong></div><div><span>本期复购率 · 演示</span><strong>22<small>%</small></strong></div><div><span>两期变化</span><strong>不可比较</strong></div></div>';  const p=r?.fixture||period(t),delta=(p.after-p.before)/10;return `<div class="metric-row"><div><span>对比期复购率 · 演示</span><strong>${p.before/10}<small>%</small></strong></div><div><span>本期复购率 · 演示</span><strong>${p.after/10}<small>%</small></strong></div><div><span>变化 · 演示</span><strong>${delta>0?'+':''}${delta}<small>个百分点</small></strong></div></div>`; }
function findings(t) { if(!t.verified)return '';if(t.scenario==='zeroDenominator')return `<section class="surface"><div class="section-head"><h2>已核验事实与证据缺口</h2><span class="badge warn">演示：证据不足</span></div>${metrics(t)}<p>输入合格；对比期有效分母为零，本期有效分母为 1,000。不能把不可计算的复购率写成 0%，不能判断复购上升、下降或持平。</p><div class="caution">独立核验通过的是可计算事实，不代表总体比较结论成立。保留待补证或暂不判断，不记录正式决定。</div><div class="actions">${btn('evidence','查看有效事实与缺口','link')}${btn('scope','查看业务口径','link')}</div></section>`;return `<section class="surface"><div class="section-head"><h2>总体比较结果</h2><span class="badge good">演示：独立核验一致</span></div>${metrics(t)}<p class="result-summary">${period(t).after>period(t).before?'复购率上升，下降前提未成立。':'复购率持平，下降前提未成立。'}复购收入由 100,000 元变为 110,000 元（合成演示）。</p><div class="caution">仅描述总体变化；未运行分组分析，不能解释原因、推荐干预或承诺收益。</div><div class="actions">${btn('evidence','查看计算与依据','link')}${btn('scope','查看业务口径','link')}</div></section>`; }
function report(t) { const r=currentReport(t);if(!r||!t.verified)return '';return `<section class="surface"><div class="section-head"><div><span class="eyebrow">演示报告 · ${t.stage==='completed'?'仅确认分析':'等待人的判断'}</span><h2>${t.scenario==='zeroDenominator'?'证据不足说明':'总体比较报告'} <span class="muted small">v${r.version}</span></h2></div>${btn('reportDetail','展开全文','quiet')}</div><p class="report-body">${esc(r.text)}</p><div class="report-section"><p>后端报告：演示已保存且已核验；当前原型只存本页内存。</p><p class="small muted">浏览器副本：${esc(t.download)}；后端保存不等于本机下载成功。</p></div><div class="actions">${btn('history','报告与意见','link')}${btn('download','演示下载结果')}${['ready','insufficient','closureMissing'].includes(t.stage)?btn('review','审阅并作判断','primary'):''}</div><details><summary>S1 后续入口 · 首试未开放</summary><p>M2、报告修改／期间重算、正式决定与事前预期、Fork／Subagent、完整专业检查面仍归 S1。当前入口不调用这些能力。</p></details></section>`; }
function discussion(t) { if(!currentReport(t)||t.stage==='completed')return '';return `<section class="surface"><h2>需要补充证据或暂不判断？</h2><p class="small muted">意见绑定当前报告；仅保留待处理，不触发修改、重算或新的模型调用。</p><div class="field"><label for="comment">待处理意见</label><textarea id="comment" data-bind="comment">${esc(t.comment)}</textarea></div><div class="actions">${btn('saveComment','保留意见与待审状态')}</div></section>`; }
function result(t) {if(t.stage!=='completed'||!t.result)return '';return `<section class="surface"><div class="section-head"><h2>本次限定分析与收束已确认</h2><span class="badge good">整体效果 · 合成回执</span></div><p>已接受来源 ${esc(t.result.reportId)} 的精确发现，保存有依据且无方案偏好的收束，任务完成；追加最终报告 ${esc(t.result.finalReportId)}，原待审报告未改写。</p><p>${esc(t.savedClosure.reason)}</p><div class="caution">${t.scenario==='zeroDenominator'?'确认的是有限核验事实与不足，不代表两期总体比较成功。 ':''}没有正式决定、事前预期或行动授权。旧任务授权已结束，累计使用仍保留。</div><div class="actions">${btn('history','查看原待审与最终报告')}${btn('closeTask','返回任务列表','primary')}</div></section>`;}
function evidenceTable(t,r=null) { if(t.scenario==='zeroDenominator')return '<div class="table-wrap"><table><caption>合成演示 · 合格输入，单期零分母</caption><thead><tr><th>指标</th><th>对比期</th><th>本期</th></tr></thead><tbody><tr><td>活跃会员（有效分母）</td><td>0</td><td>1,000</td></tr><tr><td>重复购买会员</td><td>0</td><td>220</td></tr><tr><td>复购率</td><td>不可计算：有效分母为零</td><td>22%</td></tr><tr><td>复购率两期变化</td><td colspan="2">证据不足，不可比较</td></tr></tbody></table></div><p class="small muted">两期并非都无有效行，资料检查合格。有效计数与本期复购率为已核验合成事实；不产生下降判断或虚构成功率。</p>';  const p=r?.fixture||period(t);return `<div class="table-wrap"><table><caption>合成演示 · M1 总体比较</caption><thead><tr><th>指标</th><th class="number">对比期</th><th class="number">本期</th></tr></thead><tbody><tr><td>活跃会员</td><td class="number">1,000</td><td class="number">1,000</td></tr><tr><td>重复购买会员</td><td class="number">${p.before}</td><td class="number">${p.after}</td></tr><tr><td>复购率</td><td class="number">${p.before/10}%</td><td class="number">${p.after/10}%</td></tr><tr><td>复购收入（元）</td><td class="number">100,000</td><td class="number">110,000</td></tr></tbody></table></div><p class="small muted">来源：${t.files.map(sourceName).map(esc).join('、')}、当前两期、当前报告版本。主算与独立复算一致仅为 UI 状态，不是实际计算证据；没有 M2 或分组结论。</p>`; }
function scopeDetails(t,r=null) { const p=r?.fixture||period(t);return `<dl class="key-values"><dt>对比期</dt><dd>${p.base}</dd><dt>本期</dt><dd>${p.current}</dd><dt>分母</dt><dd>期间内有有效订单的去重会员数。</dd><dt>分子</dt><dd>期间内至少两笔有效订单的去重会员数。</dd><dt>有效订单</dt><dd>本原型示例为已支付且未退款；正式产品复用现行获准合同及已绑定口径，不能凭字段名猜测。</dd><dt>复购收入</dt><dd>从会员第二笔有效订单起计入的订单金额；不是全部销售额。正式期间与口径沿用已绑定的现行合同。</dd><dt>方法</dt><dd>仅 M1 总体比较；M2 首试未开放，不是因果分析。</dd></dl>`; }
function professional(t) {return `<aside class="detail-column" aria-label="同一任务的首试依据"><section class="surface"><h2>按需查看依据</h2><p class="small muted">与简单模式共享当前任务；这里只展示首试 M1 检查面，完整专业模式仍归 S1。</p>${t.verified?evidenceTable(t):'<p>尚无已核验结果。</p>'}<details><summary>口径与期间</summary>${t.periodChosen?scopeDetails(t):'期间尚未确认'}</details><details><summary>任务授权与累计使用</summary><p>沿用 Xiaomi Token Plan CN／MiMo 2.6 Pro。单任务累计调用数、累计 Token、累计运行时间暂不设消费上限；使用与未知在途仍逐步记录，可显式停止。同一失败模型操作最多自动重试 1 次，不因重开或单次尝试刷新。单次上下文／输入输出保护、传输超时／取消、授权与来源核验仍保留；到待审／待输入停止，不无限循环。</p><p>模型调用权限等经确认并在产品配置生效后，后续 Change 复用，不重复询问；仅用户明确要求变更才调整。每任务后台仍核验 grant、文字同意、来源绑定与单次有效性。此附件未使真实配置生效；环境有效性与实际首试观察仍待核对；材料按本轮已确认范围后台核验。</p><p>${esc(t.usage)}；在途：${esc(t.inflight)}；${t.grant?'演示授权有效':'无有效演示授权'}。有效任务授权在边界内复用。</p></details><details><summary>任务历史</summary>${timeline(t)}</details><details><summary>报告历史</summary>${versions(t)}</details></section></aside>`; }
function timeline(t) { return t.events.length?`<ol class="timeline">${t.events.slice(-8).map(e=>`<li>${esc(e.text)}<time>${e.time} · 原型事件</time></li>`).join('')}</ol>`:'<p class="muted small">任务开始后显示模拟事件；没有完成百分比。</p>'; }
function versions(t) { return t.reports.length?`<ul class="version-list">${t.reports.map(r=>`<li><button data-action="version" data-version="${r.id}" class="${r.id===t.reportId?'selected':''}"><span>v${r.version} · ${r.kind==='final'?'最终报告':r.kind==='expression'?'表达修订':r.kind==='period'?'期间重算':'原待审报告'}</span><small>${r.fixture.label}</small></button></li>`).join('')}</ul>`:'<p class="muted small">尚未产生报告。</p>'; }
function saved(t) { return `<section class="saved-list"><span class="eyebrow">当前项目</span><h1>任务已经留在这里</h1><p class="muted">重新打开只恢复查看，不自动运行。原型仅在当前页面会话中保留。</p><div class="surface"><div><h2>${esc(title(t))}</h2><p class="muted small">${stageInfo(t)[0]} · ${t.reports.length} 个报告版本</p></div>${btn('reopen','重新打开任务','primary')}</div></section>`; }
function render() {
  const active=document.activeElement, focusId=active?.id, selection=active&&'selectionStart' in active?[active.selectionStart,active.selectionEnd]:null;
  const t=task();
  app.innerHTML=`${topbar()}<div class="layout ${railOpen?'':'collapsed'}">${rail(t)}<main class="workspace"><div class="contextbar"><div class="breadcrumbs"><span>${esc(project().name)}</span><span>/</span><span>${inbox?'任务列表':title(t)}</span></div><div class="row">${t.stage!=='entry'&&!inbox?btn('data','▤ 资料','quiet')+btn('closeTask','返回任务列表','quiet'):''}<span>仅本页演示 · 刷新重置</span></div></div>${contractContext(t)}${inbox?saved(t):t.stage==='entry'?welcome(t):`<header class="task-heading"><div><span class="eyebrow">${mode==='simple'?'任务工作台':'专业工作台'} · ${t.id}</span><h1>${esc(title(t))}</h1><p class="muted">${esc(t.question)}</p></div>${btn('activity','任务记录','quiet')}</header>${journey(t)}${t.stage==='discovery'?discoveryPanel(t):`${frameworkSummary(t)}<div class="work-area ${mode}"><div class="main-column">${status(t)}${pending(t)}${preparationSummary(t)}${findings(t)}${report(t)}${result(t)}${discussion(t)}</div>${mode==='professional'?professional(t):''}</div>`}`}</main></div><footer class="footer"><span>UI 合同演示 · 非真实执行 · 本页内存状态，刷新重置</span>${btn('tools',toolsOpen?'收起审核演示':'审核演示','quiet',`aria-expanded="${toolsOpen}"`)}</footer>${toolsOpen?`<section class="test-tools" aria-label="仅供原型评审的演示工具"><strong>审核演示工具</strong><label>下一次运行 <select id="failureNext" data-bind="failureNext"><option value="none" ${t.failureNext==='none'?'selected':''}>正常完成</option><option value="calculation" ${t.failureNext==='calculation'?'selected':''}>计算失败</option><option value="explanation" ${t.failureNext==='explanation'?'selected':''}>解释失败，保留核验结果</option><option value="verification" ${t.failureNext==='verification'?'selected':''}>独立核验失败</option></select></label>${btn('about','查看演示边界')}<span class="muted">不是产品流程按钮；正常步骤会自动推进。</span></section>`:''}`;
  if(focusId&&active?.closest('#app')) {const next=document.getElementById(focusId);if(next&&!next.disabled){next.focus({preventScroll:true});if(selection&&selection[0]!==null)next.setSelectionRange?.(...selection);}}
}
function modal(name,titleText,body,footer='') { lastFocus=document.activeElement;dialogKind=name;dialog.innerHTML=`<header class="dialog-head"><h2 id="dialog-title">${titleText}</h2>${btn('dismiss','×','quiet','aria-label="关闭面板"')}</header><div class="dialog-body">${body}</div>${footer?`<footer class="dialog-footer">${footer}</footer>`:''}`;if(!dialog.open)dialog.showModal(); }
function dismiss() {if((dialogKind==='analysis'||dialogKind==='review')&&!task().unknown)task().pendingReview=null;dialog.close();dialogKind='';lastFocus?.isConnected&&lastFocus.focus();}
dialog.addEventListener('close',()=>{if((dialogKind==='analysis'||dialogKind==='review')&&!task().unknown)task().pendingReview=null;dialogKind='';});
function dataDialog() {
 const t=task(),locked=!!t.codeOp||!!t.modelOp||t.verified||busy(t);
 modal('data','本地项目资料',`<p>只选择内置合成来源，不读取文件或创建文件夹。保留本地项目；来源角色自动识别，不固定文件数量。</p>${sourceCatalog.map(f=>`<div class="file-item"><div><strong>${esc(f.name)}</strong><p>${esc(f.role)}${f.sheets?' · 工作表：'+esc(f.sheets):''} · 合成示例</p></div>${btn('addFile',t.files.includes(f.id)?'已选择':'添加合成来源','',`data-file="${f.id}" ${t.files.includes(f.id)||locked?'disabled':''}`)}</div>`).join('')}<details><summary>本批格式与当前开放状态</summary><p>CSV、XLSX：结构供模型，生成 Python 本地处理明细。MD、PDF、DOCX／DOC、PPTX／PPT、常见图片（PNG／JPEG 等）：直接读取，可在有效配置与任务范围内向模型提供内容；本页提供合成 MD 回放。其他解析与图片／旧 Office 兼容尚未接通，在本批／S1 收口，不假装可用、不改换模型。</p><p>所有名称、表头和结果均为合成示例；没有真实文件选择器。原文件只读，工作簿表与派生规范数据保留来源联系；普通文档阅读不是指标核验。内容敏感时停在具体缺口，不按扩展名认定安全。不会让你逐字段手填。</p></details>${locked?'<p class="small muted">此任务来源已绑定，面板只读；不以追加来源绕过原失败或授权边界。</p>':''}${t.scenario==='empty'?'<div class="error-note">演示：两期筛选后无有效行，不可计算。</div><button type="button" data-action="resetQualification">重新选择合格演示资料</button>':''}`,btn('finishData','返回任务','primary'));
}
function beginPreparation(t) {
 if(t.codeOp||t.modelOp)return;
 if(!hasRequiredSources(t)){t.stage='needData';render();return;}
 if(t.scenario==='empty'){t.stage='blocked';render();return;}
 t.stage='inspect';log(t,'演示：受信本地检查格式、工作表与普通结构；未发模型、未运行代码');
 schedule(t,700,()=>{t.prepared=true;t.documentRead=t.files.includes('brief');t.stage=t.periodChosen?'authorize':'clarify';log(t,'演示本地画像完成，模型理解与代码准备等待有效任务授权');});render();
}

function preparationSummary(t) {
 if(!t.files.length||['entry','discovery','needData'].includes(t.stage))return '';
 return `<section class="surface"><div class="section-head"><h2>资料处理依据</h2>${btn('materials','查看材料与处理记录','link')}</div><p class="small muted">三层可信分别检查；计算一致不代表原文提取正确。所有状态均为合成回放。</p><dl class="key-values"><dt>表格源提取</dt><dd>${t.extractionTrusted?'演示：提取核对通过，来源／工作表保留关联':t.prepared?'本地画像已完成；提取可信尚未确认':'尚未核对'}</dd><dt>规范转换</dt><dd>${t.transformationTrusted?'演示：会员／订单规范资格通过':t.codeOp?.diagnostic||t.localIssue||'尚未通过；模型结构理解和生成代码需有效任务授权'}</dd><dt>指标复算</dt><dd>${t.verified?'演示：DuckDB 主算与固定独立 Python 一致':'尚无可信指标；不以代码执行成功代替核验'}</dd></dl>${t.codeOp?`<p class="small muted">代码准备自动纠正：${t.codeOp.corrections} / 1；独立于报告模型请求自动重试：${t.modelOp?.autoRetries||0} / 1。停止／重开保留原记录。</p>`:''}</section>`;
}
function materialsDialog(t) {
 modal('materials','处理依据与模型材料',`<p>当前仅演示内存记录，无真实提取、生成、执行、发出或核验。</p><h3>受信本地画像 · 不含明细</h3>${t.files.map(id=>{const s=sourceCatalog.find(x=>x.id===id);return `<div class="chat-line"><strong>${esc(sourceName(id))}</strong><p>自动角色：${esc(s?.role||'待识别')}；${esc(s?.structure||'结构待核对')}${s?.sheets?'；工作表：'+esc(s.sheets):''}</p></div>`;}).join('')}${t.documentRead?'<div class="good-note">合成经营说明已本地直接阅读：只核实两期事实，不推导因果。它是模型上下文，不是已核验量化数据；供模型仍须任务材料覆盖。</div>':''}<details open><summary>本任务模型材料范围</summary><p>CSV／XLSX 只提供普通表头、结构、类型、语义及已核验 M1 聚合／可信摘要，明细本地处理。普通文档／图片可在材料覆盖后直接提供文本内容或图片，不要求先摘要；仅作为模型解释上下文，不自动成为已核验量化证据。</p><p>凭据密钥不外发；敏感个人信息及越界业务明细停在具体缺口。把 CSV 转为 PDF 或图片不能绕过表格明细边界；不按扩展名断言安全。代码错误只回送受信分类诊断，不拼接运行原文。</p></details><details><summary>代码用途与执行隔离</summary><p>生成 Python 仅处理 CSV／XLSX 明细的提取／清洗／合并／规范转换；普通文档与图片不强制经过生成代码。派生会员／订单数据进入既有快照与分析接缝。源只读；无网络、凭据、任意目录、Shell、安装。未接通的读取如实报缺口；已获准文档／图片不因此改换模型或越界外发。</p><p>模型代码不替代 DuckDB 主算或固定独立 Python 核验；二者结果一致也不能证明源提取正确。代码准备纠正与模型请求重试各自最多 1 次，原操作记录不重置。</p></details>${t.codeOp?`<p>本操作分类记录：${esc(t.codeOp.diagnostic||'尚无失败分类')}；自动纠正 ${t.codeOp.corrections} / 1。${t.codeOp.blocked?'已阻断：'+esc(t.codeOp.blocked):''}</p>`:''}`);
}
function preparationActions(t) {
 if(t.scenario==='sensitiveDocument')return `<p>${esc(t.localIssue||t.codeOp?.diagnostic)}</p><div class="actions">${btn('excludeDocument','排除此合成文档，保留表格资料','primary')}${btn('dismissTask','保留待处理')}</div>`;
 if(t.stage==='codeUnknown')return `<div class="actions">${btn('readCodeFailure','审核演示：读回执行失败')}${btn('readCodeSuccess','审核演示：读回原执行成功')}${btn('stop','停止并保存')}</div>`;
 return `<p>${esc(t.localIssue||t.codeOp?.diagnostic||'本地资料检查不通过')}</p>${t.scenario==='relationAmbiguous'&&!t.meaningResolved?`<p>会员工作簿含“会员编号”和“客户编号”。订单“会员标识”究竟关联哪一个？这是会改变结果的真实歧义，不要求逐字段填写。</p><div class="actions">${btn('resolveRelation','确认：订单关联会员编号','primary')}${btn('dismissTask','保留待补证')}</div>`:`<div class="actions">${btn('materials','查看处理依据')}${btn('dismissTask','保留待处理')}</div>`}`;
}
function codeBinding(t) {return JSON.stringify({files:t.files,scope:t.scopeRevision,period:t.period,question:t.question,textConsent:t.textConsent});}
function codeAuthorityValid(t) {
 return !!t.grant&&!t.grantExpired&&!t.stopUnknown&&!t.readOnly&&!t.disconnected&&t.prepared&&hasRequiredSources(t)&&t.sourceValid&&t.materialsValid&&t.inputValid&&t.configValid;
}
function codePublicationAllowed(t) {
 const op=t.codeOp;
 return !!op&&!op.blocked&&op.epoch===t.epoch&&op.binding===codeBinding(t)&&codeAuthorityValid(t)&&!['stopped','restarted','completed'].includes(t.stage);
}
function blockPreparation(t,diagnostic) {
 t.codeOp.status='failed';t.codeOp.slot=false;t.codeOp.diagnostic=diagnostic;t.inflight='无';t.stage='preparationBlocked';log(t,'演示：'+diagnostic+'；未发布可信数据或报告');
}
function finishCodePreparation(t) {
 const op=t.codeOp;if(!op||op.status==='succeeded')return;
 op.slot=false;op.status='succeeded';t.inflight='演示已读回原本地执行；累计记录保留';
 if(!codePublicationAllowed(t)){op.blocked=op.blocked||'原授权／来源／执行时点不再有效';log(t,'演示：迟到代码成功只结算，不发布规范数据、不恢复执行');render();return;}
 qualifyCodePreparation(t);
}
function qualifyCodePreparation(t) {
 t.stage='qualifying';log(t,'演示：分开核对源提取与规范转换资格，不以执行成功当作可信');
 schedule(t,650,()=>{if(!codePublicationAllowed(t))return;t.extractionTrusted=true;t.transformationTrusted=true;t.dataQualified=true;log(t,'演示：多源提取及规范资格通过，接入既有 M1 主算与固定独立核验');run(t);});render();
}
function correctCodePreparation(t) {
 const op=t.codeOp;
 if(!op||op.status!=='failed'||op.slot||t.inflight==='UNKNOWN'||op.corrections>=1||!codePublicationAllowed(t)||op.diagnostic!=='日期类型转换失败（受信分类）')return;
 op.corrections++;op.status='pending';op.slot=true;t.stage='correcting';t.inflight='演示代码纠正处理中';log(t,'演示：同一代码准备操作自动纠正 1 / 1，仅发受信分类诊断，不发明细／运行原文');
 schedule(t,800,()=>{if(!codePublicationAllowed(t))return;if(t.scenario==='codeCorrectionExhausted'){blockPreparation(t,'唯一纠正仍未通过，等待处理；不换操作标识继续');return;}finishCodePreparation(t);});
}
function startCodePreparation(t) {
 if(t.codeOp){resumeCodePreparation(t);return;}
 if(!codeAuthorityValid(t)||t.inflight==='UNKNOWN')return;
 t.epoch++;t.codeOp={id:t.id+'-资料准备',binding:codeBinding(t),epoch:t.epoch,status:'pending',slot:true,corrections:0,blocked:false,diagnostic:''};
 t.stage='structuring';t.inflight='演示资料准备处理中';t.usage='已有累计使用记录（合成演示；不虚构费用值）';
 log(t,'演示：复用有效任务授权，模型仅理解普通结构；不逐字段或逐脚本审批');
 schedule(t,650,()=>{
  if(!codePublicationAllowed(t))return;
  t.structureReady=true;
  if(t.scenario==='relationAmbiguous'&&!t.meaningResolved){blockPreparation(t,'字段关联含义不明确，等待一个业务回答');return;}
  t.stage='generating';log(t,'演示：按结构生成提取／清洗／合并／规范转换 Python');
  schedule(t,650,()=>{
   if(!codePublicationAllowed(t))return;
   if(t.scenario==='isolationRejected'){blockPreparation(t,'隔离策略拒绝：代码请求网络访问；不执行、不自动纠正');return;}
   t.codeOp.executionStarted=true;t.stage='transforming';log(t,'演示：隔离处理只读源，未开放网络／凭据／任意目录／Shell／安装');
   schedule(t,800,()=>{
    if(!codePublicationAllowed(t))return;
    if(t.scenario==='codeUnknown'){t.codeOp.status='unknown';t.stage='codeUnknown';t.inflight='UNKNOWN';return;}
    if(t.scenario==='sourceChanged'){t.sourceValid=false;t.codeOp.blocked='来源身份发生变化';blockPreparation(t,'来源变化，原操作失效；不自动纠正或换标识重跑');return;}
    if(['codeCorrectionSuccess','codeCorrectionExhausted'].includes(t.scenario)){blockPreparation(t,'日期类型转换失败（受信分类）');correctCodePreparation(t);return;}
    finishCodePreparation(t);
   });
  });
 });render();
}
function resumeCodePreparation(t) {
 const op=t.codeOp;if(!op)return;
 if(op.slot||op.status==='unknown'){if(!['stopped','restarted'].includes(t.stage))t.stage='codeUnknown';render();return;}
 if(op.status==='succeeded'&&t.dataQualified){run(t);return;}
 if(op.status==='succeeded'&&!t.dataQualified&&op.executionStarted&&op.blocked==='已停止，不自动纠正'&&['stopped','restarted'].includes(t.stage)&&codeAuthorityValid(t)&&op.binding===codeBinding(t)) {
  // Explicit continuation re-admits only qualification of the settled original output.
  // No new code operation, execution, correction or source identity is created.
  t.epoch++;op.epoch=t.epoch;op.blocked=false;
  log(t,'演示：用户显式继续，核验原授权／来源；同一代码操作已成功读回，仅继续未完成资格核对，纠正次数保留');
  qualifyCodePreparation(t);return;
 }
 // No fresh operation or replenished correction on resume, re-open, source changes or stopped work.
 if(!['stopped','restarted'].includes(t.stage))t.stage='preparationBlocked';
 render();toast('原资料准备操作与纠正次数保留；先处理原因，不换标识继续或盲目重跑。');
}
function settleCodePreparation(t,outcome) {
 const op=t.codeOp;if(!op||!op.slot||!['pending','unknown'].includes(op.status))return;
 op.slot=false;t.inflight='演示已读回原本地执行；累计记录保留';log(t,'演示：只读回原执行，未重复运行代码');
 if(outcome==='success'){finishCodePreparation(t);return;}
 op.status='failed';op.diagnostic='执行状态读回为失败，等待处理';
 if(!['stopped','restarted'].includes(t.stage)){t.stage='preparationBlocked';render();}
}

function schedule(t,ms,fn) {clearTimeout(t.timer);const epoch=t.epoch;t.timer=setTimeout(()=>{if(t.epoch!==epoch)return;fn();if(t.id===taskId)render();},ms);}
function appendReport(t,kind='initial') {if(!t.verified)return null;const p=period(t),version=t.reports.length+1;const r={id:`${t.id}-V${version}`,version,kind,fixture:{...p},scopeRevision:t.scopeRevision,text:`合成演示：在 ${p.base} 与 ${p.current}，复购率由 ${p.before/10}% 变为 ${p.after/10}%，复购收入由 100,000 元变为 110,000 元。下降前提未成立。仅进行 M1 总体比较，主算与独立复算一致是本原型的演示状态。不能推导原因、分组贡献或行动收益。报告保持待审，人的确认不等于正式业务决定或行动授权。`};if(t.scenario==='zeroDenominator')r.text='合成演示：输入合格，对比期有效分母为零，复购率不可计算；本期有效分母为 1,000，重复购买会员为 220，复购率为 22%。这些可计算事实已核验，但两期复购变化证据不足，不能判断上升、下降或持平。保留待补证或暂不判断；不形成正式决定。';r.findingId=`${t.id}-F${version}`;r.closure=t.scenario==='closureMissing'?null:proposedClosure(t,r);t.reports.push(r);t.reportId=r.id;return r;}
function run(t,skipCalculation=false) {
  if(t.stopUnknown)return;
  if(t.modelOp){resumeModelExplanation(t);return;}
  if(!t.dataQualified){startCodePreparation(t);return;}
  if(!t.grant||t.grantExpired||t.readOnly||t.disconnected||t.inflight==='UNKNOWN'){t.stage='stopped';render();return;}
  t.epoch++;clearTimeout(t.timer);t.attempts++;t.usage='已有累计使用记录（演示；不虚构费用值）';t.inflight='演示处理中';t.failure=t.failureNext;t.failureNext='none';
  const explain=()=>{startModelExplanation(t);};
  if(skipCalculation&&t.verified){explain();render();return;}
  t.stage='planning';log(t,'演示：复用有效任务授权，仅选择 M1；累计使用不清零');
  schedule(t,800,()=>{t.stage='calculating';schedule(t,900,()=>{if(t.failure==='calculation'){t.stage='failed';t.inflight='无';log(t,'演示：无法计算，没有可采信结果');return;}t.stage='verifying';schedule(t,900,()=>{if(t.failure==='verification'){t.stage='failed';t.inflight='无';log(t,'演示：独立核验不一致，禁止报告成功');return;}t.verified=true;log(t,'演示：独立核验一致');explain();});});});render();
}
function modelBinding(t) {return JSON.stringify({provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',config:'演示配置未实际生效',purpose:'本轮报告解释',scope:t.scopeRevision,period:t.period,files:t.files,question:t.question,textConsent:t.textConsent});}
function modelRetryAllowed(t) {
  const op=t.modelOp;
  return !!op&&op.status==='failed'&&!op.retryBlocked&&!op.physicalSlot&&t.inflight!=='UNKNOWN'&&op.autoRetries<1&&t.grant&&!t.grantExpired&&!t.stopUnknown&&!t.readOnly&&!t.disconnected&&!['stopped','restarted','completed'].includes(t.stage)&&t.verified&&sourcesQualified(t)&&t.sourceValid&&t.materialsValid&&t.inputValid&&t.configValid&&op.binding===modelBinding(t);
}
function modelPublicationAllowed(t) {
  const op=t.modelOp;
  return !!op&&!op.publishBlocked&&op.epoch===t.epoch&&['explaining','modelUnknown'].includes(t.stage)&&t.grant&&!t.grantExpired&&!t.stopUnknown&&!t.readOnly&&!t.disconnected&&t.verified&&sourcesQualified(t)&&t.sourceValid&&t.materialsValid&&t.inputValid&&t.configValid&&op.binding===modelBinding(t);
}
function finishModelExplanation(t) {
  const op=t.modelOp;if(!op||op.reportId)return;
  op.status='succeeded';op.physicalSlot=false;t.inflight='演示已结算原请求成功；累计使用保留';
  if(!modelPublicationAllowed(t)){op.publishBlocked=true;log(t,'演示：迟到成功只结算原请求；任务已停止或原授权／来源绑定不再有效，不发布报告、不恢复任务');render();return;}
  const r=appendReport(t);op.reportId=r?.id;t.stage='ready';log(t,'演示：读回模型解释成功并生成本轮待审报告；未补发重复请求');render();
}
function automaticModelRetry(t) {
  const op=t.modelOp;
  if(t.stopUnknown||t.stage==='completed')return;
  if(op&&(op.physicalSlot||op.status==='unknown'||t.inflight==='UNKNOWN')){if(!['stopped','restarted'].includes(t.stage))t.stage='modelUnknown';render();return;}
  if(!modelRetryAllowed(t)){if(!['stopped','restarted','completed'].includes(t.stage))t.stage='modelFailed';render();return;}
  op.autoRetries++;op.status='pending';op.physicalSlot=true;t.inflight='演示模型重试处理中';t.stage='explaining';
  log(t,'演示：同一模型操作自动重试 1 / 1；Provider／模型／配置／目的／材料／来源与任务授权不变');
  schedule(t,900,()=>{op.physicalSlot=false;t.inflight='无';if(t.scenario==='modelRetryExhausted'){op.status='failed';t.stage='modelFailed';log(t,'演示：唯一自动重试仍失败，停止自动尝试，等待用户处理');}else finishModelExplanation(t);});
}
function startModelExplanation(t) {
  if(t.modelOp){resumeModelExplanation(t);return;}
  t.modelOp={binding:modelBinding(t),epoch:t.epoch,publishBlocked:false,autoRetries:0,status:'pending',physicalSlot:true,reportId:null,retryBlocked:false};
  t.stage='explaining';t.inflight='演示模型请求处理中';
  log(t,'演示：记录模型解释操作；累计调用／Token／运行时间保留，未知不当作零');
  schedule(t,900,()=>{
    const op=t.modelOp;
    if(t.scenario==='modelRequestUnknown'){op.status='unknown';t.inflight='UNKNOWN';t.stage='modelUnknown';return;}
    op.physicalSlot=false;t.inflight='无';
    if(t.failure==='explanation'){op.status='failed';op.autoRetries=1;t.stage='modelFailed';log(t,'演示旧解释失败快照：自动重试 1 / 1 已用完，核验事实保留');return;}
    if(['modelRetrySuccess','modelRetryExhausted'].includes(t.scenario)){op.status='failed';automaticModelRetry(t);return;}
    finishModelExplanation(t);
  });render();
}
function settleModelRequest(t,outcome) {
  const op=t.modelOp;if(!op||!['unknown','pending'].includes(op.status)||(!op.physicalSlot&&t.inflight!=='UNKNOWN'))return;
  op.physicalSlot=false;t.inflight='演示已读回，原累计使用保留';
  log(t,'演示：先读回并确认原物理槽已释放，没有补发并发请求');
  if(outcome==='success'){finishModelExplanation(t);return;}
  op.status='failed';
  if(['stopped','restarted'].includes(t.stage)){render();return;}
  automaticModelRetry(t);
}
function resumeModelExplanation(t) {
  if(t.stopUnknown||t.stage==='completed')return;
  const op=t.modelOp;if(!op)return;
  if(op.status==='succeeded'){if(!op.reportId&&!op.publishBlocked&&modelPublicationAllowed(t))finishModelExplanation(t);return;}
  if(op.physicalSlot||op.status==='unknown'||t.inflight==='UNKNOWN'){if(!['stopped','restarted'].includes(t.stage))t.stage='modelUnknown';render();return;}
  if(op.autoRetries>=1){t.stage='modelFailed';render();return;}
  // Explicit continuation only revisits the remaining original operation opportunity; it never resets it.
  if(['stopped','restarted'].includes(t.stage))t.stage='explaining';
  automaticModelRetry(t);
}
function stop(t,exit=false) {if(t.stopUnknown)return;t.epoch++;clearTimeout(t.timer);if(busy(t)&&t.inflight!=='无')t.inflight='UNKNOWN';if(t.codeOp){t.codeOp.blocked='已停止，不自动纠正';if(t.codeOp.slot){t.codeOp.status='unknown';t.inflight='UNKNOWN';}}if(t.modelOp){t.modelOp.retryBlocked='stopped';if(t.modelOp.physicalSlot){t.modelOp.status='unknown';t.inflight='UNKNOWN';}}if(t.stage!=='completed'){t.stage='stopped';log(t,'演示：停止新步骤并保留结果；原累计记录及在途 UNKNOWN 保留');}t.closed=exit;inbox=exit;render();}
function periodDialog() {modal('unavailable','首试未开放','<p>报告修改与期间重算仍归 S1；本轮不会发起。原报告和授权保持原范围。</p>');}
function proposedClosure(t,r) {
  const reason=t.scenario==='zeroDenominator'
    ?'对比期有效分母为零，该期复购率及两期率差不可计算。已核验的有效计数与本期复购率只支持有限事实；M1 不验证原因或策略效果，缺少经营方案比较证据。'
    :'M1 仅核实本轮总体复购事实，不验证变化原因或策略效果；本轮没有经营方案的比较证据，不能据此选择经营方案。';
  return {kind:'insufficiency',reason,evidence:[r.id+' 的已核验总体事实', '当前范围 r'+r.scopeRevision+'；方法仅 M1，不包含策略效果验证'],preference:null};
}
function legalClosure(c) {
  return !!c&&c.kind==='insufficiency'&&typeof c.reason==='string'&&!!c.reason.trim()&&Array.isArray(c.evidence)&&c.evidence.length>0&&c.evidence.every(x=>typeof x==='string'&&!!x.trim())&&c.preference===null;
}
function reviewSummary(t,r) {
  if(!r)return '<p>尚无可审阅来源。</p>';
  return `<p>待审报告 v${r.version} · M1 总体比较；${esc(r.fixture.base)} 对比 ${esc(r.fixture.current)}。</p><h3>本轮有效事实与限制</h3><p class="report-body">${esc(r.text)}</p><div class="rule"></div><h3>本轮收束建议与依据</h3>${legalClosure(r.closure)?`<p>${esc(r.closure.reason)}</p><p class="small muted">依据：上方本轮有效事实、已确认两期和仅 M1 的方法边界。没有方案偏好，不构造策略候选。</p>`:'<div class="error-note">有依据的收束内容缺失。保持待审，可保留补证意见；不能确认、完成或追加最终报告。</div>'}<details><summary>查看精确来源</summary><p class="small muted">报告标识：${esc(r.id)}；范围 r${r.scopeRevision}；发现标识：${esc(r.findingId)}。</p>${legalClosure(r.closure)?`<p class="small muted">来源依据：${r.closure.evidence.map(esc).join('；')}。</p>`:''}</details><div class="review-effects">确认的整体效果：接受这个精确来源的限定发现，保存上面的有依据收束，将任务标记完成，并追加新的最终报告；原待审版本保持不变。结束旧任务授权，累计使用保留。不产生正式决定、事前预期或行动授权。${t.scenario==='zeroDenominator'?' 完成的是有限事实与不足的审阅，不代表两期总体比较成功。':''}</div>`;
}
function reviewDialog() {
  const t=task(),r=currentReport(t);if(!t.verified||!r||t.unknown||t.result)return;
  modal('review','由你判断本次分析',reviewSummary(t,r),btn('dismiss','取消')+btn('moreEvidence','保留待补证')+btn('analysisReview','仅确认限定分析','primary',legalClosure(r.closure)?'':'disabled'));
}
function finalReview() {
  const t=task(),r=currentReport(t);if(!t.verified||!r||t.unknown||t.result||t.readOnly||t.disconnected)return;
  t.pendingReview=legalClosure(r.closure)?{reportId:r.id,version:r.version,findingId:r.findingId,scopeRevision:r.scopeRevision,period:t.period,fixture:JSON.stringify(r.fixture),sourceText:r.text,closure:JSON.parse(JSON.stringify(r.closure))}:null;
  modal('analysis','确认有限事实与本轮收束',reviewSummary(t,r),btn('dismiss','取消')+btn('moreEvidence','保留待补证')+btn('submitReview','确认并完成本次审阅','primary',t.pendingReview?'':'disabled'));
}
function validPendingReview(t) {
  const s=t.pendingReview,r=currentReport(t);
  return !!s&&!!r&&t.verified&&!t.result&&!t.readOnly&&!t.disconnected&&!t.stopUnknown&&r.kind!=='final'&&r.id===s.reportId&&r.version===s.version&&r.findingId===s.findingId&&r.scopeRevision===s.scopeRevision&&t.scopeRevision===s.scopeRevision&&t.period===s.period&&JSON.stringify(r.fixture)===s.fixture&&r.text===s.sourceText&&legalClosure(r.closure)&&JSON.stringify(r.closure)===JSON.stringify(s.closure);
}
function completeReview(t,readback=false) {
  if(!validPendingReview(t)||(!readback&&t.unknown)||(readback&&!t.unknown))return false;
  const s=t.pendingReview,source=currentReport(t),version=t.reports.length+1;
  const final={...source,id:`${t.id}-V${version}`,version,kind:'final',sourceReportId:s.reportId,closure:JSON.parse(JSON.stringify(s.closure)),text:'最终报告（合成演示）\n\n本轮确认／收束（已完成的当前效果）\n已接受原待审报告的限定事实，保存证据不足及无方案偏好的收束，完成本次审阅并追加此最终报告。'+s.closure.reason+' 旧任务授权已结束，累计使用保留。不产生正式决定、事前预期或行动授权。\n\n原待审报告原文（保留当时的阶段表述）\n'+s.sourceText};
  const acceptedFinding={id:s.findingId,sourceReportId:s.reportId,scopeRevision:s.scopeRevision};
  const savedClosure={...JSON.parse(JSON.stringify(s.closure)),sourceReportId:s.reportId,findingId:s.findingId};
  // One synchronous in-memory effect, illustrating the existing whole-review semantics only.
  t.acceptedFinding=acceptedFinding;t.savedClosure=savedClosure;t.reports.push(final);t.reportId=final.id;
  t.result={kind:'analysis',reportId:s.reportId,finalReportId:final.id,findingId:s.findingId};t.stage='completed';t.grant=false;t.unknown=false;t.pendingReview=null;
  log(t,readback?'演示读回同一次整体确认：精确发现、合法收束、完成与追加最终报告；未重复提交':'演示整体确认：接受精确发现、保存合法收束、完成并追加最终报告；未产生正式决定');
  return true;
}
function submitReview() {
  const t=task();if(t.unknown||!validPendingReview(t))return;
  if(t.scenario==='unknown'){t.unknown=true;t.stage='submitUnknown';log(t,'演示：同一来源与收束的确认结果未知；禁止重复提交，先读回');dismiss();render();return;}
  if(completeReview(t)){dismiss();render();}
}

function sendComment() {toast('首试仅保留意见，修改与重算仍归 S1。');}
function historyDialog() {const t=task();modal('history','报告版本与对应意见',`${versions(t)}<div class="rule"></div>${t.comments.length?t.comments.map(c=>`<div class="chat-line"><span class="muted small">绑定 ${esc(c.reportId)} · ${c.shared?'已选文本授权':'仅本地意见'}</span><p>${esc(c.text)}</p></div>`).join(''):'<p class="muted small">尚无点评。</p>'}${t.result?`<div class="good-note">演示确认绑定 ${esc(t.result.reportId)} · ${t.result.kind==='choice'?'记录决定':'仅接受分析'}。历史结果不会自动成为新期间的依据。</div>`:''}`); }
function about() {modal('about','UI 合同演示边界','<p>沿用固定对象 d89f7d45 的 Demo v0.2 视觉与布局，仅补 N01/N02 首试可见差异。全部资料、进度、计算、核验、保存和权限为合成状态；无上传、模型、计算器、数据库、持久化或遥测。</p><p>本页刷新全部重置。产品要求的刷新读回、停止保存和重启恢复由审核情境演示，不是已实现的后端能力。</p><p>沿用 Xiaomi Token Plan CN／MiMo 2.6 Pro。单任务累计调用数、累计 Token、累计运行时间暂不设消费上限；使用与未知在途仍逐步记录，可显式停止。同一失败模型操作最多自动重试 1 次，不因重开或单次尝试刷新。单次上下文／输入输出保护、传输超时／取消、授权与来源核验仍保留；到待审／待输入停止，不无限循环。</p><p>模型调用权限等经确认并在产品配置生效后，后续 Change 复用，不重复询问；仅用户明确要求变更才调整。每任务后台仍核验 grant、文字同意、来源绑定与单次有效性。此附件未使真实配置生效；环境有效性与实际首试观察仍待核对；材料按本轮已确认范围后台核验。不是用户 UI Gate PASS、产品接受或工程授权。</p>');}
document.addEventListener('input',e=>{const t=task(),el=e.target;if(t.readOnly||t.disconnected)return;if(el.dataset.bind&&el.type!=='checkbox'&&el.type!=='radio'&&el.tagName!=='SELECT')t[el.dataset.bind]=el.value;if(el.dataset.review){t.review[el.dataset.review]=el.value;const consent=document.getElementById('finalConsent');if(consent)consent.checked=false;}});
document.addEventListener('change',e=>{const t=task(),el=e.target;if(t.readOnly||t.disconnected)return;if(el.dataset.bind){if(el.dataset.bind==='period'){t.period=Number(el.value);t.periodChosen=true;render();}else t[el.dataset.bind]=el.type==='checkbox'?el.checked:el.value;}if(el.dataset.review){t.review[el.dataset.review]=el.value;const consent=document.getElementById('finalConsent');if(consent)consent.checked=false;}});

const auditScenarios = [
 ['mixedSources','表格＋普通文档混合资料'],['sensitiveDocument','普通文档敏感内容阻断'],
 ['isolationRejected','代码隔离策略拒绝'],['unparseable','资料无法解析'],['ocrUncertain','OCR 提取不确定（S1 边界）'],['relationAmbiguous','字段关联真实歧义'],['codeCorrectionSuccess','代码准备：唯一纠正成功'],['codeCorrectionExhausted','代码准备：唯一纠正用尽'],['codeUnknown','本地代码执行未知先读回'],['sourceChanged','资料准备中来源变化'],
 ['normal','正常 M1／上升'],['premise','下降前提未成立／持平'],['zeroDenominator','合格输入／单期零分母'],['missing','缺订单等待'],['empty','两期筛选后无有效行'],
 ['verification','独立核验失败'],['calculation','无法计算'],['explanation','报告解释失败'],['expired','授权失效'],
 ['disconnected','断连只读'],['stopUnknown','停止请求结果未知'],['stopped','已确认停止后重开'],['restarted','服务重启'],['readonly','另页只读'],
 ['download','下载失败'],['unknown','确认结果未知'],['closureMissing','收束内容缺失'],['modelRetrySuccess','模型解释：一次自动重试成功'],['modelRetryExhausted','模型解释：一次重试后仍失败'],['modelRequestUnknown','模型解释：请求未知先读回']
];
function contractContext(t) {
 return `<div class="framework-summary contract-review"><div><strong>关闭网页不是停止</strong><p>已启动任务可在仍有效授权内继续到待审／待输入停止点；累计消费暂不设上限，使用仍记录且可停止；同一模型操作最多自动重试 1 次；刷新／断连只读回。停止或服务重启后不自动续跑。</p><p>当前原型只在本页内存演示，真正刷新会重置；下方审核情境不连接任何服务。</p></div><div class="actions">${btn('scenarios','审核演示情境','quiet')}${btn('refreshRead','演示刷新：只读回','link')}${btn('boundaries','首试与 S1 边界','link')}</div></div>`;
}
function scenarioDialog() {
 modal('scenarios','审核演示：选择合成情境',`<p>仅切换到一个合成任务快照，保留之前的演示任务；这些不是生产功能或真实执行回执。</p><label for="auditScenario">审核情境</label><select id="auditScenario">${auditScenarios.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select>`,btn('dismiss','取消')+btn('loadScenario','载入演示快照','primary'));
}
function loadScenario(id) {
 const t=newTask();project().tasks.unshift(t);taskId=t.id;inbox=false;t.scenario=id;t.question=sampleQuestion;
 t.framework.purpose='verify';t.framework.confirmed=true;t.framework.quick=true;t.periodChosen=true;t.period=id==='premise'?1:0;t.files=[...defaultSources];t.prepared=true;t.stage='authorize';
 if(id==='relationAmbiguous')t.meaningResolved=false;
 if(id==='mixedSources'){t.files.push('brief');t.documentRead=true;}
 if(id==='sensitiveDocument'){t.files.push('brief');t.materialsValid=false;t.stage='preparationBlocked';t.localIssue='普通文档发现敏感个人信息或越界明细，尚未发送模型；可排除此来源，不以扩展名绕过材料边界';}
 if(['unparseable','ocrUncertain'].includes(id)){t.prepared=false;t.stage='preparationBlocked';t.localIssue=id==='unparseable'?'源文件无法解析：本地检查停止，未向模型发送内容':'合成图片读取／OCR 不确定：当前未接通，S1 收口；模型阅读不等于量化核验，不暗换模型';}
 if(['missing','empty'].includes(id)){t.files=id==='missing'?['members']:[...defaultSources];t.prepared=false;t.stage=id==='empty'?'blocked':'needData';}
 if(['verification','calculation','explanation'].includes(id))t.failureNext=id;
 if(['expired','stopped','restarted','disconnected','readonly'].includes(id)){
   t.grant=id!=='expired';t.grantExpired=id==='expired';t.usage='原累计使用记录保留（演示；具体消耗不虚构）';t.inflight='UNKNOWN';
   t.stage=id==='expired'?'stopped':id;t.disconnected=id==='disconnected';t.readOnly=['disconnected','readonly'].includes(id);
 }
 if(id==='stopUnknown'){t.grant=true;t.stopUnknown=true;t.stage='stopUnknown';t.usage='原累计使用记录保留（演示；具体消耗不虚构）';t.inflight='UNKNOWN';}
 if(['zeroDenominator','download','unknown','closureMissing','modelRetrySuccess','modelRetryExhausted','modelRequestUnknown'].includes(id)){t.structureReady=true;t.extractionTrusted=true;t.transformationTrusted=true;t.dataQualified=true;}
 if(id==='zeroDenominator'){t.grant=true;t.verified=true;appendReport(t);t.stage='insufficient';}
 if(['download','unknown','closureMissing'].includes(id)){t.grant=true;t.verified=true;appendReport(t);t.stage=id==='closureMissing'?'closureMissing':'ready';}
 if(['modelRetrySuccess','modelRetryExhausted','modelRequestUnknown'].includes(id)){t.grant=true;t.verified=true;t.usage='原操作累计调用／Token／运行时间记录保留（合成演示）';startModelExplanation(t);}
 log(t,'审核工具载入合成快照：'+auditScenarios.find(s=>s[0]===id)[1]);dismiss();render();
}
function continueTask(t) {
 if(t.stopUnknown)return toast('停止请求结果尚未确认，先读回，不重复停止或继续。');
 if(t.modelOp){resumeModelExplanation(t);return;}
 if(t.codeOp&&!t.dataQualified){resumeCodePreparation(t);return;}
 if(t.stage==='failed')return toast('计算或独立核验失败须修复对应问题；不属于模型自动重试，不通过重跑掩盖。');
 if(t.scenario==='zeroDenominator'){t.stage='insufficient';render();return;}
 if(t.inflight==='UNKNOWN')return toast('先读回在途状态；未知使用不可当作零。');
 if(t.grantExpired||!t.grant){t.stage='authorize';log(t,'任务绑定缺失或失效，先检查已有有效产品配置及来源；不因更换 Change 或尝试重复批准模型权限，累计使用保留');render();return;}
 if(t.verified&&currentReport(t)){t.stage='ready';render();return;}
 run(t,t.verified);
}
function startTextAuthorization(t) {
 modal('textAuthorization','将选定需求用于 AI 梳理（演示）',`<dl class="key-values"><dt>选定文字</dt><dd>${esc(t.question)}</dd><dt>用途</dt><dd>只用于当前会员任务的需求梳理与必要追问；不预设下降。</dd><dt>既有接收方／模型</dt><dd>Xiaomi Token Plan CN／MiMo 2.6 Pro；产品权限生效后跨 Change 复用；本附件仅演示，实际配置尚未生效。</dd><dt>使用与重试</dt><dd>单任务累计调用数、累计 Token、累计运行时间暂不设消费上限；使用与未知在途仍逐步记录，可显式停止。同一失败模型操作最多自动重试 1 次，不因重开或单次尝试刷新。单次上下文／输入输出保护、传输超时／取消、授权与来源核验仍保留；到待审／待输入停止，不无限循环。</dd><dt>产品配置复用</dt><dd>模型调用权限等经确认并在产品配置生效后，后续 Change 复用，不重复询问；仅用户明确要求变更才调整。每任务后台仍核验 grant、文字同意、来源绑定与单次有效性。此附件未使真实配置生效；环境有效性与实际首试观察仍待核对；材料按本轮已确认范围后台核验。</dd><dt>材料边界</dt><dd>仅此段选定文字；CSV／XLSX 原始行、身份值、路径、分组明细不外发。报告阶段可使用授权覆盖的已核验 M1 总体聚合／可信摘要；表格明细和运行原文不自动外发；文档正文／图片须在后续任务材料覆盖内，且通过内容安全检查。</dd></dl><p>未经适用授权，真实产品不得将需求或追问发给模型。演示按钮不授真实权限；本页只使用本地固定规则。</p>`,btn('dismiss','取消，不发送')+btn('allowTextDemo','演示：仅梳理这段需求','primary'));
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const t=task();
 const allowed=['simple','professional','rail','tools','about','dismiss','activity','materials','evidence','scope','reportDetail','history','version','scenarios','loadScenario','refreshRead','reconnect','boundaries','showJourney','showFramework','frameworkHistory','project','task'];
 if((t.readOnly||t.disconnected)&&!allowed.includes(el.dataset.action)){e.stopImmediatePropagation();e.preventDefault();toast('当前只读；未发送任何命令。');}
},true);
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const t=task();
 switch(el.dataset.action){
 case 'simple':case 'professional':mode=el.dataset.action;render();break;
 case 'rail':railOpen=!railOpen;render();break;
 case 'tools':toolsOpen=!toolsOpen;render();break;
 case 'about':about();break;
 case 'dismiss':if(dialogKind==='analysis'||dialogKind==='review')t.pendingReview=null;dismiss();break;
 case 'example':t.question=sampleQuestion;render();break;
 case 'start':if(!t.question.trim())return toast('请先输入业务问题。');if(!/会员|复购/.test(t.question))return toast('本演示只支持会员任务，未调用模型。');startTextAuthorization(t);break;
 case 'allowTextDemo':t.textConsent=true;t.usage='需求文字授权演示已记录，累计记录保留';dismiss();beginDiscovery(t);break;
 case 'data':dataDialog();break;
 case 'addFile':if(t.codeOp||t.modelOp||t.verified||busy(t))return;if(sourceCatalog.some(s=>s.id===el.dataset.file)&&!t.files.includes(el.dataset.file)){t.files.push(el.dataset.file);t.prepared=false;t.dataQualified=false;t.grant=false;t.documentRead=false;}dataDialog();render();break;
 case 'resetQualification':if(t.codeOp||t.modelOp)return;t.scenario='normal';t.files=[];t.prepared=false;t.stage='needData';dataDialog();render();break;
 case 'finishData':dismiss();if(['needData','authorize','clarify'].includes(t.stage)&&hasRequiredSources(t)&&!t.prepared)beginPreparation(t);else render();break;
 case 'confirmPeriod':if(t.periodChosen){t.stage='authorize';render();}break;
 case 'authorize':if(!t.framework.confirmed||!hasRequiredSources(t)||!t.periodChosen||!t.prepared||t.scenario==='empty'||t.codeOp||!t.materialsValid)return;t.grant=true;t.grantExpired=false;continueTask(t);break;
 case 'stop':stop(t);break;
 case 'closeTask':inbox=true;render();break;
 case 'reopen':inbox=false;render();toast('只恢复查看，没有重新发送命令。');break;
 case 'dismissTask':t.stage='needsEvidence';t.note='本次尝试已取消／未采纳，保留待处理；未形成正式决定。';render();break;
 case 'reauthorize':continueTask(t);break;
 case 'readStop':if(!t.stopUnknown)return;t.stopUnknown=false;t.stage='stopped';log(t,'演示读回确认已停止；未重复停止，原累计消耗及在途 UNKNOWN 保留');render();break;
 case 'readUsage':if(t.stopUnknown)return;if(t.codeOp?.slot){settleCodePreparation(t,'failure');break;}if(t.modelOp?.physicalSlot){settleModelRequest(t,'failure');break;}t.inflight='演示读回：无未决在途；原累计记录仍保留';log(t,'读回在途状态，不发起新执行、不清零');render();break;
 case 'retry':continueTask(t);break;
 case 'settleModelFailure':settleModelRequest(t,'failure');break;
 case 'settleModelSuccess':settleModelRequest(t,'success');break;
 case 'modelRecovery':modal('modelRecovery','模型解释恢复条件','<p>同一操作最多自动重试 1 次，记录跨重开／单次尝试保留。先明确失败原因；已用完、停止、授权失效、权限、输入、材料或资格错误不自动重试。原请求未知或仍占槽须先读回。</p><p>人工后续处理仍受现有权限与产品配置约束；此演示不会重新发出请求或刷新次数，已核验事实保留。</p>');break;
 case 'calculationRecovery':modal('calculationRecovery','计算／独立核验失败','<p>保留失败与原证据，先修复数据／计算／核验问题；不属于 Provider 自动重试，也不通过重跑掩盖。保存或人工确认结果未知只能先读回。</p>');break;
 case 'excludeDocument':if(t.scenario!=='sensitiveDocument'||t.grant||t.codeOp)return;t.files=t.files.filter(id=>id!=='brief');t.materialsValid=true;t.documentRead=false;t.scenario='normal';t.localIssue='';t.prepared=false;t.stage='needData';log(t,'演示：排除未外发的敏感文档，再检查剩余来源；没有生成代码执行或纠正记录被重置');beginPreparation(t);break;
 case 'materials':materialsDialog(t);break;
 case 'readCodeFailure':settleCodePreparation(t,'failure');break;
 case 'readCodeSuccess':settleCodePreparation(t,'success');break;
 case 'resolveRelation':{const op=t.codeOp;if(t.scenario!=='relationAmbiguous'||t.meaningResolved||!op||op.status!=='failed'||!codePublicationAllowed(t))return;t.meaningResolved=true;op.status='pending';op.slot=true;op.diagnostic='关联已按必要业务回答澄清；仍沿用原操作';t.stage='generating';log(t,'演示：只确认真实关联歧义，同一操作继续生成代码，未要求逐字段配置');schedule(t,650,()=>{if(!codePublicationAllowed(t))return;op.executionStarted=true;t.stage='transforming';schedule(t,700,()=>finishCodePreparation(t));});render();break;}
 case 'activity':modal('activity','任务记录',timeline(t));break;
 case 'evidence':if(t.verified)modal('evidence','当前报告的总体依据',evidenceTable(t)+'<div class="caution">未计算 M2。模型解释不是独立核验；此处只有合成展示，不能用于工程验收。</div>');break;
 case 'scope':modal('scope','示例业务口径',scopeDetails(t)+'<p>正式口径以现行获准合同为准；此处不创建新的字段或指标规则。</p>');break;
 case 'reportDetail':if(currentReport(t))modal('report','报告全文',`<p class="report-body">${esc(currentReport(t).text)}</p>`);break;
 case 'history':historyDialog();break;
 case 'version':{const r=t.reports.find(x=>x.id===el.dataset.version);if(r)modal('version','历史报告',`<p class="report-body">${esc(r.text)}</p>`);break;}
 case 'saveComment':t.pendingReview=null;if(!t.comment.trim())return toast('请填写待处理意见。');t.comments.push({text:t.comment,reportId:t.reportId,shared:false});t.note=t.comment;t.comment='';t.stage='needsEvidence';log(t,'演示保留意见，未采纳分析、未修改或重算');render();break;
 case 'changeScope':periodDialog();break;
 case 'review':reviewDialog();break;
 case 'analysisReview':finalReview();break;
 case 'submitReview':submitReview();break;
 case 'moreEvidence':t.pendingReview=null;modal('moreEvidence','保留待补证／暂不判断','<label for="evidenceQuestion">待处理意见（可留空表示暂不判断）</label><textarea id="evidenceQuestion"></textarea><p>仅保留意见；不自动取得资料、不开始修改或重算、不形成正式决定。</p>',btn('dismiss','取消')+btn('saveQuestion','保留待审','primary'));break;
 case 'saveQuestion':t.note=document.getElementById('evidenceQuestion').value.trim()||'暂不判断，保留待审';t.stage='needsEvidence';dismiss();render();break;
 case 'backReport':t.stage=t.scenario==='closureMissing'?'closureMissing':t.scenario==='zeroDenominator'?'insufficient':currentReport(t)?'ready':'needData';render();break;
 case 'download':t.download=t.scenario==='download'?'演示：下载失败；后端报告仍保留':'演示：请求下载尚未发出；本机是否落盘未证明，请自行核对';render();modal('download','后端保存与浏览器下载','<p>后端报告演示为已保存且核验；当前原型没有生成或下载文件。</p><p>客户端下载失败／取消不撤销后端报告。只有浏览器实际回执才能报告相应下载结果；请求下载不能证明文件已在磁盘。</p>');break;
 case 'scenarios':scenarioDialog();break;
 case 'loadScenario':loadScenario(document.getElementById('auditScenario').value);break;
 case 'refreshRead':log(t,'演示刷新只读回；没有新建任务或重发命令');render();toast('演示只读回；真实刷新会清空这个离线原型。');break;
 case 'reconnect':t.disconnected=false;t.readOnly=false;t.stage='stopped';log(t,'演示重连读回后端原已停止状态；重连没有发送停止或运行命令，继续仍须检查授权和在途记录');render();break;
 case 'readConfirmation':if(completeReview(t,true))render();else if(t.unknown)toast('待审来源或收束不再匹配；保持结果未知，不重复提交或标记完成。');break;
 case 'boundaries':modal('boundaries','首试与 S1 归属','<p>首试：同机 CSV＋XLSX 多源、结构理解、受控 Python 转换、转换资格、合法两期、M1、独立核验、有据待审报告和整体人审。保留本地项目。</p><p>MD／PDF／DOCX／DOC／PPTX／PPT／常见图片直接读取，可在有效任务材料范围内给模型正文／图片，不强制代码转换；图片／旧 Office 等未接通读取在本批／S1 收口。非表量化明细不自动成为 M1 可信数据。</p><p>S1 后续未开放：M2、完整专业检查、报告修改／期间重算、正式决定／事前预期、Fork／Subagent。保留原有生产成果，当前附件没有删除或接通它们。</p>');break;
 case 'newProject':modal('newProject','新建演示项目','<label for="projectName">项目名称</label><input id="projectName"><p>只存本页内存，不创建文件夹。</p>',btn('dismiss','取消')+btn('createProject','创建演示项目','primary'));break;
 case 'createProject':{const name=document.getElementById('projectName').value.trim();if(!name)return;const p={id:projects.length+1,name,tasks:[newTask()]};projects.push(p);projectId=p.id;taskId=p.tasks[0].id;inbox=false;dismiss();render();break;}
 case 'newTask':{const x=newTask();project().tasks.unshift(x);taskId=x.id;inbox=false;render();break;}
 case 'project':projectId=Number(el.dataset.project);taskId=project().tasks[0].id;inbox=false;render();break;
 case 'task':taskId=el.dataset.task;inbox=false;render();break;
 }
});
render();
