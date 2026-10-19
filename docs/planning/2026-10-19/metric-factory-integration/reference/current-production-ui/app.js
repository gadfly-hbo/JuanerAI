/* A2 移植自评审原型 app.js（视觉/交互层逐字保留；数据层换真实 JSON API，见 api.js）。 */
"use strict";
const $ = (s, root = document) => root.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const copy = x => JSON.parse(JSON.stringify(x));
// sampleNeed / analysisExamples 来自 api.js（产品文案，R2 保留）；baseMetrics/methods/initialTemplates
// 等合成预设已移除——模板与体系数据经 /api/templates、/api/workspace 异步装载。
const state = {route:"home",stage:"overview",systems:[],active:null,homeDraft:sampleNeed,libraryType:"metric",filter:"all",search:"",templates:[],methodTemplates:[],busy:false,importRows:null,importFile:"",importError:"",metricView:"tree",toastTimer:null,llmMode:"none"};
const current = () => state.systems.find(s=>s.id===state.active);
const metricById = id => current()?.metrics.find(m=>m.id===id);
const pendingLabels = s => [...(s.pending.refund===null?["退款归属期间"]:[]),...(s.pending.repeat===null?["复购观察窗口"]:[]),...s.metrics.filter(m=>!m.description.trim()).map(m=>`${m.name}的统计说明`)];
const pendingCount = s => pendingLabels(s).length;
const metricName = id => metricById(id)?.name || "尚未绑定";
const btn = (label,action,cls="",attrs="") => `<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const tag = (label,cls="")=>`<span class="tag ${cls}">${label}</span>`;
let modalReturn = null;
let generateTimer = null;



function routeHash(route){
  // G4：generating 不落深链（刷新回 home 且需求文本经 sessionStorage 恢复；job 服务端照常完成）
  if(route==="generating") return "#home";
  return route==="work"&&state.active ? `#work/${encodeURIComponent(state.active)}/${state.stage}` : `#${route}`;
}
function setRoute(route,stage){state.route=route;if(stage)state.stage=stage;closeMenu();render(false);window.scrollTo({top:0,behavior:"instant"});$("#main").focus({preventScroll:true});const h=routeHash(route);if(location.hash!==h)history.replaceState(null,"",h);/* 仅同步 hash 显示，非 History 深链路由（避免 hashchange 双渲染） */}
function applyHash(){const h=location.hash||"#home";
  if(h.startsWith("#work/")){const parts=h.slice(6).split("/");const id=decodeURIComponent(parts[0]||"");const stage=["overview","metrics","scenes","review"].includes(parts[1])?parts[1]:"overview";if(id)openSystem(id,stage);return;}
  const r=["home","systems","library","generating"].includes(h.slice(1))?h.slice(1):"home";
  state.route=r;render(false);window.scrollTo({top:0,behavior:"instant"});$("#main").focus({preventScroll:true});
}
async function openSystem(id,stage="overview"){
  state.active=id;state.metricView="tree";
  let s=state.systems.find(x=>x.id===id);
  if(!s||!s.blueprint){ // 摘要条目 → 拉取全量 DTO
    try{s=await Api.instance(id);const i=state.systems.findIndex(x=>x.id===id);if(i>=0)state.systems[i]=s;else state.systems.unshift(s);}
    catch(e){toast(String(e.message||e));state.active=null;setRoute("systems");return;}
  }
  state.route="work";state.stage=stage;render(false);window.scrollTo({top:0,behavior:"instant"});$("#main").focus({preventScroll:true});
  try{sessionStorage.removeItem("mf-need");}catch{} // 生成已完成：需求文本生命周期结束（下次冷启动回示例初值）
  const h=routeHash("work");if(location.hash!==h)history.replaceState(null,"",h);
}
function render(preserveScroll=true){
  const y=preserveScroll?window.scrollY:0;
  const s=current();
  $("#system-count").textContent=state.systems.length;
  $("#recent").innerHTML=state.systems.length ? state.systems.slice(0,5).map(x=>`<button class="recent-item ${state.route==="work"&&x.id===state.active?"active":""}" data-action="open-system" data-id="${x.id}">${esc(x.title)}<span>${x.delivered?`已交付 · ${esc(x.delivered.version)}`:"工作草稿"}</span></button>`).join("") : '<p class="fine nav-empty">从一句业务需求开始。</p>';
  document.querySelectorAll(".nav-primary .nav-item").forEach(el=>el.classList.toggle("active",(el.dataset.action==="systems"&&["systems","work"].includes(state.route))||(el.dataset.action==="library"&&state.route==="library")));
  const crumb=state.route==="home"?"开始创建":state.route==="systems"?"我的体系":state.route==="library"?"模板库":state.route==="generating"?"生成草稿":s?.title||"开始创建";
  $("#breadcrumb").innerHTML=`工作空间 <span>/</span> ${esc(crumb)}`;
  $("#main").innerHTML=state.route==="home"?renderHome():state.route==="generating"?renderGenerating():state.route==="systems"?renderSystems():state.route==="library"?renderLibrary():s?renderWork(s):renderHome();
  requestAnimationFrame(()=>window.scrollTo(0,y));
}

function renderHome(){return `<section class="home">
  <div class="eyebrow">从业务需求开始</div>
  <h1>你想弄清什么，或做出什么选择？</h1>
  <p class="home-intro">从一句业务需求开始。AI 帮你组织问题、假设、指标与证据，一起设计怎样形成可信的判断。</p>
  <div class="composer">
    <label for="need">描述你的业务与需求</label>
    <textarea id="need" placeholder="可以是一个经营问题、一项重大选择，或一套想建立的指标体系……">${esc(state.homeDraft)}</textarea>
    <div class="composer-bottom"><span class="fine">先用自己的话说，不必先选择分析类别。<br>${state.llmMode==="configured"?"AI 起草由已配置模型生成，采纳前可预览。":state.llmMode==="faux"?"未配置真实模型，当前为确定性演示模式。":"AI 起草需在设置页配置模型；模板路径不需要模型。"}</span>${btn('生成体系草稿 <span aria-hidden="true">↗</span>',"generate","primary")}</div>
    <p class="inline-error" id="home-error" role="alert" hidden></p>
  </div>
  <div class="home-paths"><span>也可以从已有积累开始</span>${btn('浏览模板库 <span aria-hidden="true">→</span>',"library","small quiet")}<span class="divider"></span>${btn("导入我的指标模板","import","small quiet")}</div>
  <div class="section-label"><h2>试试这样描述</h2><span class="fine">点击填入，随时改写</span></div>
  <div class="starter-list">
    ${analysisExamples.map((example,i)=>`<button class="starter-row" data-action="example" data-index="${i}"><span class="starter-number">0${i+1}</span><div><strong>${esc(example.name)}</strong><p>${esc(example.hint)}</p></div><span class="arrow" aria-hidden="true">↗</span></button>`).join("")}
  </div>
  <div class="home-bottom"><span class="green" aria-hidden="true">◇</span><p class="fine">经营与战略说明服务什么判断，数据分析提供共同的方法和证据能力。指标、研究与业务知识按需要组合，关键假设不会自动变成事实。</p></div>
</section>`;}

function renderGenerating(){return `<section class="busy-block" aria-live="polite" aria-busy="true"><span class="spinner" aria-hidden="true"></span><div class="eyebrow">正在生成</div><h1>正在整理一套可讨论的分析设计</h1><p>梳理业务目的、问题和待验证假设，再组织适用的指标、方法与证据要求。</p><div class="detail-rule">${esc(state.homeDraft)}</div><p class="fine">${state.llmMode==="faux"?"当前为确定性演示模式，不调用真实模型。":"由已配置模型起草。"}未知内容不视为已确认事实。</p><div class="actions" style="margin-top:22px">${btn("停止生成","stop-generation")}</div></section>`;}

function renderSystems(){return `<section class="page"><div class="page-heading"><div><h1>我的分析体系</h1><p>让业务目的、问题、指标、方法与证据共同形成可维护资产。</p></div>${btn("＋ 创建分析体系","home","primary")}</div>${state.systems.length?`<div class="system-list">${state.systems.map(s=>`<div class="system-row"><div class="system-icon" aria-hidden="true">▤</div><div><h2>${esc(s.title)}</h2><p>${s.metricCount??(s.metrics?s.metrics.length:0)} 个指标 · ${s.sceneCount??(s.scenes?s.scenes.length:0)} 个分析场景 · ${esc(s.source)}</p></div><div class="row-end">${tag(s.delivered?`已交付 ${esc(s.delivered.version)}`:"工作草稿",s.delivered?"":"neutral")}${btn("继续编辑 →","open-system","",`data-id="${s.id}"`)}</div></div>`).join("")}</div>`:`<div class="empty-state"><h2>还没有分析体系</h2><p>用一句话描述业务问题或建设需求，或从模板库创建自己的第一套体系。</p><div class="actions" style="margin-top:22px">${btn("描述需求","home","primary")}${btn("从模板开始","library")}</div></div>`}<p class="prototype-note">体系保存在工作区的本地实例文件中，这里自动列出已保存的体系。</p></section>`;}

function renderWork(s){
  const body=state.stage==="overview"?renderOverview(s):state.stage==="metrics"?renderMetrics(s):state.stage==="scenes"?renderScenes(s):renderReview(s);
  return `<div class="work-header"><div class="page-heading"><div><div class="system-title"><h1>${esc(s.title)}</h1>${tag(s.delivered?(s.revision>s.delivered.revision?"有新工作草稿":"已交付版本"):"工作草稿","neutral")}</div><div class="system-meta"><span>${s.metrics.length} 个指标</span><span>${s.scenes.length} 个分析场景</span><span>${s.delivered?`上次交付 ${esc(s.delivered.version)} · 当前可继续编辑`:`${esc(s.source)}`}</span></div></div><div class="actions">${btn("修改名称","rename","small quiet")}${btn("保存工作草稿","save-draft")}</div></div></div>
  <nav class="work-tabs" aria-label="体系工作视图">${[["overview","体系总览"],["metrics","指标体系"],["scenes","场景与方法"],["review","检查与交付"]].map(([key,label],i)=>`<button class="tab ${state.stage===key?"active":""}" ${state.stage===key?'aria-current="page"':""} data-action="stage" data-stage="${key}"><span class="step-number">0${i+1}</span>${label}</button>`).join("")}</nav>
  <div class="work-content"><section class="work-main" aria-label="${state.stage==="overview"?"分析体系总览":state.stage==="metrics"?"指标体系内容":state.stage==="scenes"?"分析场景内容":"设计检查与交付"}">${body}</section>${renderAssistant(s)}</div>`;
}

function renderOverview(s){const b=s.blueprint;return `
  <div class="understanding"><div class="subsection-title"><div class="eyebrow">我理解的业务需求</div>${btn("修正我的理解","edit-understanding","small quiet")}</div><h2>${esc(b.decision)}</h2><p>${esc(b.purpose)}</p><div class="context-row">${b.contexts.map(c=>tag(esc(c))).join("")}${tag(esc(b.intent),"neutral")}</div><p class="fine">语境可组合、可修正；此处是设计建议，不是已核验的业务结论。</p></div>
  <div class="scope-note"><strong>这份设计的边界</strong><p>${esc(b.boundary)}</p></div>
  <section class="subsection"><div class="subsection-title"><h3>把问题拆成可以研究的部分</h3><span class="fine">${b.questions.length} 个问题</span></div><ol class="question-outline">${b.questions.map((q,i)=>`<li><span class="number">${i+1}</span><div><strong>${esc(q.title)}</strong><p>${esc(q.detail)}</p>${q.metricRefs.length?`<div class="binding-chips">${q.metricRefs.map(id=>`<button class="binding-chip" data-action="metric" data-id="${id}">${esc(metricName(id))} ↗</button>`).join("")}</div>`:'<span class="fine">结合研究与业务证据，按需补充量化衡量。</span>'}</div></li>`).join("")}</ol></section>
  <section class="subsection"><div class="subsection-title"><h3>需要检验的关键假设</h3>${btn("查看判断边界","claim-boundaries","small quiet")}</div><div class="hypothesis-list">${b.hypotheses.map((h,i)=>`<article class="hypothesis"><div class="hypothesis-head"><span class="fine">H${i+1}</span>${tag(esc(h.kind),"warn")}</div><h4>${esc(h.text)}</h4><div class="hypothesis-evidence"><div><span>寻找支持</span><p>${esc(h.support)||"尚未定义"}</p></div><div><span>寻找反证</span><p>${esc(h.counter)||"尚未定义"}</p></div></div><p class="change-condition"><strong>何时改变判断</strong> ${esc(h.change)||"尚未定义"}</p><div class="actions">${btn("完善检验条件","edit-hypothesis","small quiet",`data-index="${i}"`)}${btn("查看证据能否支持判断","verify-claim","small quiet",`data-index="${i}"`)}</div></article>`).join("")}</div></section>
  ${b.options.length?`<section class="subsection"><div class="subsection-title"><h3>要比较的候选道路</h3><span class="fine">尚未选择或批准投入</span></div><div class="option-list">${b.options.map(o=>`<div><strong>${esc(o.name)}</strong><p>${esc(o.tradeoff)}</p></div>`).join("")}</div></section>`:""}
  <section class="subsection"><div class="subsection-title"><h3>怎样展开调查</h3>${btn("调整调查方式","edit-organization","small quiet")}</div><div class="context-row">${b.organizations.map(o=>tag(esc(o),"neutral")).join("")}</div><p class="note">调查方式与管理目的分开。同一种专业方法可以服务经营、战略或独立数据专题。</p><div class="capability-strip"><span>共享专业能力</span><p>数据分析 · 研究与访谈 · 业务判断 · 证据核验</p></div></section>
  ${renderEvidencePlan(s)}
  <section class="subsection"><div class="subsection-title"><h3>最终需要形成什么</h3></div><p class="output-description">${esc(b.deliverable)}</p><p class="note">${esc(b.judgmentRule)} 实际决策、资源批准与行动执行另由获授权负责人承担。</p></section>
  <div class="section-end"><span class="fine">${s.metrics.length?`${s.metrics.length} 个指标与问题通过引用联动。`:"当前允许先完成定性设计，再按需补充指标。"}</span>${btn(s.metrics.length?"查看关联指标 →":"查看场景与方法 →","stage","primary",`data-stage="${s.metrics.length?"metrics":"scenes"}"`)}</div>`;}

function renderEvidencePlan(s){return `<section class="subsection"><div class="subsection-title"><h3>需要怎样的证据</h3><span class="fine">计划完整 ≠ 已取得证据</span></div><div class="evidence-plan">${s.blueprint.evidence.map((e,i)=>`<article class="evidence-row"><div class="evidence-title"><strong>${esc(e.name)}</strong>${tag(esc(e.status),"neutral")}</div><p class="evidence-type">${esc(e.kind)}</p><dl><dt>来源</dt><dd>${esc(e.source)||'<span class="missing">尚未说明来源</span>'}</dd><dt>怎样核对</dt><dd>${esc(e.check)||'<span class="missing">尚未定义核验办法</span>'}</dd><dt>不足时</dt><dd>${esc(e.failure)||'<span class="missing">尚未定义不足处置</span>'}</dd></dl>${btn("编辑证据要求","edit-evidence","small quiet",`data-index="${i}"`)}</article>`).join("")}</div></section>`;}

function renderMetrics(s){
  if(!s.metrics.length)return `<div class="empty-state"><div class="eyebrow">指标按问题需要组织</div><h2>先明确判断依据，指标可以随后补充</h2><p>这项战略设计先比较客户价值、竞争方式和能力条件。没有合适的量化定义时，可以保存设计草稿，不必为了填满指标表而编造数值。</p><div class="actions" style="margin-top:22px">${btn("补充量化衡量建议","add-metric","primary")}${btn("回到分析框架","stage","",'data-stage="overview"')}</div></div><p class="note">指标仍是核心可维护资产；需要量化时，可创建指标或从指标模板开始。</p>`;
  const pending=pendingCount(s);
  let groups=[...new Set(s.metrics.map(m=>m.group))];
  return `<div class="objective"><div class="objective-label">这套体系要帮助你</div><p>${esc(s.goal)}</p></div>
  ${pending?`<div class="status-notice"><div><strong>有 ${pending} 个关键口径待确认</strong><p>可以先完善草稿，交付前再集中确认。</p></div>${btn("查看并确认","resolve","small")}</div>`:`<div class="status-notice good"><div><strong>关键业务口径已确认</strong><p>你仍可继续修改，受影响内容会重新标为待确认。</p></div>${btn("查看口径","resolve","small")}</div>`}
  <div class="summary-line"><h2>核心指标结构</h2><div class="view-switch" aria-label="指标展示方式"><button class="${state.metricView==="tree"?"active":""}" data-action="metric-view" data-view="tree" aria-pressed="${state.metricView==="tree"}">结构</button><button class="${state.metricView==="list"?"active":""}" data-action="metric-view" data-view="list" aria-pressed="${state.metricView==="list"}">清单</button></div>${btn("＋ 添加指标","add-metric","small quiet")}</div>
  ${state.metricView==="tree"?`<div class="tree-root"><small>${s.blueprint.contexts.includes("独立数据专题")?"研究用途":"业务用途"}</small><h3>${esc(s.blueprint.decision)}</h3>${tag("点击指标可看解释")}</div><div class="metric-groups">${groups.map(group=>`<section class="metric-group"><div class="group-head">${esc(group)}<span>${s.metrics.filter(m=>m.group===group).length} 项</span></div>${s.metrics.filter(m=>m.group===group).map(m=>metricCard(s,m)).join("")}</section>`).join("")}</div>`:renderMetricTable(s)}
  <div class="section-end"><span class="fine">指标定义只维护一份，场景通过引用使用。</span>${btn('继续设计分析场景 <span aria-hidden="true">→</span>',"stage","primary",'data-stage="scenes"')}</div>`;
}
function metricCard(s,m){return `<button class="metric-card ${m.id==="net_sales"?"selected":""}" data-action="metric" data-id="${m.id}"><strong>${esc(m.name)}</strong>${m.pending&&s.pending[m.pending]===null?'<span class="pending-dot" aria-label="口径待确认"></span>':""}<p>${esc(m.formula)}</p>${m.id==="net_sales"?'<span class="metric-foot">经营结果 · 元</span>':""}</button>`;}
function renderMetricTable(s){return `<div class="table-scroll" role="region" aria-label="指标清单" tabindex="0"><table><thead><tr><th>指标</th><th>业务解释</th><th>计算关系</th></tr></thead><tbody>${s.metrics.map(m=>`<tr><td><button class="link" data-action="metric" data-id="${m.id}">${esc(m.name)}</button><span class="fine">${esc(m.group)} · ${esc(m.unit)}</span></td><td>${esc(m.description)||"待补充统计说明"}</td><td>${esc(m.formula)}</td></tr>`).join("")}</tbody></table></div>`;}

function renderAssistant(s){
  const b=s.blueprint,isOverview=state.stage==="overview",isScene=state.stage==="scenes",isReview=state.stage==="review";
  const intro=isOverview?"先检查我是否理解了你的目的。问题、假设、指标和证据会组成同一份设计，关键假设仍需支持与反对证据。":isReview?"这里检查设计是否完整。证据计划写清楚，不等于已取得证据；实际分析与业务判断尚未发生。":isScene?"方法可以服务不同管理目的。我会按当前问题说明适用条件、证据要求和指标角色。":"指标定义只维护一份，再关联到问题与方法。没有合适量化定义时，可以先保留研究设计。";
  const suggestions=isOverview?(b.contexts.includes("战略选择")?["补充经营落点","把客户访谈加到证据计划","说明什么证据会推翻假设"]:b.contexts.includes("独立数据专题")?["说明因果判断还缺什么","把客户访谈加到证据计划","说明什么证据会推翻假设"]:["补充战略视角","把客户访谈加到证据计划","说明什么证据会推翻假设"]):isScene?["补充证据不足时的处理","说明方法的适用条件"]:isReview?["哪些内容还需要我确认？","设计通过代表结论成立吗？"]:b.preset==="metrics"?["退款按完成时间归属","增加退款金额占比","只保留销售与退款指标"]:["查看问题与指标的关联","补充证据不足时的处理"];
  return `<aside class="assistant" aria-label="AI 共创助手"><div class="assistant-head"><span class="assistant-spark" aria-hidden="true">✧</span><h2>一起完善</h2><span class="meta-right">AI 助手</span></div><div class="assistant-label">${isOverview?"围绕问题设计分析":isReview?"检查设计，不预判结果":isScene?"组合方法与证据":"让指标服务问题"}</div><div class="assistant-message"><p>${intro}</p></div>${s.chat.slice(-2).map(m=>`<div class="assistant-message ${m.role==="user"?"user":""}">${esc(m.text)}</div>`).join("")}${s.proposal?renderProposal(s):`<div class="suggestion-list">${suggestions.map(text=>`<button class="suggestion" data-action="suggest" data-text="${esc(text)}">${esc(text)} <span aria-hidden="true">↗</span></button>`).join("")}</div>`}<div class="assistant-compose"><label for="refine">用自然语言说说你想怎么改</label><textarea id="refine" placeholder="例如：这还涉及增长方向，帮我补上需要验证的假设。"></textarea><div class="assistant-send"><span class="fine">先看建议，再采纳到同一设计</span>${btn("发送 ↑","refine","primary small")}</div></div><p class="note">${state.llmMode==="faux"?"当前为确定性演示模式，不调用真实模型。":"AI 建议由已配置模型生成，采纳前可预览。"}</p></aside>`;
}

function renderProposal(s){const p=s.proposal;return `<div class="delta"><h3>修改建议 · ${esc(p.title)}</h3><p class="fine">${esc(p.description)}</p><div class="delta-row"><span class="old">${esc(p.before)}</span><span class="next">${esc(p.after)}</span></div><p class="fine">${esc(p.impact)}</p><div class="actions">${btn("采纳修改","apply-proposal","primary small")}${btn("放弃","discard-proposal","small quiet")}</div></div>`;}

function renderScenes(s){
  const b=s.blueprint,recommended=state.methodTemplates.filter(m=>!m.contexts||m.contexts.some(c=>b.contexts.includes(c)));
  if(!s.scenes.length)return `<div class="empty-state"><div class="eyebrow">把分析框架落到具体场景</div><h2>这次要怎样研究这个问题？</h2><p>方法、证据要求与指标角色共同形成场景。可以从当前框架生成，也可以使用方法模板。</p><div class="composer scene-composer"><label for="scene-need">分析场景需求</label><textarea id="scene-need">${esc(b.decision)}</textarea><div class="composer-bottom"><span class="fine">沿用总览中的业务目的和证据要求。</span>${btn("生成分析场景 ↗","generate-scene","primary")}</div></div></div><div class="method-hints"><h3>可参考的方法模板</h3>${recommended.slice(0,3).map(m=>`<div class="hint-row"><div><strong>${esc(m.name)}</strong><p>${esc(m.description)}</p></div>${btn("预览","preview-template","small",`data-id="${m.id}" data-type="method"`)}</div>`).join("")}</div>`;
  const scene=s.scenes[s.sceneIndex||0];
  return `<div class="scene-switch">${s.scenes.map((x,i)=>`<button class="scene-pill" data-action="select-scene" data-index="${i}" aria-pressed="${(s.sceneIndex||0)===i}">${esc(x.name)}</button>`).join("")}${btn("＋ 新增场景","new-scene","small quiet")}</div><div class="scene-heading"><div><h2>${esc(scene.name)}</h2><p>${esc(scene.purpose)}</p></div><div class="actions">${btn("存为方法模板","save-method-template","small")}</div></div><div class="summary-line">${tag("场景草稿","neutral")}${b.contexts.map(c=>tag(esc(c))).join("")}<span class="fine">${esc(scene.family||"描述分解")} · 设计方法</span></div><section class="subsection"><div class="subsection-title"><h3>准备怎么分析</h3>${btn("修改分析步骤","edit-scene","small quiet")}</div><ol class="step-list">${scene.steps.map((step,i)=>`<li><span class="number">${i+1}</span><div><strong>${esc(step.title)}</strong><p>${esc(step.detail)}</p></div></li>`).join("")}</ol></section><section class="subsection"><div class="subsection-title"><h3>指标怎样参与</h3>${scene.bindings.length?btn("调整绑定","bindings","small quiet"):""}</div>${scene.bindings.length?`<div class="bindings">${scene.bindings.map(binding=>`<div class="binding-row"><span class="binding-role">${esc(binding.role)}</span><div class="binding-chips">${binding.metric?`<button class="binding-chip" data-action="metric" data-id="${binding.metric}">${esc(metricName(binding.metric))} ↗</button>`:tag("尚未绑定","warn")}</div></div>`).join("")}</div>`:'<p class="output-description">此方法可以先比较定性证据与关键假设，不强制绑定量化指标。需要衡量时，再补充明确的指标定义。</p>'}<div class="actions" style="margin-top:15px">${btn(s.metrics.length?"缺少指标？用一句话添加":"补充量化衡量建议","add-metric","small quiet",'data-bind="true"')}</div></section><section class="subsection"><div class="subsection-title"><h3>方法适用性与判断边界</h3></div><p class="output-description">${esc(scene.limit||"只说明计算和描述性变化；缺少合格研究设计时，不形成因果结论。")}</p><p class="note">${esc(scene.evidence||"结合当前体系的证据计划，明确适用来源与核验办法。")}</p></section>${renderEvidencePlan(s)}<div class="section-end"><span class="fine">设计引用、实际证据和运行采用分别表达。</span>${btn("检查并准备交付 →","stage","primary",'data-stage="review"')}</div>`;
}

function renderReview(s){
  const pending=pendingCount(s),missing=missingRequiredBindings(s).length,framework=blueprintIssues(s),metricIssues=prototypeMetricIssues(s),methodIssues=sceneDesignIssues(s),ready=s.engineReady!==undefined?s.engineReady:designReady(s),b=s.blueprint;
  const reviewPending=s.reviewPending||[];
  return `${s.delivered?`<div class="published"><div class="success-icon" aria-hidden="true">✓</div><h2>设计版本已生成</h2><p>业务目的、问题、假设、指标、方法和证据要求已固定为设计快照。它不证明分析结论成立。</p><dl><dt>设计版本</dt><dd>${esc(s.delivered.version)}</dd><dt>实际证据</dt><dd>待获取，未执行分析或消费验证</dd></dl><div class="actions">${s.metrics.length?btn("保存指标体系模板","save-metric-template","primary"):btn("保存分析方法模板","save-method-template","primary")}${btn("下载设计包","download")}</div><p class="fine" style="margin-top:10px">更多格式：<a href="/api/instances/${encodeURIComponent(s.id)}/export/metricflow" download>MetricFlow</a> · <a href="/api/instances/${encodeURIComponent(s.id)}/export/excel" download>Excel 字典</a> · <a href="/api/instances/${encodeURIComponent(s.id)}/export/mermaid" download>Mermaid 树</a></p></div>`:""}<div class="check-intro"><div class="eyebrow">设计检查</div><h2>${ready?"这份分析设计已准备好交付":"把用途、证据和业务判断连接完整"}</h2><p>检查设计是否可供后续分析使用。证据尚待获取，不代表结论、因果或经营效果已验证。</p></div><div class="checks">
  ${checkRow(!framework.length,"问题、假设与证据计划",framework.length?framework.map(esc).join(" "):`${b.questions.length} 个问题、${b.hypotheses.length} 个待验证假设；已说明支持、反证与不足处置。`,"查看框架","stage",'data-stage="overview"')}
  ${checkRow(!metricIssues.length,"指标定义与计算关系",metricIssues.length?metricIssues.map(esc).join(" "):s.metrics.length?`${s.metrics.length} 个指标，依赖闭合；真实口径与数据资格另行核验。`:"本次先交付定性研究设计；没有强制补造量化指标。","查看指标","stage",'data-stage="metrics"')}
  ${checkRow(!pending,"需要你确认的业务口径",pending?`${pending} 个待确认项：${pendingLabels(s).map(esc).join("、")}`:"本次设计范围内的指标口径与说明已记录。",pending?"去确认":"查看","resolve")}
  ${checkRow(!missing&&!methodIssues.length&&(s.scenes.length>0||s.metricOnly),"方法、指标角色与适用条件",methodIssues.length?methodIssues.map(esc).join(" "):missing?`${missing} 项必需指标角色尚未绑定。`:s.scenes.length?`${s.scenes.length} 个场景；${s.metrics.length?"引用当前指标定义":"采用定性研究与假设检验设计"}。`:"尚未创建场景，也可以明确只交付指标体系。","查看方法","stage",'data-stage="scenes"')}
  ${checkRow(s.confirmed,"当前设计的业务复核",s.confirmed?"已复核设计；修改相关内容后，确认会失效。":"确认目的、方法与证据要求符合用途，不是确认假设已被证实。",s.confirmed?"已确认":"查看并确认","confirm-business")}
  ${reviewPending.length?`<div class="check-row"><span class="check-icon warn" aria-label="待处理">!</span><div><strong>待人工审核的 AI 指标（${reviewPending.length} 项）</strong><p>${reviewPending.map(m=>`${esc(m.display)}（${esc(m.name)}）`).join("、")}——未经人工审核的 AI 指标阻断交付。</p><div class="actions" style="margin-top:8px">${reviewPending.map(m=>`${btn(`批准 ${m.display}`,"approve-metric","small quiet",`data-id="${m.name}"`)}${btn("拒绝","reject-metric","small quiet",`data-id="${m.name}"`)}`).join("")}</div></div><span class="fine">审核动作立即落盘</span></div>`:""}</div>
  ${!s.scenes.length&&s.metrics.length?`<label class="check-option"><input type="checkbox" id="metric-only" ${s.metricOnly?"checked":""}>本次先交付指标体系，分析场景以后补充</label>`:""}<div class="scope-note evidence-boundary"><strong>设计通过，不提升任何业务结论</strong><p>当前证据均为“待获取”，所有假设仍为“待验证”。${b.contexts.includes("战略选择")?"战略设计不能从短期下滑直接判定方向失败。":b.contexts.includes("独立数据专题")?"相关差异不能自动升级为活动的因果效果。":"方案建议不等于资源批准、行动执行或改善已发生。"}</p></div><div class="delivery-box"><h3>${ready?"固定一个可供后续分析使用的设计版本":"补齐设计缺口后，即可生成版本"}</h3><p>发布为不可变设计快照并登记版本（releases/）；内容未变时拒绝重复发版。运行能力、交换格式采用状态需由工程与消费方分别核对。</p><div class="actions">${btn(s.delivered?"生成下一版本":"生成设计版本","deliver","primary",ready?"":"disabled aria-describedby=\"delivery-reason\"")}${btn("保存工作草稿","save-draft")}</div>${ready?"":'<p class="fine" id="delivery-reason" style="margin-top:10px">先处理上方设计缺口、必要绑定与口径，再完成业务复核。</p>'}</div>`;
}

function checkRow(ok,title,detail,label,action,attrs=""){return `<div class="check-row"><span class="check-icon ${ok?"":"warn"}" aria-label="${ok?"已检查":"待处理"}">${ok?"✓":"!"}</span><div><strong>${title}</strong><p>${detail}</p></div>${btn(label,action,"small quiet",attrs)}</div>`;}
function readyFlag(){const s=current();return s?s.engineReady!==undefined?s.engineReady:designReady(s):false;}

function libraryItems(){const arr=state.libraryType==="metric"?state.templates:state.methodTemplates;return arr.filter(t=>(state.filter!=="mine"||t.source==="我的模板")&&(!state.search||(t.name+t.description+(t.contexts||[]).join("")+(t.family||"")).includes(state.search)));}
function templateCard(t){const meta=t.type==="metric"?`${t.customMetrics?.length||t.metricIds.length} 个指标${t.scenes?.length?` · 含 ${t.scenes.length} 个场景`:""}`:t.roles.length?`${t.roles.length} 类指标角色 · 复用时重新匹配`:"定性证据与假设比较 · 指标按需补充";
  return `<article class="template-card"><div class="template-icon" aria-hidden="true">${t.type==="metric"?"▤":"≋"}</div><h2>${esc(t.name)}</h2><p>${esc(t.description)}</p>${t.type==="method"?`<div class="method-contexts">${(t.contexts||["经营改善","战略选择"]).map(c=>tag(esc(c),"neutral")).join("")}</div><p class="fine">${esc(t.family||"描述分析")} · 方法可服务多个语境</p>`:""}<div class="template-meta"><span>${meta}</span>${t.incomplete?tag("草稿模板","warn"):""}</div><div class="actions"><span class="template-origin">${esc(t.source)}</span>${btn("预览与使用 →","preview-template","small quiet",`data-id="${t.id}" data-type="${t.type}"`)}</div></article>`;}
function renderLibrary(){const list=libraryItems();return `<section class="page"><div class="page-heading"><div><h1>模板库</h1><p>把有效的指标与分析方法积累下来，下一次从这里开始。</p></div>${btn("＋ 导入模板","import")}</div>
  <nav class="library-tabs" aria-label="模板类别"><button class="tab ${state.libraryType==="metric"?"active":""}" data-action="library-tab" data-type="metric" aria-current="${state.libraryType==="metric"?"page":"false"}">指标体系</button><button class="tab ${state.libraryType==="method"?"active":""}" data-action="library-tab" data-type="method" aria-current="${state.libraryType==="method"?"page":"false"}">分析方法</button></nav>
  <div class="library-toolbar"><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">搜索模板</span><input id="template-search" type="search" placeholder="${state.libraryType==="metric"?"搜索指标体系或业务场景":"搜索分析问题或方法"}" value="${esc(state.search)}"></label><div class="filter-chips" aria-label="模板来源"><button class="${state.filter==="all"?"active":""}" aria-pressed="${state.filter==="all"}" data-action="library-filter" data-filter="all">全部模板</button><button class="${state.filter==="mine"?"active":""}" aria-pressed="${state.filter==="mine"}" data-action="library-filter" data-filter="mine">我的模板</button></div><span class="fine" id="template-total">${list.length} 个模板</span></div>
  <div class="template-grid" id="template-grid">${renderTemplateGrid(list)}</div><p class="library-foot">${state.libraryType==="metric"?"基于模板创建自己的副本，原模板保持不变。你也可以把完成的体系存回“我的模板”。":"方法模板保留分析步骤与指标角色。用于新体系时，会重新匹配指标，不复制原体系的指标定义。"}<br>内置模板来自 templates/ 目录；导入与另存的模板出现在「我的模板」。</p></section>`;}
function renderTemplateGrid(list){return list.length?list.map(templateCard).join(""):`<div class="empty-library"><h2>${state.filter==="mine"?"还没有自己的模板":"没有匹配的模板"}</h2><p>${state.filter==="mine"?"导入已有资料，或把完成的体系与分析方法保存到这里。":"换一个关键词试试。"}</p>${btn("导入模板","import","primary")}</div>`;}

function markDesignChanged(s){s.confirmed=false;s.revision++;}
function showUnderstanding(){const b=current().blueprint;showModal("修正我对需求的理解","不改变你已维护的指标；经营与战略语境可同时保留。",`
  <div class="field"><label for="analysis-purpose">这份设计要帮助什么</label><textarea id="analysis-purpose" required>${esc(b.purpose)}</textarea></div>
  <div class="field"><label for="analysis-decision">当前要研究的问题或选择</label><textarea id="analysis-decision" required>${esc(b.decision)}</textarea></div>
  <fieldset class="plain-fieldset"><legend>相关任务语境（可多选）</legend>${["经营改善","战略选择","独立数据专题"].map(c=>`<label><input type="checkbox" data-context="${c}" ${b.contexts.includes(c)?"checked":""}>${c}</label>`).join("")}</fieldset>
  <div class="field"><label for="analysis-boundary">需要保留的边界</label><textarea id="analysis-boundary">${esc(b.boundary)}</textarea></div>
  <div class="field"><label for="analysis-output">预期形成什么设计交付</label><textarea id="analysis-output">${esc(b.deliverable)}</textarea></div>`,btn("取消","close-modal")+btn("更新分析框架","save-understanding","primary"));}

function showHypothesis(index){const h=current().blueprint.hypotheses[index];showModal("完善假设的检验条件","支持和反对证据都要考虑。保存设计不会证实这个假设。",`
  <div class="field"><label for="hypothesis-text">待验证判断</label><textarea id="hypothesis-text" required>${esc(h.text)}</textarea></div>
  <div class="field"><label for="hypothesis-support">寻找什么支持证据</label><textarea id="hypothesis-support">${esc(h.support)}</textarea></div>
  <div class="field"><label for="hypothesis-counter">寻找什么反对证据或替代解释</label><textarea id="hypothesis-counter">${esc(h.counter)}</textarea></div>
  <div class="field"><label for="hypothesis-change">什么条件下改变判断</label><textarea id="hypothesis-change">${esc(h.change)}</textarea></div><p class="note">草稿可暂留缺口，设计检查会指出尚未补齐的条件。</p>`,btn("取消","close-modal")+btn("保存检验条件","save-hypothesis","primary",`data-index="${index}"`));}

function showEvidence(index){const e=current().blueprint.evidence[index];showModal("编辑证据要求",`${esc(e.name)} · 当前状态：待获取`,`
  <div class="field"><label for="evidence-source">准备从哪里获得依据</label><textarea id="evidence-source">${esc(e.source)}</textarea></div>
  <div class="field"><label for="evidence-check">怎样核对它是否可靠、适用</label><textarea id="evidence-check">${esc(e.check)}</textarea></div>
  <div class="field"><label for="evidence-failure">证据不足、冲突或核验失败时怎样处理</label><textarea id="evidence-failure">${esc(e.failure)}</textarea></div><p class="note">这里保存的是证据计划，不上传资料，不标记为已核验。缺口可保留在草稿中。</p>`,btn("取消","close-modal")+btn("保存证据要求","save-evidence","primary",`data-index="${index}"`));}

function showClaimBoundaries(){showModal("区分事实、解释、假设与建议","管理语境、证据强弱和判断性质是不同维度。",`<dl class="detail-grid"><dt>事实</dt><dd>观察到且具有可复核来源的内容；当前无真实业务事实核验。</dd><dt>解释</dt><dd>对事实的解释，需说明依据、替代解释及适用限制。</dd><dt>假设</dt><dd>仍待检验的判断，保留支持、反对证据与修正条件。</dd><dt>建议</dt><dd>在明确条件下提出的方案，不等于已决策、已执行或有效。</dd></dl><div class="detail-rule warn">计算分解正确不自动证明因果；进入经营会议或获得高层认可也不会提升证据强度。</div>`,btn("理解了","close-modal","primary"));}

function showVerifyClaim(index){const b=current().blueprint,h=b.hypotheses[index];showModal("暂不能确认这个判断",esc(h.text),`<p>当前只定义了怎样检验，尚未取得并核验真实证据。</p><ul class="requirements">${b.evidence.map(e=>`<li>${esc(e.name)}：${esc(e.status)}</li>`).join("")}</ul><div class="detail-rule warn">仍保留“待验证假设”。保存设计、切换经营／战略语境或业务复核，都不能把它升级成事实或因果结论。</div>`,btn("返回完善证据计划","close-modal","primary"));}

function showOrganization(){const b=current().blueprint;showModal("调整调查怎样展开","同一任务可结合多种方式，不改变业务目的或证据强度。",`<fieldset class="plain-fieldset"><legend>计划采用的调查方式</legend>${["假设先行","深度研究","自主探索"].map(o=>`<label><input type="checkbox" data-organization="${o}" ${b.organizations.includes(o)?"checked":""}>${o}</label>`).join("")}</fieldset><p class="note">这里维护专业设计，不会启动 Agent、研究任务或模型调用。</p>`,btn("取消","close-modal")+btn("保存调查方式","save-organization","primary"));}

function metricCandidate(s){
  if(s.blueprint.preset==="strategy")return {name:"单店贡献利润",text:"补充单店贡献利润，明确收入和可避免成本，不直接把它当成扩店决策结论。",metrics:[{id:"store_revenue",name:"单店收入",group:"量化验证",description:"同一门店、期间与收入确认范围内的收入。",formula:"门店合格收入相加",unit:"元"},{id:"store_avoidable_cost",name:"单店可避免成本",group:"量化验证",description:"同一范围内，若该店停止经营便可以避免的成本，固定分摊项另行披露。",formula:"明确范围内可避免成本相加",unit:"元"},{id:"store_contribution",name:"单店贡献利润",group:"量化验证",description:"以明确口径的单店收入扣除可避免成本；不单独决定店型是否应扩张。",formula:"单店收入 − 单店可避免成本",unit:"元",dependencies:["store_revenue","store_avoidable_cost"]}]};
  if(s.blueprint.preset==="operating")return {name:"经营费用率",text:"增加经营费用率，观察同一范围下费用与收入的关系。",metrics:[{id:"expense_ratio",name:"经营费用率",group:"质量与约束",description:"同一范围、期间的经营费用占收入的比例，从组成项重算。",formula:"经营费用 ÷ 收入",unit:"%",dependencies:["operating_expenses","revenue"]}]};
  if(s.blueprint.preset==="data")return {name:"活动前支付订单数",text:"增加活动前30天的支付订单数，用于检查客户原本活跃度的差异。",metrics:[{id:"pre_activity_orders",name:"活动前支付订单数",group:"研究控制",description:"以活动起点为基准，向前30天内成功支付的订单按订单号去重。",formula:"活动前30天合格订单去重计数",unit:"单",note:"30天是此合成设计的明确建议，业务复核后方可交付；不等于已取得数据。"}]};
  return {name:"退款金额占比",text:"增加退款金额占成交总额的比例，和订单退款率分开看。",metrics:[{id:"refund_amount_share",name:"退款金额占比",group:"经营风险",description:"同一期间、范围内，退款金额占成交总额的比例，区分金额影响与订单队列比例。",formula:"退款额 ÷ 成交总额",unit:"%",dependencies:["refund_amount","gmv"]}]};
}

function toast(text){const el=$("#toast");el.textContent=text;el.hidden=false;clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{el.hidden=true;},4200);}
function showModal(title,sub,body,foot="",extra=""){
  const modal=$("#modal");modalReturn=document.activeElement;
  $("#modal-content").innerHTML=`<div class="modal-head"><div><h2 id="modal-title">${title}</h2>${sub?`<p class="fine">${sub}</p>`:""}</div><button class="icon-button" data-action="close-modal" aria-label="关闭对话框">×</button></div><div class="modal-body">${body}<p class="inline-error" id="modal-error" role="alert" hidden></p></div>${foot?`<div class="modal-foot">${foot}</div>`:""}${extra}`;
  if(!modal.open)modal.showModal();
}
function closeModal(){const modal=$("#modal");if(modal.open)modal.close();if(modalReturn?.isConnected)modalReturn.focus({preventScroll:true});else $("#main").focus({preventScroll:true});}
function modalError(text){const el=$("#modal-error");if(el){el.textContent=text;el.hidden=false;document.querySelectorAll('#modal [required]').forEach(input=>{if(!input.value.trim()){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','modal-error');}});const group=$('#modal fieldset');if(group)group.setAttribute('aria-describedby','modal-error');}}
function closeMenu(){$("#sidebar").classList.remove("open");$(".mobile-backdrop")?.remove();}

function showMetric(id){const s=current(),m=metricById(id);if(!m)return;
  const referenced=s.scenes.filter(sc=>sc.bindings.some(b=>b.metric===m.id));
  showModal(esc(m.name),"指标解释 · 当前体系只维护这一份定义",`
  <dl class="detail-grid"><dt>业务分组</dt><dd>${esc(m.group)}</dd><dt>衡量什么</dt><dd>${esc(m.description)||"统计说明待补充"}</dd><dt>怎么算</dt><dd>${esc(m.formula)}</dd><dt>单位</dt><dd>${esc(m.unit)}</dd><dt>观察范围</dt><dd>按当前问题约定对象、期间与比较粒度；比率按同范围分子分母重算，真实数据资格另需核验。</dd></dl>
  ${m.note?`<div class="detail-rule">${esc(m.note)}</div>`:""}
  ${m.pending&&s.pending[m.pending]===null?`<div class="detail-rule warn">${m.pending==="refund"?"退款归属期间尚未确认，暂按建议形成草稿。":"复购观察窗口尚未确认，不能把建议当作已定口径。"} ${btn("去确认","resolve","small quiet")}</div>`:""}
  <div class="field"><label for="metric-name">指标名称</label><input id="metric-name" value="${esc(m.name)}"></div>
  <div class="field"><label for="metric-description">用业务语言解释这个指标</label><textarea id="metric-description">${esc(m.description)}</textarea><p class="fine">可以直接改名称和说明。修改计算关系时，可交给 AI 先提出建议。</p></div>
  <p class="fine">${referenced.length?`被 ${referenced.length} 个场景引用：${referenced.map(sc=>esc(sc.name)).join("、")}`:"还没有场景引用这个指标。"}</p>
  <details><summary>来源与专业详情</summary><p>来源：${esc(s.source)}。指标定义与出处随实例维护；不代表真实业务确认或运行验证。指标角色保存在场景绑定中，不在这里复制第二份口径。</p></details>`,
  btn("移除指标","delete-metric","small quiet",`data-id="${m.id}"`)+btn("取消","close-modal")+btn("保存修改","save-metric","primary",`data-id="${m.id}"`));
}

function showResolve(){const s=current();if(!s)return;const hasRefund="refund" in s.pending,hasRepeat="repeat" in s.pending;
  showModal("确认关键业务口径","这些判断会影响结果，集中确认一次即可。",`
  ${hasRefund?`<div class="resolve-item"><h3>退款金额归属哪个期间？</h3><p>按支付期间看订单最终净额；按退款完成期间看当期发生的退款影响。它不改变支付队列退款率。</p><label class="sr-only" for="refund-choice">退款金额归属</label><select id="refund-choice"><option value="payment" ${s.pending.refund==="payment"?"selected":""}>按订单支付期间归属</option><option value="completion" ${s.pending.refund==="completion"?"selected":""}>按退款完成期间归属</option></select></div>`:""}
  ${hasRepeat?`<div class="resolve-item"><h3>复购观察多长时间？</h3><p>建议用 90 天作为讨论起点，并保持复购客户与支付客户来自同一队列。</p><label class="sr-only" for="repeat-choice">复购观察窗口</label><select id="repeat-choice"><option value="90" ${s.pending.repeat==="90"?"selected":""}>90 天观察窗口</option><option value="30" ${s.pending.repeat==="30"?"selected":""}>30 天观察窗口</option><option value="180" ${s.pending.repeat==="180"?"selected":""}>180 天观察窗口</option></select></div>`:""}
  ${s.metrics.filter(m=>!m.description.trim()).map(m=>`<div class="resolve-item"><h3>${esc(m.name)}：统计说明待补充</h3><p>请用自己的话说明它衡量什么、统计范围是什么。不确定时可以先保留草稿。</p><label class="sr-only" for="missing-${m.id}">${esc(m.name)}的统计说明</label><textarea id="missing-${m.id}" data-missing-description="${m.id}" style="width:100%;min-height:90px;border:1px solid var(--line);border-radius:7px;padding:10px"></textarea></div>`).join("")}
  ${!hasRefund&&!hasRepeat&&!s.metrics.some(m=>!m.description.trim())?'<p>此体系没有待确认口径。</p>':""}
  <p class="note">这是有业务含义的集中确认。正式系统应允许用自然语言补充其他口径，而非限制为上述选项。</p>`,btn("稍后再说","close-modal")+btn("确认这些口径","save-resolve","primary"));
}

function showBindings(){const s=current(),sc=s?.scenes[s.sceneIndex||0];if(!sc)return;
  showModal("场景与指标绑定",`${esc(sc.name)} · 引用当前体系，不复制定义`,sc.bindings.map((b,i)=>`<div class="binding-edit-row"><label for="binding-${i}">${esc(b.role)}</label><select id="binding-${i}" data-binding-index="${i}"><option value="">尚未绑定</option>${s.metrics.map(m=>`<option value="${m.id}" ${m.id===b.metric?"selected":""}>${esc(m.name)}</option>`).join("")}</select></div>`).join("")+`<p class="note">相同名称也可能口径不同，先看解释再绑定。缺少必需指标时可以先保留场景草稿。</p>${btn("＋ 缺少指标，新增并绑定","add-metric","small quiet",'data-bind="true"')}`,btn("取消","close-modal")+btn("保存绑定","save-bindings","primary"));
}

function addMetricModal(bind=false){const c=metricCandidate(current());showModal("用一句话添加指标",bind?"新指标先进入当前体系，再关联到分析场景。":"说清你想衡量的业务含义即可。",`
  <div class="field"><label for="new-metric-need">你希望增加什么指标？</label><textarea id="new-metric-need" required>${esc(c.text)}</textarea></div>
  <div class="detail-rule"><strong>候选参考：${esc(c.name)}</strong><ul>${c.metrics.map(m=>`<li>${esc(m.name)}：${esc(m.formula)}</li>`).join("")}</ul></div><p class="fine">${state.llmMode==="faux"?"未配置真实模型时为确定性演示候选。":"AI 按你的描述生成候选，先看建议再采纳。"}依赖项一起检查，不以补充指标代替业务判断。</p>`,btn("取消","close-modal")+btn(bind?"加入体系并绑定":"加入指标体系","create-metric","primary",`data-bind="${bind}"`));}



function getTemplate(id,type){return (type==="method"?state.methodTemplates:state.templates).find(t=>t.id===id);}
function previewTemplate(id,type){const t=getTemplate(id,type);if(!t)return;
  const metrics=t.customMetrics||[];
  showModal(esc(t.name),`${esc(t.source)} · ${type==="metric"?"指标体系模板":"分析方法模板"}`,`
  <p>${esc(t.description)}</p>${type==="metric"?`<h3>包含的指标</h3><div class="item-list">${metrics.map(m=>`<span>${esc(m.name)}</span>`).join("")}</div><p class="note">创建自己的副本后可自由修改，不影响这个模板。${t.incomplete?"此模板存在缺失说明，使用后仍需补齐才能交付。":"关键业务口径会在新体系中重新确认。"}</p>`:`<dl class="detail-grid"><dt>适合回答</dt><dd>${esc(t.purpose)}</dd><dt>适用语境</dt><dd>${(t.contexts||["经营改善","战略选择"]).map(esc).join("、")}</dd><dt>专业方法</dt><dd>${esc(t.family||"描述分解")}</dd><dt>分析步骤</dt><dd>${t.steps.map(x=>esc(typeof x==="string"?x:x.title)).join(" → ")}</dd><dt>指标角色</dt><dd>${t.roles.length?t.roles.map(esc).join("、"):"先使用定性证据，量化指标按需补充"}</dd><dt>证据要求</dt><dd>${esc(t.evidence||"同范围的记录与核验依据")}</dd><dt>适用限制</dt><dd>${esc(t.limit||"设计引用成立不代表执行能力已接通。")}</dd></dl>${current()?`<div class="detail-rule">当前体系：${esc(current().title)}<br>${t.contexts?.length&&!current().blueprint.contexts.some(c=>t.contexts.includes(c))?"当前用途不在适用语境中，不能直接使用此方法。":!t.roles.length?"可先使用定性研究与假设比较，不强制绑定指标。":t.metricIds.filter(id=>!current().metrics.some(m=>m.id===id)).length?"部分指标角色未找到精确匹配，添加后需要补充绑定。":"所需指标已找到匹配建议，使用后可逐项查看和调整。"}</div>`:'<div class="detail-rule warn">先创建或打开一套分析体系，再把方法用于其中。</div>'}`}`,
  btn("返回","close-modal")+(type==="metric"?btn("基于模板创建体系","use-template","primary",`data-id="${t.id}" data-type="metric"`):btn("用于当前分析体系","use-template","primary",`data-id="${t.id}" data-type="method" ${current()?"":"disabled"}`)));
}

function saveTemplateModal(type){const s=current();if(!s)return;const sc=s.scenes[s.sceneIndex||0];
  if(type==="method"&&!sc)return;
  const name=type==="metric"?s.title:sc.name;
  showModal(type==="metric"?"把这套体系保存为模板":"保存为可复用分析方法",type==="metric"?"保留专业定义，方便下次创建自己的副本。":"保留方法步骤与指标角色，下次重新匹配指标。",`
  <div class="field"><label for="template-name">模板名称</label><input id="template-name" value="${esc(name)}"></div><div class="field"><label for="template-purpose">适用业务或问题</label><textarea id="template-purpose">${esc(type==="metric"?s.goal:sc.purpose)}</textarea></div>
  ${type==="metric"&&s.scenes.length?`<label class="check-option"><input type="checkbox" id="include-scenes" checked>包含已设计的分析场景与方法引用</label>`:""}
  <p class="note">${type==="metric"?"不包含原始业务数据、某次文件绑定或分析数值。":"指标绑定将转换为角色要求，不创建第二份指标定义。"} 保存到“我的模板”，不会覆盖同名模板。</p>`,btn("取消","close-modal")+btn("保存到我的模板","commit-template","primary",`data-type="${type}"`));
}

function showImport(){state.importRows=null;state.importFile="";state.importError="";
  showModal("导入自己的指标模板","先识别和预览，再保存到模板库。",`
  <div class="dropzone"><strong>选择已有指标资料</strong><p>可以使用从 Excel 导出的 CSV 指标表，先预览，再确认。</p><label class="sr-only" for="import-file">选择本地模板文件</label><input id="import-file" type="file" accept=".csv,.json"><p class="fine" style="margin-top:12px">文件仅在当前浏览器预览，不会上传。<br>Excel 可先导出为 CSV 再导入；文件只在浏览器解析预览。</p></div>
  <div class="or-line">暂时没有文件？</div><div class="actions" style="justify-content:center">${btn("填入示例指标表","demo-import")}</div>
  <div id="import-preview"></div>`,btn("取消","close-modal")+btn("确认导入模板","commit-import","primary","disabled id=\"commit-import\""));
}

function parseCsv(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
  if(quoted)throw new Error("文件中有未闭合的引号，请检查 CSV 格式。");
  if(cell||row.length){row.push(cell);if(row.some(v=>v.trim()))rows.push(row);}
  return rows;
}
function importObjects(text,filename){let entries;
  if(filename.toLowerCase().endsWith(".json")){const parsed=JSON.parse(text);entries=Array.isArray(parsed)?parsed:parsed.metrics;if(!Array.isArray(entries))throw new Error("没有找到可识别的指标列表。请使用指标数组，或包含 metrics 的 JSON 文件。");}
  else {const rows=parseCsv(text.replace(/^\uFEFF/,""));if(rows.length<2)throw new Error("文件中没有可预览的指标行。");const headers=rows.shift().map(v=>v.trim());entries=rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]||""])));}
  const normalized=entries.map((m,i)=>({id:`imported-${i}`,imported:true,name:String(m["指标名称"]||m["名称"]||m.display_name||m.name||"").trim(),description:String(m["业务口径"]||m["统计说明"]||m["口径"]||m.definition||m.description||"").trim(),group:String(m["分组"]||m.group||"导入指标").trim(),formula:String(m["计算关系"]||m.formula||"计算关系待检查").trim(),unit:String(m["单位"]||m.unit||"待确认").trim()}));
  if(!normalized.length||normalized.some(m=>!m.name))throw new Error("有指标缺少名称。请保留“指标名称”或 name 列后重试。");
  const names=new Set();for(const m of normalized){if(names.has(m.name))throw new Error(`“${m.name}”出现重复，请区分或合并后重新导入；当前输入已保留。`);names.add(m.name);}
  return normalized;
}
function renderImportPreview(){const rows=state.importRows;if(!rows)return;const missing=rows.filter(m=>!m.description).length;
  $("#import-preview").innerHTML=`<section class="import-preview"><p class="import-filename">${esc(state.importFile)}</p><h3>已识别 ${rows.length} 个指标</h3><div class="status-notice ${missing?"":"good"}"><div><strong>${missing?`${missing} 项缺少业务口径，先保存为草稿模板`:"名称与业务口径已识别，可保存为模板草稿"}</strong><p>这里只做导入预览，不代表计算与业务正确性已通过。</p></div></div><div class="table-scroll" role="region" aria-label="导入指标预览" tabindex="0"><table><thead><tr><th>指标名称</th><th>识别到的业务口径</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.description)||tag("待补充口径","warn")}</td></tr>`).join("")}</tbody></table></div><div class="field" style="margin-top:18px"><label for="import-name">保存到模板库的名称</label><input id="import-name" value="${esc(state.importFile.replace(/\.[^.]+$/,""))}"></div></section>`;
  $("#commit-import").disabled=false;
}

function showAbout(){showModal("自然语言驱动的分析体系工作台","本地工作台 · 真实引擎校验与落盘",`
  <p>把自然语言需求变成分析设计。经营与战略是管理语境，数据分析是共享专业能力；也允许独立数据专题。</p>
  <div class="about-flow"><div><strong>01</strong><span>描述要研究的问题或要做的选择，无需先选类别或模板。</span></div><div><strong>02</strong><span>在体系总览维护问题、假设、反证与改变判断的条件。</span></div><div><strong>03</strong><span>指标体系和场景方法联动；定性战略设计可以暂时没有指标。</span></div><div><strong>04</strong><span>固定设计版本，保留实际证据待获取状态，按需沉淀两类模板。</span></div></div>
  <a class="proposal-link" href="/docs/guide" target="_blank" rel="noopener">阅读工作台使用指南与验收范围 ↗</a>
  <p class="note">所有写操作经引擎校验（校验不过零写盘），体系保存在本地实例文件。模型可在设置页配置；未配置时为确定性演示模式。发布产物进入 releases/ 版本登记。</p>`,btn("开始体验","close-modal","primary"));}

async function requestRefine(text){
  const s=current();if(!s)return;
  if(!text.trim()){toast("先说说希望怎样修改。");return;}
  s.chat.push({role:"user",text});
  if(state.stage==="review"&&/[？?吗]|确认/.test(text)){
    s.chat.push({role:"assistant",text:pendingCount(s)||blueprintIssues(s).length?"左侧会指出口径、假设或证据计划缺口。设计复核只确认设计可用，不证明任何业务结论。":"设计通过表示目的、方法、引用和证据要求已写清。当前证据仍待获取，假设未证实，也没有实际决策或执行。"});render();return;
  }
  // A2 T7：真实 refine job（faux/已配置模型）→ 提案卡「先看建议再采纳」
  s.chat.push({role:"assistant",text:"正在生成修改建议……"});render();
  try{
    const {jobId}=await Api.createRefineJob(s.id,text);
    let job=null;
    for(let i=0;i<200;i++){
      job=await Api.job(jobId).catch(()=>null);
      if(!job||job.status!=="running")break;
      await new Promise(r=>setTimeout(r,1500));
    }
    if(!job||job.status!=="done"){s.chat.push({role:"assistant",text:"建议生成未完成（模型输出未通过校验），工作稿没有变化。"});render();return;}
    const proposal=await Api.refineProposal(s.id).catch(()=>null);
    if(!proposal){s.chat.push({role:"assistant",text:"没有形成可展示的建议，工作稿没有变化。"});render();return;}
    s.chat.pop();s.chat.pop();s.chat.push({role:"assistant",text:`建议已生成：${proposal.after}。请在右侧查看并决定采纳或放弃。`});
    s.proposal={...proposal,systemId:s.id};render();
  }catch(e){
    s.chat.push({role:"assistant",text:`建议生成失败：${String(e&&e.message||e)}。工作稿没有变化。`});render();
  }
}




// A2 T5：写后刷新（拉取最新 DTO 替换工作区条目）与写失败就地呈现（demo modal-error 语汇）
async function refreshSystem(){
  if(!state.active)return;
  try{
    const fresh=await Api.instance(state.active);
    const i=state.systems.findIndex(x=>x.id===state.active);
    if(i>=0)state.systems[i]=fresh;else state.systems.unshift(fresh);
  }catch(e){toast("刷新体系数据失败，可重新打开该体系。");}
}
function apiModalError(e){
  const msg=(e&&e.payload&&Array.isArray(e.payload.errors)&&e.payload.errors.length)?e.payload.errors.join("\n"):String((e&&e.message)||e);
  modalError(msg.split("\n").slice(0,4).join("；"));
}

async function handleAction(action,el){
  const s=current();
  switch(action){
    case "home":setRoute("home");break;
    case "systems":setRoute("systems");break;
    case "library":setRoute("library");break;
    case "open-system":openSystem(el.dataset.id);break;
    case "stage":state.stage=el.dataset.stage;closeModal();render(false);window.scrollTo({top:0,behavior:"instant"});{const h=routeHash("work");if(location.hash!==h)history.replaceState(null,"",h);}break;
    case "metric-view":state.metricView=el.dataset.view;render();break;
    case "menu":{
      const sidebar=$("#sidebar");sidebar.classList.toggle("open");if(sidebar.classList.contains("open")){const back=document.createElement("button");back.className="mobile-backdrop show";back.setAttribute("aria-label","关闭导航");back.dataset.action="close-menu";document.body.append(back);}else closeMenu();break;
    }
    case "close-menu":closeMenu();break;
    case "about":showAbout();break;
    case "close-modal":closeModal();break;
    case "example":{
      const n=Number(el.dataset.index);
      state.homeDraft=analysisExamples[n].text;
      $("#need").value=state.homeDraft;$("#need").focus();break;
    }
    case "generate":{
      const text=$("#need").value.trim();state.homeDraft=text;
      try{sessionStorage.setItem("mf-need",text);}catch{} // G4：刷新后需求保留
      if(!text){const err=$("#home-error");err.textContent="先写一点业务需求，几个字也可以。";err.hidden=false;$("#need").focus();break;}
      setRoute("generating");state.busy=true;
      // A2 T3（G1/G4）：POST create-job → 轮询 → 完成自动落盘进 work；停止=离开轮询（服务端照常完成，G4）
      void Api.createJob(text).then(({jobId})=>{
        const timer=setInterval(async()=>{
          const job=await Api.job(jobId).catch(()=>null);
          if(!state.busy||state.route!=="generating"){clearInterval(timer);return;} // 已停止/离开
          if(!job)return;
          if(job.status==="done"&&job.instanceId){
            clearInterval(timer);state.busy=false;
            const ws=await Api.workspace().catch(()=>null);
            if(ws)state.systems=ws.systems;
            await openSystem(job.instanceId,"overview");
          }else if(job.status==="error"){
            clearInterval(timer);state.busy=false;
            toast(`生成未完成：${job.error||"模型输出未通过校验"}。需求文本已保留。`);
            setRoute("home");
          }
        },1500);
        generateTimer=timer;
      }).catch(e=>{state.busy=false;setRoute("home");toast(`生成未能启动：${String(e&&e.message||e)}。需求文本已保留。`);});
      break;
    }
    case "stop-generation":{ // G4：客户端离开轮询；服务端任务照常完成（产物不丢，出现在「我的体系」）
      if(generateTimer)clearInterval(generateTimer);
      state.busy=false;setRoute("home");toast("生成已停止，原需求仍保留。");break;
    }
    case "save-draft":toast("工作草稿已保存。");break;
    case "rename":showModal("修改体系名称","名称帮助你找到这套体系。",`<div class="field"><label for="system-name">体系名称</label><input id="system-name" value="${esc(s.title)}"></div>`,btn("取消","close-modal")+btn("保存名称","save-name","primary"));break;
    case "save-name":{const title=$("#system-name").value.trim();if(!title){modalError("请填写体系名称。");break;}
      try{await Api.patchBlueprint(s.id,{title});s.title=title;closeModal();render();}catch(e){apiModalError(e);}break;}
    case "edit-understanding":showUnderstanding();break;
    case "save-understanding":{
      const purpose=$("#analysis-purpose").value.trim(),decision=$("#analysis-decision").value.trim(),contexts=[...document.querySelectorAll('[data-context]:checked')].map(x=>x.dataset.context);
      if(!purpose||!decision||!contexts.length){modalError("请说明目的、要支持的判断，并至少保留一个适用语境。");break;}
      try{await Api.patchBlueprint(s.id,{purpose,decision,contexts,boundary:$("#analysis-boundary").value.trim(),deliverable:$("#analysis-output").value.trim()});await refreshSystem();closeModal();render();}catch(e){apiModalError(e);}break;
    }
    case "edit-hypothesis":showHypothesis(Number(el.dataset.index));break;
    case "save-hypothesis":{
      const h=s.blueprint.hypotheses[Number(el.dataset.index)],text=$("#hypothesis-text").value.trim();if(!text){modalError("请写下要检验的判断。");break;}
      try{await Api.patchHypothesis(s.id,h.id,{text,support:$("#hypothesis-support").value.trim(),counter:$("#hypothesis-counter").value.trim(),change:$("#hypothesis-change").value.trim()});await refreshSystem();closeModal();render();}catch(e){apiModalError(e);}break;
    }
    case "edit-evidence":showEvidence(Number(el.dataset.index));break;
    case "save-evidence":{
      const e0=s.blueprint.evidence[Number(el.dataset.index)];
      try{await Api.patchEvidence(s.id,e0.id,{source:$("#evidence-source").value.trim(),check:$("#evidence-check").value.trim(),failure:$("#evidence-failure").value.trim()});await refreshSystem();closeModal();render();}catch(e){apiModalError(e);}break;
    }
    case "claim-boundaries":showClaimBoundaries();break;
    case "verify-claim":showVerifyClaim(Number(el.dataset.index));break;
    case "edit-organization":showOrganization();break;
    case "save-organization":{
      const organizations=[...document.querySelectorAll('[data-organization]:checked')].map(x=>x.dataset.organization);if(!organizations.length){modalError("请至少保留一种调查方式。");break;}
      try{await Api.patchBlueprint(s.id,{organizations});await refreshSystem();closeModal();render();}catch(e){apiModalError(e);}break;
    }
    case "metric":showMetric(el.dataset.id);break;
    case "save-metric":{
      const m=metricById(el.dataset.id),name=$("#metric-name").value.trim(),description=$("#metric-description").value.trim();
      if(!name||!description){modalError("名称和业务解释需要填写完整；你的输入已保留。");break;}
      if(s.metrics.some(x=>x.id!==m.id&&x.name===name)){modalError("已有同名指标，请先区分业务含义。");break;}
      try{await Api.patchMetric(s.id,m.id,{name,description});await refreshSystem();closeModal();render();toast("指标已修改，相关业务复核需要重新确认。");}catch(e){apiModalError(e);}break;
    }
    case "delete-metric":{
      // A2 T5：依赖保护走引擎六路引用（findMetricReferences 真值；合成依赖表移除）
      try{
        const impact=await Api.deleteMetricIntent(s.id,el.dataset.id);
        if(impact.blocked){
          showModal("这个指标仍被使用",`${esc(metricById(el.dataset.id)?.name||el.dataset.id)} · 需要先处理引用`, `<p>直接移除会使下面的计算、问题或场景失去依据。当前指标没有删除。</p><div class="item-list">${impact.references.map(r=>`<span>${esc(r)}</span>`).join("")}</div>`,btn("保留并返回","close-modal","primary"));
          break;
        }
      }catch(e){apiModalError(e);break;}
      showModal("移除这个指标？",esc(metricById(el.dataset.id)?.name||el.dataset.id),"<p>它会从当前工作草稿移除。已交付旧版本仍然保留。</p>",btn("取消","close-modal")+btn("从草稿移除","commit-delete","primary",`data-id="${el.dataset.id}"`));break;
    }
    case "commit-delete":{
      try{await Api.deleteMetric(s.id,el.dataset.id);await refreshSystem();closeModal();render();toast("已从工作稿移除。");}catch(e){apiModalError(e);}break;
    }
    case "resolve":showResolve();break;
    case "save-resolve":{
      const body={};
      if($("#refund-choice"))body.refund=$("#refund-choice").value==="payment";
      if($("#repeat-choice"))body.repeat=$("#repeat-choice").value;
      const descriptions={};document.querySelectorAll('[data-missing-description]').forEach(input=>{if(input.value.trim())descriptions[input.dataset.missingDescription]=input.value.trim();});
      if(Object.keys(descriptions).length)body.descriptions=descriptions;
      try{await Api.resolve(s.id,body);await refreshSystem();closeModal();render();toast("关键口径已记录，业务复核仍需查看当前草稿。");}catch(e){apiModalError(e);}break;
    }
    case "suggest":requestRefine(el.dataset.text);break;
    case "refine":requestRefine($("#refine").value);break;
    case "apply-proposal":{
      try{
        await Api.applyRefine(s.id);
        await refreshSystem();
        s.chat.push({role:"assistant",text:"已采纳修改建议。修改已进入同一工作稿；相关业务复核已标为待确认。"});
        s.proposal=null;render();toast("修改建议已采纳到工作稿。");
      }catch(e){apiModalError(e);}
      break;
    }
    case "discard-proposal":{
      try{await Api.discardRefine(s.id);}catch{}
      s.proposal=null;s.chat.push({role:"assistant",text:"已放弃这项修改建议，工作稿没有变化。"});render();break;
    }
    case "add-metric":addMetricModal(el.dataset.bind==="true");break;
    case "create-metric":{
      const need=$("#new-metric-need").value.trim();
      if(!need){modalError("先描述希望增加的指标。");break;}
      // A2：新增指标走 AI 建议流（先看建议再采纳——不直接写稿；faux 模式候选语汇见弹层）
      closeModal();state.stage="overview";render();
      requestRefine(`增加指标：${need}${el.dataset.bind==="true"?"（并关联到当前分析场景）":""}`);
      break;
    }
    case "generate-scene":{
      const need=($("#scene-new-need")||$("#scene-need"))?.value.trim();if(!need){toast("先描述这个场景要回答的问题。");break;}
      try{ // T7：方法模板选用流（demo 合成生成=模板套用同构；走推荐方法或首个）
        const b=s.blueprint,recommended=state.methodTemplates.filter(m=>!m.contexts||m.contexts.some(c=>b.contexts.includes(c)));
        const method=recommended[0]||state.methodTemplates[0];
        await Api.createScene(s.id,method.id,need);
        await refreshSystem();
        closeModal();state.stage="scenes";render();toast("分析场景草稿已生成，可以调整步骤与指标绑定。");
      }catch(e){apiModalError(e);}
      break;
    }
    case "new-scene":showModal("新增分析场景","沿用当前分析体系，按问题组织方法与证据。",`<div class="field"><label for="scene-new-need">希望分析什么问题？</label><textarea id="scene-new-need">${esc(s.blueprint.decision)}</textarea></div>`,btn("取消","close-modal")+btn("生成场景草稿","generate-scene","primary"));break;
    case "select-scene":s.sceneIndex=Number(el.dataset.index);render();break;
    case "bindings":showBindings();break;
    case "save-bindings":{
      const sc=s.scenes[s.sceneIndex||0];
      const bindings=[...document.querySelectorAll("[data-binding-index]")].map(select=>({role:sc.bindings[Number(select.dataset.bindingIndex)].role,metric:select.value})).filter(b=>b.metric);
      try{await Api.patchBindings(s.id,sc.id,bindings);await refreshSystem();closeModal();render();toast(sc.bindings.length>bindings.length?"场景草稿已保存，未绑定项会在检查时提示。":"场景绑定已保存，引用当前体系的指标。");}catch(e){apiModalError(e);}break;
    }
    case "edit-scene":{
      const sc=s.scenes[s.sceneIndex||0];showModal("修改分析场景","用业务语言编辑，指标绑定保持独立可查。",`<div class="field"><label for="scene-name">场景名称</label><input id="scene-name" value="${esc(sc.name)}"></div><div class="field"><label for="scene-purpose">它要回答什么问题？</label><textarea id="scene-purpose">${esc(sc.purpose)}</textarea></div><div class="field"><label for="scene-steps">分析步骤（每行一个，用自己的话写）</label><textarea id="scene-steps" rows="5">${esc(sc.steps.map(x=>x.title).join("\n"))}</textarea></div>`,btn("取消","close-modal")+btn("保存场景","save-scene","primary"));break;
    }
    case "save-scene":{
      const sc=s.scenes[s.sceneIndex||0],name=$("#scene-name").value.trim(),purpose=$("#scene-purpose").value.trim(),steps=$("#scene-steps").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!name||!purpose||!steps.length){modalError("请填写场景名称、业务问题和至少一个分析步骤。");break;}
      const stepsChanged=steps.join("\n")!==sc.steps.map(x=>x.title).join("\n");
      if(stepsChanged){ // G8：步骤属方法模板——改步骤=沉淀新方法，场景指向它（引用不复制）
        try{
          const saved=await Api.saveAsMethod(s.id,sc.id,{name:`${name} · 方法`,purpose,steps});
          await Api.patchScene(s.id,sc.id,{purpose});
          await refreshSystem();closeModal();render();toast(`分析步骤已另存为新方法（${saved.id}@${saved.version}），场景改为引用该方法。`);
        }catch(e){apiModalError(e);}break;
      }
      try{await Api.patchScene(s.id,sc.id,{purpose});await refreshSystem();closeModal();render();toast("场景草稿已保存，未绑定项会在检查时提示。");}catch(e){apiModalError(e);}break;
    }
    case "library-tab":state.libraryType=el.dataset.type;state.search="";state.filter="all";render();break;
    case "library-filter":state.filter=el.dataset.filter;render();break;
    case "preview-template":previewTemplate(el.dataset.id,el.dataset.type);break;
    case "use-template":{
      const t=getTemplate(el.dataset.id,el.dataset.type);if(!t)break;
      try{
        if(t.type==="metric"){
          const created=t.source==="我的模板"
            ? await Api.createFromUserTemplate(t.id)
            : await Api.createFromTemplate(t.id);
          const ws=await Api.workspace().catch(()=>null);
          if(ws)state.systems=ws.systems;
          await openSystem(created.instanceId,"metrics");
          closeModal();
          toast("已创建自己的体系副本，原模板保持不变。");
        }else{
          if(!s)break;
          if(t.contexts?.length&&!s.blueprint.contexts.some(c=>t.contexts.includes(c))){modalError("此方法的适用语境与当前体系不符。请先回体系总览核对用途，或选择其他方法；没有自动修改体系。");break;}
          await Api.createScene(s.id,t.id,t.purpose);
          await refreshSystem();
          closeModal();state.stage="scenes";render();
          toast("方法已形成当前体系中的场景，请查看匹配与绑定。");
        }
      }catch(e){apiModalError(e);}
      break;
    }
    case "save-method-template":saveTemplateModal("method");break;
    case "save-metric-template":if(!s.delivered){toast("先完成设计检查并生成交付版本。");break;}saveTemplateModal("metric");break;
    case "commit-template":{
      const type=el.dataset.type,name=$("#template-name").value.trim(),description=$("#template-purpose").value.trim();if(!name||!description){modalError("请填写模板名称和适用问题。");break;}
      try{
        if(type==="metric"){
          // U1-a：另存指标模板 → templates/user/（宽松装载；不覆盖同名——服务端 id 唯一化）
          const rows=current().metrics.map(m=>({name:m.name,description:m.description,group:m.group,formula:m.formula,unit:m.unit}));
          await Api.saveUserTemplate({name,purpose:description,rows});
        }else{
          const sc=current().scenes[current().sceneIndex||0];
          const steps=sc.steps.map(x=>x.title);
          const saved=await Api.saveAsMethod(current().id,sc.id,{name,purpose:sc.purpose,steps});
          await refreshSystem();
          void saved;
        }
        closeModal();state.libraryType=type==="metric"?"metric":"method";state.filter="mine";state.search="";
        const tpl=await Api.templates().catch(()=>null);
        if(tpl){state.templates=tpl.templates;state.methodTemplates=tpl.methodTemplates;}
        setRoute("library");toast("已加入我的模板，原有同名内容不会覆盖。");
      }catch(e){apiModalError(e);}
      break;
    }
    case "import":showImport();break;
    case "demo-import":{
      state.importFile="示例经营指标.csv";state.importRows=importObjects("指标名称,业务口径,分组,计算关系,单位\n净销售额,成交商品金额减去已完成退款金额,经营结果,成交总额减退款额,元\n支付订单数,成功支付订单按订单号去重,经营结果,订单去重计数,单\n客户复购率,,客户质量,复购客户数除以支付客户数,%",state.importFile);renderImportPreview();break;
    }
    case "commit-import":{
      if(!state.importRows)break;const name=$("#import-name").value.trim();if(!name){modalError("请给模板起一个名称。");break;}
      try{ // G5：浏览器解析（已预览）→ 确认落服务端用户草稿模板（U1-a templates/user/，不覆盖）
        await Api.saveUserTemplate({name,rows:state.importRows,purpose:"从自己的指标资料导入，保留原说明；使用前需要检查定义和计算关系。"});
        const tpl=await Api.templates().catch(()=>null);
        if(tpl){state.templates=tpl.templates;state.methodTemplates=tpl.methodTemplates;}
        state.importRows=null;state.importFile="";
        closeModal();state.libraryType="metric";state.filter="mine";state.search="";setRoute("library");toast("已导入为个人草稿模板，缺失口径没有被自动补造。");
      }catch(e){apiModalError(e);}
      break;
    }
    case "confirm-business":{
      if(s.confirmed){toast("当前草稿已复核；相关修改后会重新提示确认。");break;}
      const b=s.blueprint;showModal("复核这套业务设计","确认设计符合用途，不等于证实假设。",`<dl class="detail-grid"><dt>分析目的</dt><dd>${esc(b.purpose)}</dd><dt>支持的判断</dt><dd>${esc(b.decision)}</dd><dt>适用语境</dt><dd>${b.contexts.map(esc).join("、")}</dd><dt>设计内容</dt><dd>${b.questions.length} 个问题 · ${b.hypotheses.length} 个假设 · ${s.metrics.length} 个指标 · ${s.scenes.length} 个场景</dd><dt>证据计划</dt><dd>${b.evidence.length} 项，实际证据仍待获取</dd></dl><p class="note">确认的是当前设计。缺失的必需内容和未确认口径仍阻断设计交付；不会批准经营行动或把假设变为事实。方法执行与真实采用尚未验证。</p>`,btn("回去修改","close-modal")+btn("确认当前业务设计","commit-confirm","primary"));break;
    }
    case "approve-metric":{
      try{await Api.approveMetric(s.id,el.dataset.id);await refreshSystem();render();toast("已批准该 AI 指标（写入审核人）。");}catch(e){apiModalError(e);}break;
    }
    case "reject-metric":{
      try{await Api.rejectMetric(s.id,el.dataset.id);await refreshSystem();render();toast("已拒绝并移除该 AI 指标。");}catch(e){apiModalError(e);}break;
    }
    case "commit-confirm":{
      try{await Api.confirmReview(s.id);await refreshSystem();closeModal();render();toast("当前业务设计已复核。");}catch(e){apiModalError(e);}break;
    }
    case "deliver":{
      if(!readyFlag()){toast("还有待处理内容，请先完成设计检查。");break;}
      try{
        const r=await Api.deliver(s.id);
        await refreshSystem();render();
        toast(`设计版本 ${r.version} 已发布，实际证据仍待获取。`);
      }catch(e){
        toast((e&&e.payload&&e.payload.errors&&e.payload.errors[0])||"发布未完成，请先完成设计检查。");
      }
      break;
    }
    case "download":{
      if(!s.delivered)break; // G3：真实 releases 快照直链（C24：无合成标记）
      const a=document.createElement("a");a.href=`/api/instances/${encodeURIComponent(s.id)}/export/sap`;a.download="";a.click();
      toast("已触发设计包下载（SAP 快照，含指纹）。");break;
    }
  }
}

document.addEventListener("click",event=>{const el=event.target.closest("[data-action]");if(el&&!el.disabled)handleAction(el.dataset.action,el).catch(error=>{console.error(error);toast("操作遇到问题，当前内容仍在页面中。");});});
document.addEventListener("input",event=>{
  if(event.target.id==="need")state.homeDraft=event.target.value;
  if(event.target.id==="template-search"){state.search=event.target.value;const items=libraryItems();$("#template-grid").innerHTML=renderTemplateGrid(items);$("#template-total").textContent=`${items.length} 个模板`;}
});
document.addEventListener("change",async event=>{
  if(event.target.id==="metric-only"){current().metricOnly=event.target.checked;markDesignChanged(current());render();}
  if(event.target.id==="import-file"){
    const file=event.target.files[0];if(!file)return;state.importRows=null;$("#commit-import").disabled=true;$("#import-preview").innerHTML="";$("#modal-error").hidden=true;
    if(file.size>1024*1024){modalError("仅支持预览 1MB 以内的 CSV／JSON，请换一份小文件。");return;}
    try{state.importFile=file.name;state.importRows=importObjects(await file.text(),file.name);renderImportPreview();}
    catch(error){modalError(`导入未完成：${error.message} 文件名与当前页面仍保留，可重新选择。`);}
  }
});
$("#modal").addEventListener("click",event=>{if(event.target===$("#modal")){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
$("#modal").addEventListener("cancel",event=>{event.preventDefault();closeModal();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeMenu();if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){if(document.activeElement?.id==="need"){$('[data-action="generate"]').click();event.preventDefault();}else if(document.activeElement?.id==="refine"){$('[data-action="refine"]').click();event.preventDefault();}}});
// A2 启动：装载真实数据（工作区体系 + 两类模板 + LLM 模式）→ 应用 hash 路由 → 首渲染。
window.addEventListener("hashchange",()=>applyHash());
(async()=>{
  try{
    const [ws,tpl,llm]=await Promise.all([Api.workspace(),Api.templates(),Api.llmStatus()]);
    state.systems=ws.systems;
    state.templates=tpl.templates;
    state.methodTemplates=tpl.methodTemplates;
    state.llmMode=llm.mode;
  }catch(e){console.error(e);toast("工作区数据加载失败，可刷新重试。");}
  try{const kept=sessionStorage.getItem("mf-need");if(kept)state.homeDraft=kept;}catch{}
  if(location.hash&&location.hash!=="#home")applyHash();else render();
})();
